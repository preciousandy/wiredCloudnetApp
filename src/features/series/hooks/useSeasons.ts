import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/api/services';

export function useSeasons(seriesId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['seasons', seriesId],
    queryFn: () => catalogService.seasons(seriesId),
    enabled: enabled && Boolean(seriesId),
    staleTime: 60_000,
  });
}
