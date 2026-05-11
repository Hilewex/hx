import {
  CreateFraudFalsePositiveReviewCommand,
  CreateFraudReviewCaseCommand,
  CreateFraudSignalCommand,
  ReviewFraudCaseCommand
} from '@hx/contracts';
import {
  createFraudFalsePositiveReview,
  createFraudReviewCase,
  createFraudSignal,
  reviewFraudCase
} from '@hx/fraud';
import * as response from './response';
import { requireRiskOperator } from './guards';

export async function handleCreateFraudSignal(req: any) {
  const guardResult = requireRiskOperator(req.context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: CreateFraudSignalCommand = req.body;
    if (!command.target?.targetId || !command.target?.targetType || !command.signalType || !command.severity) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for fraud signal');
    }
    const evidenceError = validateFraudEvidence(command);
    if (evidenceError) return evidenceError;
    return response.created(await createFraudSignal(command));
  } catch (error: any) {
    if (error?.code?.startsWith('FRAUD_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('FRAUD_SIGNAL_FAILED', 'Failed to create fraud signal');
  }
}

export async function handleCreateFraudCase(req: any) {
  const guardResult = requireRiskOperator(req.context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: CreateFraudReviewCaseCommand = req.body;
    if (!command.target?.targetId || !command.target?.targetType || !command.signalType || !command.severity) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for fraud review case');
    }
    const evidenceError = validateFraudEvidence(command);
    if (evidenceError) return evidenceError;
    return response.created(await createFraudReviewCase(command));
  } catch (error: any) {
    if (error?.code?.startsWith('FRAUD_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('FRAUD_CASE_CREATION_FAILED', 'Failed to create fraud review case');
  }
}

export async function handleReviewFraudCase(req: any) {
  const guardResult = requireRiskOperator(req.context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: ReviewFraudCaseCommand = req.body;
    if (!command.fraudCaseId || !command.reviewerId || !command.decision) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'Missing required fields for fraud review');
    }
    const evidenceError = validateFraudEvidence(command);
    if (evidenceError) return evidenceError;
    return response.ok(await reviewFraudCase(command));
  } catch (error: any) {
    if (error?.code?.startsWith('FRAUD_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('FRAUD_REVIEW_FAILED', 'Failed to review fraud case');
  }
}

export async function handleCreateFraudFalsePositiveReview(req: any) {
  const guardResult = requireRiskOperator(req.context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const command: CreateFraudFalsePositiveReviewCommand = req.body;
    if (!command.fraudCaseId) {
      return response.badRequest('REQUEST_MISSING_FIELD', 'fraudCaseId is required');
    }
    const evidenceError = validateFraudEvidence(command);
    if (evidenceError) return evidenceError;
    return response.created(await createFraudFalsePositiveReview(command));
  } catch (error: any) {
    if (error?.code?.startsWith('FRAUD_')) {
      return response.badRequest(error.code, error.message);
    }
    return response.internalError('FRAUD_FALSE_POSITIVE_REVIEW_FAILED', 'Failed to create fraud false-positive review');
  }
}

function validateFraudEvidence(command: {
  reasonCode?: string;
  correlationId?: string;
  idempotencyKey?: string;
}) {
  if (!command.reasonCode) {
    return response.badRequest('FRAUD_REASON_CODE_REQUIRED', 'reasonCode is required');
  }
  if (!command.correlationId) {
    return response.badRequest('FRAUD_CORRELATION_ID_REQUIRED', 'correlationId is required');
  }
  if (!command.idempotencyKey) {
    return response.badRequest('FRAUD_IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey is required');
  }
  return null;
}
