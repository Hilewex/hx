import assert from "assert";
import {
  CommercialPoolStatus,
  PoolErrorCode,
  ProductAcceptanceStatus,
} from "@hx/contracts";
import { PoolService } from "@hx/pool";
import { SmokeRunner, SmokeResult } from "../types";

export const poolBasePriceCorridorFoundationSmoke: SmokeRunner = {
  name: "pool-price-corridor-foundation",
  run: async (): Promise<{ result: SmokeResult; message?: string }> => {
    try {
      const service = new PoolService();
      const suffix = Date.now().toString();
      const supplierActor = {
        actorId: `supplier-actor-${suffix}`,
        actorType: "SUPPLIER" as const,
        supplierId: `supplier-${suffix}`,
      };
      const adminActor = {
        actorId: `admin-actor-${suffix}`,
        actorType: "ADMIN" as const,
      };
      const creatorActor = {
        actorId: `creator-actor-${suffix}`,
        actorType: "CREATOR" as const,
        creatorStoreId: `creator-store-${suffix}`,
      };

      const draft = await service.createSupplierProductDraft({
        actor: supplierActor,
        supplierId: supplierActor.supplierId,
        title: "Pool base price smoke product",
        categoryId: "cat-smoke",
      });
      assert.equal(draft.success, true);

      const updated = await service.updateSupplierProductDraft({
        actor: supplierActor,
        id: draft.data.id,
        description: "Pool base price foundation smoke",
        brand: "HX",
        variants: [
          {
            id: "variant-1",
            title: "Default",
            sku: `SKU-${suffix}`,
            barcode: `BAR-${suffix}`,
            stock: 5,
            price: 100,
            attributes: {},
            media: [
              {
                id: "media-1",
                url: "https://example.test/product.jpg",
                type: "IMAGE",
                order: 0,
              },
            ],
          },
        ],
      });
      assert.equal(updated.success, true);

      const submitted = await service.submitSupplierProductForReview({
        actor: supplierActor,
        id: draft.data.id,
      });
      assert.equal(submitted.success, true);
      assert.equal(submitted.data.status, ProductAcceptanceStatus.SUBMITTED);

      const approved = await service.approveSupplierProduct({
        actor: adminActor,
        productId: draft.data.id,
      });
      assert.equal(approved.success, true);

      const commercialized = await service.commercializeApprovedProduct({
        actor: adminActor,
        submittedProductId: draft.data.id,
      });
      assert.equal(commercialized.success, true);
      assert.equal(commercialized.data.supplierBasePriceSnapshot?.amount, 100);
      assert.equal(
        commercialized.data.supplierBasePriceSnapshot?.visibility,
        "INTERNAL_ONLY",
      );
      assert.equal(commercialized.data.poolBasePriceSnapshot?.amount, 100);
      assert.equal(
        commercialized.data.poolBasePriceSnapshot?.platformMarginAmount,
        0,
      );
      assert.equal(
        commercialized.data.poolBasePriceSnapshot?.ruleSource,
        "FOUNDATION_CATEGORY_MARGIN_POLICY_MISSING",
      );

      commercialized.data.priceCorridor = {
        minPrice: 90,
        suggestedPrice: 100,
        recommendedPrice: 100,
        maxPrice: 120,
        currency: "TRY",
        ruleSource: "FOUNDATION_CATEGORY_MARGIN_POLICY_MISSING",
        launchMode: true,
        launchRequiresRecommendedPrice: true,
      };

      const bound = await service.bindCommercialPoolProduct({
        actor: adminActor,
        commercialPoolProductId: commercialized.data.id,
      });
      assert.equal(bound.success, true);
      assert.equal(bound.data.snapshot.isAllBound, true);

      const activated = await service.activateCommercialPoolProduct({
        actor: adminActor,
        commercialPoolProductId: commercialized.data.id,
      });
      assert.equal(activated.success, true);
      assert.equal(activated.data.status, CommercialPoolStatus.ACTIVE);

      const available = await service.listAvailableCommercialProductsForCreator();
      assert.equal(available.success, true);
      const creatorVisible = available.data.find(
        (product) => product.id === commercialized.data.id,
      );
      assert.ok(creatorVisible);
      assert.equal("supplierBasePriceSnapshot" in creatorVisible, false);
      assert.equal(
        "supplierBasePriceAmount" in creatorVisible.poolBasePriceSnapshot!,
        false,
      );

      const belowMin = await service.addCommercialProductToCreatorStore({
        actor: creatorActor,
        creatorStoreId: creatorActor.creatorStoreId,
        commercialPoolProductId: commercialized.data.id,
        selectedPrice: 89,
      });
      assert.equal(belowMin.success, false);
      assert.equal(
        belowMin.error.code,
        PoolErrorCode.POOL_CREATOR_PRICE_OUT_OF_CORRIDOR,
      );
      assert.equal(belowMin.error.details?.reasonCode, "SELECTED_PRICE_BELOW_MIN");

      const aboveMax = await service.addCommercialProductToCreatorStore({
        actor: creatorActor,
        creatorStoreId: creatorActor.creatorStoreId,
        commercialPoolProductId: commercialized.data.id,
        selectedPrice: 121,
      });
      assert.equal(aboveMax.success, false);
      assert.equal(
        aboveMax.error.code,
        PoolErrorCode.POOL_CREATOR_PRICE_OUT_OF_CORRIDOR,
      );
      assert.equal(aboveMax.error.details?.reasonCode, "SELECTED_PRICE_ABOVE_MAX");

      const launchRejected = await service.addCommercialProductToCreatorStore({
        actor: creatorActor,
        creatorStoreId: creatorActor.creatorStoreId,
        commercialPoolProductId: commercialized.data.id,
        selectedPrice: 110,
      });
      assert.equal(launchRejected.success, false);
      assert.equal(
        launchRejected.error.code,
        PoolErrorCode.POOL_CREATOR_PRICE_REQUIRES_RECOMMENDED,
      );
      assert.equal(
        launchRejected.error.details?.reasonCode,
        "LAUNCH_REQUIRES_RECOMMENDED_PRICE",
      );

      const accepted = await service.addCommercialProductToCreatorStore({
        actor: creatorActor,
        creatorStoreId: creatorActor.creatorStoreId,
        commercialPoolProductId: commercialized.data.id,
        selectedPrice: 100,
      });
      assert.equal(accepted.success, true);
      assert.equal(accepted.data.selectedPrice, 100);
      assert.equal(accepted.data.priceSelection?.accepted, true);
      assert.equal(accepted.data.priceSelection?.corridor.recommendedPrice, 100);

      return {
        result: "PASS",
        message: "Pool base price and creator corridor enforcement smoke passed.",
      };
    } catch (error: any) {
      return { result: "FAIL", message: error.message };
    }
  },
};
