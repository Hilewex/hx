import { SearchMode } from '@hx/contracts';
import { ProductSearchDocument } from './document';

export interface OpenSearchClientConfig {
  node: string;
  username?: string;
  password?: string;
  indexProducts: string;
}

export interface OpenSearchProductSearchInput {
  query: string;
  mode: SearchMode;
  limit: number;
  storefrontId?: string;
  categoryId?: string;
}

export interface OpenSearchProductSearchResult {
  documents: Array<{ document: ProductSearchDocument; scoreFoundationOnly: number }>;
  facets: Record<string, Array<{ value: string; count: number }>>;
}

export class OpenSearchFoundationClient {
  constructor(private readonly config: OpenSearchClientConfig) {}

  async ensureProductIndex(): Promise<void> {
    const exists = await this.request('HEAD', `/${encodeURIComponent(this.config.indexProducts)}`);
    if (exists.status === 200) return;
    if (exists.status !== 404) {
      throw new Error(`OPENSEARCH_INDEX_CHECK_FAILED_${exists.status}`);
    }

    const create = await this.request('PUT', `/${encodeURIComponent(this.config.indexProducts)}`, {
      mappings: {
        properties: {
          productId: { type: 'keyword' },
          variantId: { type: 'keyword' },
          slug: { type: 'keyword' },
          name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          title: { type: 'text' },
          brand: { type: 'keyword' },
          categoryIds: { type: 'keyword' },
          categorySlugs: { type: 'keyword' },
          storefrontId: { type: 'keyword' },
          storefrontSlug: { type: 'keyword' },
          creatorId: { type: 'keyword' },
          status: { type: 'keyword' },
          visible: { type: 'boolean' },
          mediaType: { type: 'keyword' },
          priceMin: { type: 'double' },
          priceMax: { type: 'double' },
          facetValues: { type: 'object', enabled: true },
          sourceOwner: { type: 'keyword' },
          projectionTruth: { type: 'boolean' },
          searchIndexTruth: { type: 'boolean' },
          productTruthMutated: { type: 'boolean' },
          priceTruth: { type: 'boolean' },
          stockTruth: { type: 'boolean' },
          mediaTruth: { type: 'boolean' },
          rankingFinal: { type: 'boolean' },
          updatedAt: { type: 'date' }
        }
      }
    });
    if (create.status < 200 || create.status >= 300) {
      throw new Error(`OPENSEARCH_INDEX_CREATE_FAILED_${create.status}`);
    }
  }

  async indexProduct(document: ProductSearchDocument): Promise<void> {
    await this.ensureProductIndex();
    const response = await this.request(
      'PUT',
      `/${encodeURIComponent(this.config.indexProducts)}/_doc/${encodeURIComponent(document.productId)}?refresh=true`,
      document
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OPENSEARCH_INDEX_PRODUCT_FAILED_${response.status}`);
    }
  }

  async indexProducts(documents: ProductSearchDocument[]): Promise<void> {
    if (documents.length === 0) return;
    await this.ensureProductIndex();
    const body = documents
      .flatMap(document => [
        JSON.stringify({ index: { _index: this.config.indexProducts, _id: document.productId } }),
        JSON.stringify(document)
      ])
      .join('\n') + '\n';
    const response = await this.requestText('POST', '/_bulk?refresh=true', body);
    if (response.status < 200 || response.status >= 300 || response.body?.errors) {
      throw new Error(`OPENSEARCH_BULK_INDEX_FAILED_${response.status}`);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    const response = await this.request(
      'DELETE',
      `/${encodeURIComponent(this.config.indexProducts)}/_doc/${encodeURIComponent(productId)}`
    );
    if (![200, 202, 404].includes(response.status)) {
      throw new Error(`OPENSEARCH_DELETE_PRODUCT_FAILED_${response.status}`);
    }
  }

  async deactivateProduct(productId: string, updatedAt: string = new Date().toISOString()): Promise<void> {
    const response = await this.request(
      'POST',
      `/${encodeURIComponent(this.config.indexProducts)}/_update/${encodeURIComponent(productId)}`,
      { doc: { status: 'UNAVAILABLE', visible: false, updatedAt } }
    );
    if (![200, 201, 202, 404].includes(response.status)) {
      throw new Error(`OPENSEARCH_DEACTIVATE_PRODUCT_FAILED_${response.status}`);
    }
  }

  async searchProducts(input: OpenSearchProductSearchInput): Promise<OpenSearchProductSearchResult> {
    await this.ensureProductIndex();
    const filters: unknown[] = [
      { term: { visible: true } },
      { term: { status: 'ACTIVE' } }
    ];

    if (input.mode === 'DISCOVER') filters.push({ term: { mediaType: 'VIDEO' } });
    if (input.mode === 'STOREFRONT' && input.storefrontId) filters.push({ term: { storefrontId: input.storefrontId } });
    if (input.categoryId) filters.push({ term: { categoryIds: input.categoryId } });

    const response = await this.request('POST', `/${encodeURIComponent(this.config.indexProducts)}/_search`, {
      size: input.limit,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: input.query,
                fields: ['name^2', 'title^2', 'slug', 'brand', 'categorySlugs', 'storefrontSlug'],
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: filters
        }
      },
      aggs: {
        categories: { terms: { field: 'categoryIds', size: 20 } },
        brands: { terms: { field: 'brand', size: 20 } },
        mediaTypes: { terms: { field: 'mediaType', size: 10 } }
      }
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OPENSEARCH_SEARCH_FAILED_${response.status}`);
    }

    const hits = response.body?.hits?.hits || [];
    const facets = response.body?.aggregations || {};
    return {
      documents: hits.map((hit: any) => ({
        document: hit._source as ProductSearchDocument,
        scoreFoundationOnly: typeof hit._score === 'number' ? hit._score : 0
      })),
      facets: {
        categoryIds: this.toFacetBuckets(facets.categories),
        brand: this.toFacetBuckets(facets.brands),
        mediaType: this.toFacetBuckets(facets.mediaTypes)
      }
    };
  }

  private toFacetBuckets(aggregation: any): Array<{ value: string; count: number }> {
    return (aggregation?.buckets || []).map((bucket: any) => ({
      value: String(bucket.key),
      count: Number(bucket.doc_count || 0)
    }));
  }

  private async request(method: string, path: string, body?: unknown): Promise<{ status: number; body?: any }> {
    const response = await fetch(`${this.config.node}${path}`, {
      method,
      headers: this.headers('application/json'),
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await this.safeJson(response) };
  }

  private async requestText(method: string, path: string, body: string): Promise<{ status: number; body?: any }> {
    const response = await fetch(`${this.config.node}${path}`, {
      method,
      headers: this.headers('application/x-ndjson'),
      body
    });
    return { status: response.status, body: await this.safeJson(response) };
  }

  private headers(contentType: string): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': contentType };
    if (this.config.username && this.config.password) {
      headers.Authorization = `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`;
    }
    return headers;
  }

  private async safeJson(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }
}
