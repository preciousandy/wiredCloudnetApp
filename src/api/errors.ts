/**
 * Error taxonomy, mirrors the codes agreed in cloudnet-api-contract.md.
 * UI switches on `code`, never on `message`. Messages are for humans and
 * will be translated; codes are the stable contract.
 */

export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'TOKEN_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INSUFFICIENT_FUNDS',
  'ALREADY_ENTITLED',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  'RATE_LIMITED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'SERVER_ERROR',
  'NETWORK_ERROR',
  'CONTRACT_VIOLATION',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown>;
  readonly retryAfterSeconds?: number;

  constructor(params: {
    code: ErrorCode;
    message: string;
    status?: number;
    details?: Record<string, unknown>;
    retryAfterSeconds?: number;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status ?? 0;
    this.details = params.details ?? {};
    this.retryAfterSeconds = params.retryAfterSeconds;
  }

  /** Safe to retry automatically without user involvement. */
  get isRetryable(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'SERVER_ERROR';
  }

  /** Session is dead, the user must re-authenticate. */
  get isAuthFailure(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.code === 'TOKEN_EXPIRED';
  }
}

/**
 * Fallback copy. Screens should override with contextual wording where it
 * matters (a wallet screen can say more than a generic list can).
 */
const FALLBACK_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHENTICATED: 'Please sign in to continue.',
  TOKEN_EXPIRED: 'Your session expired. Please sign in again.',
  FORBIDDEN: 'You do not have access to this.',
  NOT_FOUND: 'We could not find that.',
  VALIDATION_FAILED: 'Please check the details and try again.',
  INSUFFICIENT_FUNDS: 'Your wallet balance is too low for this purchase.',
  ALREADY_ENTITLED: 'You already own this, it is in your library.',
  PAYMENT_PENDING: 'Your payment is still being confirmed.',
  PAYMENT_FAILED: 'That payment did not go through. You have not been charged.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment.',
  OTP_INVALID: 'That code is not correct.',
  OTP_EXPIRED: 'That code has expired. Request a new one.',
  SERVER_ERROR: 'Something went wrong on our side. Please try again.',
  NETWORK_ERROR: 'No connection. Check your network and try again.',
  CONTRACT_VIOLATION: 'The app received unexpected data. Please update the app.',
};

export function messageForCode(code: ErrorCode): string {
  return FALLBACK_MESSAGES[code];
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError({ code: 'NETWORK_ERROR', message: error.message });
  }
  return new ApiError({ code: 'SERVER_ERROR', message: messageForCode('SERVER_ERROR') });
}
