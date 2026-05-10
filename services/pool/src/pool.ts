import {
  ProductAcceptanceStatus,
  SupplierSubmittedProduct,
  CreateSupplierProductDraftCommand,
  UpdateSupplierProductDraftCommand,
  SubmitSupplierProductForReviewCommand,
  StartProductReviewCommand,
  RequestProductRevisionCommand,
  SubmitProductRevisionCommand,
  ApproveSupplierProductCommand,
  RejectSupplierProductCommand,
  SuspendSubmittedProductCommand,
  CommercialPoolStatus,
  CommercialPoolProduct,
  CreatorVisibleCommercialPoolProduct,
  CommercializeApprovedProductCommand,
  ActivateCommercialPoolProductCommand,
  SuspendCommercialPoolProductCommand,
  ArchiveCommercialPoolProductCommand,
  PoolBindingStatus,
  PoolBindingType,
  BindCommercialPoolProductCommand,
  CommercialPoolBindingSnapshot,
  PoolBindingCheckResult,
  PoolResult,
  PoolErrorCode,
  PoolActorContext,
  GetSupplierSubmittedProductQuery,
  ListSupplierSubmittedProductsQuery,
  CreatorStoreProduct,
  CreatorStoreProductStatus,
  CreatorStoreProductVisibility,
  AddCommercialProductToCreatorStoreCommand,
  PauseCreatorStoreProductCommand,
  ResumeCreatorStoreProductCommand,
  RemoveCreatorStoreProductCommand,
  UpdateCreatorStoreProductMerchandisingCommand,
  ReorderCreatorStoreProductsCommand,
  AddCreatorStoreProductMediaCommand,
  RemoveCreatorStoreProductMediaCommand,
  ReorderCreatorStoreProductMediaCommand,
  CreatorStoreProductMediaType,
  CreatorStoreProductMediaUsage,
  CreatorStoreProductMediaOperationResult,
  PoolBasePriceSnapshot,
  PriceCorridor,
  SupplierBasePriceSnapshot,
} from "@hx/contracts";
import { randomUUID } from "crypto";

const inMemorySubmittedProductStore: Map<string, SupplierSubmittedProduct> =
  new Map();
const inMemoryCommercialProductStore: Map<string, CommercialPoolProduct> =
  new Map();
const inMemoryCreatorStoreProductStore: Map<string, CreatorStoreProduct> =
  new Map();
const inMemoryBindingSnapshotStore: Map<string, CommercialPoolBindingSnapshot> =
  new Map();

const ok = <T>(data: T): PoolResult<T> => ({ success: true, data });
const fail = (
  code: PoolErrorCode,
  message: string,
  details?: Record<string, any>,
): PoolResult<any> => ({
  success: false,
  error: { code, message, details },
});

const FOUNDATION_MARGIN_RULE_SOURCE =
  "FOUNDATION_CATEGORY_MARGIN_POLICY_MISSING" as const;

function buildSupplierBasePriceSnapshot(
  product: SupplierSubmittedProduct,
): SupplierBasePriceSnapshot | undefined {
  const baseVariant = product.variants
    .filter((variant) => variant.price > 0)
    .sort((left, right) => left.price - right.price)[0];

  if (!baseVariant) return undefined;

  return {
    amount: baseVariant.price,
    currency: "TRY",
    supplierId: product.supplierId,
    sourceProductId: product.id,
    capturedAt: new Date(),
    visibility: "INTERNAL_ONLY",
  };
}

function buildPoolBasePriceSnapshot(
  supplierBasePriceSnapshot: SupplierBasePriceSnapshot,
  categoryId?: string,
): PoolBasePriceSnapshot {
  return {
    amount: supplierBasePriceSnapshot.amount,
    currency: supplierBasePriceSnapshot.currency,
    supplierBasePriceAmount: supplierBasePriceSnapshot.amount,
    platformMarginAmount: 0,
    categoryId,
    ruleSource: FOUNDATION_MARGIN_RULE_SOURCE,
    calculatedAt: new Date(),
  };
}

function buildPriceCorridor(poolBasePriceSnapshot: PoolBasePriceSnapshot): PriceCorridor {
  return {
    minPrice: poolBasePriceSnapshot.amount,
    suggestedPrice: poolBasePriceSnapshot.amount,
    recommendedPrice: poolBasePriceSnapshot.amount,
    maxPrice: poolBasePriceSnapshot.amount,
    currency: poolBasePriceSnapshot.currency,
    ruleSource: poolBasePriceSnapshot.ruleSource,
    launchMode: true,
    launchRequiresRecommendedPrice: true,
  };
}

