import { PoolService } from "@hx/pool";
import {
  SupplierSubmittedVariant,
  ProductMediaRef,
  PoolActorContext,
  PoolResult,
  SupplierSubmittedProduct,
  CommercialPoolProduct,
  CreatorStoreProduct,
  CreatorStoreProductVisibility,
  CreatorStoreProductMediaType,
  CreatorStoreProductMediaUsage,
  CreatorStoreProductMediaOperationResult,
} from "@hx/contracts";

const poolService = new PoolService();

const supplierActor: PoolActorContext = {
  actorId: "supplier-actor-1",
  actorType: "SUPPLIER",
  supplierId: "supplier-acme",
};

const adminActor: PoolActorContext = {
  actorId: "admin-actor-1",
  actorType: "ADMIN",
};

const creatorActor: PoolActorContext = {
    actorId: "creator-actor-1",
    actorType: "CREATOR",
    creatorStoreId: "store-1",
}

const otherCreatorActor: PoolActorContext = {
    actorId: "creator-actor-2",
    actorType: "CREATOR",
    creatorStoreId: "store-2",
}

function log(title: string, data?: any) {
  console.log(`\n--- ${title} ---`);
  if (data) {
    // Check for PoolResult failure and log error specifically
    if (data.success === false) {
      console.error(JSON.stringify(data.error, null, 2));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`ASSERTION FAILED: ${message}`);
        process.exit(1);
    }
}

async function handleResult<T>(
  title: string,
  resultPromise: Promise<PoolResult<T>>,
  expectSuccess: boolean = true,
): Promise<T | null> {
  log(title);
  const result = await resultPromise;
  log(`Result for: ${title}`, result);
  if (expectSuccess) {
    assert(result.success, `Expected success for "${title}" but failed.`);
    return result.success ? (result.data as T) : null;
  } else {
    assert(!result.success, `Expected failure for "${title}" but succeeded.`);
    return null;
  }
}

