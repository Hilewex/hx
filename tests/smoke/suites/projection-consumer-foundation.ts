import { applyProjectionUpdate, seedProjection, getProjection } from '@hx/catalog';
import { CatalogProductReadProjection } from '@hx/contracts';
import { randomUUID } from 'crypto';

export const projectionConsumerFoundationSmoke = {
  name: 'Projection Consumer Foundation',
  run: async (baseUrl: string) => {
    try {
      console.log('--- Projection Consumer Foundation Tests ---');

      const productId = randomUUID();

      // 1. Seed initial projection
      const initialProjection: CatalogProductReadProjection = {
        productId,
        slug: 'test-product',
        name: 'Test Product',
        brand: 'Test Brand',
        status: 'ACTIVE',
        variants: [],
        publicReadable: true,
        catalogReadTruth: false,
        projectionSource: 'FOUNDATION_SEED',
        priceTruth: false,
        stockTruth: false,
        mediaTruth: false,
        searchIndexTruth: false,
        productTruthMutated: false,
        description: 'A test product for projection consumer foundation',
        categories: [],
        media: []
      };

      seedProjection(initialProjection);

      // 2. Test Pricing Projection Update
      const priceIdempotencyKey = randomUUID();
      const priceUpdateResult = applyProjectionUpdate({
        productId,
        sourceOwner: 'pricing',
        updateType: 'PRICE_CHANGED',
        occurredAt: new Date().toISOString(),
        correlationId: randomUUID(),
        idempotencyKey: priceIdempotencyKey,
        ownerTruthMutated: false,
        productTruthMutated: false,
        priceTruthMutated: false,
        stockTruthMutated: false,
        mediaTruthMutated: false,
        searchIndexTruthMutated: false,
        projectionUpdated: true,
        businessTruthMutated: false,
        payload: {
          activeSalePrice: 199.99,
          currency: 'TRY'
        }
      });

      if (!priceUpdateResult.success || priceUpdateResult.priceTruthMutated) {
        throw new Error('Pricing projection update failed or boundary violated');
      }

      const afterPrice = getProjection(productId);
      if (afterPrice?.price?.current !== 199.99) {
        throw new Error('Pricing projection state not applied correctly');
      }
      console.log('✅ Pricing projection update test passed.');

      // 3. Test Stock Projection Update
      const stockIdempotencyKey = randomUUID();
      const stockUpdateResult = applyProjectionUpdate({
        productId,
        sourceOwner: 'stock',
        updateType: 'STOCK_CHANGED',
        occurredAt: new Date().toISOString(),
        correlationId: randomUUID(),
        idempotencyKey: stockIdempotencyKey,
        ownerTruthMutated: false,
        productTruthMutated: false,
        priceTruthMutated: false,
        stockTruthMutated: false,
        mediaTruthMutated: false,
        searchIndexTruthMutated: false,
        projectionUpdated: true,
        businessTruthMutated: false,
        payload: {
          availabilityStatus: 'OUT_OF_STOCK'
        }
      });

      if (!stockUpdateResult.success || stockUpdateResult.stockTruthMutated) {
        throw new Error('Stock projection update failed or boundary violated');
      }

      const afterStock = getProjection(productId);
      if (afterStock?.stock?.status !== 'OUT_OF_STOCK') {
        throw new Error('Stock projection state not applied correctly');
      }
      console.log('✅ Stock projection update test passed.');

      // 4. Test Media Projection Update (Approved)
      const mediaIdempotencyKey = randomUUID();
      const mediaUpdateResult = applyProjectionUpdate({
        productId,
        sourceOwner: 'media',
        updateType: 'MEDIA_APPROVED',
        occurredAt: new Date().toISOString(),
        correlationId: randomUUID(),
        idempotencyKey: mediaIdempotencyKey,
        ownerTruthMutated: false,
        productTruthMutated: false,
        priceTruthMutated: false,
        stockTruthMutated: false,
        mediaTruthMutated: false,
        searchIndexTruthMutated: false,
        projectionUpdated: true,
        businessTruthMutated: false,
        payload: {
          mediaId: 'media-1',
          url: 'https://example.com/media-1.jpg',
          isPrimary: true,
          status: 'APPROVED'
        }
      });

      if (!mediaUpdateResult.success || mediaUpdateResult.mediaTruthMutated) {
        throw new Error('Media projection update failed or boundary violated');
      }

      const afterMedia = getProjection(productId);
      if (!afterMedia?.media?.some(m => m.mediaId === 'media-1')) {
        throw new Error('Media projection state not applied correctly');
      }
      console.log('✅ Media projection update (Approved) test passed.');

      // 5. Test Media Projection Update (Rejected)
      const rejectMediaIdempotencyKey = randomUUID();
      const rejectMediaUpdateResult = applyProjectionUpdate({
        productId,
        sourceOwner: 'media',
        updateType: 'MEDIA_REJECTED',
        occurredAt: new Date().toISOString(),
        correlationId: randomUUID(),
        idempotencyKey: rejectMediaIdempotencyKey,
        ownerTruthMutated: false,
        productTruthMutated: false,
        priceTruthMutated: false,
        stockTruthMutated: false,
        mediaTruthMutated: false,
        searchIndexTruthMutated: false,
        projectionUpdated: true,
        businessTruthMutated: false,
        payload: {
          mediaId: 'media-1',
          url: 'https://example.com/media-1.jpg',
          isPrimary: true,
          status: 'REJECTED'
        }
      });

      if (!rejectMediaUpdateResult.success || rejectMediaUpdateResult.mediaTruthMutated) {
        throw new Error('Media projection reject update failed or boundary violated');
      }

      const afterMediaReject = getProjection(productId);
      if (afterMediaReject?.media?.some(m => m.mediaId === 'media-1')) {
        throw new Error('Media projection state did not remove rejected media');
      }
      console.log('✅ Media projection update (Rejected) test passed.');

      // 6. Test Idempotency
      const duplicatePriceResult = applyProjectionUpdate({
        productId,
        sourceOwner: 'pricing',
        updateType: 'PRICE_CHANGED',
        occurredAt: new Date().toISOString(),
        correlationId: randomUUID(),
        idempotencyKey: priceIdempotencyKey, // Using same key
        ownerTruthMutated: false,
        productTruthMutated: false,
        priceTruthMutated: false,
        stockTruthMutated: false,
        mediaTruthMutated: false,
        searchIndexTruthMutated: false,
        projectionUpdated: true,
        businessTruthMutated: false,
        payload: {
          activeSalePrice: 99.99, // Different price to ensure it doesn't apply
          currency: 'TRY'
        }
      });

      if (duplicatePriceResult.ignoredReason !== 'DUPLICATE_IDEMPOTENCY_KEY') {
        throw new Error('Idempotency failed, duplicate update not ignored');
      }

      const afterDuplicate = getProjection(productId);
      if (afterDuplicate?.price?.current !== 199.99) { // Should still be 199.99
        throw new Error('Idempotency failed, duplicate update applied effect');
      }
      console.log('✅ Idempotency prevention test passed.');

      console.log('--- Projection Consumer Foundation Tests Completed ---');
      return { result: 'PASS', message: 'All projection foundation constraints verified' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};

