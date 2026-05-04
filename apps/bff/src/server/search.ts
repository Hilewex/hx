import { searchCandidates } from '@hx/search';
import { SearchMode, SearchSurface } from '@hx/contracts';
import * as response from './response';

const SEARCH_MODES: SearchMode[] = ['GLOBAL', 'DISCOVER', 'CATALOG', 'STOREFRONT'];
const SEARCH_SURFACES: SearchSurface[] = ['HOME', 'HEADER', 'DISCOVER', 'CATEGORY_PLP', 'STOREFRONT', 'MOBILE_OVERLAY'];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function handleSearch(context: any, queryParams: Record<string, string>) {
  const query = queryParams.q || queryParams.query || '';
  const modeInput = queryParams.mode?.toUpperCase();
  const surfaceInput = queryParams.surface?.toUpperCase();
  const mode = isSearchMode(modeInput) ? modeInput : 'GLOBAL';
  const surface = isSearchSurface(surfaceInput) ? surfaceInput : undefined;
  const storefrontId = queryParams.storefrontId;
  const categoryId = queryParams.categoryId;
  const limit = normalizeLimit(queryParams.limit);
  const warnings = [
    ...(modeInput && !isSearchMode(modeInput) ? ['SEARCH_MODE_DEFAULTED_TO_GLOBAL'] : []),
    ...(surfaceInput && !isSearchSurface(surfaceInput) ? ['SEARCH_SURFACE_IGNORED_INVALID'] : []),
    ...(queryParams.limit && limit === DEFAULT_LIMIT ? ['SEARCH_LIMIT_DEFAULTED_INVALID'] : [])
  ];
  
  const result = await searchCandidates({
    query,
    mode,
    surface,
    storefrontId,
    categoryId,
    limit
  });

  return response.ok({
    ...result,
    warnings: [...(result.warnings || []), ...warnings]
  });
}

function isSearchMode(value: string | undefined): value is SearchMode {
  return !!value && SEARCH_MODES.includes(value as SearchMode);
}

function isSearchSurface(value: string | undefined): value is SearchSurface {
  return !!value && SEARCH_SURFACES.includes(value as SearchSurface);
}

function normalizeLimit(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}
