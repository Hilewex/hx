export type SupplierActor = {
  actorId: string;
  actorRole: 'SUPPLIER';
  supplierId: string;
};

export type SupplierActionType =
  | 'REQUEST_PRODUCT_INTAKE_REVIEW'
  | 'REQUEST_BASE_PRICE_UPDATE'
  | 'REQUEST_STOCK_UPDATE'
  | 'REQUEST_PRODUCT_MEDIA_REVIEW'
  | 'REQUEST_LOGISTICS_INFO_UPDATE'
  | 'REQUEST_SUPPLIER_PROFILE_UPDATE';

export type SupplierActionTargetType =
  | 'SUPPLIER_PRODUCT'
  | 'POOL_PRODUCT'
  | 'BASE_PRICE'
  | 'STOCK_ITEM'
  | 'PRODUCT_MEDIA'
  | 'LOGISTICS_INFO'
  | 'SUPPLIER_PROFILE';

export type SupplierPermissionCode =
  | 'CAN_REQUEST_PRODUCT_INTAKE_REVIEW'
  | 'CAN_REQUEST_BASE_PRICE_UPDATE'
  | 'CAN_REQUEST_STOCK_UPDATE'
  | 'CAN_REQUEST_PRODUCT_MEDIA_REVIEW'
  | 'CAN_REQUEST_LOGISTICS_INFO_UPDATE'
  | 'CAN_REQUEST_SUPPLIER_PROFILE_UPDATE';

export interface SupplierScope {
  ownerId: string;
  supplierId: string;
  scopeId: string;
}

export interface SupplierActionTarget {
  targetType: SupplierActionTargetType;
  targetId: string;
  productId?: string;
  poolProductId?: string;
}

export interface SupplierProtectedActionRequest extends SupplierScope, SupplierActionTarget {
  actorId: string;
  actorRole: string;
  actionType: SupplierActionType;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  permissionCode?: SupplierPermissionCode;
  metadata?: Record<string, string | number | boolean | null>;
}

export type SupplierActionDecision =
  | 'REJECTED'
  | 'PENDING_OWNER_DOMAIN'
  | 'DUPLICATE_IDEMPOTENCY_KEY';

export interface SupplierProtectedActionEvidence {
  actorId: string;
  supplierId: string;
  scopeId: string;
  ownerId: string;
  actionType: SupplierActionType;
  targetType: SupplierActionTargetType;
  targetId: string;
  productId: string | null;
  poolProductId: string | null;
  reasonCode: string;
  correlationId: string;
  idempotencyKey: string;
  decision: SupplierActionDecision;
  permissionCode: SupplierPermissionCode | null;
  ownerDomainHandoff: string | null;
  auditRequired: true;
  supplierDirectWrite: false;
  ownerTruthMutatedBySupplier: false;
  productTruthMutated: false;
  platformSalePriceTruthMutated: false;
  creatorMarginTruthMutated: false;
  stockTruthDirectlyMutated: false;
  basePriceTruthDirectlyMutated: false;
  financeTruthMutated: false;
  payoutTruthMutated: false;
  settlementTruthMutated: false;
  customerPiiExposed: false;
  bffTruthMutated: false;
  uiTruthMutated: false;
  actorSpoofingBlocked: boolean;
  supplierScopeChecked: boolean;
  ownerScopeChecked: boolean;
  auditEvidenceRequired: true;
  reasonCodeRequired: true;
  permissionChecked: boolean;
  businessTruthMutated: false;
}

export type SupplierActionResult = {
  success: boolean;
  evidence: SupplierProtectedActionEvidence;
  error?: string;
};

export type SupplierProjectionScopeStatus = 'PROJECTED' | 'DEGRADED' | 'UNAVAILABLE';

export interface SupplierContextProjection {
  actorId: string;
  supplierId: string;
  storeNameProjection: string;
  authenticatedProjection: boolean;
  supplierScopeStatus: SupplierProjectionScopeStatus;
}

export interface SupplierProductProjectionItem {
  supplierProductId: string;
  productId: string;
  title: string;
  intakeStatusProjection: string;
  reviewStatusProjection: string;
  stockProjectionText: string;
  priceProjectionText: string;
  moderationProjectionText: string;
  productSubmittedTruth: false;
  productActiveTruth: false;
  stockTruth: false;
  priceTruth: false;
  activationTruth: false;
}

export interface SupplierProductsProjection {
  items: SupplierProductProjectionItem[];
  totalProjection?: number;
  emptyState?: boolean;
  warnings?: string[];
}

export interface SupplierOrderProjectionItem {
  orderId: string;
  orderReference: string;
  productTitle: string;
  quantityProjectionText: string;
  preparationStateProjection: string;
  readinessProjectionText: string;
  shipmentPreparationProjectionText: string;
  supportProjectionText: string;
  shipmentTruth: false;
  deliveryTruth: false;
  customerPrivateDataIncluded: false;
}

export interface SupplierOrdersProjection {
  items: SupplierOrderProjectionItem[];
  totalProjection?: number;
  emptyState?: boolean;
  warnings?: string[];
}

export interface SupplierShipmentProjectionItem {
  shipmentId: string;
  orderReference: string;
  carrierProjectionText: string;
  trackingProjectionText: string;
  preparationStateProjection: string;
  degradedStateText?: string;
  shipmentPreparedTruth: false;
  shippedTruth: false;
  deliveredTruth: false;
  rawLogisticsPayloadIncluded: false;
}

export interface SupplierShipmentsProjection {
  items: SupplierShipmentProjectionItem[];
  totalProjection?: number;
  degradedStateText?: string;
  emptyState?: boolean;
  warnings?: string[];
}

export interface SupplierSupportProjectionItem {
  ticketId: string;
  orderReference?: string;
  statusProjection: string;
  guidanceText: string;
  escalationProjectionText: string;
  moderationDecisionTruth: false;
  fraudRiskInternalsIncluded: false;
}

export interface SupplierSupportProjection {
  items: SupplierSupportProjectionItem[];
  totalProjection?: number;
  degradedStateText?: string;
  emptyState?: boolean;
  warnings?: string[];
}

export interface SupplierScopeGuidanceProjection {
  surfaceOnlyProjection: true;
  actionsRequireOwnerCommand: true;
  scopeOutsideActionBlockedText: string;
  boundaryTexts: string[];
}

export interface SupplierBoundaryFlags {
  stockTruth: false;
  priceTruth: false;
  activationTruth: false;
  shipmentTruth: false;
  deliveryTruth: false;
  payoutSettlementTruth: false;
  moderationDecisionTruth: false;
  rawLogisticsPayloadIncluded: false;
  privateCustomerDataIncluded: false;
}

export interface SupplierDashboardProjection {
  context: SupplierContextProjection;
  products: SupplierProductsProjection;
  orders: SupplierOrdersProjection;
  shipments: SupplierShipmentsProjection;
  support: SupplierSupportProjection;
  stockWarningProjectionText: string;
  degradedStateText?: string;
  scopeGuidance: SupplierScopeGuidanceProjection;
  boundaryFlags: SupplierBoundaryFlags;
  warnings?: string[];
}
