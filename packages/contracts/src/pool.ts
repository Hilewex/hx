
export enum ProductAcceptanceStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  REVISION_REQUESTED = "REVISION_REQUESTED",
  REVISION_SUBMITTED = "REVISION_SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export interface ProductMediaRef {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  order: number;
}

export interface SupplierProductLogisticsInput {
  shippingWeight: number;
  shippingWidth: number;
  shippingHeight: number;
  shippingDepth: number;
  isFragile: boolean;
}

export interface SupplierSubmittedVariant {
  id: string;
  title: string;
  sku: string;
  barcode: string;
  stock: number;
  price: number;
  attributes: Record<string, string>;
  media: ProductMediaRef[];
}

export interface SupplierSubmittedProduct {
  id: string;
  supplierId: string;
  title: string;
  description: string;
  brand: string;
  categoryId: string;
  tags: string[];
  status: ProductAcceptanceStatus;
  variants: SupplierSubmittedVariant[];
  logistics: SupplierProductLogisticsInput;
  reviewHistory: ProductReviewDecisionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductReviewDecisionRecord {
  id: string;
  reviewerId: string;
  decision: "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  notes: string;
  timestamp: Date;
}

// Commands
export type CreateSupplierProductDraftCommand = {
  actor: PoolActorContext;
} & Pick<SupplierSubmittedProduct, "supplierId" | "title" | "categoryId">;

export type UpdateSupplierProductDraftCommand = {
  actor: PoolActorContext;
  id: string;
} & Partial<
  Pick<
    SupplierSubmittedProduct,
    | "title"
    | "description"
    | "brand"
    | "categoryId"
    | "tags"
    | "variants"
    | "logistics"
  >
>;

export interface SubmitSupplierProductForReviewCommand {
  actor: PoolActorContext;
  id: string;
}

export interface StartProductReviewCommand {
  actor: PoolActorContext;
  productId: string;
}

export interface RequestProductRevisionCommand {
  actor: PoolActorContext;
  productId: string;
  notes: string;
  requiredChanges: string[];
}

export interface SubmitProductRevisionCommand {
  actor: PoolActorContext;
  id: string;
  changes: Partial<SupplierSubmittedProduct>;
}

export interface ApproveSupplierProductCommand {
  actor: PoolActorContext;
  productId: string;
  notes?: string;
}

export interface RejectSupplierProductCommand {
  actor: PoolActorContext;
  productId: string;
  notes: string;
}

export interface SuspendSubmittedProductCommand {
  actor: PoolActorContext;
  productId: string;
  reason: string;
}

// Results
export interface CreateSupplierProductDraftResult {
  product: SupplierSubmittedProduct;
}

export type PoolActorType =
  | "SUPPLIER"
  | "ADMIN"
  | "OPERATOR"
  | "SYSTEM"
  | "CREATOR";

export interface PoolActorContext {
  actorId: string;
  actorType: PoolActorType;
  supplierId?: string;
  creatorStoreId?: string;
}


export enum PoolErrorCode {
  POOL_FORBIDDEN = "POOL_FORBIDDEN",
  POOL_NOT_FOUND = "POOL_NOT_FOUND",
  POOL_INVALID_TRANSITION = "POOL_INVALID_TRANSITION",
  POOL_VALIDATION_FAILED = "POOL_VALIDATION_FAILED",
  POOL_DUPLICATE_COMMERCIALIZE = "POOL_DUPLICATE_COMMERCIALIZE",
  POOL_BINDING_INCOMPLETE = "POOL_BINDING_INCOMPLETE",
  POOL_ACTOR_CONTEXT_REQUIRED = "POOL_ACTOR_CONTEXT_REQUIRED",
  POOL_SUPPLIER_SCOPE_MISMATCH = "POOL_SUPPLIER_SCOPE_MISMATCH",
  POOL_CREATOR_STORE_SCOPE_MISMATCH = "POOL_CREATOR_STORE_SCOPE_MISMATCH",
  POOL_CREATOR_STORE_PRODUCT_NOT_FOUND = "POOL_CREATOR_STORE_PRODUCT_NOT_FOUND",
  POOL_CREATOR_STORE_DUPLICATE_PRODUCT = "POOL_CREATOR_STORE_DUPLICATE_PRODUCT",
  POOL_CREATOR_STORE_INVALID_MERCHANDISING = "POOL_CREATOR_STORE_INVALID_MERCHANDISING",
  POOL_CREATOR_STORE_REORDER_FAILED = "POOL_CREATOR_STORE_REORDER_FAILED",
  POOL_CREATOR_STORE_MEDIA_DUPLICATE = "POOL_CREATOR_STORE_MEDIA_DUPLICATE",
  POOL_CREATOR_STORE_MEDIA_NOT_FOUND = "POOL_CREATOR_STORE_MEDIA_NOT_FOUND",
  POOL_CREATOR_STORE_MEDIA_INVALID = "POOL_CREATOR_STORE_MEDIA_INVALID",
}

export interface PoolErrorResult {
  code: PoolErrorCode;
  message: string;
  details?: Record<string, any>;
}

export type PoolResult<T> =
  | { success: true; data: T }
  | { success: false; error: PoolErrorResult };


export enum CommercialPoolStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

export enum PoolBindingStatus {
  PENDING = "PENDING",
  BOUND = "BOUND",
  FAILED = "FAILED",
}

export enum PoolBindingType {
  PRICING = "PRICING",
  STOCK = "STOCK",
  CATEGORY = "CATEGORY",
  MEDIA = "MEDIA",
}

export interface PoolBindingCheckResult {
  type: PoolBindingType;
  status: PoolBindingStatus;
  reason?: string;
  checkedAt: Date;
}

export interface CommercialPoolBindingSnapshot {
  pricing: PoolBindingCheckResult;
  stock: PoolBindingCheckResult;
  category: PoolBindingCheckResult;
  media: PoolBindingCheckResult;
  isAllBound: boolean;
  createdAt: Date;
}


export interface CommercializationSnapshot {
  timestamp: Date;
  actorId: string;
  originalSubmittedProductId: string;
  data: Pick<
    SupplierSubmittedProduct,
    | "title"
    | "description"
    | "brand"
    | "categoryId"
    | "tags"
    | "variants"
    | "logistics"
  >;
}

export interface CommercialPoolProduct {
  id: string;
  status: CommercialPoolStatus;
  commercialization: CommercializationSnapshot;
  bindingSnapshot?: CommercialPoolBindingSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommercializeApprovedProductCommand {
  actor: PoolActorContext;
  submittedProductId: string;
}

export interface ActivateCommercialPoolProductCommand {
  actor: PoolActorContext;
  commercialPoolProductId: string;
}

export interface SuspendCommercialPoolProductCommand {
  actor: PoolActorContext;
  commercialPoolProductId: string;
  reason: string;
}

export interface ArchiveCommercialPoolProductCommand {
  actor: PoolActorContext;
  commercialPoolProductId: string;
}

export interface CommercializeApprovedProductResult {
  product: CommercialPoolProduct;
}

export interface BindCommercialPoolProductCommand {
  actor: PoolActorContext;
  commercialPoolProductId: string;
}

export interface GetSupplierSubmittedProductQuery {
  actor: PoolActorContext;
  id: string;
}

export interface ListSupplierSubmittedProductsQuery {
  actor: PoolActorContext;
  supplierId?: string;
  status?: ProductAcceptanceStatus;
}

export enum CreatorStoreProductStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  REMOVED = "REMOVED",
}

export enum CreatorStoreProductVisibility {
  VISIBLE = "VISIBLE",
  HIDDEN = "HIDDEN",
}

export enum CreatorStoreProductMediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export enum CreatorStoreProductMediaUsage {
  PRODUCT_CARD = "PRODUCT_CARD",
  PRODUCT_DETAIL = "PRODUCT_DETAIL",
  STORE_HIGHLIGHT = "STORE_HIGHLIGHT",
}

export interface CreatorStoreProductMediaRef {
  mediaAssetId: string;
  mediaType: CreatorStoreProductMediaType;
  usage: CreatorStoreProductMediaUsage;
  displayOrder: number;
  caption?: string;
}

export interface CreatorStoreProduct {
  id: string;
  creatorStoreId: string;
  commercialPoolProductId: string;
  status: CreatorStoreProductStatus;
  visibility: CreatorStoreProductVisibility;
  displayOrder: number;
  isFeatured: boolean;
  creatorNote: string;
  selectedPrice: number;
  creatorMediaRefs: CreatorStoreProductMediaRef[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddCommercialProductToCreatorStoreCommand {
  actor: PoolActorContext;
  creatorStoreId: string;
  commercialPoolProductId: string;
  selectedPrice: number;
}

export interface PauseCreatorStoreProductCommand {
  actor: PoolActorContext;
  creatorStoreProductId: string;
}

export interface ResumeCreatorStoreProductCommand {
  actor: PoolActorContext;
  creatorStoreProductId: string;
}

export interface RemoveCreatorStoreProductCommand {
  actor: PoolActorContext;
  creatorStoreProductId: string;
}

export interface UpdateCreatorStoreProductMerchandisingCommand {
  actor: PoolActorContext;
  creatorStoreProductId: string;
  visibility?: CreatorStoreProductVisibility;
  displayOrder?: number;
  isFeatured?: boolean;
  creatorNote?: string;
}

export interface ReorderCreatorStoreProductsCommand {
  actor: PoolActorContext;
  creatorStoreId: string;
  orderedProductIds: string[];
}

export interface AddCommercialProductToCreatorStoreResult {
  creatorStoreProduct: CreatorStoreProduct;
}

export interface UpdateCreatorStoreProductMerchandisingResult {
  creatorStoreProduct: CreatorStoreProduct;
}

export interface ReorderCreatorStoreProductsResult {
  success: true;
}

export interface AddCreatorStoreProductMediaCommand {
  actor: PoolActorContext;
  creatorStoreProductId: string;
  mediaAssetId: string;
  mediaType: CreatorStoreProductMediaType;
  usage: CreatorStoreProductMediaUsage;
  displayOrder: number;
  caption?: string;
}

export interface RemoveCreatorStoreProductMediaCommand {
  actor: PoolActorContext;
  creatorStoreProductId: string;
  mediaAssetId: string;
}

export interface ReorderCreatorStoreProductMediaCommand {
  actor: PoolActorContext;
  creatorStoreProductId: string;
  orderedMediaAssetIds: string[];
}

export interface CreatorStoreProductMediaOperationResult {
  creatorStoreProduct: CreatorStoreProduct;
}


