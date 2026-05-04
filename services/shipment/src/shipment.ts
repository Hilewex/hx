import { getShipmentRepository } from './repository';
import {
  CreateShipmentFromOrderCommand,
  ShipmentResponse,
  ShipmentLine,
  ShipmentPackage,
  ShipmentState,
  ShipmentStateTransitionCommand,
  ShipmentTransitionResult
} from '@hx/contracts';
import { getOrderById } from '@hx/order';
import { randomUUID } from 'node:crypto';
import { getShipmentCarrierProviderAdapter } from './provider-adapter';

export async function createShipmentFromOrder(command: CreateShipmentFromOrderCommand): Promise<ShipmentResponse> {
  const { orderId, idempotencyKey: initialIdempotencyKey } = command;

  const idempotencyKey = initialIdempotencyKey || `shipment-order-${orderId}`;
  const repo = getShipmentRepository();

  const existingByIdempotency = await repo.getByIdempotencyKey(idempotencyKey);
  if (existingByIdempotency) {
    return existingByIdempotency;
  }

  const existingShipments = await repo.getByOrderId(orderId);
  if (existingShipments.length > 0) {
    return existingShipments[0];
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return createErrorResponse(orderId, ['ORDER_NOT_FOUND']);
  }

  if (order.state !== 'CREATED' || !order.orderId) {
    return createErrorResponse(orderId, ['ORDER_INVALID_STATE_FOR_SHIPMENT']);
  }

  const shipmentId = randomUUID();
  const packageId = randomUUID();

  const lines: ShipmentLine[] = order.lines.map(ol => ({
    shipmentLineId: randomUUID(),
    orderLineId: ol.orderLineId,
    productId: ol.productId,
    variantId: ol.variantId,
    storefrontId: ol.storefrontId,
    quantity: ol.quantity,
    state: 'CREATED'
  }));

  const pkg: ShipmentPackage = {
    packageId,
    shipmentId,
    orderId,
    lineIds: lines.map(l => l.shipmentLineId),
    state: 'CREATED'
  };

  const response: ShipmentResponse = {
    shipmentId,
    orderId,
    state: 'CREATED',
    packages: [pkg],
    lines,
    timeline: [
      {
        timestamp: new Date().toISOString(),
        state: 'CREATED',
        note: 'Shipment created from order'
      }
    ],
    entitlementTriggerSummary: {
      deliveredOpensReviewEligibility: true,
      deliveredOpensStoryEligibility: true,
      actualEligibilityMutationPerformed: false
    },
    errors: [],
    warnings: []
  };

  await repo.save(response, idempotencyKey);
  return response;
}

export async function getShipmentById(shipmentId: string): Promise<ShipmentResponse | undefined> {
  const repo = getShipmentRepository();
  return repo.getById(shipmentId);
}

export async function getShipmentsByOrderId(orderId: string): Promise<ShipmentResponse[]> {
  const repo = getShipmentRepository();
  return repo.getByOrderId(orderId);
}

export async function getShipmentDetail(shipmentId: string): Promise<ShipmentResponse | undefined> {
  return getShipmentById(shipmentId);
}

export async function transitionShipmentState(command: ShipmentStateTransitionCommand): Promise<ShipmentTransitionResult> {
  const { shipmentId, targetState, note, carrierData } = command;
  const repo = getShipmentRepository();
  const shipment = await repo.getById(shipmentId);

  if (!shipment) {
    return { success: false, error: 'SHIPMENT_NOT_FOUND' };
  }

  if (!isValidTransition(shipment.state, targetState)) {
    return { success: false, error: 'INVALID_TRANSITION' };
  }

  // Apply changes
  shipment.state = targetState;
  shipment.timeline.push({
    timestamp: new Date().toISOString(),
    state: targetState,
    note
  });

  // Update packages and lines
  for (const pkg of shipment.packages) {
    pkg.state = targetState;
    if (targetState === 'SHIPPED' && carrierData) {
      pkg.carrierName = carrierData.carrierName;
      pkg.trackingNumber = carrierData.trackingNumber;

      // HARDENING-09D: Call the shipment carrier provider adapter
      const carrierAdapter = getShipmentCarrierProviderAdapter();
      const providerEnvelope = await carrierAdapter.createTracking(pkg);
      pkg.providerEnvelope = providerEnvelope; // Attach the result, but do not act on it
    }
    if (targetState === 'DELIVERED') {
      pkg.deliveredAt = new Date().toISOString();
    }
  }

  for (const line of shipment.lines) {
    line.state = targetState;
  }

  await repo.save(shipment);
  return { success: true, shipment };
}

function isValidTransition(current: ShipmentState, target: ShipmentState): boolean {
  const transitions: Record<ShipmentState, ShipmentState[]> = {
    'CREATED': ['PREPARING'],
    'PREPARING': ['SHIPPED'],
    'SHIPPED': ['IN_TRANSIT'],
    'IN_TRANSIT': ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED'],
    'OUT_FOR_DELIVERY': ['DELIVERED', 'DELIVERY_FAILED'],
    'DELIVERED': [],
    'DELIVERY_FAILED': ['RETURNED_TO_SENDER'],
    'RETURNED_TO_SENDER': []
  };

  return transitions[current]?.includes(target) || false;
}

function createErrorResponse(orderId: string, errors: string[]): ShipmentResponse {
  return {
    shipmentId: '',
    orderId,
    state: 'CREATED',
    packages: [],
    lines: [],
    timeline: [],
    entitlementTriggerSummary: {
      deliveredOpensReviewEligibility: false,
      deliveredOpensStoryEligibility: false,
      actualEligibilityMutationPerformed: false
    },
    errors,
    warnings: []
  };
}
