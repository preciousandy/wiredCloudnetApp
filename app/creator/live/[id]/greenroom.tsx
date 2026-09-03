import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, ConfirmDialog, Text, toast } from '@/ui';
import { semantic } from '@/ui/theme/colors';
import { formatMoney } from '@/lib/money';
import { formatRelativeTime } from '@/lib/format';
import { liveService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { useBroadcast } from '@/features/live/hooks/useBroadcast';
import { CameraStage } from '@/features/live/components/CameraStage';
import { PreflightList } from '@/features/live/components/PreflightList';

/**
 * The green room.
 *
 * The last screen before a creator is in front of an audience, so it does one
 * thing: let them see and fix everything that could go wrong, while nothing is
 * being transmitted. Camera framing, which way it faces, whether the mic is on,
 * and a checklist of the things that are true about the event itself.
 *
 * Nothing here reaches viewers. The stream key is fetched when this screen opens
 * and the connection only starts on Go live.
 */
export default function GreenRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const broadcast = useBroadcast();
  const [confirmLive, setConfirmLive] = useState(false);

  const { data: events } = useQuery({
    queryKey: ['creator', 'live'],
    queryFn: () => liveService.mine(),
  });
  const event = events?.items.find((e) => e.id === eventId) ?? null;

  /**
   * Credentials are fetched here rather than on the list screen.
   *
   * A stream key lets anyone holding it broadcast as this creator, so it is
   * requested at the last moment and never rides along on a list response.
   */
  const { data: session, isError: sessionFailed } = useQuery({
    queryKey: ['creator', 'live', eventId, 'session'],
    queryFn: () => liveService.openSession(eventId),
    enabled: Boolean(eventId),
    retry: 1,
    // Refetching a key mid-broadcast would invalidate the one in use.
    staleTime: Infinity,
  });

  // Camera comes up as soon as the screen does, and goes down when it leaves,
  // unless we are on the way to the dashboard already live.
  useEffect(() => {
    void broadcast.startPreview();
    return () => {
      if (broadcast.state !== 'live' && broadcast.state !== 'connecting') {
        void broadcast.stopPreview();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goLive = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No stream credentials');
      await broadcast.connect({
        ingestUrl: session.ingestUrl,
        streamKey: session.streamKey,
      });
      return liveService.goLive(eventId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator', 'live'] });
      router.replace(`/creator/live/${eventId}/dashboard`);
    },
    onError: (cause) => {
      void broadcast.disconnect();
      toast.error(toApiError(cause).message);
    },
  });

  const checks = [
    {
      key: 'connection',
      label: 'Stream connection ready',
      detail: sessionFailed
        ? 'Could not reach CloudNet. Check your connection and reopen this screen.'
        : session
          ? 'CloudNet is ready to receive your stream.'
          : 'Getting things ready.',
      state: sessionFailed ? ('fail' as const) : session ? ('pass' as const) : ('pending' as const),
    },
    {
      key: 'camera',
      label: 'Camera and microphone',
      detail: !broadcast.devices.cameraEnabled
        ? 'Your camera is off. Viewers will hear you but see nothing.'
        : !broadcast.devices.microphoneEnabled
          ? 'Your microphone is muted. Viewers will see you but hear nothing.'
          : 'Both are on.',
      state:
        broadcast.devices.cameraEnabled && broadcast.devices.microphoneEnabled
          ? ('pass' as const)
          : ('warn' as const),
    },
    {
      key: 'schedule',
      label: 'Start time',
      detail: event ? formatRelativeTime(event.startsAt) : 'Loading',
      state: 'pass' as const,
    },
    {
      key: 'access',
      label: event?.ticketPrice ? 'Ticketed event' : 'Free event',
      detail: event?.ticketPrice
        ? `Viewers pay ${formatMoney(event.ticketPrice, { compactWhole: true })} to join. ${
            event.ticketsSold
          } sold so far.`
        : 'Anyone on CloudNet can join.',
      state: 'pass' as const,
    },
  ];

  const blocked = !session || goLive.isPending || broadcast.state === 'connecting';

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

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ top: insets.top + 8 }}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-lg bg-black/45"
      >
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </Pressable>

      <View className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-white">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        >
          <Text variant="caption" className="uppercase tracking-wide text-neutral-400">
            Green room
          </Text>
          <Text variant="title" numberOfLines={2} className="mt-1">
            {event?.title ?? 'Your event'}
          </Text>
          <Text variant="caption" className="mb-4 mt-1 text-neutral-500">
            Nothing is being sent yet. Check yourself over, then go live.
          </Text>

          <PreflightList checks={checks} />

          <View className="mt-5">
            <Button
              label={broadcast.state === 'connecting' ? 'Connecting' : 'Go live'}
              variant="danger"
              loading={goLive.isPending || broadcast.state === 'connecting'}
              disabled={blocked}
              onPress={() => setConfirmLive(true)}
            />
          </View>

          <View className="mt-3 flex-row items-start gap-2">
            <Ionicons name="shield-checkmark-outline" size={14} color={semantic.success} />
            <Text variant="caption" className="flex-1 leading-5 text-neutral-400">
              Once you go live your followers get a notification and anyone with
              a ticket can join.
            </Text>
          </View>
        </ScrollView>
      </View>

      <ConfirmDialog
        visible={confirmLive}
        title="Go live now?"
        message={
          event?.ticketPrice
            ? 'Ticket holders will be let in straight away and your followers will be notified.'
            : 'Your followers will be notified and anyone can join.'
        }
        confirmLabel="Go live"
        loading={goLive.isPending}
        onConfirm={() => {
          setConfirmLive(false);
          goLive.mutate();
        }}
        onCancel={() => setConfirmLive(false)}
      />
    </View>
  );
}
