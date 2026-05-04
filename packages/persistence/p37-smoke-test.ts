import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import {
  CancelReturnResponse,
  RefundResponse,
  ShipmentResponse,
} from '@hx/contracts';
import { closePool, getDbPool } from './src';
import { getShipmentRepository, resetShipmentRepository } from '../../services/shipment/src/repository';
import { getCancelReturnRepository, resetCancelReturnRepository } from '../../services/cancel-return/src/repository';
import { getRefundRepository, resetRefundRepository } from '../../services/refund/src/repository';

config();

const defaultDatabaseUrl = 'postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDatabaseUrl;
}

function resetAllRepositories() {
  resetShipmentRepository();
  resetCancelReturnRepository();
  resetRefundRepository();
}

async function verifyMemoryMode() {
  console.log('--- Memory Mode Test ---');
  process.env.PERSISTENCE_MODE = 'memory';
  resetAllRepositories();

  const shipmentRepo = getShipmentRepository();
  const cancelRepo = getCancelReturnRepository();
  const refundRepo = getRefundRepository();

  const orderId = randomUUID();
  const shipmentIdempotencyKey = `memory-shipment-${orderId}`;

  const shipment: ShipmentResponse = {
    shipmentId: randomUUID(),
    orderId,
    state: 'CREATED',
    packages: [],
    lines: [],
    timeline: [],
    entitlementTriggerSummary: {
      deliveredOpensReviewEligibility: false,
      deliveredOpensStoryEligibility: false,
      actualEligibilityMutationPerformed: false,
    },
    errors: [],
    warnings: [],
  };

  await shipmentRepo.save(shipment, shipmentIdempotencyKey);
  const foundShipment = await shipmentRepo.getById(shipment.shipmentId);
  const foundShipmentByIdempotency = await shipmentRepo.getByIdempotencyKey(shipmentIdempotencyKey);
  if (!foundShipment || !foundShipmentByIdempotency || foundShipment.shipmentId !== shipment.shipmentId) {
    throw new Error('Memory mode shipment save/get/idempotency failed');
  }

  const returnRequest: CancelReturnResponse = {
    requestId: randomUUID(),
    orderId,
    type: 'RETURN',
    state: 'APPROVED',
    lines: [{
      requestLineId: randomUUID(),
      orderLineId: randomUUID(),
      productId: 'prod-memory',
      storefrontId: randomUUID(),
      quantity: 1,
      state: 'APPROVED',
      reasonCode: 'CHANGED_MIND',
    }],
    refundImpactSummary: {
      refundRequired: true,
      refundState: 'PENDING',
      actualRefundExecutionPerformed: false,
    },
    postDeliveryEntitlementImpactSummary: {
      reviewImpactPending: true,
      storyImpactPending: true,
      verifiedPurchaseImpactPending: true,
      actualEntitlementMutationPerformed: false,
    },
    errors: [],
    warnings: [],
  };

  const returnIdempotencyKey = `memory-return-${orderId}`;
  await cancelRepo.save(returnRequest, returnIdempotencyKey);
  const foundReturn = await cancelRepo.getById(returnRequest.requestId);
  const foundReturnByIdempotency = await cancelRepo.getByIdempotencyKey(returnIdempotencyKey);
  if (!foundReturn || !foundReturnByIdempotency || foundReturn.requestId !== returnRequest.requestId) {
    throw new Error('Memory mode cancel-return save/get/idempotency failed');
  }

  const refund: RefundResponse = {
    refundId: randomUUID(),
    cancelReturnRequestId: returnRequest.requestId,
    sourceType: 'RETURN',
    state: 'CREATED',
    lines: [{
      refundLineId: randomUUID(),
      requestLineId: returnRequest.lines[0].requestLineId,
      orderLineId: returnRequest.lines[0].orderLineId,
      productId: 'prod-memory',
      storefrontId: randomUUID(),
      quantity: 1,
      amount: 10,
      currency: 'TRY',
    }],
    amountSummary: {
      requestedAmount: 10,
      approvedAmount: 10,
      refundedAmount: 0,
      currency: 'TRY',
    },
    paymentSummary: {
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    },
    settlementImpactSummary: {
      settlementAdjustmentRequired: true,
      actualSettlementMutationPerformed: false,
    },
    payoutImpactSummary: {
      payoutAdjustmentRequired: true,
      actualPayoutMutationPerformed: false,
    },
    errors: [],
    warnings: [],
  };

  const refundIdempotencyKey = `memory-refund-${returnRequest.requestId}`;
  await refundRepo.save(refund, refundIdempotencyKey);
  const foundRefund = await refundRepo.getById(refund.refundId);
  const foundRefundByIdempotency = await refundRepo.getByIdempotencyKey(refundIdempotencyKey);
  if (!foundRefund || !foundRefundByIdempotency || foundRefund.state !== 'CREATED') {
    throw new Error('Memory mode refund save/get/idempotency failed');
  }

  console.log('Memory mode validated successfully.\n');
}

