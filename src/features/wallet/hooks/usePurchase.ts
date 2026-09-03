import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/api/services';
import { ApiError, toApiError } from '@/api/errors';
import type { PurchaseResult } from '@/api/schemas/wallet';
import { newIdempotencyKey } from '@/lib/idempotency';
import { toast } from '@/store/toast';

/**
 * Purchase state machine.
 *
 * Purchase is NOT a boolean. PSP confirmation is asynchronous, so 'pending' is
 * a real state the UI must render honestly, telling a user they own something
 * before the money has settled is how support tickets and chargebacks start.
 *
 *   idle → confirming → pending → entitled
 *                     ↘ failed | insufficient_funds | already_entitled
 */
export type PurchaseState =
  | { status: 'idle' }
  | { status: 'confirming' }
  | { status: 'pending'; purchaseId: string }
  | { status: 'entitled'; result: PurchaseResult }
  | { status: 'insufficient_funds'; error: ApiError }
  | { status: 'already_entitled' }
  | { status: 'failed'; error: ApiError };

export function usePurchase(titleId: string) {
  const [state, setState] = useState<PurchaseState>({ status: 'idle' });
  const queryClient = useQueryClient();

  /**
   * The key is created once per purchase INTENT and reused across every retry.
   * Generating it per request would defeat idempotency entirely, which is the
   * whole reason a user on flaky mobile data cannot be charged twice.
   */
  const idempotencyKey = useRef<string | null>(null);

  const buy = useCallback(async () => {
    if (state.status === 'confirming') return;

    idempotencyKey.current ??= newIdempotencyKey();
    setState({ status: 'confirming' });

    try {
      const result = await walletService.purchase(titleId, idempotencyKey.current);

      if (result.status === 'pending') {
        setState({ status: 'pending', purchaseId: result.purchaseId });
        return;
      }

      if (result.status === 'failed') {
        setState({
          status: 'failed',
          error: new ApiError({ code: 'PAYMENT_FAILED', message: 'That payment did not go through.' }),
        });
        return;
      }

      setState({ status: 'entitled', result });
      toast.success('Purchase complete, it is in your library');

      // Balance is server truth, re-read rather than computing it locally.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['title', titleId] }),
        queryClient.invalidateQueries({ queryKey: ['entitlements'] }),
      ]);
    } catch (cause) {
      const error = toApiError(cause);

      if (error.code === 'INSUFFICIENT_FUNDS') {
        setState({ status: 'insufficient_funds', error });
        return;
      }
      if (error.code === 'ALREADY_ENTITLED') {
        setState({ status: 'already_entitled' });
        return;
      }
      setState({ status: 'failed', error });
    }
  }, [titleId, state.status, queryClient]);

  /** Only call once the purchase has reached a terminal state. */
  const reset = useCallback(() => {
    idempotencyKey.current = null;
    setState({ status: 'idle' });
  }, []);

  /** Retry keeps the same idempotency key, that is the point. */
  const retry = useCallback(() => {
    setState({ status: 'idle' });
    void buy();
  }, [buy]);

  return { state, buy, retry, reset };
}
