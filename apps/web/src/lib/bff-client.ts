export type HttpMethod = 'GET' | 'POST';

export interface BffClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  headers?: HeadersInit;
}

export interface BffSuccess<T> {
  ok: true;
  status: number;
  data: T;
}

export interface BffFailure {
  ok: false;
  status?: number;
  error: {
    code: string;
    message: string;
  };
}

export type BffResponse<T> = BffSuccess<T> | BffFailure;

const defaultTimeoutMs = 8000;

export class BffClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly headers?: HeadersInit;

  constructor(config: BffClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? process.env.NEXT_PUBLIC_BFF_BASE_URL ?? '/api/bff';
    this.timeoutMs = config.timeoutMs ?? defaultTimeoutMs;
    this.headers = config.headers;
  }

  get<T>(path: string, init?: RequestInit): Promise<BffResponse<T>> {
    return this.request<T>('GET', path, undefined, init);
  }

  post<TRequest, TResponse>(path: string, body: TRequest, init?: RequestInit): Promise<BffResponse<TResponse>> {
    return this.request<TResponse>('POST', path, body, init);
  }

  private async request<T>(method: HttpMethod, path: string, body?: unknown, init: RequestInit = {}): Promise<BffResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.resolveUrl(path), {
        ...init,
        method,
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...this.headers,
          ...init.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: init.signal ?? controller.signal,
      });

      const payload = await this.parseJson<T>(response);

      if (!response.ok) {
        const normalizedError = normalizeBffPayloadError(payload);
        return {
          ok: false,
          status: response.status,
          error: normalizedError ?? {
            code: `HTTP_${response.status}`,
            message: 'BFF request failed.',
          },
        };
      }

      return {
        ok: true,
        status: response.status,
        data: payload,
      };
    } catch (error) {
      return {
        ok: false,
        error: normalizeTransportError(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveUrl(path: string): string {
    if (/^https?:\/\//.test(path)) {
      return path;
    }

    const normalizedBase = this.baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  private async parseJson<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }
}

export function createBffClient(config?: BffClientConfig): BffClient {
  return new BffClient(config);
}

export function normalizeTransportError(error: unknown): BffFailure['error'] {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: 'BFF_TIMEOUT',
      message: 'BFF request timed out.',
    };
  }

  if (error instanceof Error) {
    return {
      code: 'BFF_TRANSPORT_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'BFF_UNKNOWN_ERROR',
    message: 'Unknown BFF transport error.',
  };
}

function normalizeBffPayloadError(payload: unknown): BffFailure['error'] | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  if ('errors' in payload && Array.isArray((payload as { errors?: unknown }).errors)) {
    const [firstError] = (payload as { errors: unknown[] }).errors;
    if (firstError && typeof firstError === 'object') {
      const code = 'code' in firstError ? (firstError as { code?: unknown }).code : undefined;
      const message = 'message' in firstError ? (firstError as { message?: unknown }).message : undefined;
      if (typeof code === 'string' && typeof message === 'string') {
        return { code, message };
      }
    }
  }

  const maybeError = 'error' in payload ? (payload as { error?: unknown }).error : payload;
  if (!maybeError || typeof maybeError !== 'object') {
    return undefined;
  }

  const code = 'code' in maybeError ? (maybeError as { code?: unknown }).code : undefined;
  const message = 'message' in maybeError ? (maybeError as { message?: unknown }).message : undefined;

  if (typeof code !== 'string' || typeof message !== 'string') {
    return undefined;
  }

  return { code, message };
}