function redactCommercialProductForCreator(
  product: CommercialPoolProduct,
): CreatorVisibleCommercialPoolProduct {
  const { supplierBasePriceSnapshot, poolBasePriceSnapshot, ...visible } = product;
  const visiblePoolBasePriceSnapshot = poolBasePriceSnapshot
    ? {
        amount: poolBasePriceSnapshot.amount,
        currency: poolBasePriceSnapshot.currency,
        platformMarginAmount: poolBasePriceSnapshot.platformMarginAmount,
        platformMarginRate: poolBasePriceSnapshot.platformMarginRate,
        categoryId: poolBasePriceSnapshot.categoryId,
        ruleSource: poolBasePriceSnapshot.ruleSource,
        calculatedAt: poolBasePriceSnapshot.calculatedAt,
      }
    : undefined;

  return {
    ...visible,
    poolBasePriceSnapshot: visiblePoolBasePriceSnapshot,
  };
}

export class PoolService {
  private validateActor(
    actor: PoolActorContext,
    allowedTypes: PoolActorContext["actorType"][],
  ) {
    if (!actor) {
      return fail(
        PoolErrorCode.POOL_ACTOR_CONTEXT_REQUIRED,
        "Actor context is required.",
      );
    }
    if (!allowedTypes.includes(actor.actorType)) {
      return fail(
        PoolErrorCode.POOL_FORBIDDEN,
        `Actor type ${actor.actorType} is not allowed.`,
      );
    }
    if (actor.actorType === "SUPPLIER" && !actor.supplierId) {
      return fail(
        PoolErrorCode.POOL_ACTOR_CONTEXT_REQUIRED,
        "Supplier actor must have a supplierId.",
      );
    }
    if (actor.actorType === "CREATOR" && !actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_ACTOR_CONTEXT_REQUIRED,
        "Creator actor must have a creatorStoreId.",
      );
    }
    return ok(true);
  }

  async createSupplierProductDraft(
    cmd: CreateSupplierProductDraftCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["SUPPLIER"]);
    if (!actorValidation.success) return actorValidation;

    if (cmd.actor.supplierId !== cmd.supplierId) {
      return fail(
        PoolErrorCode.POOL_SUPPLIER_SCOPE_MISMATCH,
        "Actor supplierId does not match command supplierId.",
      );
    }

    const id = randomUUID();
    const product: SupplierSubmittedProduct = {
      id,
      supplierId: cmd.supplierId,
      title: cmd.title,
      categoryId: cmd.categoryId,
      description: "",
      brand: "",
      tags: [],
      status: ProductAcceptanceStatus.DRAFT,
      variants: [],
      logistics: {
        shippingWeight: 0,
        shippingWidth: 0,
        shippingHeight: 0,
        shippingDepth: 0,
        isFragile: false,
      },
      reviewHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemorySubmittedProductStore.set(id, product);
    return ok(product);
  }

  async updateSupplierProductDraft(
    cmd: UpdateSupplierProductDraftCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["SUPPLIER"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemorySubmittedProductStore.get(cmd.id);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    if (product.supplierId !== cmd.actor.supplierId) {
      return fail(
        PoolErrorCode.POOL_SUPPLIER_SCOPE_MISMATCH,
        "Supplier can only update their own products.",
      );
    }
    if (product.status !== ProductAcceptanceStatus.DRAFT) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Only DRAFT products can be updated.",
      );
    }
    const updatedProduct = { ...product, ...cmd, updatedAt: new Date() };
    inMemorySubmittedProductStore.set(cmd.id, updatedProduct);
    return ok(updatedProduct);
  }

  async submitSupplierProductForReview(
    cmd: SubmitSupplierProductForReviewCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["SUPPLIER"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemorySubmittedProductStore.get(cmd.id);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    if (product.supplierId !== cmd.actor.supplierId) {
      return fail(
        PoolErrorCode.POOL_SUPPLIER_SCOPE_MISMATCH,
        "Supplier can only submit their own products.",
      );
    }
    if (
      product.status !== ProductAcceptanceStatus.DRAFT &&
      product.status !== ProductAcceptanceStatus.REVISION_REQUESTED
    ) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Only DRAFT or REVISION_REQUESTED products can be submitted.",
      );
    }

    // Validation
    const validationErrors: string[] = [];
    if (!product.title) validationErrors.push("Product name is required.");
    if (!product.categoryId)
      validationErrors.push("Supplier suggested category is required.");
    if (!product.variants || product.variants.length === 0) {
      validationErrors.push("At least one variant is required.");
    } else {
      const hasPrice = product.variants.some((v) => v.price > 0);
      const hasStock = product.variants.some((v) => v.stock > 0);
      if (!hasPrice)
        validationErrors.push("At least one variant must have a price.");
      if (!hasStock)
        validationErrors.push("At least one variant must have stock.");
    }
    if (validationErrors.length > 0) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "Submission validation failed.",
        { errors: validationErrors },
      );
    }

    product.status = ProductAcceptanceStatus.SUBMITTED;
    product.updatedAt = new Date();
    inMemorySubmittedProductStore.set(cmd.id, product);
    return ok(product);
  }

  async startProductReview(
    cmd: StartProductReviewCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemorySubmittedProductStore.get(cmd.productId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    if (
      product.status !== ProductAcceptanceStatus.SUBMITTED &&
      product.status !== ProductAcceptanceStatus.REVISION_SUBMITTED
    ) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Product must be SUBMITTED or REVISION_SUBMITTED to start review.",
      );
    }
    product.status = ProductAcceptanceStatus.UNDER_REVIEW;
    product.updatedAt = new Date();
    inMemorySubmittedProductStore.set(cmd.productId, product);
    return ok(product);
  }

  async requestProductRevision(
    cmd: RequestProductRevisionCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;
    if (!cmd.requiredChanges || cmd.requiredChanges.length === 0) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "requiredChanges cannot be empty.",
      );
    }

    const product = inMemorySubmittedProductStore.get(cmd.productId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    product.status = ProductAcceptanceStatus.REVISION_REQUESTED;
    product.reviewHistory.push({
      id: randomUUID(),
      reviewerId: cmd.actor.actorId,
      decision: "REVISION_REQUESTED",
      notes: cmd.notes,
      timestamp: new Date(),
    });
    product.updatedAt = new Date();
    inMemorySubmittedProductStore.set(cmd.productId, product);
    return ok(product);
  }

  async submitProductRevision(
    cmd: SubmitProductRevisionCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["SUPPLIER"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemorySubmittedProductStore.get(cmd.id);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    if (product.supplierId !== cmd.actor.supplierId) {
      return fail(
        PoolErrorCode.POOL_SUPPLIER_SCOPE_MISMATCH,
        "Supplier can only revise their own products.",
      );
    }
    if (product.status !== ProductAcceptanceStatus.REVISION_REQUESTED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Product must be in REVISION_REQUESTED state.",
      );
    }
    const updatedProduct = { ...product, ...cmd.changes, updatedAt: new Date() };
    updatedProduct.status = ProductAcceptanceStatus.REVISION_SUBMITTED;
    inMemorySubmittedProductStore.set(cmd.id, updatedProduct);
    return ok(updatedProduct);
  }

  async approveSupplierProduct(
    cmd: ApproveSupplierProductCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemorySubmittedProductStore.get(cmd.productId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    product.status = ProductAcceptanceStatus.APPROVED;
    product.reviewHistory.push({
      id: randomUUID(),
      reviewerId: cmd.actor.actorId,
      decision: "APPROVED",
      notes: cmd.notes || "",
      timestamp: new Date(),
    });
    product.updatedAt = new Date();
    inMemorySubmittedProductStore.set(cmd.productId, product);
    return ok(product);
  }

  async rejectSupplierProduct(
    cmd: RejectSupplierProductCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;
    if (!cmd.notes) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "Rejection notes are required.",
      );
    }

    const product = inMemorySubmittedProductStore.get(cmd.productId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    product.status = ProductAcceptanceStatus.REJECTED;
    product.reviewHistory.push({
      id: randomUUID(),
      reviewerId: cmd.actor.actorId,
      decision: "REJECTED",
      notes: cmd.notes,
      timestamp: new Date(),
    });
    product.updatedAt = new Date();
    inMemorySubmittedProductStore.set(cmd.productId, product);
    return ok(product);
  }

  async suspendSubmittedProduct(
    cmd: SuspendSubmittedProductCommand,
  ): Promise<PoolResult<SupplierSubmittedProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;
    if (!cmd.reason) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "Suspension reason is required.",
      );
    }

    const product = inMemorySubmittedProductStore.get(cmd.productId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Product not found.");
    }
    product.status = ProductAcceptanceStatus.SUSPENDED;
    product.updatedAt = new Date();
    inMemorySubmittedProductStore.set(cmd.productId, product);
    return ok(product);
  }

  async getSubmittedProduct(
    query: GetSupplierSubmittedProductQuery,
  ): Promise<PoolResult<SupplierSubmittedProduct | undefined>> {
    const actorValidation = this.validateActor(query.actor, [
      "ADMIN",
      "OPERATOR",
      "SUPPLIER",
    ]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemorySubmittedProductStore.get(query.id);
    if (
      query.actor.actorType === "SUPPLIER" &&
      product &&
      product.supplierId !== query.actor.supplierId
    ) {
      return fail(
        PoolErrorCode.POOL_SUPPLIER_SCOPE_MISMATCH,
        "Supplier can only view their own products.",
      );
    }
    return ok(product);
  }

  async listSupplierSubmittedProducts(
    query: ListSupplierSubmittedProductsQuery,
  ): Promise<PoolResult<SupplierSubmittedProduct[]>> {
    const actorValidation = this.validateActor(query.actor, [
      "ADMIN",
      "OPERATOR",
      "SUPPLIER",
    ]);
    if (!actorValidation.success) return actorValidation;

    let products = Array.from(inMemorySubmittedProductStore.values());
    if (query.actor.actorType === "SUPPLIER") {
      products = products.filter(
        (p) => p.supplierId === query.actor.supplierId,
      );
    }
    if (query.status) {
      products = products.filter((p) => p.status === query.status);
    }
    return ok(products);
  }

  async commercializeApprovedProduct(
    cmd: CommercializeApprovedProductCommand,
  ): Promise<PoolResult<CommercialPoolProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;

    const submittedProduct = inMemorySubmittedProductStore.get(
      cmd.submittedProductId,
    );
    if (!submittedProduct) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Submitted product not found.");
    }
    if (submittedProduct.status !== ProductAcceptanceStatus.APPROVED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Submitted product is not approved.",
      );
    }
    const existingCommercialProduct = Array.from(
      inMemoryCommercialProductStore.values(),
    ).find(
      (p) =>
        p.commercialization.originalSubmittedProductId ===
        cmd.submittedProductId,
    );
    if (existingCommercialProduct) {
      return fail(
        PoolErrorCode.POOL_DUPLICATE_COMMERCIALIZE,
        "Product already commercialized.",
      );
    }

    const supplierBasePriceSnapshot =
      buildSupplierBasePriceSnapshot(submittedProduct);
    const poolBasePriceSnapshot = supplierBasePriceSnapshot
      ? buildPoolBasePriceSnapshot(
          supplierBasePriceSnapshot,
          submittedProduct.categoryId,
        )
      : undefined;
    const priceCorridor = poolBasePriceSnapshot
      ? buildPriceCorridor(poolBasePriceSnapshot)
      : undefined;

    const id = randomUUID();
    const commercialProduct: CommercialPoolProduct = {
      id,
      status: CommercialPoolStatus.PENDING,
      commercialization: {
        timestamp: new Date(),
        actorId: cmd.actor.actorId,
        originalSubmittedProductId: cmd.submittedProductId,
        data: {
          title: submittedProduct.title,
          description: submittedProduct.description,
          brand: submittedProduct.brand,
          categoryId: submittedProduct.categoryId,
          tags: submittedProduct.tags,
          variants: submittedProduct.variants,
          logistics: submittedProduct.logistics,
        },
      },
      supplierBasePriceSnapshot,
      poolBasePriceSnapshot,
      priceCorridor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryCommercialProductStore.set(id, commercialProduct);
    return ok(commercialProduct);
  }

  async bindCommercialPoolProduct(
    cmd: BindCommercialPoolProductCommand,
  ): Promise<PoolResult<{ snapshot: CommercialPoolBindingSnapshot }>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCommercialProductStore.get(cmd.commercialPoolProductId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Commercial product not found.");
    }

    const snapshotData = product.commercialization.data;
    const hasBasePrice =
      !!product.supplierBasePriceSnapshot &&
      !!product.poolBasePriceSnapshot &&
      !!product.priceCorridor;
    const hasStockInput =
      snapshotData.variants.length > 0 &&
      snapshotData.variants.some((v) => v.stock > 0);
    const hasCanonicalCategoryId = !!snapshotData.categoryId;
    const mediaCount = snapshotData.variants.reduce(
      (acc, v) => acc + (v.media?.length || 0),
      0,
    );

    const pricing: PoolBindingCheckResult = {
      type: PoolBindingType.PRICING,
      status: hasBasePrice ? PoolBindingStatus.BOUND : PoolBindingStatus.FAILED,
      reason: hasBasePrice
        ? undefined
        : "Product has no persisted supplier base price, pool base price, or price corridor.",
      checkedAt: new Date(),
    };
    const stock: PoolBindingCheckResult = {
      type: PoolBindingType.STOCK,
      status: hasStockInput ? PoolBindingStatus.BOUND : PoolBindingStatus.FAILED,
      reason: hasStockInput ? undefined : "Product has no variants with stock > 0",
      checkedAt: new Date(),
    };
    const category: PoolBindingCheckResult = {
      type: PoolBindingType.CATEGORY,
      status: hasCanonicalCategoryId
        ? PoolBindingStatus.BOUND
        : PoolBindingStatus.FAILED,
      reason: hasCanonicalCategoryId
        ? undefined
        : "Product has no canonical category ID",
      checkedAt: new Date(),
    };
    const media: PoolBindingCheckResult = {
      type: PoolBindingType.MEDIA,
      status: mediaCount > 0 ? PoolBindingStatus.BOUND : PoolBindingStatus.FAILED,
      reason: mediaCount > 0 ? undefined : "Product has no media files",
      checkedAt: new Date(),
    };
    const isAllBound =
      pricing.status === PoolBindingStatus.BOUND &&
      stock.status === PoolBindingStatus.BOUND &&
      category.status === PoolBindingStatus.BOUND &&
      media.status === PoolBindingStatus.BOUND;
    const snapshot: CommercialPoolBindingSnapshot = {
      pricing,
      stock,
      category,
      media,
      isAllBound,
      createdAt: new Date(),
    };
    inMemoryBindingSnapshotStore.set(product.id, snapshot);
    product.bindingSnapshot = snapshot;
    inMemoryCommercialProductStore.set(product.id, product);
    return ok({ snapshot });
  }

  async getCommercialPoolBindingSnapshot(
    commercialPoolProductId: string,
  ): Promise<PoolResult<CommercialPoolBindingSnapshot | undefined>> {
    // This might need actor validation in a real scenario
    const snapshot = inMemoryBindingSnapshotStore.get(commercialPoolProductId);
    return ok(snapshot);
  }

  private async canActivateCommercialPoolProduct(
    commercialPoolProductId: string,
  ): Promise<{ canActivate: boolean; reason: string }> {
    const product = inMemoryCommercialProductStore.get(commercialPoolProductId);
    if (!product) {
      return { canActivate: false, reason: "Commercial product not found" };
    }
    const binding = inMemoryBindingSnapshotStore.get(commercialPoolProductId);
    if (!binding || !binding.isAllBound) {
      return {
        canActivate: false,
        reason:
          "All bindings must be BOUND before activation. Please run the binding process.",
      };
    }
    return { canActivate: true, reason: "" };
  }

  async activateCommercialPoolProduct(
    cmd: ActivateCommercialPoolProductCommand,
  ): Promise<PoolResult<CommercialPoolProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCommercialProductStore.get(cmd.commercialPoolProductId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Commercial product not found.");
    }
    if (product.status === CommercialPoolStatus.ARCHIVED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Cannot activate an archived product",
      );
    }
    const canActivateResult = await this.canActivateCommercialPoolProduct(
      cmd.commercialPoolProductId,
    );
    if (!canActivateResult.canActivate) {
      return fail(
        PoolErrorCode.POOL_BINDING_INCOMPLETE,
        `Activation failed: ${canActivateResult.reason}`,
      );
    }

    product.status = CommercialPoolStatus.ACTIVE;
    product.updatedAt = new Date();
    inMemoryCommercialProductStore.set(cmd.commercialPoolProductId, product);
    return ok(product);
  }

  async suspendCommercialPoolProduct(
    cmd: SuspendCommercialPoolProductCommand,
  ): Promise<PoolResult<CommercialPoolProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;
    if (!cmd.reason) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "Suspension reason is required.",
      );
    }

    const product = inMemoryCommercialProductStore.get(cmd.commercialPoolProductId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Commercial product not found.");
    }
    product.status = CommercialPoolStatus.SUSPENDED;
    product.updatedAt = new Date();
    inMemoryCommercialProductStore.set(cmd.commercialPoolProductId, product);
    return ok(product);
  }

  async archiveCommercialPoolProduct(
    cmd: ArchiveCommercialPoolProductCommand,
  ): Promise<PoolResult<CommercialPoolProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["ADMIN", "OPERATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCommercialProductStore.get(cmd.commercialPoolProductId);
    if (!product) {
      return fail(PoolErrorCode.POOL_NOT_FOUND, "Commercial product not found.");
    }
    product.status = CommercialPoolStatus.ARCHIVED;
    product.updatedAt = new Date();
    inMemoryCommercialProductStore.set(cmd.commercialPoolProductId, product);
    return ok(product);
  }

  async getCommercialPoolProduct(
    id: string,
  ): Promise<PoolResult<CommercialPoolProduct | undefined>> {
    // This might need actor validation
    return ok(inMemoryCommercialProductStore.get(id));
  }

  async listCommercialPoolProducts(): Promise<PoolResult<CommercialPoolProduct[]>> {
    // This might need actor validation
    return ok(Array.from(inMemoryCommercialProductStore.values()));
  }

  async listAvailableCommercialProductsForCreator(): Promise<
    PoolResult<CreatorVisibleCommercialPoolProduct[]>
  > {
    const products = Array.from(inMemoryCommercialProductStore.values()).filter(
      (p) =>
        p.status === CommercialPoolStatus.ACTIVE &&
        p.bindingSnapshot?.isAllBound,
    );
    return ok(products.map(redactCommercialProductForCreator));
  }

  async addCommercialProductToCreatorStore(
    cmd: AddCommercialProductToCreatorStoreCommand,
  ): Promise<PoolResult<CreatorStoreProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    if (cmd.actor.creatorStoreId !== cmd.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Actor creatorStoreId does not match command creatorStoreId.",
      );
    }

    const commercialProduct = inMemoryCommercialProductStore.get(
      cmd.commercialPoolProductId,
    );
    if (!commercialProduct) {
      return fail(
        PoolErrorCode.POOL_NOT_FOUND,
        "Commercial product not found.",
      );
    }

    if (commercialProduct.status !== CommercialPoolStatus.ACTIVE) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Cannot add a non-ACTIVE commercial product.",
      );
    }

    if (!commercialProduct.bindingSnapshot?.isAllBound) {
      return fail(
        PoolErrorCode.POOL_BINDING_INCOMPLETE,
        "Cannot add a product with incomplete bindings.",
      );
    }

    if (cmd.selectedPrice <= 0) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "selectedPrice must be positive.",
      );
    }

    const corridor = commercialProduct.priceCorridor;
    if (!corridor) {
      return fail(
        PoolErrorCode.POOL_BINDING_INCOMPLETE,
        "Cannot add a product without a price corridor.",
      );
    }

    if (cmd.selectedPrice < corridor.minPrice) {
      return fail(
        PoolErrorCode.POOL_CREATOR_PRICE_OUT_OF_CORRIDOR,
        "selectedPrice is below the allowed corridor.",
        {
          reasonCode: "SELECTED_PRICE_BELOW_MIN",
          selectedPrice: cmd.selectedPrice,
          corridor,
        },
      );
    }

    if (cmd.selectedPrice > corridor.maxPrice) {
      return fail(
        PoolErrorCode.POOL_CREATOR_PRICE_OUT_OF_CORRIDOR,
        "selectedPrice is above the allowed corridor.",
        {
          reasonCode: "SELECTED_PRICE_ABOVE_MAX",
          selectedPrice: cmd.selectedPrice,
          corridor,
        },
      );
    }

    if (
      corridor.launchRequiresRecommendedPrice &&
      cmd.selectedPrice !== corridor.recommendedPrice
    ) {
      return fail(
        PoolErrorCode.POOL_CREATOR_PRICE_REQUIRES_RECOMMENDED,
        "Launch mode requires the recommended price.",
        {
          reasonCode: "LAUNCH_REQUIRES_RECOMMENDED_PRICE",
          selectedPrice: cmd.selectedPrice,
          corridor,
        },
      );
    }

    const existing = Array.from(
      inMemoryCreatorStoreProductStore.values(),
    ).find(
      (p) =>
        p.creatorStoreId === cmd.creatorStoreId &&
        p.commercialPoolProductId === cmd.commercialPoolProductId,
    );

    if (existing) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_DUPLICATE_PRODUCT,
        "This product is already in the store.",
      );
    }

    const id = randomUUID();
    const creatorStoreProduct: CreatorStoreProduct = {
      id,
      creatorStoreId: cmd.creatorStoreId,
      commercialPoolProductId: cmd.commercialPoolProductId,
      selectedPrice: cmd.selectedPrice,
      status: CreatorStoreProductStatus.ACTIVE,
      visibility: CreatorStoreProductVisibility.VISIBLE,
      displayOrder: 0,
      isFeatured: false,
      creatorNote: "",
      priceSelection: {
        accepted: true,
        selectedPrice: cmd.selectedPrice,
        corridor,
      },
      creatorMediaRefs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryCreatorStoreProductStore.set(id, creatorStoreProduct);
    return ok(creatorStoreProduct);
  }

  async pauseCreatorStoreProduct(
    cmd: PauseCreatorStoreProductCommand,
  ): Promise<PoolResult<CreatorStoreProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(cmd.creatorStoreProductId);
    if (!product) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_PRODUCT_NOT_FOUND,
        "Creator store product not found.",
      );
    }

    if (product.creatorStoreId !== cmd.actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator can only modify products in their own store.",
      );
    }

    if (product.status !== CreatorStoreProductStatus.ACTIVE) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Only ACTIVE products can be paused.",
      );
    }

    product.status = CreatorStoreProductStatus.PAUSED;
    product.updatedAt = new Date();
    inMemoryCreatorStoreProductStore.set(product.id, product);
    return ok(product);
  }

  async resumeCreatorStoreProduct(
    cmd: ResumeCreatorStoreProductCommand,
  ): Promise<PoolResult<CreatorStoreProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(cmd.creatorStoreProductId);
    if (!product) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_PRODUCT_NOT_FOUND,
        "Creator store product not found.",
      );
    }

    if (product.creatorStoreId !== cmd.actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator can only modify products in their own store.",
      );
    }

    if (product.status !== CreatorStoreProductStatus.PAUSED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Only PAUSED products can be resumed.",
      );
    }

    product.status = CreatorStoreProductStatus.ACTIVE;
    product.updatedAt = new Date();
    inMemoryCreatorStoreProductStore.set(product.id, product);
    return ok(product);
  }

  async removeCreatorStoreProduct(
    cmd: RemoveCreatorStoreProductCommand,
  ): Promise<PoolResult<{ success: true }>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(cmd.creatorStoreProductId);
    if (!product) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_PRODUCT_NOT_FOUND,
        "Creator store product not found.",
      );
    }

    if (product.creatorStoreId !== cmd.actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator can only remove products from their own store.",
      );
    }

    product.status = CreatorStoreProductStatus.REMOVED;
    product.updatedAt = new Date();
    inMemoryCreatorStoreProductStore.set(cmd.creatorStoreProductId, product);
    return ok({ success: true });
  }

  async getCreatorStoreProduct(
    actor: PoolActorContext,
    creatorStoreProductId: string,
  ): Promise<PoolResult<CreatorStoreProduct | undefined>> {
    const actorValidation = this.validateActor(actor, ["CREATOR", "ADMIN"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(creatorStoreProductId);
    if (
      actor.actorType === "CREATOR" &&
      product &&
      product.creatorStoreId !== actor.creatorStoreId
    ) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator can only view products in their own store.",
      );
    }
    return ok(product);
  }

  async listCreatorStoreProducts(
    actor: PoolActorContext,
    creatorStoreId: string,
  ): Promise<PoolResult<CreatorStoreProduct[]>> {
    const actorValidation = this.validateActor(actor, ["CREATOR", "ADMIN"]);
    if (!actorValidation.success) return actorValidation;

    if (actor.actorType === "CREATOR" && actor.creatorStoreId !== creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator can only list products from their own store.",
      );
    }

    const products = Array.from(
      inMemoryCreatorStoreProductStore.values(),
    ).filter((p) => p.creatorStoreId === creatorStoreId);
    return ok(products);
  }

  async updateCreatorStoreProductMerchandising(
    cmd: UpdateCreatorStoreProductMerchandisingCommand,
  ): Promise<PoolResult<CreatorStoreProduct>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(cmd.creatorStoreProductId);
    if (!product) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_PRODUCT_NOT_FOUND,
        "Creator store product not found.",
      );
    }

    if (product.creatorStoreId !== cmd.actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator can only modify products in their own store.",
      );
    }

    if (product.status === CreatorStoreProductStatus.REMOVED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Cannot modify merchandising of a removed product.",
      );
    }

    // Guard: displayOrder cannot be negative
    if (cmd.displayOrder !== undefined && cmd.displayOrder < 0) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "displayOrder cannot be negative.",
      );
    }

    // Guard: creatorNote max length (e.g., 500)
    if (cmd.creatorNote !== undefined && cmd.creatorNote.length > 500) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "creatorNote is too long (max 500 characters).",
      );
    }

    if (cmd.visibility !== undefined) product.visibility = cmd.visibility;
    if (cmd.displayOrder !== undefined) product.displayOrder = cmd.displayOrder;
    if (cmd.isFeatured !== undefined) product.isFeatured = cmd.isFeatured;
    if (cmd.creatorNote !== undefined) product.creatorNote = cmd.creatorNote;

    product.updatedAt = new Date();
    inMemoryCreatorStoreProductStore.set(product.id, product);
    return ok(product);
  }

  async reorderCreatorStoreProducts(
    cmd: ReorderCreatorStoreProductsCommand,
  ): Promise<PoolResult<{ success: true }>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    if (cmd.actor.creatorStoreId !== cmd.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Actor creatorStoreId mismatch.",
      );
    }

    // Guard: duplicate ID check
    const uniqueIds = new Set(cmd.orderedProductIds);
    if (uniqueIds.size !== cmd.orderedProductIds.length) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_REORDER_FAILED,
        "Duplicate IDs found in reorder list.",
      );
    }

    // Guard: foreign product check
    for (const id of cmd.orderedProductIds) {
      const product = inMemoryCreatorStoreProductStore.get(id);
      if (!product || product.creatorStoreId !== cmd.creatorStoreId) {
        return fail(
          PoolErrorCode.POOL_CREATOR_STORE_REORDER_FAILED,
          `Product ${id} does not belong to this store.`,
        );
      }
    }

    // Apply displayOrder
    cmd.orderedProductIds.forEach((id, index) => {
      const product = inMemoryCreatorStoreProductStore.get(id)!;
      product.displayOrder = index;
      product.updatedAt = new Date();
      inMemoryCreatorStoreProductStore.set(id, product);
    });

    return ok({ success: true });
  }

  async listVisibleCreatorStoreProducts(
    creatorStoreId: string,
  ): Promise<PoolResult<CreatorStoreProduct[]>> {
    const products = Array.from(inMemoryCreatorStoreProductStore.values())
      .filter(
        (p) =>
          p.creatorStoreId === creatorStoreId &&
          p.status === CreatorStoreProductStatus.ACTIVE &&
          p.visibility === CreatorStoreProductVisibility.VISIBLE,
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return ok(products);
  }

  async addCreatorStoreProductMedia(
    cmd: AddCreatorStoreProductMediaCommand,
  ): Promise<PoolResult<CreatorStoreProductMediaOperationResult>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(
      cmd.creatorStoreProductId,
    );
    if (!product) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_PRODUCT_NOT_FOUND,
        "Creator store product not found.",
      );
    }

    if (product.creatorStoreId !== cmd.actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator store mismatch.",
      );
    }

    if (product.status === CreatorStoreProductStatus.REMOVED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Cannot add media to a removed product.",
      );
    }

    if (!cmd.mediaAssetId) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "mediaAssetId is required.",
      );
    }

    if (cmd.displayOrder < 0) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "displayOrder cannot be negative.",
      );
    }

    if (cmd.caption && cmd.caption.length > 200) {
      return fail(
        PoolErrorCode.POOL_VALIDATION_FAILED,
        "Caption is too long (max 200).",
      );
    }

    const exists = product.creatorMediaRefs.some(
      (m) => m.mediaAssetId === cmd.mediaAssetId,
    );
    if (exists) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_MEDIA_DUPLICATE,
        "Media already exists for this product.",
      );
    }

    product.creatorMediaRefs.push({
      mediaAssetId: cmd.mediaAssetId,
      mediaType: cmd.mediaType,
      usage: cmd.usage,
      displayOrder: cmd.displayOrder,
      caption: cmd.caption,
    });

    product.updatedAt = new Date();
    inMemoryCreatorStoreProductStore.set(product.id, product);

    return ok({ creatorStoreProduct: product });
  }

  async removeCreatorStoreProductMedia(
    cmd: RemoveCreatorStoreProductMediaCommand,
  ): Promise<PoolResult<CreatorStoreProductMediaOperationResult>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(
      cmd.creatorStoreProductId,
    );
    if (!product) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_PRODUCT_NOT_FOUND,
        "Creator store product not found.",
      );
    }

    if (product.creatorStoreId !== cmd.actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator store mismatch.",
      );
    }

    if (product.status === CreatorStoreProductStatus.REMOVED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Cannot remove media from a removed product.",
      );
    }

    const index = product.creatorMediaRefs.findIndex(
      (m) => m.mediaAssetId === cmd.mediaAssetId,
    );
    if (index === -1) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_MEDIA_NOT_FOUND,
        "Media not found.",
      );
    }

    product.creatorMediaRefs.splice(index, 1);
    product.updatedAt = new Date();
    inMemoryCreatorStoreProductStore.set(product.id, product);

    return ok({ creatorStoreProduct: product });
  }

  async reorderCreatorStoreProductMedia(
    cmd: ReorderCreatorStoreProductMediaCommand,
  ): Promise<PoolResult<CreatorStoreProductMediaOperationResult>> {
    const actorValidation = this.validateActor(cmd.actor, ["CREATOR"]);
    if (!actorValidation.success) return actorValidation;

    const product = inMemoryCreatorStoreProductStore.get(
      cmd.creatorStoreProductId,
    );
    if (!product) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_PRODUCT_NOT_FOUND,
        "Creator store product not found.",
      );
    }

    if (product.creatorStoreId !== cmd.actor.creatorStoreId) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_SCOPE_MISMATCH,
        "Creator store mismatch.",
      );
    }

    if (product.status === CreatorStoreProductStatus.REMOVED) {
      return fail(
        PoolErrorCode.POOL_INVALID_TRANSITION,
        "Cannot reorder media of a removed product.",
      );
    }

    // Check for duplicates in cmd
    const uniqueIds = new Set(cmd.orderedMediaAssetIds);
    if (uniqueIds.size !== cmd.orderedMediaAssetIds.length) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_MEDIA_INVALID,
        "Duplicate media IDs in reorder request.",
      );
    }

    // Check if all requested IDs exist in the product
    const currentIds = product.creatorMediaRefs.map((m) => m.mediaAssetId);
    if (cmd.orderedMediaAssetIds.length !== currentIds.length) {
      return fail(
        PoolErrorCode.POOL_CREATOR_STORE_MEDIA_INVALID,
        "Reorder list must contain all current media IDs.",
      );
    }

    for (const id of cmd.orderedMediaAssetIds) {
      if (!currentIds.includes(id)) {
        return fail(
          PoolErrorCode.POOL_CREATOR_STORE_MEDIA_INVALID,
          `Media ID ${id} not found in product.`,
        );
      }
    }

    // Apply new order
    const reorderedMedia = cmd.orderedMediaAssetIds.map((id, index) => {
      const media = product.creatorMediaRefs.find((m) => m.mediaAssetId === id)!;
      return { ...media, displayOrder: index };
    });

    product.creatorMediaRefs = reorderedMedia;
    product.updatedAt = new Date();
    inMemoryCreatorStoreProductStore.set(product.id, product);

    return ok({ creatorStoreProduct: product });
  }
}
