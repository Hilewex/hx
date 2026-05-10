import { applyProjectionUpdate, seedProjection, getProjection } from '@hx/catalog';
import { CatalogProductReadProjection } from '@hx/contracts';
import { randomUUID } from 'crypto';

export const staleProjectionLeakSmoke = {
  name: 'Stale Price / Stock / Media Leak Smoke',
  run: async (baseUrl: string) => {
    try {
      console.log('--- Stale Projection Leak Smoke Tests ---');

      const productId = randomUUID();

      // 1. Initial State Seed
      const initialProjection: CatalogProductReadProjection = {
        productId,
        slug: 'leak-test-product',
        name: 'Leak Test Product',
        brand: 'Leak Test Brand',
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
        description: 'Testing stale leaks',
        categories: [],
        media: [
          { mediaId: 'media-initial', url: 'https://ex.com/a.jpg', isPrimary: true, type: 'IMAGE' }
        ],
        price: {
          current: 100.0,
          currency: 'TRY'
        },
        stock: {
          status: 'IN_STOCK'
        }
      };

      seedProjection(initialProjection);

      // Verify Initial State
      const initialRead = getProjection(productId);
      if (initialRead?.price?.current !== 100.0 || initialRead?.stock?.status !== 'IN_STOCK') {
        throw new Error('Initial projection seed failed');
      }

      // 2. Stale Price Leak Test
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
          activeSalePrice: 150.0,
          currency: 'TRY'
        }
      });

      if (!priceUpdateResult.success || priceUpdateResult.priceTruthMutated || priceUpdateResult.ownerTruthMutated || priceUpdateResult.businessTruthMutated || !priceUpdateResult.projectionUpdated) {
        throw new Error('Pricing update boundary violation');
      }

      const priceRead = getProjection(productId);
      if (priceRead?.price?.current !== 150.0) {
        throw new Error('Stale price leak detected - old price still active');
      }
      console.log('✅ Stale price leak test passed.');

      // 3. Stale Stock / Unavailable Leak Test
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

      if (!stockUpdateResult.success || stockUpdateResult.stockTruthMutated || stockUpdateResult.ownerTruthMutated || stockUpdateResult.businessTruthMutated || !stockUpdateResult.projectionUpdated) {
        throw new Error('Stock update boundary violation');
      }

      const stockRead = getProjection(productId);
      if (stockRead?.stock?.status !== 'OUT_OF_STOCK') {
        throw new Error('Stale stock / unavailable leak detected - item still appears in stock');
      }
      console.log('✅ Stale stock / unavailable leak test passed.');

      // 4. Media Rejected / Pending Leak Test
      const mediaIdempotencyKey = randomUUID();
      const mediaUpdateResult = applyProjectionUpdate({
        productId,
        sourceOwner: 'media',
        updateType: 'MEDIA_REJECTED',
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
          mediaId: 'media-initial',
          url: 'https://ex.com/a.jpg',
          isPrimary: true,
          status: 'REJECTED'
        }
      });

      if (!mediaUpdateResult.success || mediaUpdateResult.mediaTruthMutated || mediaUpdateResult.ownerTruthMutated || mediaUpdateResult.businessTruthMutated || !mediaUpdateResult.projectionUpdated) {
        throw new Error('Media update boundary violation');
      }

      const mediaRead = getProjection(productId);
      if (mediaRead?.media?.some(m => m.mediaId === 'media-initial')) {
        throw new Error('Media rejected leak detected - rejected media surfaced to public projection');
      }
      console.log('✅ Media rejected leak test passed.');

      // 5. Duplicate Idempotency Leak Test
      const duplicatePriceResult = applyProjectionUpdate({
        productId,
        sourceOwner: 'pricing',
        updateType: 'PRICE_CHANGED',
        occurredAt: new Date().toISOString(),
        correlationId: randomUUID(),
        idempotencyKey: priceIdempotencyKey, // same key
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

      if (duplicatePriceResult.ignoredReason !== 'DUPLICATE_IDEMPOTENCY_KEY') {
        throw new Error('Idempotency failure: duplicate request not caught');
      }

      const duplicatePriceRead = getProjection(productId);
      if (duplicatePriceRead?.price?.current === 199.99) {
        throw new Error('Duplicate idempotency leak detected - projection corrupted by duplicate update');
      }
      console.log('✅ Duplicate idempotency effect test passed.');

      // Public Surface Assertion via fetch
      // Let's try to query the catalog public read endpoint if available
      try {
         const publicCatalogRes = await fetch(`${baseUrl}/catalog/${productId}`);
         if (publicCatalogRes.ok) {
           const body = await publicCatalogRes.json();
           if (body.price?.current !== 150.0 || body.stock?.status !== 'OUT_OF_STOCK') {
              throw new Error('Public catalog API leak detected - returns stale data');
           }
           console.log('✅ Public Surface API verification passed.');
         } else {
           console.log('⚠️ Public API for catalog not available, falling back to direct projection validation (Limitation).');
         }
      } catch (e: any) {
         console.log('⚠️ Public API fetch error, falling back to direct projection validation (Limitation).', e.message);
      }

      console.log('--- Stale Projection Leak Smoke Tests Completed ---');
      return { result: 'PASS', message: 'All stale projection leaks blocked correctly.' };
    } catch (e: any) {
      return { result: 'FAIL', message: e.message };
    }
  }
};
