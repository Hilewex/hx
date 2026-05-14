import type { BffFailure } from '../bff-client';

export interface NormalizedBffError {
  code: string;
  message: string;
  status?: number;
  retryable: boolean;
}

export class BffReadError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(error: NormalizedBffError) {
    super(error.message);
    this.name = 'BffReadError';
    this.code = error.code;
    this.status = error.status;
    this.retryable = error.retryable;
  }
}

export function normalizeBffFailure(failure: BffFailure): NormalizedBffError {
  return {
    code: failure.error.code,
    message: failure.error.message,
    status: failure.status,
    retryable: isRetryableBffFailure(failure),
  };
}

export function toBffReadError(failure: BffFailure): BffReadError {
  return new BffReadError(normalizeBffFailure(failure));
}

export function isRetryableBffFailure(failure: BffFailure): boolean {
  if (!failure.status) {
    return true;
  }

  return failure.status === 408 || failure.status === 429 || failure.status >= 500;
}
