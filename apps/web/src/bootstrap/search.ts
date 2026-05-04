import { SearchResponse, SearchCandidate, ProductSearchCandidate } from '@hx/contracts';
import { config } from '../config';

const BFF_URL = config.NEXT_PUBLIC_BFF_URL || 'http://localhost:3000';

async function fetchSearch(query: string, mode?: string): Promise<SearchResponse> {
  const url = mode 
    ? `/search?query=${encodeURIComponent(query)}&mode=${mode}`
    : `/search?query=${encodeURIComponent(query)}`;
    
  console.log(`[Simulation] GET ${url}`);
  const response = await fetch(`${BFF_URL}${url}`);
  return await response.json();
}

export async function simulateSearchFlow() {
  console.log('--- P26 Search Foundation Simulation Start ---');

  // 1. Empty query
  const emptyRes = await fetchSearch('');
  console.log('1. Empty Query Result:', emptyRes.emptyState?.code);
  if (emptyRes.emptyState?.code !== 'QUERY_REQUIRED') {
    throw new Error('Empty query should return QUERY_REQUIRED');
  }

  // 2. Global product search
  const productRes = await fetchSearch('valid', 'GLOBAL');
  console.log('2. Global Product Search Count:', productRes.candidates.length);
  const hasProduct = productRes.candidates.some(c => c.type === 'PRODUCT');
  if (!hasProduct) throw new Error('Global search should return product candidate');

  // 3. Category search
  const catRes = await fetchSearch('electronics', 'GLOBAL');
  console.log('3. Category Search Result:', catRes.candidates.map(c => c.type));
  const hasCategory = catRes.candidates.some(c => c.type === 'CATEGORY');
  if (!hasCategory) throw new Error('Global search for electronics should return category candidate');

  // 4. Storefront search
  const storeRes = await fetchSearch('hx store', 'GLOBAL');
  console.log('4. Storefront Search Result:', storeRes.candidates.map(c => c.type));
  const hasStore = storeRes.candidates.some(c => c.type === 'STOREFRONT');
  if (!hasStore) throw new Error('Global search for hx store should return storefront candidate');

  // 5. Discover search
  const discoverRes = await fetchSearch('video', 'DISCOVER');
  console.log('5. Discover Search Result (Types):', discoverRes.candidates.map(c => c.type));
  const onlyVideoProducts = discoverRes.candidates.every(c => 
    c.type === 'PRODUCT' && (c as ProductSearchCandidate).mediaType === 'VIDEO'
  );
  if (!onlyVideoProducts) throw new Error('Discover mode should only return video products');
  
  const hasStory = discoverRes.candidates.some(c => (c as any).type === 'STORY');
  if (hasStory) throw new Error('Discover search should NOT return story candidates');

  // 6. Catalog search
  const catalogRes = await fetchSearch('valid', 'CATALOG');
  console.log('6. Catalog Search Result:', catalogRes.candidates.map(c => c.type));
  const onlyProductOrCategory = catalogRes.candidates.every(c => 
    c.type === 'PRODUCT' || c.type === 'CATEGORY'
  );
  if (!onlyProductOrCategory) throw new Error('Catalog mode should return products or categories only');

  // 7. Hidden/unavailable visibility
  const hiddenRes = await fetchSearch('hidden', 'GLOBAL');
  console.log('7. Hidden Search Result Count:', hiddenRes.candidates.length);
  if (hiddenRes.candidates.length > 0) throw new Error('Hidden products should not appear in search');

  const unavailableRes = await fetchSearch('unavailable', 'GLOBAL');
  console.log('7. Unavailable Search Result Count:', unavailableRes.candidates.length);
  if (unavailableRes.candidates.length > 0) throw new Error('Unavailable products should not appear in search');

  // 8. M8 warning
  console.log('8. Response Warnings:', productRes.warnings);
  const hasM8Warning = productRes.warnings?.includes('M8_RANKING_NOT_IN_SCOPE');
  if (!hasM8Warning) throw new Error('Response should include M8_RANKING_NOT_IN_SCOPE warning');

  // Boundary check: No rankingFinal = true
  const allCandidates = [
    ...productRes.candidates,
    ...catRes.candidates,
    ...storeRes.candidates,
    ...discoverRes.candidates,
    ...catalogRes.candidates
  ];
  if (allCandidates.some(c => c.rankingFinal)) {
    throw new Error('P26 should not have rankingFinal=true candidates');
  }

  console.log('--- P26 Search Foundation Simulation PASS ---');
}
