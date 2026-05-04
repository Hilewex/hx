import { PoolService } from "@hx/pool";
import {
  PoolActorContext,
  CreateSupplierProductDraftCommand,
  UpdateSupplierProductDraftCommand,
  SubmitSupplierProductForReviewCommand,
  RequestProductRevisionCommand,
  SubmitProductRevisionCommand,
  ApproveSupplierProductCommand,
  RejectSupplierProductCommand,
  SuspendSubmittedProductCommand,
  CommercializeApprovedProductCommand,
  ActivateCommercialPoolProductCommand,
  SuspendCommercialPoolProductCommand,
  ArchiveCommercialPoolProductCommand,
  BindCommercialPoolProductCommand,
  StartProductReviewCommand,
  AddCommercialProductToCreatorStoreCommand,
  UpdateCreatorStoreProductMerchandisingCommand,
  ReorderCreatorStoreProductsCommand,
  AddCreatorStoreProductMediaCommand,
  RemoveCreatorStoreProductMediaCommand,
  ReorderCreatorStoreProductMediaCommand,
} from "@hx/contracts";
import * as http from "http";
import { PoolResult } from "@hx/contracts";

const poolService = new PoolService();

export function extractPoolActorContext(
  req: http.IncomingMessage,
): PoolActorContext | null {
  const actorId = req.headers["x-actor-id"];
  const actorType = req.headers["x-actor-type"];
  const supplierId = req.headers["x-supplier-id"];
  const creatorStoreId = req.headers["x-creator-store-id"];

  if (
    !actorId ||
    !actorType ||
    typeof actorId !== "string" ||
    typeof actorType !== "string"
  ) {
    return null;
  }

  if (actorType === "SUPPLIER" && !supplierId) {
    return null;
  }

  if (actorType === "CREATOR" && !creatorStoreId) {
    return null;
  }

  return {
    actorId,
    actorType: actorType as any,
    supplierId: typeof supplierId === "string" ? supplierId : undefined,
    creatorStoreId:
      typeof creatorStoreId === "string" ? creatorStoreId : undefined,
  };
}

// Supplier Routes
export const createSupplierProductDraft = async (
  actor: PoolActorContext,
  cmd: Omit<CreateSupplierProductDraftCommand, "actor">,
) => {
  return await poolService.createSupplierProductDraft({ ...cmd, actor });
};

export const updateSupplierProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
  cmd: Omit<UpdateSupplierProductDraftCommand, "actor" | "id">,
) => {
  return await poolService.updateSupplierProductDraft({
    ...cmd,
    id: submittedProductId,
    actor,
  });
};

export const submitSupplierProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
) => {
  return await poolService.submitSupplierProductForReview({
    id: submittedProductId,
    actor,
  });
};

export const submitSupplierProductRevision = async (
  actor: PoolActorContext,
  submittedProductId: string,
  cmd: Omit<SubmitProductRevisionCommand, "actor" | "id">,
) => {
  return await poolService.submitProductRevision({
    ...cmd,
    id: submittedProductId,
    actor,
  });
};

export const getSupplierProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
) => {
  return await poolService.getSubmittedProduct({ id: submittedProductId, actor });
};

export const listSupplierProducts = async (actor: PoolActorContext) => {
  return await poolService.listSupplierSubmittedProducts({ actor });
};

// Creator Routes
export const listAvailableCommercialProductsForCreator = async (
  actor: PoolActorContext,
) => {
  return await poolService.listAvailableCommercialProductsForCreator();
};

export const addCommercialProductToCreatorStore = async (
  actor: PoolActorContext,
  cmd: Omit<AddCommercialProductToCreatorStoreCommand, "actor">,
) => {
  // Enforce storeId from actor context, not from body
  return await poolService.addCommercialProductToCreatorStore({
    ...cmd,
    creatorStoreId: actor.creatorStoreId!,
    actor,
  });
};

export const listCreatorStoreProducts = async (actor: PoolActorContext) => {
  return await poolService.listCreatorStoreProducts(
    actor,
    actor.creatorStoreId!,
  );
};

export const getCreatorStoreProduct = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
) => {
  return await poolService.getCreatorStoreProduct(actor, creatorStoreProductId);
};

export const pauseCreatorStoreProduct = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
) => {
  return await poolService.pauseCreatorStoreProduct({
    creatorStoreProductId,
    actor,
  });
};

export const resumeCreatorStoreProduct = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
) => {
  return await poolService.resumeCreatorStoreProduct({
    creatorStoreProductId,
    actor,
  });
};

export const removeCreatorStoreProduct = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
) => {
  return await poolService.removeCreatorStoreProduct({
    creatorStoreProductId,
    actor,
  });
};

export const updateCreatorStoreProductMerchandising = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
  cmd: Omit<UpdateCreatorStoreProductMerchandisingCommand, "actor" | "creatorStoreProductId">,
) => {
  return await poolService.updateCreatorStoreProductMerchandising({
    ...cmd,
    creatorStoreProductId,
    actor,
  });
};

