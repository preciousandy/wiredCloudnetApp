import { z } from 'zod';
import { apiConfig } from './config';
import { ApiError, isErrorCode, messageForCode, type ErrorCode } from './errors';
import { STORAGE_KEYS, secureStorage } from '@/lib/storage';

/**
 * The transport layer. Nothing above this knows about HTTP.
 *
 * Responsibilities:
 *   - attach auth
 *   - carry idempotency keys
 *   - normalise every failure into ApiError
 *   - validate every response against a zod schema before it reaches the app
 *
 * The validation step matters more than it looks: without it, a backend shape
 * change surfaces as `undefined is not an object` three screens deep. With it,
 * we get CONTRACT_VIOLATION at the boundary, naming the exact field.
 */

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestOptions<TResponse> {
  method?: Method;
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  schema: z.ZodType<TResponse>;
  /** Required on any request that moves money. */
  idempotencyKey?: string;
  auth?: boolean;
  signal?: AbortSignal;
  /** Suppress DEV console warning for 404s when frontend handles graceful fallback */
  silent404?: boolean;
  _isRetry?: boolean;
}

let refreshHandler: (() => Promise<boolean>) | null = null;

/** Registered by the session store so the client can refresh without a cycle. */
export function registerRefreshHandler(handler: () => Promise<boolean>): void {
  refreshHandler = handler;
}

function buildUrl(path: string, query?: RequestOptions<unknown>['query']): string {
  const base = apiConfig.baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Avoid duplicate /api if both base and path have it
  const url = cleanPath.startsWith('/api/') && base.endsWith('/api')
    ? `${base.slice(0, -4)}${cleanPath}`
    : `${base}${cleanPath}`;

  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

const errorEnvelope = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string().optional(),
    details: z.record(z.unknown()).optional(),
    retryAfter: z.number().optional(),
  }),
});

interface LaravelErrorPayload {
  status?: string;
  message?: string;
  errors?: Record<string, string[] | string>;
  retryAfter?: number;
}

async function parseError(response: Response): Promise<ApiError> {
  // Handle HTTP 429 Rate Limiting explicitly
  if (response.status === 429) {
    const retryHeader = response.headers.get('Retry-After');
    let retryAfter = retryHeader ? parseInt(retryHeader, 10) : 60;
    if (isNaN(retryAfter) || retryAfter <= 0) retryAfter = 60;

    let message = `Too many login attempts. Please try again in ${retryAfter} seconds.`;

    try {
      const payload = await response.json();
      if (payload && typeof payload === 'object') {
        const p = payload as { message?: string; error?: { message?: string; retryAfter?: number }; retryAfter?: number };
        if (p.error?.retryAfter) retryAfter = p.error.retryAfter;
        if (p.retryAfter) retryAfter = p.retryAfter;
        if (p.error?.message) message = p.error.message;
        else if (p.message && !p.message.includes('ThrottleRequestsException')) message = p.message;
      }
    } catch {
      // ignore
    }

    return new ApiError({
      code: 'RATE_LIMITED',
      message,
      status: 429,
      retryAfterSeconds: retryAfter,
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    const code = statusToCode(response.status);
    return new ApiError({
      code,
      message: messageForCode(code),
      status: response.status,
    });
  }

  // 1. Try standard errorEnvelope { error: { code, message, ... } }
  const parsedEnvelope = errorEnvelope.safeParse(payload);
  if (parsedEnvelope.success) {
    const { code, message, details, retryAfter } = parsedEnvelope.data.error;
    const normalisedCode: ErrorCode = code && isErrorCode(code) ? code : statusToCode(response.status);
    return new ApiError({
      code: normalisedCode,
      message: message || messageForCode(normalisedCode),
      status: response.status,
      details,
      retryAfterSeconds: retryAfter,
    });
  }

  // 2. Try Laravel style { status: 'error', message: '...', errors: { ... } }
  if (payload && typeof payload === 'object') {
    const laravel = payload as LaravelErrorPayload;
    let message = laravel.message;
    let details: Record<string, unknown> | undefined;

    if (laravel.errors && typeof laravel.errors === 'object') {
      details = laravel.errors as Record<string, unknown>;
      // Extract the first error message from field validation
      const firstField = Object.keys(laravel.errors)[0];
      if (firstField) {
        const fieldVal = laravel.errors[firstField];
        const firstMessage = Array.isArray(fieldVal) ? fieldVal[0] : fieldVal;
        if (typeof firstMessage === 'string' && firstMessage.trim().length > 0) {
          message = firstMessage;
        }
      }
    }

    const code = statusToCode(response.status);
    return new ApiError({
      code,
      message: message || messageForCode(code),
      status: response.status,
      details,
      retryAfterSeconds: laravel.retryAfter,
    });
  }

  const fallbackCode = statusToCode(response.status);
  return new ApiError({
    code: fallbackCode,
    message: messageForCode(fallbackCode),
    status: response.status,
  });
}


function statusToCode(status: number): ErrorCode {
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 422) return 'VALIDATION_FAILED';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER_ERROR';
  return 'SERVER_ERROR';
}

export async function request<TResponse>(options: RequestOptions<TResponse>): Promise<TResponse> {
  const { method = 'GET', path, body, query, schema, idempotencyKey, auth = true, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  if (auth) {
    const token = await secureStorage.get(STORAGE_KEYS.accessToken);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      throw new ApiError({
        code: 'UNAUTHENTICATED',
        message: messageForCode('UNAUTHENTICATED'),
        status: 401,
      });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  const fullUrl = buildUrl(path, query);
  if (__DEV__) {
    console.log(`[API ${method}] -> ${fullUrl}`, body ? JSON.stringify(body) : '');
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (__DEV__ && !(options.silent404 && response.status === 404)) {
      console.log(`[API ${method}] <- ${fullUrl} [Status: ${response.status}]`);
    }
  } catch (cause) {
    if (__DEV__) {
      console.warn(`[API Network Error] ${fullUrl}`, cause);
    }
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: messageForCode('NETWORK_ERROR'),
      details: { cause: String(cause) },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 && auth && refreshHandler && !options._isRetry) {
    const refreshed = await refreshHandler();
    if (refreshed) {
      return request({ ...options, auth: true, _isRetry: true });
    }
  }

  if (!response.ok) {
    const error = await parseError(response);
    if (__DEV__ && !(options.silent404 && response.status === 404) && response.status !== 401) {
      console.warn(`[API Error] ${fullUrl}`, error.message, error.details);
    }
    throw error;
  }


  if (response.status === 204) {
    return schema.parse(undefined);
  }

  const payload: unknown = await response.json();

  // Try direct schema validation
  let parsed = schema.safeParse(payload);

  // If failed, check if payload is wrapped in { status: 'success', data: ... } or { data: ... }
  if (!parsed.success && payload && typeof payload === 'object' && 'data' in payload) {
    const innerData = (payload as { data: unknown }).data;
    const unwrappedParsed = schema.safeParse(innerData);
    if (unwrappedParsed.success) {
      return unwrappedParsed.data;
    }
  }

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new ApiError({
      code: 'CONTRACT_VIOLATION',
      message: `Unexpected response from ${path}: ${firstIssue?.path.join('.') ?? 'unknown'}, ${
        firstIssue?.message ?? 'shape mismatch'
      }`,
      status: response.status,
      details: { issues: parsed.error.issues },
    });
  }

  return parsed.data;
}

