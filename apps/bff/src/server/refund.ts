import { 
  createRefundFromCancelReturn, 
  getRefundDetail, 
  processRefund, 
  transitionRefundState 
} from '@hx/refund';
import * as response from './response';

export async function handleCreateRefundFromCancelReturn(context: any, body: any) {
  const result = await createRefundFromCancelReturn(body);
  if (result.errors.includes('CANCEL_RETURN_REQUEST_NOT_FOUND')) {
    return response.notFound('CANCEL_RETURN_REQUEST_NOT_FOUND', 'Cancel/return request not found');
  }
  if (result.errors.length > 0) {
    return response.unprocessable('REFUND_CREATION_FAILED', result.errors.join(', '));
  }
  return response.created(result);
}

export async function handleGetRefundDetail(context: any, refundId: string) {
  const result = await getRefundDetail(refundId);
  if (!result) {
    return response.notFound('REFUND_NOT_FOUND', 'Refund not found');
  }
  return response.ok(result);
}

export async function handleProcessRefund(context: any, body: any) {
  const { refundId } = body;
  try {
    const result = await processRefund(refundId);
    return response.ok(result);
  } catch (e: any) {
    if (e.message === 'REFUND_NOT_FOUND') {
      return response.notFound('REFUND_NOT_FOUND', 'Refund not found');
    }
    return response.internalError();
  }
}

export async function handleTransitionRefund(context: any, body: any) {
  const result = await transitionRefundState(body);
  if (!result.success) {
    if (result.error === 'REFUND_NOT_FOUND') {
      return response.notFound('REFUND_NOT_FOUND', 'Refund not found');
    }
    return response.badRequest('TRANSITION_FAILED', result.error || 'Transition failed');
  }
  return response.ok(result);
}
