import { FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, Screen, StateView, Text } from '@/ui';
import { brand, neutral, semantic } from '@/ui/theme/colors';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { liveService } from '@/api/services';
import type { CreatorLiveEvent } from '@/api/schemas/live';

const STATUS: Record<
  CreatorLiveEvent['status'],
  { label: string; color: string; background: string }
> = {
  upcoming: { label: 'Scheduled', color: neutral[600], background: 'bg-neutral-100' },
  live: { label: 'Live now', color: '#FFFFFF', background: 'bg-danger' },
  ended: { label: 'Ended', color: neutral[500], background: 'bg-neutral-100' },
};

export default function MyLiveEvents() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['creator', 'live'],
    queryFn: () => liveService.mine(),
  });

  const events = data?.items ?? [];

  return (
    <Screen>
      <View className="flex-row items-center gap-3 pb-3 pt-2">
        <BackButton />
        <Text variant="heading" className="flex-1">
          Live events
        </Text>
        <Pressable
          onPress={() => router.push('/creator/live/new')}
          accessibilityRole="button"
          accessibilityLabel="Schedule a live event"
          className="h-10 w-10 items-center justify-center rounded-lg bg-brand-500"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <StateView
        loading={isPending}
        error={isError ? { message: 'Check your connection and try again.' } : null}
        data={events}
        isEmpty={(items) => items.length === 0}
        onRetry={() => void refetch()}
        emptyTitle="No live events yet"
        emptyMessage="Schedule one, set a ticket price, and your followers get a reminder an hour before you start."
        emptyAction={
          <View className="w-full px-8">
            <Button label="Schedule an event" onPress={() => router.push('/creator/live/new')} />
          </View>
        }
      >
        {(items) => (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
            renderItem={({ item }) => <EventCard event={item} />}
          />
        )}
      </StateView>
    </Screen>
  );
}

function EventCard({ event }: { event: CreatorLiveEvent }) {
  const status = STATUS[event.status];
  const isLive = event.status === 'live';

  /**
   * One card, one obvious next action.
   *
   * Live goes to the dashboard, scheduled goes to the green room, ended goes to
   * the summary. Making the whole card the action rather than hiding it behind a
   * menu matters here: the creator opening this screen two minutes before a
   * paid event should not have to hunt.
   */
  const open = () => {
    if (event.status === 'ended') return;
    router.push(
      isLive ? `/creator/live/${event.id}/dashboard` : `/creator/live/${event.id}/greenroom`,
    );
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${status.label}`}
      className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
    >
      <View className="relative">
        <Image
          source={{ uri: event.posterUrl }}
          style={{ width: '100%', height: 140 }}
          contentFit="cover"
        />
        <View className={`absolute left-3 top-3 flex-row items-center gap-1.5 rounded px-2 py-1 ${status.background}`}>
          {isLive ? <View className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
          <Text variant="caption" className="font-bold" style={{ color: status.color }}>
            {status.label}
          </Text>
        </View>
        {isLive ? (
          <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded bg-black/60 px-2 py-1">
            <Ionicons name="eye-outline" size={12} color="#FFFFFF" />
            <Text variant="caption" className="font-bold text-white">
              {formatCount(event.viewerCount)}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-2 p-4">
        <Text variant="label" numberOfLines={1} className="font-bold">
          {event.title}
        </Text>

        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={13} color={neutral[400]} />
          <Text variant="caption" className="text-neutral-500">
            {event.status === 'ended' && event.endedAt
              ? `Ended ${formatRelativeTime(event.endedAt)}`
              : formatRelativeTime(event.startsAt)}
          </Text>
          <View className="mx-1 h-3 w-px bg-neutral-200" />
          <Ionicons name="pricetag-outline" size={13} color={neutral[400]} />
          <Text variant="caption" className="text-neutral-500">
            {event.ticketPrice ? formatMoney(event.ticketPrice, { compactWhole: true }) : 'Free'}
          </Text>
        </View>

        {event.ticketsSold > 0 ? (
          <View className="mt-1 flex-row items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
            <Ionicons name="cash-outline" size={14} color={semantic.success} />
            <Text variant="caption" className="flex-1 font-bold text-success">
              {event.ticketsSold} {event.ticketsSold === 1 ? 'ticket' : 'tickets'} sold,{' '}
              {formatMoney(event.earnings, { compactWhole: true })} earned
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
