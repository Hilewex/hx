import {
  SupplierActionResult,
  SupplierActionType,
  SupplierPermissionCode,
  SupplierProtectedActionEvidence,
  SupplierProtectedActionRequest
} from '@hx/contracts';

export const name = "supplier-management";

const processedIdempotencyKeys = new Set<string>();

const actionPermissionMap: Record<SupplierActionType, SupplierPermissionCode> = {
  REQUEST_PRODUCT_INTAKE_REVIEW: 'CAN_REQUEST_PRODUCT_INTAKE_REVIEW',
  REQUEST_BASE_PRICE_UPDATE: 'CAN_REQUEST_BASE_PRICE_UPDATE',
  REQUEST_STOCK_UPDATE: 'CAN_REQUEST_STOCK_UPDATE',
  REQUEST_PRODUCT_MEDIA_REVIEW: 'CAN_REQUEST_PRODUCT_MEDIA_REVIEW',
  REQUEST_LOGISTICS_INFO_UPDATE: 'CAN_REQUEST_LOGISTICS_INFO_UPDATE',
  REQUEST_SUPPLIER_PROFILE_UPDATE: 'CAN_REQUEST_SUPPLIER_PROFILE_UPDATE'
};

export function validateSupplierProtectedAction(req: SupplierProtectedActionRequest): SupplierActionResult {
  const requiredError = validateRequiredFields(req);
  if (requiredError) {
    return failure(req, requiredError, {
      permissionChecked: false,
      ownerScopeChecked: Boolean(req.ownerId && req.supplierId && req.ownerId === req.supplierId),
      supplierScopeChecked: Boolean(req.scopeId && req.supplierId && req.scopeId === req.supplierId)
    });
  }

  if (req.actorRole !== 'SUPPLIER') {
    return failure(req, 'Insufficient permissions', { permissionChecked: true });
  }

  if (req.actorId !== req.supplierId) {
    return failure(req, 'Actor spoofing blocked', {
      actorSpoofingBlocked: true,
      permissionChecked: true
    });
  }

  const expectedPermission = actionPermissionMap[req.actionType];
  if (!expectedPermission || (req.permissionCode && req.permissionCode !== expectedPermission)) {
    return failure(req, 'Insufficient permissions', { permissionChecked: true });
  }

  if (req.ownerId !== req.supplierId) {
    return failure(req, 'Owner scope mismatch', {
      permissionChecked: true,
      ownerScopeChecked: true
    });
  }

  if (req.scopeId !== req.supplierId) {
    return failure(req, 'Supplier scope mismatch', {
      permissionChecked: true,
      ownerScopeChecked: true,
      supplierScopeChecked: true
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
        supplierScopeChecked: true,
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
      supplierScopeChecked: true,
      actorSpoofingBlocked: true,
      ownerDomainHandoff: getOwnerDomainForAction(req.actionType)
    })
  };
}

function validateRequiredFields(req: Partial<SupplierProtectedActionRequest>): string | null {
  if (!req.actorId || !req.actorRole) return 'Missing actorId or actorRole';
  if (!req.supplierId) return 'Missing supplierId';
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
  req: Partial<SupplierProtectedActionRequest>,
  error: string,
  flags: Partial<Pick<SupplierProtectedActionEvidence, 'actorSpoofingBlocked' | 'permissionChecked' | 'ownerScopeChecked' | 'supplierScopeChecked'>> = {}
): SupplierActionResult {
  return {
    success: false,
    error,
    evidence: createEvidence(req, {
      decision: 'REJECTED',
      permissionChecked: flags.permissionChecked ?? false,
      ownerScopeChecked: flags.ownerScopeChecked ?? false,
      supplierScopeChecked: flags.supplierScopeChecked ?? false,
      actorSpoofingBlocked: flags.actorSpoofingBlocked ?? false,
      ownerDomainHandoff: null
    })
  };
}

function createEvidence(
  req: Partial<SupplierProtectedActionRequest>,
  overrides: Partial<SupplierProtectedActionEvidence>
): SupplierProtectedActionEvidence {
  const actionType = req.actionType || 'REQUEST_PRODUCT_INTAKE_REVIEW';

  return {
    actorId: req.actorId || 'UNKNOWN',
    supplierId: req.supplierId || 'UNKNOWN',
    scopeId: req.scopeId || 'UNKNOWN',
    ownerId: req.ownerId || 'UNKNOWN',
    actionType,
    targetType: req.targetType || 'SUPPLIER_PRODUCT',
    targetId: req.targetId || 'UNKNOWN',
    productId: req.productId || null,
    poolProductId: req.poolProductId || null,
    reasonCode: overrides.reasonCode || req.reasonCode || 'MISSING_REASON_CODE',
    correlationId: req.correlationId || 'UNKNOWN',
    idempotencyKey: req.idempotencyKey || 'UNKNOWN',
    decision: overrides.decision || 'REJECTED',
    permissionCode: overrides.permissionCode || (req.permissionCode ?? null),
    ownerDomainHandoff: overrides.ownerDomainHandoff ?? null,
    auditRequired: true,
    supplierDirectWrite: false,
    ownerTruthMutatedBySupplier: false,
    productTruthMutated: false,
    platformSalePriceTruthMutated: false,
    creatorMarginTruthMutated: false,
    stockTruthDirectlyMutated: false,
    basePriceTruthDirectlyMutated: false,
    financeTruthMutated: false,
    payoutTruthMutated: false,
    settlementTruthMutated: false,
    customerPiiExposed: false,
    bffTruthMutated: false,
    uiTruthMutated: false,
    actorSpoofingBlocked: overrides.actorSpoofingBlocked ?? false,
    supplierScopeChecked: overrides.supplierScopeChecked ?? false,
    ownerScopeChecked: overrides.ownerScopeChecked ?? false,
    auditEvidenceRequired: true,
    reasonCodeRequired: true,
    permissionChecked: overrides.permissionChecked ?? false,
    businessTruthMutated: false
  };
}

function getOwnerDomainForAction(actionType: SupplierActionType): string {
  switch (actionType) {
    case 'REQUEST_PRODUCT_INTAKE_REVIEW':
      return 'PRODUCT_INTAKE_DOMAIN';
    case 'REQUEST_BASE_PRICE_UPDATE':
      return 'BASE_PRICE_POLICY_DOMAIN';
    case 'REQUEST_STOCK_UPDATE':
      return 'CENTRAL_STOCK_DOMAIN';
    case 'REQUEST_PRODUCT_MEDIA_REVIEW':
      return 'MEDIA_DOMAIN';
    case 'REQUEST_LOGISTICS_INFO_UPDATE':
      return 'LOGISTICS_DOMAIN';
    case 'REQUEST_SUPPLIER_PROFILE_UPDATE':
      return 'SUPPLIER_MANAGEMENT_DOMAIN';
    default:
      return 'UNKNOWN_DOMAIN';
  }
}
