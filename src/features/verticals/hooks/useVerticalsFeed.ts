import { useQuery } from '@tanstack/react-query';
import { verticalsService } from '@/api/services';

export function useVerticalsFeed() {
  return useQuery({
    queryKey: ['verticals', 'feed'],
    queryFn: () => verticalsService.feed(),
    staleTime: 5 * 60_000,
  });
}
