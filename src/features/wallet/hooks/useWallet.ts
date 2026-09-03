import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/api/services';

/** Wallet balance is never cached aggressively, money must look current. */
export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.get(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => walletService.transactions(),
    staleTime: 15_000,
  });
}
