import {
  CategorySearchCandidate,
  ProductSearchCandidate,
  SearchCandidate,
  SearchIntent,
  SearchIntentType,
  SearchMode,
  SearchQueryInput,
  SearchResponse,
  StorefrontSearchCandidate
} from '@hx/contracts';
import { getCatalogProductProjection } from '@hx/catalog';
import { resolveSearchConfig, SearchServiceConfig } from './config';
import {
  buildProductSearchDocumentFromCatalogProjection,
  isCatalogProjectionIndexable,
  ProductSearchDocument,
  productDocumentToCandidate,
  toProductSearchDocument
} from './document';
import { OpenSearchFoundationClient } from './opensearch';

const MEMORY_CANDIDATES: SearchCandidate[] = [
  {
    type: 'PRODUCT',
    productId: 'p_valid',
    slug: 'valid-product',
    name: 'Valid Product',
    brand: 'HX Brand',
    status: 'ACTIVE',
    mediaType: 'IMAGE',
    categoryIds: ['c_1'],
    storefrontId: 's_1',
    scoreFoundationOnly: 0.9,
    searchTruth: false,
    projectionTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    rankingFinal: false
  } as ProductSearchCandidate,
  {
    type: 'PRODUCT',
    productId: 'p_video_1',
    slug: 'video-product',
    name: 'Video Product',
    brand: 'HX Video',
    status: 'ACTIVE',
    mediaType: 'VIDEO',
    categoryIds: ['c_fashion'],
    storefrontId: 's_video',
    scoreFoundationOnly: 0.85,
    searchTruth: false,
    projectionTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    rankingFinal: false
  } as ProductSearchCandidate,
  {
    type: 'PRODUCT',
    productId: 'p_hidden',
    slug: 'hidden-product',
    name: 'Hidden Product',
    status: 'HIDDEN',
    mediaType: 'IMAGE',
    scoreFoundationOnly: 0.1,
    searchTruth: false,
    projectionTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    rankingFinal: false
  } as ProductSearchCandidate,
  {
    type: 'PRODUCT',
    productId: 'p_unavailable',
    slug: 'unavailable-product',
    name: 'Unavailable Product',
    status: 'UNAVAILABLE',
    mediaType: 'IMAGE',
    scoreFoundationOnly: 0,
    searchTruth: false,
    projectionTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    rankingFinal: false
  } as ProductSearchCandidate,
  {
    type: 'CATEGORY',
    categoryId: 'c_1',
    name: 'Electronics',
    slug: 'electronics',
    scoreFoundationOnly: 0.95,
    searchTruth: false,
    taxonomyTruthMutated: false,
    rankingFinal: false
  } as CategorySearchCandidate,
  {
    type: 'CATEGORY',
    categoryId: 'c_fashion',
    name: 'Fashion',
    slug: 'fashion',
    scoreFoundationOnly: 0.9,
    searchTruth: false,
    taxonomyTruthMutated: false,
    rankingFinal: false
  } as CategorySearchCandidate,
  {
    type: 'STOREFRONT',
    storefrontId: 's_1',
    creatorId: 'creator_1',
    name: 'HX Store',
    slug: 'hx-store',
    scoreFoundationOnly: 0.8,
    searchTruth: false,
    storefrontTruthMutated: false,
    rankingFinal: false
  } as StorefrontSearchCandidate,
  {
    type: 'STOREFRONT',
    storefrontId: 's_video',
    creatorId: 'creator_video',
    name: 'Video Store',
    slug: 'video-store',
    scoreFoundationOnly: 0.75,
    searchTruth: false,
    storefrontTruthMutated: false,
    rankingFinal: false
  } as StorefrontSearchCandidate
];

const PRODUCT_DOCUMENT_SEED: ProductSearchDocument[] = MEMORY_CANDIDATES
  .filter((candidate): candidate is ProductSearchCandidate => candidate.type === 'PRODUCT')
  .map(candidate => toProductSearchDocument({
    productId: candidate.productId,
    slug: candidate.slug,
    name: candidate.name,
    brand: candidate.brand,
    categoryIds: candidate.categoryIds,
    storefrontId: candidate.storefrontId,
    status: candidate.status,
    mediaType: candidate.mediaType,
    updatedAt: new Date(0).toISOString()
  }));

const MEMORY_INDEX_DOCUMENTS = new Map<string, ProductSearchDocument>(
  PRODUCT_DOCUMENT_SEED.map(document => [document.productId, document])
);

