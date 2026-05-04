import { 
  CreateSettlementFromOrderCommand, 
  ApplySettlementActionCommand, 
  GetSettlementLineQuery, 
  ListSettlementLinesQuery,
  ActorContext
} from '@hx/contracts';

import { 
  createSettlementFromOrder, 
  applySettlementAction, 
  getSettlementLine, 
  listSettlementLines 
} from '@hx/settlement';
import * as response from './response';

import { requireFinanceRole } from './guards';

export async function handleCreateSettlementFromOrder(context: ActorContext, body: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;
  
  try {
    if (!body.orderId) {
      return response.badRequest('SETTLEMENT_ORDER_ID_REQUIRED', 'orderId is required');
    }

    const command: CreateSettlementFromOrderCommand = {
      orderId: body.orderId,
      idempotencyKey: body.idempotencyKey,
      correlationId: body.correlationId
    };

    const res = await createSettlementFromOrder(command);
    
    if (!res.success) {
      if (res.errors?.includes('SETTLEMENT_ORDER_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Order not found for settlement');
      }
      return response.unprocessable('SETTLEMENT_FAILED', res.errors?.join(', ') || 'Settlement creation failed');
    }

    return response.created(res);
  } catch (error: any) {
    return response.internalError('SETTLEMENT_FAILED', 'Failed to create settlement from order');
  }
}

export async function handleApplySettlementAction(context: ActorContext, body: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    if (!body.settlementLineId || !body.action) {
      return response.badRequest('INVALID_REQUEST', 'settlementLineId and action are required');
    }

    const command: ApplySettlementActionCommand = {
      settlementLineId: body.settlementLineId,
      action: body.action,
      actorId: (context as any).actorId || 'system',
      note: body.note,
      correlationId: body.correlationId
    };

    const res = await applySettlementAction(command);

    if (!res.success) {
      if (res.errors?.includes('SETTLEMENT_LINE_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Settlement line not found');
      }
      return response.unprocessable('SETTLEMENT_ACTION_FAILED', res.errors?.join(', ') || 'Action failed');
    }

    return response.ok(res);
  } catch (error: any) {
    return response.internalError('SETTLEMENT_ACTION_FAILED', 'Failed to apply settlement action');
  }
}

export async function handleGetSettlementLine(context: ActorContext, query: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    if (!query.settlementLineId) {
      return response.badRequest('SETTLEMENT_LINE_ID_REQUIRED', 'settlementLineId is required');
    }

    const q: GetSettlementLineQuery = {
      settlementLineId: query.settlementLineId as string
    };

    const res = await getSettlementLine(q);

    if (!res) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Settlement line not found');
    }

    return response.ok(res);
  } catch (error: any) {
    if (response.isNotFoundError(error)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Settlement line not found');
    }
    return response.internalError('SETTLEMENT_GET_FAILED', 'Failed to retrieve settlement line');
  }
}

export async function handleListSettlementLines(context: ActorContext, query: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const q: ListSettlementLinesQuery = {
      orderId: query.orderId as string,
      orderLineId: query.orderLineId as string,
      storefrontId: query.storefrontId as string,
      partyType: query.partyType as any,
      status: query.status as any,
      reasonCode: query.reasonCode as any,
      limit: query.limit ? parseInt(query.limit as string, 10) : undefined,
      offset: query.offset ? parseInt(query.offset as string, 10) : undefined
    };

    const res = await listSettlementLines(q);
    return response.ok(res);
  } catch (error: any) {
    return response.internalError('SETTLEMENT_LIST_FAILED', 'Failed to list settlement lines');
  }
}
