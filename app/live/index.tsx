import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, MoneyText, Screen, Skeleton, Text } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { liveService } from '@/api/services';
import { formatCount, formatRelativeTime } from '@/lib/format';
import type { LiveEvent } from '@/api/schemas/live';

export default function LiveList() {
  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ['live'],
    queryFn: () => liveService.list(),
    // Live status changes on its own, so this list should not go stale.
    refetchInterval: 20_000,
  });

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Live</Text>
        <View className="w-10" />
      </View>

      {isPending ? (
        <View className="mt-5 gap-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, gap: 18, paddingBottom: 28 }}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center gap-2 py-24">
              <Ionicons name="radio-outline" size={30} color={neutral[300]} />
              <Text variant="body" className="text-neutral-400">
                No events scheduled right now.
              </Text>
            </View>
          }
          renderItem={({ item }) => <EventCard event={item} />}
        />
      )}
    </Screen>
  );
}

function EventCard({ event }: { event: LiveEvent }) {
  const live = event.status === 'live';
  const ended = event.status === 'ended';

  return (
    <Pressable
      onPress={() => router.push(`/live/${event.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${event.status}`}
    >
      <View className="overflow-hidden rounded-lg bg-neutral-100" style={{ height: 190 }}>
        <Image
          source={{ uri: event.posterUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={180}
        />

        <View className="absolute left-3 top-3 flex-row items-center gap-2">
          {live ? (
            <View className="flex-row items-center gap-1.5 rounded-lg bg-danger px-2 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-white" />
              <Text variant="caption" className="font-bold uppercase text-white">
                Live
              </Text>
            </View>
          ) : ended ? (
            <View className="rounded-lg bg-black/70 px-2 py-1">
              <Text variant="caption" className="font-bold text-white">
                {event.replayAvailable ? 'Replay' : 'Ended'}
              </Text>
            </View>
          ) : (
            <View className="rounded-lg bg-black/70 px-2 py-1">
              <Text variant="caption" className="font-bold text-white">
                Starts {formatRelativeTime(event.startsAt).replace(' ago', '')}
              </Text>
            </View>
          )}

          {live ? (
            <View className="flex-row items-center gap-1 rounded-lg bg-black/60 px-2 py-1">
              <Ionicons name="eye" size={11} color="#FFFFFF" />
              <Text variant="caption" className="font-bold text-white">
                {formatCount(event.viewerCount)}
              </Text>
            </View>
          ) : null}
        </View>

        {event.ticketPrice && !event.hasTicket ? (
          <View className="absolute right-3 top-3 rounded-lg bg-success px-2 py-1">
            <MoneyText
              value={event.ticketPrice}
              variant="caption"
              className="font-bold text-white"
            />
          </View>
        ) : event.hasTicket ? (
          <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-lg bg-black/70 px-2 py-1">
            <Ionicons name="ticket" size={11} color="#FFFFFF" />
            <Text variant="caption" className="font-bold text-white">
              Ticket
            </Text>
          </View>
        ) : null}
      </View>

      <Text variant="heading" numberOfLines={1} className="mt-2 text-[17px]">
        {event.title}
      </Text>
      <Text variant="caption" numberOfLines={2} className="mt-0.5">
        {event.description}
      </Text>
      <Text variant="caption" className="mt-1 text-neutral-400">
        {event.creator.displayName}
      </Text>
    </Pressable>
  );
}