async function verifyInvalidConfig() {
  console.log('--- Invalid Config Test ---');
  const originalMode = process.env.PERSISTENCE_MODE;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  process.env.PERSISTENCE_MODE = 'postgres';
  delete process.env.DATABASE_URL;
  resetAllRepositories();

  try {
    getShipmentRepository();
    throw new Error('Expected postgres mode without DATABASE_URL to fail');
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('DATABASE_URL')) {
      throw error;
    }
  } finally {
    if (originalMode) process.env.PERSISTENCE_MODE = originalMode;
    else delete process.env.PERSISTENCE_MODE;
    if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    else process.env.DATABASE_URL = defaultDatabaseUrl;
    resetAllRepositories();
  }

  console.log('Invalid config behavior validated successfully.\n');
}

async function verifyPostgresMode() {
  console.log('--- Postgres Mode Test ---');
  process.env.PERSISTENCE_MODE = 'postgres';
  resetAllRepositories();

  const shipmentRepo = getShipmentRepository();
  const cancelRepo = getCancelReturnRepository();
  const refundRepo = getRefundRepository();

  if (shipmentRepo.constructor.name.includes('InMemory')) {
    throw new Error('Postgres mode selected an in-memory shipment repository');
  }

  const orderId = randomUUID();
  const orderLineId = randomUUID();
  const shipmentId = randomUUID();
  const packageId = randomUUID();
  const shipmentIdempotencyKey = `postgres-shipment-${orderId}`;

  const shipment: ShipmentResponse = {
    shipmentId,
    orderId,
    state: 'CREATED',
    packages: [{
      packageId,
      shipmentId,
      orderId,
      lineIds: [],
      state: 'CREATED',
    }],
    lines: [{
      shipmentLineId: randomUUID(),
      orderLineId,
      productId: 'prod-1',
      variantId: 'var-1',
      storefrontId: randomUUID(),
      quantity: 1,
      state: 'CREATED',
    }],
    timeline: [],
    entitlementTriggerSummary: {
      deliveredOpensReviewEligibility: false,
      deliveredOpensStoryEligibility: false,
      actualEligibilityMutationPerformed: false,
    },
    errors: [],
    warnings: [],
  };

  await shipmentRepo.save(shipment, shipmentIdempotencyKey);
  const idempotentShipment = await shipmentRepo.getByIdempotencyKey(shipmentIdempotencyKey);
  if (!idempotentShipment || idempotentShipment.shipmentId !== shipmentId) {
    throw new Error('Shipment idempotency test failed');
  }

  shipment.state = 'SHIPPED';
  shipment.packages[0].state = 'SHIPPED';
  shipment.lines[0].state = 'SHIPPED';
  await shipmentRepo.save(shipment);

  const loadedShipment = await shipmentRepo.getById(shipmentId);
  if (!loadedShipment || loadedShipment.state !== 'SHIPPED') {
    throw new Error('Shipment DB update test failed');
  }
  console.log('Shipment DB success.');

  const requestId = randomUUID();
  const cancelIdempotencyKey = `postgres-cancel-${orderId}`;
  const cancelRequest: CancelReturnResponse = {
    requestId,
    orderId,
    type: 'CANCEL',
    state: 'APPROVED',
    lines: [{
      requestLineId: randomUUID(),
      orderLineId,
      productId: 'prod-1',
      variantId: 'var-1',
      storefrontId: randomUUID(),
      quantity: 1,
      state: 'APPROVED',
      reasonCode: 'CHANGED_MIND',
    }],
    refundImpactSummary: {
      refundRequired: true,
      refundState: 'PENDING',
      actualRefundExecutionPerformed: false,
    },
    postDeliveryEntitlementImpactSummary: {
      reviewImpactPending: false,
      storyImpactPending: false,
      verifiedPurchaseImpactPending: false,
      actualEntitlementMutationPerformed: false,
    },
    errors: [],
    warnings: [],
  };

  await cancelRepo.save(cancelRequest, cancelIdempotencyKey);
  const loadedCancel = await cancelRepo.getById(requestId);
  const idempotentCancel = await cancelRepo.getByIdempotencyKey(cancelIdempotencyKey);
  if (!loadedCancel || !idempotentCancel || loadedCancel.state !== 'APPROVED') {
    throw new Error('CancelReturn DB save/get/idempotency failed');
  }
  if (loadedCancel.refundImpactSummary.actualRefundExecutionPerformed) {
    throw new Error('Return approved was treated as refund completed');
  }
  console.log('CancelReturn DB success.');

  const refundId = randomUUID();
  const refundIdempotencyKey = `postgres-refund-${requestId}`;
  const refund: RefundResponse = {
    refundId,
    cancelReturnRequestId: requestId,
    sourceType: 'CANCEL',
    state: 'CREATED',
    lines: [{
      refundLineId: randomUUID(),
      requestLineId: cancelRequest.lines[0].requestLineId,
      orderLineId,
      productId: 'prod-1',
      variantId: 'var-1',
      storefrontId: randomUUID(),
      quantity: 1,
      amount: 150.5,
      currency: 'TRY',
    }],
    amountSummary: {
      requestedAmount: 150.5,
      approvedAmount: 150.5,
      refundedAmount: 0,
      currency: 'TRY',
    },
    paymentSummary: {
      simulationOnly: true,
      actualProviderRefundPerformed: false,
    },
    settlementImpactSummary: {
      settlementAdjustmentRequired: true,
      actualSettlementMutationPerformed: false,
    },
    payoutImpactSummary: {
      payoutAdjustmentRequired: true,
      actualPayoutMutationPerformed: false,
    },
    errors: [],
    warnings: [],
  };

  await refundRepo.save(refund, refundIdempotencyKey);
  const loadedRefund = await refundRepo.getById(refundId);
  const idempotentRefund = await refundRepo.getByIdempotencyKey(refundIdempotencyKey);
  if (!loadedRefund || !idempotentRefund || loadedRefund.state !== 'CREATED') {
    throw new Error('Refund DB save/get/idempotency failed');
  }

  refund.state = 'SUCCEEDED';
  await refundRepo.save(refund);

  const updatedRefund = await refundRepo.getById(refundId);
  if (!updatedRefund || updatedRefund.state !== 'SUCCEEDED') {
    throw new Error('Refund DB update failed');
  }
  if (updatedRefund.paymentSummary.actualProviderRefundPerformed) {
    throw new Error('Refund persistence marked a real provider refund as performed');
  }

  const byRequestId = await refundRepo.getByCancelReturnRequestId(requestId);
  if (!byRequestId || byRequestId.refundId !== refundId) {
    throw new Error('Refund DB getByCancelReturnRequestId failed');
  }

  await closePool();
  resetAllRepositories();

  const restartedShipment = await getShipmentRepository().getById(shipmentId);
  const restartedReturn = await getCancelReturnRepository().getById(requestId);
  const restartedRefund = await getRefundRepository().getById(refundId);
  if (!restartedShipment || !restartedReturn || !restartedRefund) {
    throw new Error('Restart-safe read test failed');
  }

  console.log('Refund DB and restart-safe read success.');
  console.log('Postgres mode validated successfully.\n');
}

async function run() {
  try {
    await verifyMemoryMode();
    await verifyInvalidConfig();

    const pool = getDbPool();
    await pool.query('SELECT 1');

    await verifyPostgresMode();

    await closePool();
    console.log('All persistence smoke tests passed.');
  } catch (error) {
    console.error('Smoke test failed:', error);
    await closePool();
    process.exit(1);
  }
}

run();
