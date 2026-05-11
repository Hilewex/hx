import {
  CreateRiskSignalCommand,
  CreateRiskCaseCommand,
  ReviewRiskCaseCommand,
  GetRiskCaseQuery,
  ListRiskCasesQuery
} from '@hx/contracts';
import {
  createRiskSignal,
  createRiskCase,
  reviewRiskCase,
  getRiskCase,
  listRiskCases,
  listRiskSignals
} from '@hx/risk';
import * as response from './response';
import { requireAuthenticated, requireRiskOperator } from './guards';

export async function handleCreateRiskSignal(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: CreateRiskSignalCommand = req.body;
    if (!command.target?.targetId || !command.target?.targetType || !command.type) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for risk signal');
    }
    const evidenceError = validateRiskEvidence(command);
    if (evidenceError) return evidenceError;
    const result = await createRiskSignal(command);
    return response.created(result);
  } catch (error: any) {
    if (error?.code?.startsWith('RISK_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('RISK_SIGNAL_FAILED', 'Failed to create risk signal');
  }
}

export async function handleListRiskSignals(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const query = {
      targetId: req.query.targetId as string,
      targetType: req.query.targetType as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    const result = await listRiskSignals(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('RISK_SIGNAL_LIST_FAILED', 'Failed to list risk signals');
  }
}

export async function handleCreateRiskCase(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: CreateRiskCaseCommand = req.body;
    if (!command.target?.targetId || !command.target?.targetType || !command.level) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for risk case');
    }
    const evidenceError = validateRiskEvidence(command);
    if (evidenceError) return evidenceError;
    const result = await createRiskCase(command);
    return response.created(result);
  } catch (error: any) {
    if (error?.code?.startsWith('RISK_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('RISK_CASE_CREATION_FAILED', 'Failed to create risk case');
  }
}

export async function handleReviewRiskCase(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: ReviewRiskCaseCommand = req.body;
    if (!command.caseId || !command.reviewerId || !command.decision) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for risk review');
    }
    const evidenceError = validateRiskEvidence(command);
    if (evidenceError) return evidenceError;
    const result = await reviewRiskCase(command);
    return response.ok(result);
  } catch (error: any) {
    if (error?.code?.startsWith('RISK_')) {
      return response.badRequest(error.code, error.message);
    }
    if (response.isNotFoundError(error)) {
      return response.notFound('RISK_CASE_NOT_FOUND', 'Risk case not found for review');
    }
    return response.internalError('RISK_REVIEW_FAILED', 'Failed to review risk case');
  }
}

function validateRiskEvidence(command: {
  reasonCode?: string;
  correlationId?: string;
  idempotencyKey?: string;
}) {
  if (!command.reasonCode) {
    return response.badRequest('RISK_REASON_CODE_REQUIRED', 'reasonCode is required');
  }
  if (!command.correlationId) {
    return response.badRequest('RISK_CORRELATION_ID_REQUIRED', 'correlationId is required');
  }
  if (!command.idempotencyKey) {
    return response.badRequest('RISK_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
  return null;
}

export async function handleGetRiskCase(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const caseId = req.query.caseId as string;
    if (!caseId) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'caseId is required');
    }
    const query: GetRiskCaseQuery = { caseId };
    const result = await getRiskCase(query);
    if (!result) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Risk case not found');
    }
    return response.ok(result);
  } catch (error: any) {
    if (response.isNotFoundError(error)) {
      return response.notFound('RESOURCE_NOT_FOUND', 'Risk case not found');
    }
    return response.internalError('RISK_GET_FAILED', 'Failed to retrieve risk case');
  }
}

export async function handleListRiskCases(req: any) {
  const context = req.context;
  const guardResult = requireRiskOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const query: ListRiskCasesQuery = {
      targetId: req.query.targetId as string,
      targetType: req.query.targetType as any,
      status: req.query.status as any,
      level: req.query.level as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    const result = await listRiskCases(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError('RISK_LIST_FAILED', 'Failed to list risk cases');
  }
}
