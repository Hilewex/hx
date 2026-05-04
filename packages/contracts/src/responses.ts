export interface BaseResponse<T = unknown> {
  data: T | null;
  success: boolean;
  meta?: ResponseMeta;
  error?: ErrorResponse;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedData<T> {
  items: T[];
  nextCursor?: string | null;
  total?: number;
}

export interface PaginatedResponse<T> extends BaseResponse<PaginatedData<T>> {}