async function simulate() {
  log("PX-HAVUZ-05 Full Smoke Test START");

  // 1. Supplier submits a product
  const draftResult = await handleResult<SupplierSubmittedProduct>(
    "1. Supplier creates draft",
    poolService.createSupplierProductDraft({
      actor: supplierActor,
      supplierId: "supplier-acme",
      title: "Creator Store Test Product",
      categoryId: "cat-test",
    }),
  );
  const submittedProductId = draftResult!.id;
  const media: ProductMediaRef[] = [{ id: "media-1", url: "http://a.com/1.png", type: "IMAGE", order: 1 }];
  const variants: SupplierSubmittedVariant[] = [{ id: "var-1", title: "V1", sku: "S1", barcode: "B1", stock: 10, price: 100, attributes: {}, media }];
  await handleResult(
      "2. Supplier updates draft with data",
      poolService.updateSupplierProductDraft({
          actor: supplierActor,
          id: submittedProductId,
          variants,
          brand: "Smoke Test Brand"
      })
  );
  await handleResult(
    "3. Supplier submits for review",
    poolService.submitSupplierProductForReview({
      actor: supplierActor,
      id: submittedProductId,
    }),
  );

  // 2. Admin approves
    await handleResult(
        "4. Admin starts review",
        poolService.startProductReview({
            actor: adminActor,
            productId: submittedProductId,
        })
    );
  await handleResult(
    "5. Admin approves",
    poolService.approveSupplierProduct({
      actor: adminActor,
      productId: submittedProductId,
    }),
  );

  // 3. Admin commercializes
  const commercialResult = await handleResult<CommercialPoolProduct>(
    "6. Admin commercializes",
    poolService.commercializeApprovedProduct({
      actor: adminActor,
      submittedProductId,
    }),
  );
  const commercialPoolProductId = commercialResult!.id;

  // 4. Admin binds
  await handleResult(
    "7. Admin binds product",
    poolService.bindCommercialPoolProduct({
      actor: adminActor,
      commercialPoolProductId,
    }),
  );

  // 5. Admin activates
  await handleResult(
    "8. Admin activates product",
    poolService.activateCommercialPoolProduct({
      actor: adminActor,
      commercialPoolProductId,
    }),
  );

  // 6. Creator lists available products
  const availableProducts = await handleResult<CommercialPoolProduct[]>(
      "9. Creator lists available products",
      poolService.listAvailableCommercialProductsForCreator()
  );
  assert(availableProducts!.some(p => p.id === commercialPoolProductId), "Product should be available to creator");

  // 7. Creator adds product to store
  const addedProduct = await handleResult<CreatorStoreProduct>(
      "10. Creator adds product to store",
      poolService.addCommercialProductToCreatorStore({
          actor: creatorActor,
          creatorStoreId: creatorActor.creatorStoreId!,
          commercialPoolProductId,
          selectedPrice: 150
      })
  )
    const creatorStoreProductId = addedProduct!.id

  // 9. Creator merchandising update PASS
    await handleResult(
        "11. Creator updates merchandising",
        poolService.updateCreatorStoreProductMerchandising({
            actor: creatorActor,
            creatorStoreProductId,
            visibility: CreatorStoreProductVisibility.VISIBLE,
            displayOrder: 10,
            isFeatured: true,
            creatorNote: "Check this out!"
        })
    );

  // 10. Foreign store product merchandising FAIL
    await handleResult(
        "12. Other creator tries to update merchandising (should fail)",
        poolService.updateCreatorStoreProductMerchandising({
            actor: otherCreatorActor,
            creatorStoreProductId,
            displayOrder: 20
        }),
        false
    );

  // 11. Negative displayOrder FAIL
    await handleResult(
        "13. Negative displayOrder (should fail)",
        poolService.updateCreatorStoreProductMerchandising({
            actor: creatorActor,
            creatorStoreProductId,
            displayOrder: -1
        }),
        false
    );

  // 12. Too long creatorNote FAIL
    await handleResult(
        "14. Too long creatorNote (should fail)",
        poolService.updateCreatorStoreProductMerchandising({
            actor: creatorActor,
            creatorStoreProductId,
            creatorNote: "A".repeat(501)
        }),
        false
    );

  // 13. Reorder PASS
    await handleResult(
        "15. Creator reorders products",
        poolService.reorderCreatorStoreProducts({
            actor: creatorActor,
            creatorStoreId: creatorActor.creatorStoreId!,
            orderedProductIds: [creatorStoreProductId]
        })
    );

  // 14. Reorder duplicate ID FAIL
    await handleResult(
        "16. Reorder with duplicate IDs (should fail)",
        poolService.reorderCreatorStoreProducts({
            actor: creatorActor,
            creatorStoreId: creatorActor.creatorStoreId!,
            orderedProductIds: [creatorStoreProductId, creatorStoreProductId]
        }),
        false
    );

  // 15. Reorder foreign product FAIL
    await handleResult(
        "17. Reorder with foreign product (should fail)",
        poolService.reorderCreatorStoreProducts({
            actor: creatorActor,
            creatorStoreId: creatorActor.creatorStoreId!,
            orderedProductIds: ["some-other-id"]
        }),
        false
    );

  // 16. Visible list only ACTIVE + VISIBLE PASS
    const visibleProducts = await handleResult<CreatorStoreProduct[]>(
        "18. List visible products",
        poolService.listVisibleCreatorStoreProducts(creatorActor.creatorStoreId!)
    );
    assert(visibleProducts!.length === 1, "Should have 1 visible product");
    assert(visibleProducts![0].id === creatorStoreProductId, "Incorrect product in visible list");

    // Hide product and check visible list
    await poolService.updateCreatorStoreProductMerchandising({
        actor: creatorActor,
        creatorStoreProductId,
        visibility: CreatorStoreProductVisibility.HIDDEN
    });
    const emptyVisibleProducts = await handleResult<CreatorStoreProduct[]>(
        "19. List visible products after hiding",
        poolService.listVisibleCreatorStoreProducts(creatorActor.creatorStoreId!)
    );
    assert(emptyVisibleProducts!.length === 0, "Visible list should be empty after hiding product");

    // PX-FENOMEN-03 Media Hook Tests
    await handleResult<CreatorStoreProductMediaOperationResult>(
        "20. Add media PASS",
        poolService.addCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            mediaAssetId: "asset-123",
            mediaType: CreatorStoreProductMediaType.VIDEO,
            usage: CreatorStoreProductMediaUsage.PRODUCT_CARD,
            displayOrder: 0,
            caption: "Amazing hook video"
        })
    );

    await handleResult(
        "21. Duplicate media FAIL",
        poolService.addCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            mediaAssetId: "asset-123",
            mediaType: CreatorStoreProductMediaType.IMAGE,
            usage: CreatorStoreProductMediaUsage.PRODUCT_DETAIL,
            displayOrder: 1
        }),
        false
    );

    await handleResult(
        "22. Foreign store product media add FAIL",
        poolService.addCreatorStoreProductMedia({
            actor: otherCreatorActor,
            creatorStoreProductId,
            mediaAssetId: "asset-456",
            mediaType: CreatorStoreProductMediaType.IMAGE,
            usage: CreatorStoreProductMediaUsage.PRODUCT_DETAIL,
            displayOrder: 1
        }),
        false
    );

    await handleResult<CreatorStoreProductMediaOperationResult>(
        "23. Add second media PASS",
        poolService.addCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            mediaAssetId: "asset-456",
            mediaType: CreatorStoreProductMediaType.IMAGE,
            usage: CreatorStoreProductMediaUsage.PRODUCT_DETAIL,
            displayOrder: 1
        })
    );

    await handleResult<CreatorStoreProductMediaOperationResult>(
        "24. Reorder media PASS",
        poolService.reorderCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            orderedMediaAssetIds: ["asset-456", "asset-123"]
        })
    );

    await handleResult(
        "25. Reorder duplicate media FAIL",
        poolService.reorderCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            orderedMediaAssetIds: ["asset-456", "asset-456"]
        }),
        false
    );

    await handleResult(
        "26. Reorder missing/foreign media FAIL",
        poolService.reorderCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            orderedMediaAssetIds: ["asset-456", "wrong-asset"]
        }),
        false
    );

    await handleResult<CreatorStoreProductMediaOperationResult>(
        "27. Remove media PASS",
        poolService.removeCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            mediaAssetId: "asset-123"
        })
    );

    await handleResult(
        "28. Remove missing media FAIL",
        poolService.removeCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            mediaAssetId: "asset-123"
        }),
        false
    );

  // 17. Removed product tests
    await handleResult(
        "29. Creator removes product",
        poolService.removeCreatorStoreProduct({
            actor: creatorActor,
            creatorStoreProductId
        })
    );

    await handleResult(
        "30. Removed product media add FAIL",
        poolService.addCreatorStoreProductMedia({
            actor: creatorActor,
            creatorStoreProductId,
            mediaAssetId: "asset-789",
            mediaType: CreatorStoreProductMediaType.IMAGE,
            usage: CreatorStoreProductMediaUsage.PRODUCT_DETAIL,
            displayOrder: 1
        }),
        false
    );

    await handleResult(
        "31. Update removed product merchandising (should fail)",
        poolService.updateCreatorStoreProductMerchandising({
            actor: creatorActor,
            creatorStoreProductId,
            displayOrder: 5
        }),
        false
    );

    // 18. Verify commercial product status unchanged
    const finalCommercialProduct = await handleResult<CommercialPoolProduct | undefined>(
        "32. Verify commercial product status is unchanged",
        poolService.getCommercialPoolProduct(commercialPoolProductId)
    );
    assert(finalCommercialProduct!.status === "ACTIVE", "Commercial product status should not have changed");

    // Global media truth check (commercialization variants should be untouched)
    const variantsWithMedia = finalCommercialProduct!.commercialization.data.variants.filter(v => v.media && v.media.length > 0);
    assert(variantsWithMedia.length > 0, "Global media truth should still exist");
    assert(variantsWithMedia[0].media[0].id === "media-1", "Global media truth should not be mutated");

  log("PX-HAVUZ-05 & PX-FENOMEN-03 Full Smoke Test END: ALL TESTS PASSED");
}

simulate().catch(e => {
    console.error("SIMULATION FAILED WITH UNCAUGHT EXCEPTION");
    console.error(e);
    process.exit(1);
});
