import {
  deleteProductSearchDocument,
  ensureProductSearchIndex,
  getFoundationProductDocuments,
  indexProductSearchDocuments,
  resolveSearchConfig,
  searchCandidates
} from './src';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function runMemoryValidation() {
  const memoryConfig = resolveSearchConfig({
    NODE_ENV: 'test',
    SEARCH_BACKEND: 'memory',
    OPENSEARCH_INDEX_PRODUCTS: 'hx_products_foundation_test'
  });

  const productRes = await searchCandidates({ query: 'valid', mode: 'GLOBAL' }, memoryConfig);
  assert(productRes.candidates.some(candidate => candidate.type === 'PRODUCT'), 'memory backend should return product candidates');
  assert(productRes.warnings?.includes('SEARCH_BACKEND_MEMORY_EXPLICIT'), 'memory backend warning should be explicit');
  assert(productRes.candidates.every(candidate => candidate.rankingFinal === false), 'search must not final-rank candidates');
  assert(productRes.candidates.every(candidate => candidate.searchTruth === false), 'search projection must not claim truth ownership');

  const hiddenRes = await searchCandidates({ query: 'hidden', mode: 'GLOBAL' }, memoryConfig);
  assert(hiddenRes.candidates.length === 0, 'hidden products must not appear in search');

  const discoverRes = await searchCandidates({ query: 'video', mode: 'DISCOVER' }, memoryConfig);
  assert(
    discoverRes.candidates.every(candidate => candidate.type === 'PRODUCT' && candidate.mediaType === 'VIDEO'),
    'discover candidate retrieval must stay limited to video product candidates'
  );

}

function runConfigValidation() {
  let failed = false;
  try {
    resolveSearchConfig({
      NODE_ENV: 'test',
      SEARCH_BACKEND: 'opensearch'
    });
  } catch {
    failed = true;
  }
  assert(failed, 'SEARCH_BACKEND=opensearch without OPENSEARCH_NODE must fail config validation');
}

async function runDegradedValidation() {
  const degradedConfig = resolveSearchConfig({
    NODE_ENV: 'test',
    SEARCH_BACKEND: 'opensearch',
    OPENSEARCH_NODE: 'http://127.0.0.1:9',
    OPENSEARCH_INDEX_PRODUCTS: 'hx_products_foundation_unreachable',
    SEARCH_ALLOW_DEGRADED_FALLBACK: 'true'
  });

  const res = await searchCandidates({ query: 'valid', mode: 'GLOBAL' }, degradedConfig);
  assert(res.candidates.some(candidate => candidate.type === 'PRODUCT'), 'degraded fallback should return explicit memory candidates');
  assert(res.warnings?.includes('SEARCH_DEGRADED_FALLBACK_USED'), 'degraded fallback warning should be explicit');
}

async function runOpenSearchValidationIfConfigured() {
  const envConfig = resolveSearchConfig();
  if (envConfig.SEARCH_BACKEND !== 'opensearch') {
    return 'SKIPPED_SEARCH_BACKEND_NOT_OPENSEARCH';
  }

  await ensureProductSearchIndex(envConfig);
  const documents = getFoundationProductDocuments().map(document => ({
    ...document,
    updatedAt: new Date().toISOString()
  }));
  await indexProductSearchDocuments(documents, envConfig);

  const res = await searchCandidates({ query: 'valid', mode: 'GLOBAL' }, envConfig);
  assert(res.candidates.some(candidate => candidate.type === 'PRODUCT' && candidate.productId === 'p_valid'), 'OpenSearch should return indexed product candidate');
  assert(res.warnings?.includes('SEARCH_BACKEND_OPENSEARCH'), 'OpenSearch response warning should be explicit');
  assert(res.candidates.every(candidate => candidate.rankingFinal === false), 'OpenSearch candidates must not be final-ranked');

  await deleteProductSearchDocument('p40_smoke_nonexistent', envConfig);
  return 'PASS';
}

async function main() {
  runConfigValidation();
  await runMemoryValidation();
  await runDegradedValidation();
  const opensearch = await runOpenSearchValidationIfConfigured();

  console.log(JSON.stringify({
    p40SearchFoundationSmoke: 'PASS',
    opensearchRuntime: opensearch
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
