export type ApiErrorCategory =
  | 'transport'
  | 'auth'
  | 'permission'
  | 'ownership'
  | 'eligibility'
  | 'validation'
  | 'contract'
  | 'state_transition'
  | 'idempotency'
  | 'business_rule'
  | 'processing'
  | 'finance'
  | 'moderation'
  | 'risk'
  | 'system'
  | 'unknown_result';

export interface ApiError {
  code: string;
  message: string;
  category: ApiErrorCategory;
  retryable?: boolean;
  details?: Record<string, unknown>;
  correlationId?: string;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
  warnings?: string[];
}

export interface ApiErrorEnvelope {
  errors: ApiError[];
  meta?: Record<string, unknown>;
  warnings?: string[];
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
