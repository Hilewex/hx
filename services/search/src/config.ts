import { createServiceConfig, parseConfig } from '@hx/config';
import { z } from 'zod';

export type SearchBackend = 'memory' | 'opensearch';

export interface SearchServiceConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  SEARCH_BACKEND: SearchBackend;
  OPENSEARCH_NODE?: string;
  OPENSEARCH_INDEX_PRODUCTS: string;
  OPENSEARCH_USERNAME?: string;
  OPENSEARCH_PASSWORD?: string;
  SEARCH_ALLOW_DEGRADED_FALLBACK: boolean;
}

export const searchConfigSchema = createServiceConfig({
  SEARCH_BACKEND: z.enum(['memory', 'opensearch']).default('memory'),
  OPENSEARCH_NODE: z.string().url().optional(),
  OPENSEARCH_URL: z.string().url().optional(),
  OPENSEARCH_INDEX_PRODUCTS: z.string().min(1).default('hx_products_foundation'),
  OPENSEARCH_USERNAME: z.string().min(1).optional(),
  OPENSEARCH_PASSWORD: z.string().min(1).optional(),
  SEARCH_ALLOW_DEGRADED_FALLBACK: z.coerce.boolean().default(false)
}).superRefine((value, ctx) => {
  if (value.SEARCH_BACKEND === 'opensearch' && !value.OPENSEARCH_NODE && !value.OPENSEARCH_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OPENSEARCH_NODE'],
      message: 'OPENSEARCH_NODE is required when SEARCH_BACKEND=opensearch'
    });
  }
});

export function resolveSearchConfig(env?: Record<string, string | undefined>): SearchServiceConfig {
  const parsed = parseConfig(searchConfigSchema, env ?? process.env);
  return {
    ...parsed,
    OPENSEARCH_NODE: parsed.OPENSEARCH_NODE || parsed.OPENSEARCH_URL
  };
}
