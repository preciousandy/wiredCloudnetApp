import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { useSeasons } from '../hooks/useSeasons';
import { EpisodeRow } from './EpisodeRow';
import { SeasonPicker } from './SeasonPicker';
import type { Episode } from '@/api/schemas/series';

export function EpisodeList({
  seriesId,
  onBuy,
}: {
  seriesId: string;
  onBuy: (episode: Episode) => void;
}) {
  const { data, isPending } = useSeasons(seriesId, true);
  const [season, setSeason] = useState(1);

  // Land on the season holding the viewer's next episode, not always season one.
  useEffect(() => {
    if (!data?.nextEpisodeId) return;
    const owner = data.seasons.find((s) =>
      s.episodes.some((e) => e.id === data.nextEpisodeId),
    );
    if (owner) setSeason(owner.seasonNumber);
  }, [data]);

  const current = useMemo(
    () => data?.seasons.find((s) => s.seasonNumber === season) ?? data?.seasons[0],
    [data, season],
  );

  if (isPending) {
    return (
      <View className="gap-3 pt-2">
        {[0, 1, 2].map((i) => (
          <View key={i} className="flex-row gap-3">
            <Skeleton className="h-[70px] w-[124px]" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (!data || !current) {
    return (
      <View className="items-center gap-2 py-14">
        <Ionicons name="albums-outline" size={26} color={neutral[300]} />
        <Text variant="body" className="text-neutral-400">
          No episodes yet.
        </Text>
      </View>
    );
  }

  const upcoming = current.episodeCount - current.releasedCount;

  return (
    <View>
      <SeasonPicker seasons={data.seasons} value={season} onChange={setSeason} />

      <View className="mt-2 flex-row items-center gap-2">
        <Text variant="caption" className="text-neutral-500">
          {current.releasedCount} of {current.episodeCount} episodes out
        </Text>
        {upcoming > 0 ? (
          <View className="rounded-lg bg-neutral-100 px-2 py-0.5">
            <Text variant="caption" className="text-neutral-500">
              {upcoming} still to come
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-1 divide-y divide-neutral-100">
        {current.episodes.map((episode) => (
          <EpisodeRow
            key={episode.id}
            episode={episode}
            onPlay={() => router.push(`/watch/${episode.id}`)}
            onBuy={() => onBuy(episode)}
          />
        ))}
      </View>
    </View>
  );
}
