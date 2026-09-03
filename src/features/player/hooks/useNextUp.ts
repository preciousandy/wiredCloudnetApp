import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/api/services';
import type { TitleSummary } from '@/api/schemas/catalog';

/**
 * What to offer when something finishes.
 *
 * An episode hands off to the next episode, which is the only sensible answer
 * mid-series. A film falls back to a recommendation in the same category, and
 * never to the thing that just finished.
 */
export function useNextUp(currentId: string, category?: string, seriesId?: string | null) {
  return useQuery<TitleSummary | null>({
    queryKey: ['next-up', currentId, category, seriesId],
    queryFn: async () => {
      if (seriesId) {
        const { next } = await catalogService.nextEpisode(currentId);
        // End of the run: fall through to a recommendation rather than nothing.
        if (next) return next;
      }

      const sameCategory = category
        ? await catalogService.byCategory(category)
        : { items: [] as TitleSummary[] };

      const fromCategory = sameCategory.items.find((t) => t.id !== currentId);
      if (fromCategory) return fromCategory;

      const everything = await catalogService.byCategory('all');
      return everything.items.find((t) => t.id !== currentId) ?? null;
    },
    enabled: Boolean(currentId),
    staleTime: 5 * 60_000,
  });
}
