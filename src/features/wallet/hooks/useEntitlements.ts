import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/api/services';

/** Everything the user owns. Drives the Library tab. */
export function useEntitlements() {
  return useQuery({
    queryKey: ['entitlements'],
    queryFn: () => walletService.entitlements(),
    staleTime: 30_000,
  });
}
