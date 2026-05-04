import { ApiErrorCategory, ApiErrorEnvelope, ApiSuccessEnvelope } from '@hx/contracts';

export interface BffResponse {
  status: number;
  body: any;
}

export function ok<T>(data: T, meta?: Record<string, unknown>): BffResponse {
  const body: ApiSuccessEnvelope<T> = { data, meta };
  return { status: 200, body };
}

export function created<T>(data: T, meta?: Record<string, unknown>): BffResponse {
  const body: ApiSuccessEnvelope<T> = { data, meta };
  return { status: 201, body };
}

export function badRequest(code: string, message: string, details?: Record<string, unknown>): BffResponse {
  return errorResponse(400, code, message, 'validation', details);
}

export function notFound(code: string, message: string, details?: Record<string, unknown>): BffResponse {
  return errorResponse(404, code, message, 'transport', details);
}

export function conflict(code: string, message: string, details?: Record<string, unknown>): BffResponse {
  return errorResponse(409, code, message, 'state_transition', details);
}

export function unprocessable(code: string, message: string, details?: Record<string, unknown>): BffResponse {
  return errorResponse(422, code, message, 'business_rule', details);
}

export function forbidden(code: string, message: string, details?: Record<string, unknown>): BffResponse {
  return errorResponse(403, code, message, 'permission', details);
}

export function unauthorized(code: string, message: string, details?: Record<string, unknown>): BffResponse {
  return errorResponse(401, code, message, 'auth', details);
}

/**
 * Safe internal error that doesn't leak raw exception messages
 */
export function internalError(code = 'INTERNAL_ERROR', message = 'An unexpected error occurred'): BffResponse {
  return errorResponse(500, code, message, 'system');
}

export function isNotFoundError(error: any): boolean {
  if (!error) return false;
  const message = (error.message || String(error)).toLowerCase();
  return message.includes('not found') || message.includes('not_found');
}

export function domainError(
  status: number,
  code: string,
  message: string,
  category: ApiErrorCategory,
  details?: Record<string, unknown>
): BffResponse {
  return errorResponse(status, code, message, category, details);
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  category: ApiErrorCategory,
  details?: Record<string, unknown>
): BffResponse {
  const body: ApiErrorEnvelope = {
    errors: [
      {
        code,
        message,
        category,
        details,
      },
    ],
  };
  return { status, body };
}

/**
 * Common mutation result to BFF response mapping
 */
export function fromMutationResult(result: any, options: { successStatus?: number } = {}): BffResponse {
  if (!result) {
    return internalError('EMPTY_RESULT', 'Service returned no result');
  }

  if (result.success) {
    return {
      status: options.successStatus || 200,
      body: { data: result.data || result.id || result } as ApiSuccessEnvelope<any>
    };
  }

  // Map common domain errors if possible, otherwise unprocessable
  const status = result.errorCategory === 'validation' ? 400 : 422;
  return domainError(
    status,
    result.errorCode || 'DOMAIN_ERROR',
    result.errorMessage || 'Domain operation failed',
    result.errorCategory || 'business_rule',
    result.errorDetails
  );
}
