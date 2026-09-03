import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, ConfirmDialog, Text, toast } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { formatCount, formatTimecode } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { liveService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { useBroadcast } from '@/features/live/hooks/useBroadcast';
import { CameraStage } from '@/features/live/components/CameraStage';
import { HealthBadge } from '@/features/live/components/HealthBadge';
import { LiveChatPanel } from '@/features/live/components/LiveChatPanel';

/**
 * The live control room.
 *
 * On screen while the creator is broadcasting, so the ordering is by what they
 * need at a glance and in a hurry: am I actually up, how many people are here,
 * what have I made, and the way out. Chat is below all of that because reading
 * it is optional and the numbers are not.
 *
 * Stats poll rather than push. A websocket is the right answer for viewer counts
 * eventually, but polling is honest against a mock and the swap is one hook.
 */
export default function LiveDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const broadcast = useBroadcast();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // A creator holding a phone still for forty minutes should not watch it sleep.
  useKeepAwake();

  const { data: events } = useQuery({
    queryKey: ['creator', 'live'],
    queryFn: () => liveService.mine(),
  });
  const event = events?.items.find((e) => e.id === eventId) ?? null;

  const { data: stats } = useQuery({
    queryKey: ['creator', 'live', eventId, 'stats'],
    queryFn: () => liveService.stats(eventId),
    enabled: Boolean(eventId),
    refetchInterval: 4_000,
  });

  const { data: chatData } = useQuery({
    queryKey: ['live', eventId, 'chat'],
    queryFn: () => liveService.messages(eventId),
    enabled: Boolean(eventId),
    refetchInterval: 4_000,
  });

  const totalCommentCount = Math.max(chatData?.items?.length ?? 0, stats?.chatMessageCount ?? 0);

  const endLive = useMutation({
    mutationFn: async () => {
      await broadcast.disconnect();
      return liveService.endLive(eventId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator', 'live'] });
      toast.success('Event ended');
      router.replace('/creator/live');
    },
    onError: (cause) => toast.error(toApiError(cause).message),
  });

  const live = broadcast.state === 'live';
  const reconnecting = broadcast.state === 'reconnecting';

  return (
    <View className="flex-1 bg-neutral-950">
      <StatusBar style="light" />

      <CameraStage
        state={broadcast.state}
        isSupported={broadcast.isSupported}
        devices={broadcast.devices}
        posterUrl={event?.posterUrl}
        onFlip={() => void broadcast.flipCamera()}
        onToggleCamera={() => void broadcast.toggleCamera()}
        onToggleMicrophone={() => void broadcast.toggleMicrophone()}
      />

      {/* Live badge and elapsed time. The two things a broadcaster glances at
          most, so they sit top left where nothing else competes. */}
      <View
        className="absolute left-4 flex-row items-center gap-2"
        style={{ top: insets.top + 8 }}
      >
        <View
          className={`flex-row items-center gap-1.5 rounded px-2.5 py-1.5 ${
            reconnecting ? 'bg-warning' : live ? 'bg-danger' : 'bg-neutral-700'
          }`}
        >
          <View className="h-1.5 w-1.5 rounded-full bg-white" />
          <Text variant="caption" className="font-bold text-white">
            {reconnecting ? 'RECONNECTING' : live ? 'LIVE' : 'OFF AIR'}
          </Text>
        </View>

        <View className="rounded bg-black/55 px-2.5 py-1.5">
          <Text variant="caption" className="font-bold text-white">
            {formatTimecode(broadcast.elapsedSeconds)}
          </Text>
        </View>

        <HealthBadge health={broadcast.health} />
      </View>

      <View
        className="absolute right-4 flex-row items-center gap-1.5 rounded bg-black/55 px-2.5 py-1.5"
        style={{ top: insets.top + 8 }}
      >
        <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
        <Text variant="caption" className="font-bold text-white">
          {formatCount(stats?.viewerCount ?? 0)}
        </Text>
      </View>

      <View className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-white">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        >
          <Text variant="label" numberOfLines={1} className="font-bold">
            {event?.title ?? 'Your event'}
          </Text>

          <View className="mt-4 flex-row gap-3">
            <Stat
              icon="eye-outline"
              label="Watching"
              value={formatCount(stats?.viewerCount ?? 0)}
            />
            <Stat
              icon="trending-up-outline"
              label="Peak"
              value={formatCount(stats?.peakViewerCount ?? 0)}
            />
            <Stat
              icon="ticket-outline"
              label="Tickets"
              value={formatCount(stats?.ticketsSold ?? 0)}
            />
          </View>

          {event?.ticketPrice ? (
            <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-success/10 px-4 py-3">
              <Ionicons name="cash-outline" size={16} color={semantic.success} />
              <Text variant="caption" className="flex-1 text-neutral-600">
                Earned so far, your share
              </Text>
              <Text variant="label" className="font-bold text-success">
                {formatMoney(stats?.earnings ?? event.earnings, { compactWhole: true })}
              </Text>
            </View>
          ) : null}

          {reconnecting ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-lg bg-warning/10 p-3">
              <Ionicons name="warning-outline" size={15} color={semantic.warning} />
              <Text variant="caption" className="flex-1 leading-5 text-neutral-700">
                Your connection dropped and we are reconnecting. Viewers see a
                pause, not an ending. Move somewhere with better signal if it
                keeps happening.
              </Text>
            </View>
          ) : null}

          {event?.chatEnabled ? (
            <Pressable
              onPress={() => setChatOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open live chat"
              className="mt-3 flex-row items-center gap-2 rounded-lg border border-neutral-200 px-4 py-3"
            >
              <Ionicons name="chatbubble-outline" size={16} color={neutral[500]} />
              <Text variant="label" className="flex-1">
                Live chat
              </Text>
              <Text variant="caption" className="font-semibold text-neutral-500">
                {formatCount(totalCommentCount)}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={neutral[400]} />
            </Pressable>
          ) : null}

          <View className="mt-4">
            <Button
              label="End event"
              variant="danger"
              loading={endLive.isPending}
              onPress={() => setConfirmEnd(true)}
            />
          </View>
        </ScrollView>
      </View>

      <LiveChatPanel
        visible={chatOpen}
        eventId={eventId}
        onClose={() => setChatOpen(false)}
      />

      <ConfirmDialog
        visible={confirmEnd}
        tone="danger"
        title="End the event?"
        message={
          event?.replayAvailable
            ? 'Everyone watching will be dropped. The replay stays available afterwards.'
            : 'Everyone watching will be dropped and there is no replay for this event.'
        }
        confirmLabel="End event"
        loading={endLive.isPending}
        onConfirm={() => {
          setConfirmEnd(false);
          endLive.mutate();
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 gap-1 rounded-lg bg-neutral-50 p-3">
      <Ionicons name={icon} size={15} color={neutral[400]} />
      <Text variant="title" className="mt-0.5">
        {value}
      </Text>
      <Text variant="caption" className="text-neutral-400">
        {label}
      </Text>
    </View>
  );
}
