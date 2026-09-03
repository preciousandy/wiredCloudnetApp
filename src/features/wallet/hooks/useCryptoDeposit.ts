import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '@/api/services';
import { toApiError, type ApiError } from '@/api/errors';
import { newIdempotencyKey } from '@/lib/idempotency';
import { toast } from '@/store/toast';
import type { Money } from '@/lib/money';
import type { CryptoDeposit } from '@/api/schemas/payments';

const POLL_MS = 2000;

export function useCryptoNetworks() {
  return useQuery({
    queryKey: ['wallet', 'crypto', 'networks'],
    queryFn: () => paymentsService.cryptoNetworks(),
    staleTime: 10 * 60_000,
  });
}

/**
 * One crypto top up, start to finish.
 *
 * Polls rather than assuming: a chain confirms on its own schedule, and telling
 * someone their money has landed before it has is the worst thing a wallet can do.
 */
export function useCryptoDeposit() {
  const [deposit, setDeposit] = useState<CryptoDeposit | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [creating, setCreating] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const create = useCallback(
    async (amount: Money, networkId: string) => {
      setError(null);
      setCreating(true);

      // Retrying must return the same address, never issue a second one.
      idempotencyKey.current ??= newIdempotencyKey();

      try {
        const created = await paymentsService.createCryptoDeposit(
          amount,
          networkId,
          idempotencyKey.current,
        );
        setDeposit(created);

        stop();
        timer.current = setInterval(async () => {
          try {
            const next = await paymentsService.cryptoStatus(created.depositId);
            setDeposit(next);

            if (next.status === 'completed' || next.status === 'underpaid') {
              stop();
              await queryClient.invalidateQueries({ queryKey: ['wallet'] });
              await queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
              toast.success(
                next.status === 'underpaid'
                  ? 'Received less than expected, credited what arrived'
                  : 'Crypto received, wallet topped up',
              );
            }

            if (next.status === 'expired') {
              stop();
              toast.error('This deposit address expired');
            }
          } catch {
            /* a failed poll is not a failed deposit; keep waiting */
          }
        }, POLL_MS);
      } catch (cause) {
        setError(toApiError(cause));
      } finally {
        setCreating(false);
      }
    },
    [stop, queryClient],
  );

  const reset = useCallback(() => {
    stop();
    idempotencyKey.current = null;
    setDeposit(null);
    setError(null);
  }, [stop]);

  return { deposit, error, creating, create, reset };
}
