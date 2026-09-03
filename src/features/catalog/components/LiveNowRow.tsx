import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MoneyText, Text } from '@/ui';
import { liveService } from '@/api/services';
import { formatCount } from '@/lib/format';
import { SectionHeader } from './SectionHeader';
import type { LiveEvent } from '@/api/schemas/live';

/** Upcoming events only count as "now" once they are close enough to matter. */
const SOON_MS = 2 * 60 * 60 * 1000;

/**
 * Live, as content rather than chrome.
 *
 * Renders nothing at all when no event is running or imminent, which is why it
 * belongs in the feed and not in the header: a permanent Live button spends the
 * best space on the screen advertising an empty room.
 */
export function LiveNowRow() {
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.66;

  const { data } = useQuery({
    queryKey: ['live'],
    queryFn: () => liveService.list(),
    refetchInterval: 30_000,
  });

  const relevant = (data?.items ?? []).filter((event) => {
    if (event.status === 'live') return true;
    if (event.status !== 'upcoming') return false;
    return new Date(event.startsAt).getTime() - Date.now() <= SOON_MS;
  });

  if (relevant.length === 0) return null;

  return (
    <View className="mb-7">
      <SectionHeader title="Live now" onSeeAll={() => router.push('/live')} />

      <FlatList
        data={relevant}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => <LiveCard event={item} width={cardWidth} />}
      />
    </View>
  );
}

function LiveCard({ event, width }: { event: LiveEvent; width: number }) {
  const live = event.status === 'live';

  const startsIn = () => {
    const minutes = Math.max(
      Math.round((new Date(event.startsAt).getTime() - Date.now()) / 60_000),
      0,
    );
    if (minutes < 1) return 'Starting now';
    if (minutes < 60) return `In ${minutes} min`;
    return `In ${Math.round(minutes / 60)}h`;
  };

  return (
    <Pressable
      onPress={() => router.push(`/live/${event.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${live ? 'live now' : startsIn()}`}
      style={{ width }}
    >
      <View
        className="overflow-hidden rounded-lg bg-neutral-100"
        style={{ height: width * 0.56 }}
      >
        <Image
          source={{ uri: event.posterUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={180}
        />

        <View className="absolute left-2 top-2 flex-row items-center gap-1.5">
          {live ? (
            <View className="flex-row items-center gap-1.5 rounded-lg bg-danger px-2 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-white" />
              <Text variant="caption" className="font-bold uppercase text-white">
                Live
              </Text>
            </View>
          ) : (
            <View className="rounded-lg bg-black/75 px-2 py-1">
              <Text variant="caption" className="font-bold text-white">
                {startsIn()}
              </Text>
            </View>
          )}

          {live ? (
            <View className="flex-row items-center gap-1 rounded-lg bg-black/65 px-2 py-1">
              <Ionicons name="eye" size={10} color="#FFFFFF" />
              <Text variant="caption" className="font-bold text-white">
                {formatCount(event.viewerCount)}
              </Text>
            </View>
          ) : null}
        </View>

        {event.ticketPrice && !event.hasTicket ? (
          <View className="absolute right-2 top-2 rounded-lg bg-success px-2 py-1">
            <MoneyText value={event.ticketPrice} variant="caption" className="font-bold text-white" />
          </View>
        ) : null}
      </View>

      <Text variant="label" numberOfLines={1} className="mt-2 font-bold text-neutral-900">
        {event.title}
      </Text>
      <Text variant="caption" numberOfLines={1}>
        {event.creator.displayName}
      </Text>
    </Pressable>
  );
}
