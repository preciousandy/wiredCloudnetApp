import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { walletService } from '@/api/services';
import { ApiError, toApiError } from '@/api/errors';
import { newIdempotencyKey } from '@/lib/idempotency';
import { toast } from '@/store/toast';
import type { Money } from '@/lib/money';

export type DepositState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'pending'; depositId: string; reference: string }
  | { status: 'completed'; reference: string }
  | { status: 'failed'; error: ApiError };

export function usePaymentMethods(country?: string) {
  return useQuery({
    queryKey: ['wallet', 'methods', country],
    queryFn: () => walletService.methods(country),
    staleTime: 0,
  });
}

export function useDeposit() {
  const [state, setState] = useState<DepositState>({ status: 'idle' });
  const queryClient = useQueryClient();

  /**
   * One key per funding intent, reused across retries. Same discipline as a
   * purchase: a dropped response must never turn into two charges.
   */
  const idempotencyKey = useRef<string | null>(null);

  const refreshWallet = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
      ]),
    [queryClient],
  );

  const submit = useCallback(
    async (amount: Money, methodId: string, country?: string) => {
      idempotencyKey.current ??= newIdempotencyKey();
      setState({ status: 'submitting' });

      try {
        const intent = await walletService.deposit(amount, methodId, idempotencyKey.current, country);
        await refreshWallet();

        /**
         * Hosted checkout. The browser closes itself on redirect back to our
         * scheme; either way we fall through to polling, because the webhook,
         * not the browser, is what actually confirms a payment.
         */
        if (intent.checkoutUrl) {
          try {
            await WebBrowser.openAuthSessionAsync(intent.checkoutUrl, 'cloudnet://wallet/fund');
          } catch {
            /* user dismissed the browser; the deposit may still land */
          }
          await refreshWallet();
        }

        if (intent.status === 'pending') {
          setState({ status: 'pending', depositId: intent.depositId, reference: intent.reference });
          return;
        }
        idempotencyKey.current = null;
        setState({ status: 'completed', reference: intent.reference });
        toast.success('Wallet topped up');
      } catch (cause) {
        const error = toApiError(cause);
        setState({ status: 'failed', error });
        toast.error(error.message);
      }
    },
    [refreshWallet],
  );

  /**
   * Poll a pending deposit until the provider confirms. Real money moves on the
   * provider's clock, not ours, so the UI waits honestly rather than pretending.
   */
  const checkPending = useCallback(
    async (depositId: string) => {
      try {
        const intent = await walletService.depositStatus(depositId);
        if (intent.status === 'completed') {
          idempotencyKey.current = null;
          setState({ status: 'completed', reference: intent.reference });
          toast.success('Payment confirmed, balance updated');
          await refreshWallet();
        }
      } catch {
        /* keep waiting; a failed poll is not a failed deposit */
      }
    },
    [refreshWallet],
  );

  const reset = useCallback(() => {
    idempotencyKey.current = null;
    setState({ status: 'idle' });
  }, []);

  return { state, submit, checkPending, reset };
}
