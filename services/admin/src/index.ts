import {
  AdminProtectedActionRequest,
  AdminActionResult,
  AdminProtectedActionEvidence
} from '@hx/contracts';

export {
  buildFinanceOpsProjection,
  buildOperationalQueueDetailProjection,
  buildOperationalQueueProjection,
  listPayoutCandidateReviewQueue,
  priorities,
  queueDomains,
  readPayoutCandidateReviewProjection,
  workflowStates,
} from './ops-projections';

const processedIdempotencyKeys = new Set<string>();

export function validateAdminProtectedAction(req: AdminProtectedActionRequest): AdminActionResult {
  if (!req.actorId || !req.actorRole) {
    return {
      success: false,
      error: 'Missing actorId or actorRole',
      evidence: createFailureEvidence(req, 'Missing actor')
    };
  }

  if (!req.reasonCode) {
    return {
      success: false,
      error: 'Missing reasonCode',
      evidence: createFailureEvidence(req, 'Missing reasonCode')
    };
  }

  if (!req.correlationId) {
    return {
      success: false,
      error: 'Missing correlationId',
      evidence: createFailureEvidence(req, 'Missing correlationId')
    };
  }

  if (!req.idempotencyKey) {
    return {
      success: false,
      error: 'Missing idempotencyKey',
      evidence: createFailureEvidence(req, 'Missing idempotencyKey')
    };
  }

  const validRoles = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'];
  if (!validRoles.includes(req.actorRole)) {
    return {
      success: false,
      error: 'Insufficient permissions',
      evidence: createFailureEvidence(req, 'Invalid role')
    };
  }
  
  if (processedIdempotencyKeys.has(req.idempotencyKey)) {
     return {
        success: false,
        error: 'Duplicate idempotency key',
        evidence: createFailureEvidence(req, 'ALREADY_PROCESSED')
     }
  }
  
  processedIdempotencyKeys.add(req.idempotencyKey);

  const evidence: AdminProtectedActionEvidence = {
    actorId: req.actorId,
    actionType: req.actionType,
    targetType: req.targetType,
    targetId: req.targetId,
    reasonCode: req.reasonCode,
    correlationId: req.correlationId,
    idempotencyKey: req.idempotencyKey,
    decision: 'PENDING_OWNER_DOMAIN',
    adminDirectWrite: false, // Core requirement: No direct write
    ownerCommandRequired: true, // Handed off to owner domain
    ownerTruthMutatedByAdmin: false,
    bffTruthMutated: false,
    uiTruthMutated: false,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    permissionChecked: true,
    ownerScopeChecked: req.scopeId ? true : false,
    businessTruthMutated: false,
    ownerDomainHandoff: getOwnerDomainForAction(req.actionType)
  };

  return {
    success: true,
    evidence
  };
}

function createFailureEvidence(req: Partial<AdminProtectedActionRequest>, fallbackReason: string): AdminProtectedActionEvidence {
  return {
    actorId: req.actorId || 'UNKNOWN',
    actionType: req.actionType || 'MODERATION_REVIEW_REQUEST',
    targetType: req.targetType || 'UNKNOWN',
    targetId: req.targetId || 'UNKNOWN',
    reasonCode: req.reasonCode || fallbackReason,
    correlationId: req.correlationId || 'UNKNOWN',
    idempotencyKey: req.idempotencyKey || 'UNKNOWN',
    decision: 'REJECTED',
    adminDirectWrite: false,
    ownerCommandRequired: true,
    ownerTruthMutatedByAdmin: false,
    bffTruthMutated: false,
    uiTruthMutated: false,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    permissionChecked: false,
    ownerScopeChecked: false,
    businessTruthMutated: false,
    ownerDomainHandoff: null
  };
}

function getOwnerDomainForAction(actionType: string): string {
  switch (actionType) {
    case 'SUSPEND_CREATOR_REQUEST': return 'CREATOR_DOMAIN';
    case 'SUPPLIER_REVIEW_REQUEST': return 'SUPPLIER_DOMAIN';
    case 'MODERATION_REVIEW_REQUEST': return 'MODERATION_DOMAIN';
    case 'PAYOUT_HOLD_REQUEST': return 'FINANCE_DOMAIN';
    case 'CATALOG_VISIBILITY_REVIEW_REQUEST': return 'CATALOG_DOMAIN';
    default: return 'UNKNOWN_DOMAIN';
  }
}
