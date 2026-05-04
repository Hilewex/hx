import {
  getCatalogProductProjection,
  getStorefrontContext,
  listPublicCatalogProductCards
} from '@hx/catalog';
import { PdpResponse } from '@hx/contracts';
import * as response from './response';

export function handlePdpRead(productId: string, storefrontId?: string): response.BffResponse {
  if (!storefrontId) {
    return response.badRequest('STOREFRONT_CONTEXT_REQUIRED', 'PDP must be opened within a storefront context');
  }

  const storefront = getStorefrontContext(storefrontId);
  if (!storefront) {
    return response.notFound('STOREFRONT_NOT_FOUND', 'Storefront context not found');
  }

  const result = getCatalogProductProjection(productId, { includeNonPublic: false });
  if (result.status === 'NOT_FOUND') {
    return response.notFound('PRODUCT_NOT_FOUND', 'Product not found');
  }
  if (result.status === 'UNAVAILABLE') {
    return response.domainError(410, 'PRODUCT_GONE', 'Product is permanently unavailable', 'business_rule');
  }
  if (!result.product) {
    return response.notFound('PRODUCT_NOT_FOUND', 'Product not found');
  }

  const pdpData: PdpResponse = {
    product: result.product,
    storefrontContext: {
      storefrontId: storefront.storefrontId,
      name: storefront.name,
      creatorNote: storefront.creatorNote,
      isFollowed: storefront.isFollowed
    }
  };

  return response.ok(pdpData);
}

export function handleCatalogProductRead(productId: string): response.BffResponse {
  const result = getCatalogProductProjection(productId, { includeNonPublic: false });
  if (result.status === 'NOT_FOUND') {
    return response.notFound('PRODUCT_NOT_FOUND', 'Product not found');
  }
  if (result.status === 'UNAVAILABLE') {
    return response.domainError(410, 'PRODUCT_GONE', 'Product is permanently unavailable', 'business_rule');
  }
  return response.ok({ product: result.product, warnings: result.warnings });
}

export function handleCatalogProductCards(queryParams: Record<string, string>): response.BffResponse {
  const cards = listPublicCatalogProductCards({
    categoryId: queryParams.categoryId,
    storefrontId: queryParams.storefrontId,
    limit: queryParams.limit ? Number(queryParams.limit) : undefined
  });

  return response.ok({
    productCards: cards,
    warnings: [
      'CATALOG_PRODUCT_CARD_PROJECTION',
      'CARD_TRUTH_FALSE',
      'PRICE_STOCK_MEDIA_OWNER_TRUTH_NOT_PRODUCED_BY_BFF'
    ]
  });
}
