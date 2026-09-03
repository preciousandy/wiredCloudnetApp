import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/api/services';

/**
 * The home feed. Composed server-side, so adding or reordering a row is a
 * backend change rather than an app release.
 */
export function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => catalogService.home(),
    staleTime: 60_000,
  });
}