export const reorderCreatorStoreProducts = async (
  actor: PoolActorContext,
  cmd: Omit<ReorderCreatorStoreProductsCommand, "actor" | "creatorStoreId">,
) => {
  return await poolService.reorderCreatorStoreProducts({
    ...cmd,
    creatorStoreId: actor.creatorStoreId!,
    actor,
  });
};

export const listVisibleCreatorStoreProducts = async (
  actor: PoolActorContext,
  creatorStoreId: string,
) => {
  return await poolService.listVisibleCreatorStoreProducts(creatorStoreId);
};

export const addCreatorStoreProductMedia = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
  cmd: Omit<AddCreatorStoreProductMediaCommand, "actor" | "creatorStoreProductId">,
) => {
  return await poolService.addCreatorStoreProductMedia({
    ...cmd,
    creatorStoreProductId,
    actor,
  });
};

export const removeCreatorStoreProductMedia = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
  mediaAssetId: string,
) => {
  return await poolService.removeCreatorStoreProductMedia({
    creatorStoreProductId,
    mediaAssetId,
    actor,
  });
};

export const reorderCreatorStoreProductMedia = async (
  actor: PoolActorContext,
  creatorStoreProductId: string,
  cmd: Omit<ReorderCreatorStoreProductMediaCommand, "actor" | "creatorStoreProductId">,
) => {
  return await poolService.reorderCreatorStoreProductMedia({
    ...cmd,
    creatorStoreProductId,
    actor,
  });
};

// Admin Routes

export const listAdminProducts = async (actor: PoolActorContext) => {
  return await poolService.listSupplierSubmittedProducts({ actor });
};

export const getAdminProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
) => {
  return await poolService.getSubmittedProduct({ id: submittedProductId, actor });
};

export const startProductReview = async (
  actor: PoolActorContext,
  submittedProductId: string,
) => {
  return await poolService.startProductReview({
    productId: submittedProductId,
    actor,
  });
};

export const requestProductRevision = async (
  actor: PoolActorContext,
  submittedProductId: string,
  cmd: Omit<RequestProductRevisionCommand, "actor" | "productId">,
) => {
  return await poolService.requestProductRevision({
    ...cmd,
    productId: submittedProductId,
    actor,
  });
};

export const approveSupplierProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
  cmd: Omit<ApproveSupplierProductCommand, "actor" | "productId">,
) => {
  return await poolService.approveSupplierProduct({
    ...cmd,
    productId: submittedProductId,
    actor,
  });
};

export const rejectSupplierProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
  cmd: Omit<RejectSupplierProductCommand, "actor" | "productId">,
) => {
  return await poolService.rejectSupplierProduct({
    ...cmd,
    productId: submittedProductId,
    actor,
  });
};

export const suspendSubmittedProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
  cmd: Omit<SuspendSubmittedProductCommand, "actor" | "productId">,
) => {
  return await poolService.suspendSubmittedProduct({
    ...cmd,
    productId: submittedProductId,
    actor,
  });
};

export const commercializeProduct = async (
  actor: PoolActorContext,
  submittedProductId: string,
) => {
  return await poolService.commercializeApprovedProduct({
    submittedProductId,
    actor,
  });
};

export const listAdminCommercialProducts = async (actor: PoolActorContext) => {
  return await poolService.listCommercialPoolProducts();
};

export const getAdminCommercialProduct = async (
  actor: PoolActorContext,
  commercialPoolProductId: string,
) => {
  return await poolService.getCommercialPoolProduct(commercialPoolProductId);
};

export const bindCommercialProduct = async (
  actor: PoolActorContext,
  commercialPoolProductId: string,
) => {
  return await poolService.bindCommercialPoolProduct({
    commercialPoolProductId,
    actor,
  });
};

export const getCommercialProductBinding = async (
  actor: PoolActorContext,
  commercialPoolProductId: string,
) => {
  return await poolService.getCommercialPoolBindingSnapshot(
    commercialPoolProductId,
  );
};

export const activateCommercialProduct = async (
  actor: PoolActorContext,
  commercialPoolProductId: string,
) => {
  return await poolService.activateCommercialPoolProduct({
    commercialPoolProductId,
    actor,
  });
};

export const suspendCommercialProduct = async (
  actor: PoolActorContext,
  commercialPoolProductId: string,
  cmd: Omit<SuspendCommercialPoolProductCommand, "actor" | "commercialPoolProductId">,
) => {
  return await poolService.suspendCommercialPoolProduct({
    ...cmd,
    commercialPoolProductId,
    actor,
  });
};

export const archiveCommercialProduct = async (
  actor: PoolActorContext,
  commercialPoolProductId: string,
) => {
  return await poolService.archiveCommercialPoolProduct({
    commercialPoolProductId,
    actor,
  });
};
