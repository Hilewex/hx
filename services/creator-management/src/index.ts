import {
  CreatorActionResult,
  CreatorActionType,
  CreatorPermissionCode,
  CreatorProtectedActionEvidence,
  CreatorProtectedActionRequest
} from '@hx/contracts';

export const name = "creator-management";

const processedIdempotencyKeys = new Set<string>();

const actionPermissionMap: Record<CreatorActionType, CreatorPermissionCode> = {
  UPDATE_STOREFRONT_PROFILE_REQUEST: 'CAN_MANAGE_STOREFRONT',
  REORDER_STOREFRONT_PRODUCT_REQUEST: 'CAN_REORDER_STOREFRONT_PRODUCTS',
  REQUEST_PRODUCT_MEDIA_REVIEW: 'CAN_REQUEST_PRODUCT_MEDIA_REVIEW',
  REQUEST_STORE_CONTENT_REVIEW: 'CAN_REQUEST_STORE_CONTENT_REVIEW',
  REQUEST_PRODUCT_VISIBILITY_REVIEW: 'CAN_REQUEST_PRODUCT_VISIBILITY_REVIEW',
  REQUEST_CREATOR_PRICE_WITHIN_ALLOWED_RANGE: 'CAN_REQUEST_CREATOR_PRICE_WITHIN_ALLOWED_RANGE'
};

export function validateCreatorProtectedAction(req: CreatorProtectedActionRequest): CreatorActionResult {
  const requiredError = validateRequiredFields(req);
  if (requiredError) {
    return failure(req, requiredError, {
      permissionChecked: false,
      ownerScopeChecked: Boolean(req.ownerId && req.creatorId && req.ownerId === req.creatorId),
      storefrontScopeChecked: Boolean(req.scopeId && req.storefrontId && req.scopeId === req.storefrontId)
    });
  }

  if (req.actorRole !== 'CREATOR') {
    return failure(req, 'Insufficient permissions', { permissionChecked: true });
  }

  if (req.actorId !== req.creatorId) {
    return failure(req, 'Actor spoofing blocked', {
      actorSpoofingBlocked: true,
      permissionChecked: true
    });
  }

  const expectedPermission = actionPermissionMap[req.actionType];
  if (!expectedPermission || (req.permissionCode && req.permissionCode !== expectedPermission)) {
    return failure(req, 'Insufficient permissions', { permissionChecked: true });
  }

  if (req.ownerId !== req.creatorId) {
    return failure(req, 'Owner scope mismatch', {
      permissionChecked: true,
      ownerScopeChecked: true
    });
  }

  if (req.scopeId !== req.storefrontId) {
    return failure(req, 'Storefront scope mismatch', {
      permissionChecked: true,
      ownerScopeChecked: true,
      storefrontScopeChecked: true
    });
  }

  if (processedIdempotencyKeys.has(req.idempotencyKey)) {
    return {
      success: false,
      error: 'Duplicate idempotency key',
      evidence: createEvidence(req, {
        decision: 'DUPLICATE_IDEMPOTENCY_KEY',
        reasonCode: 'ALREADY_PROCESSED',
        permissionChecked: true,
        ownerScopeChecked: true,
        storefrontScopeChecked: true,
        actorSpoofingBlocked: true,
        ownerDomainHandoff: getOwnerDomainForAction(req.actionType)
      })
    };
  }

  processedIdempotencyKeys.add(req.idempotencyKey);

  return {
    success: true,
    evidence: createEvidence(req, {
      decision: 'PENDING_OWNER_DOMAIN',
      permissionCode: expectedPermission,
      permissionChecked: true,
      ownerScopeChecked: true,
      storefrontScopeChecked: true,
      actorSpoofingBlocked: true,
      ownerDomainHandoff: getOwnerDomainForAction(req.actionType)
    })
  };
}

