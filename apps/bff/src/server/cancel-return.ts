import { ActorContext } from '@hx/contracts';
import { 
  createCancelRequest, 
  createReturnRequest, 
  getCancelReturnRequestById, 
  transitionCancelReturnRequest 
} from '@hx/cancel-return';
import { 
  CreateCancelRequestCommand, 
  CreateReturnRequestCommand, 
  CancelReturnTransitionCommand 
} from '@hx/contracts';
import * as response from './response';

export async function handleCreateCancelRequest(context: ActorContext, body: any) {
  const command: CreateCancelRequestCommand = body;
  if (!command.orderId) return response.badRequest('MISSING_ORDER_ID', 'Order ID is required');
  
  const result = await createCancelRequest(command);
  if (result.errors.length > 0) {
    return response.unprocessable('CANCEL_FAILED', result.errors.join(', '));
  }
  return response.ok(result);
}

export async function handleCreateReturnRequest(context: ActorContext, body: any) {
  const command: CreateReturnRequestCommand = body;
  if (!command.orderId) return response.badRequest('MISSING_ORDER_ID', 'Order ID is required');

  const result = await createReturnRequest(command);
  if (result.errors.length > 0) {
    return response.unprocessable('RETURN_FAILED', result.errors.join(', '));
  }
  return response.ok(result);
}

export async function handleGetCancelReturnRequest(context: ActorContext, requestId: string) {
  const result = await getCancelReturnRequestById(requestId);
  if (!result) return response.notFound('CANCEL_RETURN_REQUEST_NOT_FOUND', 'Request not found');
  return response.ok(result);
}

export async function handleTransitionCancelReturnRequest(context: ActorContext, body: any) {
  const command: CancelReturnTransitionCommand = body;
  if (!command.requestId) return response.badRequest('MISSING_REQUEST_ID', 'Request ID is required');

  const result = await transitionCancelReturnRequest(command);
  if (!result.success) {
    return response.badRequest('TRANSITION_FAILED', 'Transition failed');
  }
  return response.ok(result);
}
