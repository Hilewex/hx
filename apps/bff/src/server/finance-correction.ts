import { 
  createFinanceCorrection,
  createFinanceCorrectionFromRefund,
  reviewFinanceCorrection,
  getFinanceCorrection,
  listFinanceCorrections
} from '@hx/finance-correction';
import * as response from './response';
import { requireFinanceRole } from './guards';

function getActorId(context: any): string {
  return String(context.userId || context.actorId || 'anon');
}

export async function handleCreateFinanceCorrection(context: any, body: any) {
  const guardResult = requireFinanceRole(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const result = await createFinanceCorrection({
      ...body,
      correlationId: context.requestId,
    });

    if (!result.success) {
      if (result.errors?.includes('FINANCE_CORRECTION_TARGET_REQUIRED') || 
          result.errors?.includes('FINANCE_CORRECTION_REASON_REQUIRED')) {
        return response.badRequest('FINANCE_CORRECTION_VALIDATION_FAILED', result.errors.join(', '));
      }
      return response.unprocessable('FINANCE_CORRECTION_FAILED', result.errors?.join(', ') || 'Finance correction failed');
    }

    return response.created(result);
  } catch (error: any) {
    return response.internalError('FINANCE_CORRECTION_FAILED', 'Failed to create finance correction');
  }
}

export async function handleCreateFinanceCorrectionFromRefund(context: any, body: any) {
  const guardResult = requireFinanceRole(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const { refundId, idempotencyKey } = body;
    
    if (!refundId) {
      return response.badRequest('FINANCE_CORRECTION_REFUND_ID_REQUIRED', 'refundId is required');
    }

    const result = await createFinanceCorrectionFromRefund(refundId, idempotencyKey);

    if (!result.success) {
      if (result.errors?.includes('FINANCE_CORRECTION_REFUND_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Refund not found for finance correction');
      }
      return response.unprocessable('FINANCE_CORRECTION_FAILED', result.errors?.join(', ') || 'Finance correction failed');
    }

    return response.created(result);
  } catch (error: any) {
    return response.internalError('FINANCE_CORRECTION_FAILED', 'Failed to create finance correction from refund');
  }
}

export async function handleReviewFinanceCorrection(context: any, body: any) {
  const guardResult = requireFinanceRole(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const result = await reviewFinanceCorrection({
      ...body,
      reviewerId: getActorId(context),
      correlationId: context.requestId,
    });

    if (!result.success) {
      if (result.errors?.includes('FINANCE_CORRECTION_NOT_FOUND')) {
        return response.notFound('RESOURCE_NOT_FOUND', 'Finance correction not found');
      }
      return response.unprocessable('FINANCE_CORRECTION_REVIEW_FAILED', result.errors?.join(', ') || 'Review failed');
    }

    return response.ok(result);
  } catch (error: any) {
    return response.internalError('FINANCE_CORRECTION_REVIEW_FAILED', 'Failed to review finance correction');
  }
}

export async function handleGetFinanceCorrection(context: any, query: any) {
  const guardResult = requireFinanceRole(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    if (!query.correctionId) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'correctionId is required');
    }
    const result = await getFinanceCorrection({ correctionId: query.correctionId });
    if (!result) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Finance correction not found');
    }
    return response.ok(result);
  } catch (error: any) {
    if (response.isNotFoundError(error)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Finance correction not found');
    }
    return response.internalError('FINANCE_CORRECTION_GET_FAILED', 'Failed to retrieve finance correction');
  }
}

export async function handleListFinanceCorrections(context: any, query: any) {
  const guardResult = requireFinanceRole(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const offset = query.offset ? parseInt(query.offset, 10) : undefined;

    const result = await listFinanceCorrections({
      ...query,
      limit,
      offset,
    });

    return response.ok(result);
  } catch (error: any) {
    return response.internalError('FINANCE_CORRECTION_LIST_FAILED', 'Failed to list finance corrections');
  }
}
