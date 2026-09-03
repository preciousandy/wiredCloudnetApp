import { ApiError, messageForCode, type ErrorCode } from '../errors';

/**
 * Mock realism controls.
 *
 * A mock that always succeeds instantly teaches us nothing. These knobs let us
 * develop against the conditions our users actually have: slow Nigerian mobile
 * data, dropped requests, and pending PSP confirmations.
 */
export const mockSettings = {
  minLatencyMs: 220,
  maxLatencyMs: 700,
  /** 0 to 1. Set above 0 to exercise error paths during development. */
  failureRate: 0,
  /** Share of deposits that resolve asynchronously rather than instantly. */
  pendingDepositRate: 0.3,
};

export async function delay(): Promise<void> {
  const { minLatencyMs, maxLatencyMs } = mockSettings;
  const ms = minLatencyMs + Math.random() * (maxLatencyMs - minLatencyMs);
  await new Promise((resolve) => setTimeout(resolve, ms));

  if (mockSettings.failureRate > 0 && Math.random() < mockSettings.failureRate) {
    throw fail('NETWORK_ERROR');
  }
}

export function fail(code: ErrorCode, details?: Record<string, unknown>): ApiError {
  return new ApiError({ code, message: messageForCode(code), details });
}

export function nowIso(): string {
  return new Date().toISOString();
}

let counter = 1000;
export function id(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}

export function reference(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `CN-${year}-${seq}`;
}

/**
 * Slice a fixture array into cursor pages.
 *
 * The mock paginates for real so the infinite scroll path is exercised in
 * development rather than discovered in production the day the catalogue grows.
 */
export function paginate<T>(items: T[], cursor: string | undefined, pageSize = 8) {
  const start = cursor ? Number(cursor) : 0;
  const safeStart = Number.isFinite(start) && start >= 0 ? start : 0;
  const slice = items.slice(safeStart, safeStart + pageSize);
  const next = safeStart + pageSize;
  return {
    items: slice,
    nextCursor: next < items.length ? String(next) : null,
  };
}