function validateRequiredFields(req: Partial<CreatorProtectedActionRequest>): string | null {
  if (!req.actorId || !req.actorRole) return 'Missing actorId or actorRole';
  if (!req.creatorId) return 'Missing creatorId';
  if (!req.storefrontId) return 'Missing storefrontId';
  if (!req.scopeId) return 'Missing scopeId';
  if (!req.ownerId) return 'Missing ownerId';
  if (!req.actionType) return 'Missing actionType';
  if (!req.targetType || !req.targetId) return 'Missing target';
  if (!req.reasonCode) return 'Missing reasonCode';
  if (!req.correlationId) return 'Missing correlationId';
  if (!req.idempotencyKey) return 'Missing idempotencyKey';
  if (!req.requestedAt) return 'Missing requestedAt';
  return null;
}

function failure(
  req: Partial<CreatorProtectedActionRequest>,
  error: string,
  flags: Partial<Pick<CreatorProtectedActionEvidence, 'actorSpoofingBlocked' | 'permissionChecked' | 'ownerScopeChecked' | 'storefrontScopeChecked'>> = {}
): CreatorActionResult {
  return {
    success: false,
    error,
    evidence: createEvidence(req, {
      decision: 'REJECTED',
      permissionChecked: flags.permissionChecked ?? false,
      ownerScopeChecked: flags.ownerScopeChecked ?? false,
      storefrontScopeChecked: flags.storefrontScopeChecked ?? false,
      actorSpoofingBlocked: flags.actorSpoofingBlocked ?? false,
      ownerDomainHandoff: null
    })
  };
}

function createEvidence(
  req: Partial<CreatorProtectedActionRequest>,
  overrides: Partial<CreatorProtectedActionEvidence>
): CreatorProtectedActionEvidence {
  const actionType = req.actionType || 'REQUEST_STORE_CONTENT_REVIEW';

  return {
    actorId: req.actorId || 'UNKNOWN',
    creatorId: req.creatorId || 'UNKNOWN',
    storefrontId: req.storefrontId || 'UNKNOWN',
    scopeId: req.scopeId || 'UNKNOWN',
    ownerId: req.ownerId || 'UNKNOWN',
    actionType,
    targetType: req.targetType || 'STORE_CONTENT',
    targetId: req.targetId || 'UNKNOWN',
    reasonCode: overrides.reasonCode || req.reasonCode || 'MISSING_REASON_CODE',
    correlationId: req.correlationId || 'UNKNOWN',
    idempotencyKey: req.idempotencyKey || 'UNKNOWN',
    decision: overrides.decision || 'REJECTED',
    permissionCode: overrides.permissionCode || (req.permissionCode ?? null),
    ownerDomainHandoff: overrides.ownerDomainHandoff ?? null,
    auditRequired: true,
    creatorDirectWrite: false,
    ownerTruthMutatedByCreator: false,
    productTruthMutated: false,
    priceTruthMutated: false,
    stockTruthMutated: false,
    mediaTruthMutated: false,
    financeTruthMutated: false,
    payoutTruthMutated: false,
    bffTruthMutated: false,
    uiTruthMutated: false,
    actorSpoofingBlocked: overrides.actorSpoofingBlocked ?? false,
    storefrontScopeChecked: overrides.storefrontScopeChecked ?? false,
    ownerScopeChecked: overrides.ownerScopeChecked ?? false,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    permissionChecked: overrides.permissionChecked ?? false,
    businessTruthMutated: false
  };
}

function getOwnerDomainForAction(actionType: CreatorActionType): string {
  switch (actionType) {
    case 'UPDATE_STOREFRONT_PROFILE_REQUEST':
    case 'REQUEST_STORE_CONTENT_REVIEW':
      return 'CONTENT_DOMAIN';
    case 'REORDER_STOREFRONT_PRODUCT_REQUEST':
    case 'REQUEST_PRODUCT_VISIBILITY_REVIEW':
      return 'STOREFRONT_DOMAIN';
    case 'REQUEST_PRODUCT_MEDIA_REVIEW':
      return 'MEDIA_DOMAIN';
    case 'REQUEST_CREATOR_PRICE_WITHIN_ALLOWED_RANGE':
      return 'PRICING_POLICY_DOMAIN';
    default:
      return 'UNKNOWN_DOMAIN';
  }
}
