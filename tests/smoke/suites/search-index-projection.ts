import {
  deleteCatalogProductProjection,
  indexCatalogProductProjection,
  searchCandidates,
  SearchServiceConfig
} from '@hx/search';
import { SmokeRunner, SmokeResult } from '../types';

const memoryConfig: SearchServiceConfig = {
  NODE_ENV: 'test',
  PORT: 0,
  LOG_LEVEL: 'error',
  SEARCH_BACKEND: 'memory',
  OPENSEARCH_INDEX_PRODUCTS: 'hx_products_foundation',
  SEARCH_ALLOW_DEGRADED_FALLBACK: false
};

async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function assertProjectionBoundary(value: any, label: string): SmokeResult | undefined {
  if (
    value.searchIndexTruth !== false ||
    value.productTruthMutated !== false ||
    value.priceTruth !== false ||
    value.stockTruth !== false ||
    value.mediaTruth !== false ||
    value.rankingFinal !== false
  ) {
    return { result: 'FAIL', message: `${label} missing projection boundary flags` };
  }
  if ('projectionTruth' in value && value.projectionTruth !== false) {
    return { result: 'FAIL', message: `${label} exposed projection as truth` };
  }
  return undefined;
}

function assertNoBlockedCandidateLeak(candidates: any[], label: string): SmokeResult | undefined {
  const blockedIds = ['p_hidden', 'p_unavailable', 'p_suspended', 'p_archived'];
  if (candidates.some(candidate => candidate.type === 'PRODUCT' && blockedIds.includes(candidate.productId))) {
    return { result: 'FAIL', message: `${label} leaked hidden/unavailable/suspended/archived candidate` };
  }
  return undefined;
}

export const searchIndexProjectionSmoke: SmokeRunner = {
  name: 'search-index-projection',
  run: async (baseUrl: string) => {
    try {
      await deleteCatalogProductProjection('p_valid', memoryConfig);
      const activeIndex = await indexCatalogProductProjection('p_valid', memoryConfig);
      if (activeIndex.status !== 'INDEXED' || !activeIndex.document) {
        return { result: 'FAIL', message: 'Active catalog projection was not indexed' };
      }
      if (activeIndex.document.sourceOwner !== 'CATALOG_READ_PROJECTION') {
        return { result: 'FAIL', message: 'Search document source owner is not catalog read projection' };
      }
      if (activeIndex.document.visible !== true || activeIndex.document.status !== 'ACTIVE') {
        return { result: 'FAIL', message: 'Active catalog projection did not map to indexable document' };
      }
      let boundaryFailure = assertProjectionBoundary(activeIndex.document, 'active index document');
      if (boundaryFailure) return boundaryFailure;
      boundaryFailure = assertProjectionBoundary(activeIndex, 'active index result');
      if (boundaryFailure) return boundaryFailure;

      const activeSearch = await searchCandidates({ query: 'valid product', mode: 'GLOBAL', limit: 10 }, memoryConfig);
      const activeCandidate = activeSearch.candidates.find(
        candidate => candidate.type === 'PRODUCT' && candidate.productId === 'p_valid'
      );
      if (!activeCandidate) {
        return { result: 'FAIL', message: 'Indexed active projection did not become a search candidate' };
      }
      boundaryFailure = assertProjectionBoundary(activeCandidate, 'active candidate');
      if (boundaryFailure) return boundaryFailure;
      if (activeCandidate.searchTruth !== false || activeCandidate.rankingFinal !== false) {
        return { result: 'FAIL', message: 'Active candidate violated search/ranking boundary' };
      }

      const blockedIds = ['p_hidden', 'p_unavailable', 'p_suspended', 'p_archived'];
      for (const productId of blockedIds) {
        const result = await indexCatalogProductProjection(productId, memoryConfig);
        if (result.status !== 'DEACTIVATED') {
          return { result: 'FAIL', message: `${productId} should deactivate instead of indexing` };
        }
        boundaryFailure = assertProjectionBoundary(result, `${productId} index result`);
        if (boundaryFailure) return boundaryFailure;
      }

      for (const query of ['hidden product', 'unavailable product', 'suspended product', 'archived product']) {
        const result = await searchCandidates({ query, mode: 'GLOBAL', limit: 10 }, memoryConfig);
        const leakFailure = assertNoBlockedCandidateLeak(result.candidates, query);
        if (leakFailure) return leakFailure;
      }

      const bffRes = await fetch(`${baseUrl}/search?q=product&mode=GLOBAL&limit=10`);
      const bffBody = await readJson(bffRes);
      if (!bffRes.ok) {
        return { result: 'FAIL', message: `BFF search regression failed: ${bffRes.status}` };
      }
      const bffCandidates = bffBody.data?.candidates || [];
      if (!bffCandidates.some((candidate: any) => candidate.type === 'PRODUCT' && candidate.productId === 'p_valid')) {
        return { result: 'FAIL', message: 'BFF search regression lost active product candidate' };
      }
      const bffLeakFailure = assertNoBlockedCandidateLeak(bffCandidates, 'BFF search regression');
      if (bffLeakFailure) return bffLeakFailure;
      for (const candidate of bffCandidates.filter((item: any) => item.type === 'PRODUCT')) {
        boundaryFailure = assertProjectionBoundary(candidate, 'BFF product candidate');
        if (boundaryFailure) return boundaryFailure;
        if (candidate.searchTruth !== false) {
          return { result: 'FAIL', message: 'BFF product candidate exposed search truth' };
        }
      }

      return {
        result: 'PASS',
        message: 'Search index projection helpers and candidate boundaries verified'
      };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