const MEMORY_WARNINGS = [
  'SEARCH_BACKEND_MEMORY_EXPLICIT',
  'SEARCH_INDEX_FOUNDATION_MEMORY',
  'SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH',
  'RANKING_NOT_IN_SCOPE',
  'M8_RANKING_NOT_IN_SCOPE'
];

const OPENSEARCH_WARNINGS = [
  'SEARCH_BACKEND_OPENSEARCH',
  'SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH',
  'RANKING_NOT_IN_SCOPE',
  'M8_RANKING_NOT_IN_SCOPE'
];

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function classifyIntent(normalizedQuery: string, mode: SearchMode): SearchIntent {
  const tokens = normalizedQuery ? normalizedQuery.split(' ') : [];
  let type: SearchIntentType = 'PRODUCT';
  let confidence = 0.5;

  if (!normalizedQuery) {
    return {
      type: 'UNKNOWN',
      confidence: 0,
      normalizedQuery: '',
      tokens: []
    };
  }

  const categoryTerms = ['electronics', 'fashion', 'ayakkabı', 'mutfak', 'elbise'];
  const storeTerms = ['store', 'mağaza', 'fenomen', 'hx store'];
  const discoveryTerms = ['trend', 'yeni', 'çok kaydedilen', 'videolu', 'video'];

  if (categoryTerms.some(term => normalizedQuery.includes(term))) {
    type = 'CATEGORY';
    confidence = 0.8;
  } else if (storeTerms.some(term => normalizedQuery.includes(term))) {
    type = 'STOREFRONT';
    confidence = 0.9;
  } else if (discoveryTerms.some(term => normalizedQuery.includes(term)) || mode === 'DISCOVER') {
    type = 'DISCOVERY';
    confidence = 0.85;
  }

  return {
    type,
    confidence,
    normalizedQuery,
    tokens,
    warnings: normalizedQuery.match(/[^\x00-\x7F]/) ? ['ADVANCED_NORMALIZATION_MISSING'] : []
  };
}

export function getFoundationProductDocuments(): ProductSearchDocument[] {
  return PRODUCT_DOCUMENT_SEED.map(document => ({ ...document, categoryIds: [...document.categoryIds] }));
}

export async function ensureProductSearchIndex(config: SearchServiceConfig = resolveSearchConfig()): Promise<void> {
  if (config.SEARCH_BACKEND === 'memory') return;
  const client = createOpenSearchClient(config);
  await client.ensureProductIndex();
}

