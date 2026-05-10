import { getOrderOpsOverview } from '@hx/order-ops';
import { OrderOpsContextQuery, SupportActorType } from '@hx/contracts';
import * as response from './response';

export async function handleGetOrderOpsOverview(context: any, query: any) {
  try {
    const typedQuery: OrderOpsContextQuery = {
      orderId: query.orderId,
      actorType: context?.role as SupportActorType | undefined,
      actorId: context?.actorId || context?.sessionId,
      includeSupport: query.includeSupport === 'true',
      includeRisk: query.includeRisk === 'true'
    };

    if (!typedQuery.orderId) {
      return response.badRequest('ORDER_OPS_ORDER_ID_REQUIRED', 'orderId is required');
    }

    const result = await getOrderOpsOverview(typedQuery);

    if (result.errors?.includes('ORDER_OPS_ORDER_NOT_FOUND')) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Order not found for ops overview');
    }

    if (result.errors?.length) {
      return response.badRequest('ORDER_OPS_FAILED', result.errors.join(', '));
    }

    return response.ok(result);
  } catch (err: any) {
    if (response.isNotFoundError(err)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Order not found for ops overview');
    }
    return response.internalError('ORDER_OPS_FAILED', 'Failed to get order ops overview');
  }
}
