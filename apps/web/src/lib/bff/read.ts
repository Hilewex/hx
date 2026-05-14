import { createBffClient, type BffClientConfig } from '../bff-client';
import type { PublicProjectionEnvelope, PublicProjectionTransportStatus } from '@hx/contracts';
import { normalizeBffFailure, toBffReadError, type NormalizedBffError } from './errors';

const bff = createBffClient();

export async function readBffProjection<T>(path: string, config?: BffClientConfig): Promise<T> {
  const client = config ? createBffClient(config) : bff;
  const response = await client.get<T>(path, { cache: 'no-store' });

  if (!response.ok) {
    throw toBffReadError(response);
  }

  return unwrapBffData<T>(response.data);
}

export async function readBffProjectionState<T>(
  path: string,
  config?: BffClientConfig,
): Promise<PublicProjectionEnvelope<T>> {
  const client = config ? createBffClient(config) : bff;
  const response = await client.get<T>(path, { cache: 'no-store' });

  if (!response.ok) {
    const error = normalizeBffFailure(response);
    return {
      transport: {
        status: toTransportStatus(error),
        retryable: error.retryable,
        error,
      },
    };
  }

  const data = unwrapBffData<T>(response.data);
  const warnings = extractWarnings(data);

  return {
    data,
    transport: {
      status: isEmptyPayload(data) ? 'empty' : warnings.length > 0 ? 'degraded' : 'available',
      retryable: false,
      warnings,
    },
  };
}

function unwrapBffData<T>(payload: T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload;
}

function extractWarnings(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || !('warnings' in payload)) {
    return [];
  }

  const warnings = (payload as { warnings?: unknown }).warnings;
  return Array.isArray(warnings) ? warnings.filter((warning): warning is string => typeof warning === 'string') : [];
}

function isEmptyPayload(payload: unknown): boolean {
  if (!payload) {
    return true;
  }

  if (typeof payload !== 'object') {
    return false;
  }

  if ('emptyState' in payload && (payload as { emptyState?: unknown }).emptyState) {
    return true;
  }

  const listKeys = ['items', 'candidates', 'productCards', 'products'];
  return listKeys.some((key) => {
    const value = (payload as Record<string, unknown>)[key];
    return Array.isArray(value) && value.length === 0;
  });
}

function toTransportStatus(error: NormalizedBffError): PublicProjectionTransportStatus {
  if (error.code === 'BFF_TIMEOUT') {
    return 'timeout';
  }

  if (!error.status || error.status >= 500) {
    return 'unavailable';
  }

  return 'error';
}