export async function indexProductSearchDocument(
  document: ProductSearchDocument,
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<void> {
  if (config.SEARCH_BACKEND === 'memory') {
    MEMORY_INDEX_DOCUMENTS.set(document.productId, cloneProductDocument(document));
    return;
  }
  const client = createOpenSearchClient(config);
  await client.indexProduct(document);
}

export async function indexProductSearchDocuments(
  documents: ProductSearchDocument[],
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<void> {
  if (config.SEARCH_BACKEND === 'memory') {
    for (const document of documents) {
      MEMORY_INDEX_DOCUMENTS.set(document.productId, cloneProductDocument(document));
    }
    return;
  }
  const client = createOpenSearchClient(config);
  await client.indexProducts(documents);
}

export async function deleteProductSearchDocument(
  productId: string,
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<void> {
  if (config.SEARCH_BACKEND === 'memory') {
    MEMORY_INDEX_DOCUMENTS.delete(productId);
    return;
  }
  const client = createOpenSearchClient(config);
  await client.deleteProduct(productId);
}

export async function deactivateProductSearchDocument(
  productId: string,
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<void> {
  if (config.SEARCH_BACKEND === 'memory') {
    const existing = MEMORY_INDEX_DOCUMENTS.get(productId);
    if (existing) {
      MEMORY_INDEX_DOCUMENTS.set(productId, {
        ...cloneProductDocument(existing),
        status: 'UNAVAILABLE',
        visible: false,
        updatedAt: new Date().toISOString()
      });
    }
    return;
  }
  const client = createOpenSearchClient(config);
  await client.deactivateProduct(productId);
}

export interface CatalogProductProjectionIndexResult {
  productId: string;
  status: 'INDEXED' | 'DEACTIVATED' | 'DELETED' | 'NOT_FOUND';
  document?: ProductSearchDocument;
  searchIndexTruth: false;
  productTruthMutated: false;
  priceTruth: false;
  stockTruth: false;
  mediaTruth: false;
  rankingFinal: false;
  warnings: string[];
}

export async function indexCatalogProductProjection(
  productId: string,
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<CatalogProductProjectionIndexResult> {
  const result = getCatalogProductProjection(productId, { includeNonPublic: true });
  if (!result.product) {
    return catalogProjectionIndexResult(productId, 'NOT_FOUND', undefined, result.warnings || []);
  }

  const document = buildProductSearchDocumentFromCatalogProjection(result.product, new Date().toISOString());
  if (!isCatalogProjectionIndexable(result.product)) {
    await deactivateCatalogProductProjection(productId, config);
    return catalogProjectionIndexResult(productId, 'DEACTIVATED', document, [
      ...(result.warnings || []),
      'CATALOG_PROJECTION_NOT_INDEXABLE_DEACTIVATED'
    ]);
  }

  await indexProductSearchDocument(document, config);
  return catalogProjectionIndexResult(productId, 'INDEXED', document, [
    ...(result.warnings || []),
    'CATALOG_READ_PROJECTION_INDEXED_TO_SEARCH_PROJECTION'
  ]);
}

export async function indexCatalogProductProjections(
  productIds: string[],
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<CatalogProductProjectionIndexResult[]> {
  const results: CatalogProductProjectionIndexResult[] = [];
  for (const productId of productIds) {
    results.push(await indexCatalogProductProjection(productId, config));
  }
  return results;
}

export async function deactivateCatalogProductProjection(
  productId: string,
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<CatalogProductProjectionIndexResult> {
  await deactivateProductSearchDocument(productId, config);
  return catalogProjectionIndexResult(productId, 'DEACTIVATED', undefined, [
    'SEARCH_INDEX_PROJECTION_DEACTIVATED',
    'SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH'
  ]);
}

export async function deleteCatalogProductProjection(
  productId: string,
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<CatalogProductProjectionIndexResult> {
  await deleteProductSearchDocument(productId, config);
  return catalogProjectionIndexResult(productId, 'DELETED', undefined, [
    'SEARCH_INDEX_PROJECTION_DELETED',
    'SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH'
  ]);
}

export async function searchCandidates(
  input: SearchQueryInput,
  config: SearchServiceConfig = resolveSearchConfig()
): Promise<SearchResponse> {
  const mode = input.mode || 'GLOBAL';

  if (!input.query || input.query.trim() === '') {
    return {
      query: input.query || '',
      mode,
      intent: classifyIntent('', mode),
      candidates: [],
      emptyState: {
        code: 'QUERY_REQUIRED',
        message: 'Arama sorgusu gereklidir.',
        suggestedSurface: 'HOME'
      },
      warnings: warningsForConfig(config)
    };
  }

  const normalized = normalizeQuery(input.query);
  const intent = classifyIntent(normalized, mode);
  const limit = input.limit || 20;

  if (config.SEARCH_BACKEND === 'opensearch') {
    try {
      return await searchWithOpenSearch(input, normalized, intent, mode, limit, config);
    } catch (error) {
      if (!config.SEARCH_ALLOW_DEGRADED_FALLBACK) throw error;
      return searchWithMemory(input, normalized, intent, mode, limit, [
        ...MEMORY_WARNINGS,
        'SEARCH_DEGRADED_FALLBACK_USED',
        'OPENSEARCH_UNAVAILABLE'
      ]);
    }
  }

  return searchWithMemory(input, normalized, intent, mode, limit, MEMORY_WARNINGS);
}

async function searchWithOpenSearch(
  input: SearchQueryInput,
  normalized: string,
  intent: SearchIntent,
  mode: SearchMode,
  limit: number,
  config: SearchServiceConfig
): Promise<SearchResponse> {
  const client = createOpenSearchClient(config);
  const productResult = await client.searchProducts({
    query: normalized,
    mode,
    limit,
    storefrontId: input.storefrontId,
    categoryId: input.categoryId
  });

  const candidates: SearchCandidate[] = productResult.documents.map(hit =>
    productDocumentToCandidate(hit.document, hit.scoreFoundationOnly, OPENSEARCH_WARNINGS)
  );

  if (mode === 'GLOBAL' || mode === 'CATALOG') {
    candidates.push(...searchStaticNonProductCandidates(normalized, mode, limit - candidates.length));
  }

  return buildResponse(input, mode, intent, candidates.slice(0, limit), warningsForConfig(config));
}

function searchWithMemory(
  input: SearchQueryInput,
  normalized: string,
  intent: SearchIntent,
  mode: SearchMode,
  limit: number,
  warnings: string[]
): SearchResponse {
  const productCandidates = Array.from(MEMORY_INDEX_DOCUMENTS.values()).filter(document => {
    const matchesQuery =
      document.name.toLowerCase().includes(normalized) ||
      document.slug.toLowerCase().includes(normalized) ||
      document.title.toLowerCase().includes(normalized);

    if (!matchesQuery) return false;
    if (!document.visible || document.status !== 'ACTIVE') return false;

    if (mode === 'DISCOVER') {
      return document.mediaType === 'VIDEO';
    }

    if (mode === 'CATALOG') {
      return true;
    }

    if (mode === 'STOREFRONT' && input.storefrontId) {
      return document.storefrontId === input.storefrontId;
    }

    return true;
  }).map(document => productDocumentToCandidate(document, 0.5, warnings));

  const nonProductCandidates =
    mode === 'GLOBAL' || mode === 'CATALOG'
      ? searchStaticNonProductCandidates(normalized, mode, limit - productCandidates.length)
      : [];
  const candidates = [...productCandidates, ...nonProductCandidates].slice(0, limit);

  return buildResponse(input, mode, intent, candidates, addContextWarnings(warnings, mode, input.storefrontId));
}

function searchStaticNonProductCandidates(normalized: string, mode: SearchMode, limit: number): SearchCandidate[] {
  if (limit <= 0) return [];
  return MEMORY_CANDIDATES.filter(candidate => {
    if (candidate.type === 'PRODUCT') return false;
    if (mode === 'DISCOVER' || mode === 'STOREFRONT') return false;
    return candidate.name.toLowerCase().includes(normalized) || candidate.slug.toLowerCase().includes(normalized);
  }).slice(0, limit);
}

function buildResponse(
  input: SearchQueryInput,
  mode: SearchMode,
  intent: SearchIntent,
  candidates: SearchCandidate[],
  warnings: string[]
): SearchResponse {
  const emptyState = candidates.length === 0
    ? {
        code: 'NO_RESULTS' as const,
        message: 'Sonuç bulunamadı.',
        suggestedSurface: mode === 'DISCOVER' ? 'HOME' as const : 'DISCOVER' as const
      }
    : undefined;

  return {
    query: input.query,
    mode,
    surface: input.surface,
    intent,
    candidates,
    emptyState,
    warnings
  };
}

function warningsForConfig(config: SearchServiceConfig): string[] {
  if (config.SEARCH_BACKEND === 'opensearch') return OPENSEARCH_WARNINGS;
  return MEMORY_WARNINGS;
}

function addContextWarnings(warnings: string[], mode: SearchMode, storefrontId?: string): string[] {
  const next = [...warnings];
  if (mode === 'STOREFRONT' && storefrontId) {
    next.push('STOREFRONT_SEARCH_CONTEXT_FOUNDATION_LIMITED');
  }
  return next;
}

function createOpenSearchClient(config: SearchServiceConfig): OpenSearchFoundationClient {
  if (!config.OPENSEARCH_NODE) {
    throw new Error('OPENSEARCH_NODE_REQUIRED');
  }
  return new OpenSearchFoundationClient({
    node: config.OPENSEARCH_NODE,
    username: config.OPENSEARCH_USERNAME,
    password: config.OPENSEARCH_PASSWORD,
    indexProducts: config.OPENSEARCH_INDEX_PRODUCTS
  });
}

function cloneProductDocument(document: ProductSearchDocument): ProductSearchDocument {
  return {
    ...document,
    categoryIds: [...document.categoryIds],
    categorySlugs: [...document.categorySlugs],
    facetValues: Object.fromEntries(
      Object.entries(document.facetValues).map(([key, values]) => [key, [...values]])
    )
  };
}

function catalogProjectionIndexResult(
  productId: string,
  status: CatalogProductProjectionIndexResult['status'],
  document: ProductSearchDocument | undefined,
  warnings: string[]
): CatalogProductProjectionIndexResult {
  return {
    productId,
    status,
    document: document ? cloneProductDocument(document) : undefined,
    searchIndexTruth: false,
    productTruthMutated: false,
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    rankingFinal: false,
    warnings: [...warnings, 'SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH', 'M8_RANKING_NOT_IN_SCOPE']
  };
}
