import { 
  createShipmentFromOrder, 
  getShipmentDetail, 
  transitionShipmentState 
} from '@hx/shipment';
import { 
  CreateShipmentFromOrderCommand, 
  ShipmentStateTransitionCommand 
} from '@hx/contracts';
import * as response from './response';

export async function handleCreateShipmentFromOrder(context: any, body: any) {
  const command: CreateShipmentFromOrderCommand = { ...body };
  const result = await createShipmentFromOrder(command);
  
  if (!result.shipmentId || result.errors.includes('ORDER_NOT_FOUND')) {
    return response.notFound('ORDER_NOT_FOUND', 'Order not found for shipment creation');
  }

  return response.created(result);
}

export async function handleGetShipmentDetail(context: any, shipmentId: string) {
  if (!shipmentId) {
    return response.badRequest('INVALID_SHIPMENT_ID', 'Shipment ID is required');
  }

  const detail = await getShipmentDetail(shipmentId);
  if (!detail) {
    return response.notFound('SHIPMENT_NOT_FOUND', 'Shipment not found');
  }

  return response.ok(detail);
}

export async function handleTransitionShipmentState(context: any, body: any) {
  const command: ShipmentStateTransitionCommand = { ...body };
  const result = await transitionShipmentState(command);

  if (!result.success) {
    return response.badRequest('TRANSITION_FAILED', result.error || 'Transition failed');
  }

  return response.ok(result.shipment);
}
