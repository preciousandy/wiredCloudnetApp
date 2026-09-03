import * as Crypto from 'expo-crypto';

/**
 * Idempotency keys.
 *
 * Every request that moves money carries one. If the user double-taps, the
 * network drops mid-flight, or the app is backgrounded and the request retried,
 * the same key must reach the server so it charges exactly once.
 *
 * The key is generated when the user forms the INTENT to pay, not when the
 * request fires, otherwise a retry would generate a fresh key and defeat
 * the entire mechanism.
 */
export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}

/**
 * Holds a stable key across retries of one logical operation.
 * Call reset() only once the operation reaches a terminal state.
 */
export class IdempotencyScope {
  private key: string | null = null;

  current(): string {
    this.key ??= newIdempotencyKey();
    return this.key;
  }

  reset(): void {
    this.key = null;
  }
}
