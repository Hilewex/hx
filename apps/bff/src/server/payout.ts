import {
  createPayoutItemsFromSettlement,
  createPayoutBatch,
  applyPayoutItemAction,
  applyPayoutBatchAction,
  getPayoutItem,
  getPayoutBatch,
  listPayoutItems,
  listPayoutBatches
} from '@hx/payout';
import * as response from './response';

import { requireFinanceRole } from './guards';

export async function handleCreatePayoutItemsFromSettlement(context: any, body: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await createPayoutItemsFromSettlement(body);
    if (!result.success) {
      if (result.errors?.includes('PAYOUT_SETTLEMENT_LINE_IDS_REQUIRED')) {
        return response.badRequest('PAYOUT_SETTLEMENT_LINE_IDS_REQUIRED', 'Settlement line IDs are required');
      }
      if (result.errors?.some((e: any) => e.includes('PAYOUT_SETTLEMENT_LINE_NOT_FOUND'))) {
        return response.notFound('RESOURCE_NOT_FOUND', 'One or more settlement lines not found');
      }
      return response.unprocessable('PAYOUT_FAILED', result.errors?.join(', ') || 'Payout items creation failed');
    }
    return response.created(result);
  } catch (error: any) {
    return response.internalError('PAYOUT_FAILED', 'Failed to create payout items');
  }
}

export async function handleCreatePayoutBatch(context: any, body: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await createPayoutBatch(body);
    if (!result.success) {
      if (result.errors?.includes('PAYOUT_ITEM_IDS_REQUIRED')) {
        return response.badRequest('PAYOUT_ITEM_IDS_REQUIRED', 'Payout item IDs are required');
      }
      if (result.errors?.includes('PAYOUT_NO_ELIGIBLE_ITEMS')) {
        return response.badRequest('PAYOUT_NO_ELIGIBLE_ITEMS', 'No eligible items for payout batch');
      }
      return response.unprocessable('PAYOUT_BATCH_FAILED', result.errors?.join(', ') || 'Payout batch creation failed');
    }
    return response.created(result);
  } catch (error: any) {
    return response.internalError('PAYOUT_BATCH_FAILED', 'Failed to create payout batch');
  }
}

export async function handleApplyPayoutItemAction(context: any, body: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await applyPayoutItemAction(body);
    if (!result.success) {
      if (result.errors?.includes('PAYOUT_ITEM_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Payout item not found');
      }
      return response.unprocessable('PAYOUT_ITEM_ACTION_FAILED', result.errors?.join(', ') || 'Action failed');
    }
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('PAYOUT_ITEM_ACTION_FAILED', 'Failed to apply payout item action');
  }
}

export async function handleApplyPayoutBatchAction(context: any, body: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await applyPayoutBatchAction(body);
    if (!result.success) {
      if (result.errors?.includes('PAYOUT_BATCH_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Payout batch not found');
      }
      return response.unprocessable('PAYOUT_BATCH_ACTION_FAILED', result.errors?.join(', ') || 'Action failed');
    }
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('PAYOUT_BATCH_ACTION_FAILED', 'Failed to apply payout batch action');
  }
}

export async function handleGetPayoutItem(context: any, query: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const payoutItemId = query.payoutItemId as string;
    if (!payoutItemId) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'payoutItemId is required');
    }
    const result = await getPayoutItem({ payoutItemId });
    if (!result) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Payout item not found');
    }
    return response.ok(result);
  } catch (e: any) {
    if (response.isNotFoundError(e)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Payout item not found');
    }
    return response.internalError('PAYOUT_ITEM_GET_FAILED', 'Failed to retrieve payout item');
  }
}

export async function handleGetPayoutBatch(context: any, query: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    if (!query.batchId) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'batchId is required');
    }
    const result = await getPayoutBatch(query);
    if (!result) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Payout batch not found');
    }
    return response.ok(result);
  } catch (e: any) {
    if (response.isNotFoundError(e)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Payout batch not found');
    }
    return response.internalError('PAYOUT_BATCH_GET_FAILED', 'Failed to retrieve payout batch');
  }
}

export async function handleListPayoutItems(context: any, query: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await listPayoutItems(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('PAYOUT_ITEMS_LIST_FAILED', 'Failed to list payout items');
  }
}

export async function handleListPayoutBatches(context: any, query: any) {
  const guard = requireFinanceRole(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await listPayoutBatches(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('PAYOUT_BATCHES_LIST_FAILED', 'Failed to list payout batches');
  }
}

export async function handleCreateSmokeTestPayoutItem(context: any, body: any) {
    const guard = requireFinanceRole(context);
    if (!guard.allowed) return guard.response;

    try {
        const { createTestPayoutItem } = await import('@hx/payout');
        const result = await createTestPayoutItem(body);

        if (!result.success) {
            return response.unprocessable('PAYOUT_TEST_ITEM_FAILED', result.errors?.join(', ') || 'Failed to create test payout item');
        }
        return response.created(result);
    } catch (error: any) {
        return response.internalError('PAYOUT_TEST_ITEM_FAILED', 'Failed to create test payout item');
    }
}
