import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useKeepAwake } from 'expo-keep-awake';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, MoneyText, Text, toast } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { liveService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { newIdempotencyKey } from '@/lib/idempotency';
import { formatCount } from '@/lib/format';
import type { LiveEvent, LiveTicket } from '@/api/schemas/live';

export default function LiveRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [buying, setBuying] = useState(false);

  const { data: event, isPending } = useQuery({
    queryKey: ['live', id],
    queryFn: () => liveService.detail(String(id)),
    enabled: Boolean(id),
    // Status, viewer count and ticket state all move without us doing anything.
    refetchInterval: 8000,
  });

  const canWatch = Boolean(
    event && event.status !== 'upcoming' && (event.ticketPrice === null || event.hasTicket),
  );

  const { data: ticket } = useQuery<LiveTicket>({
    queryKey: ['live', id, 'ticket'],
    queryFn: () => liveService.ticket(String(id)),
    enabled: canWatch,
    retry: false,
  });

  const buy = async () => {
    if (!event) return;
    setBuying(true);
    try {
      await liveService.buyTicket(event.id, newIdempotencyKey());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['live', id] }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      ]);
      toast.success('Ticket bought');
    } catch (cause) {
      const error = toApiError(cause);
      if (error.code === 'INSUFFICIENT_FUNDS') {
        toast.error('Not enough balance. Top up and try again.');
        router.push('/wallet/fund');
      } else {
        toast.error(error.message);
      }
    } finally {
      setBuying(false);
    }
  };

  if (isPending || !event) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <StatusBar style="light" />
        <ActivityIndicator color="#F2702D" />
      </View>
    );
  }

  if (canWatch && ticket) {
    return <LiveStage event={event} ticket={ticket} />;
  }

  return <Lobby event={event} buying={buying} onBuy={() => void buy()} />;
}

function Lobby({
  event,
  buying,
  onBuy,
}: {
  event: LiveEvent;
  buying: boolean;
  onBuy: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [remaining, setRemaining] = useState('');

  // A countdown is the whole point of a lobby; a static start time is not enough.
  useEffect(() => {
    const tick = () => {
      const ms = new Date(event.startsAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining('Starting now');
        return;
      }
      const hours = Math.floor(ms / 3_600_000);
      const minutes = Math.floor((ms % 3_600_000) / 60_000);
      const seconds = Math.floor((ms % 60_000) / 1000);
      setRemaining(
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${String(seconds).padStart(2, '0')}s`,
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [event.startsAt]);

  const ended = event.status === 'ended';

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <Image
        source={{ uri: event.posterUrl }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.95)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <View style={{ paddingTop: insets.top + 8 }} className="px-4">
        <BackButton tone="dark" />
      </View>

      <View className="flex-1 justify-end gap-3 px-5" style={{ paddingBottom: insets.bottom + 24 }}>
        {!ended ? (
          <View className="self-start rounded-lg bg-white/10 px-3 py-1.5">
            <Text variant="caption" className="font-bold uppercase tracking-widest text-white">
              Starts in {remaining}
            </Text>
          </View>
        ) : (
          <View className="self-start rounded-lg bg-white/10 px-3 py-1.5">
            <Text variant="caption" className="font-bold uppercase tracking-widest text-white">
              {event.replayAvailable ? 'Replay available' : 'This event has ended'}
            </Text>
          </View>
        )}

        <Text variant="display" numberOfLines={2} className="text-white">
          {event.title}
        </Text>
        <Text variant="body" className="text-white/70">
          {event.description}
        </Text>
        <Text variant="caption" className="text-white/50">
          {event.creator.displayName}
        </Text>

        <View className="mt-3 gap-3">
          {event.ticketPrice && !event.hasTicket ? (
            <>
              <View className="flex-row items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-3">
                <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
                <Text variant="label" className="flex-1 text-white">
                  Ticket
                </Text>
                <MoneyText value={event.ticketPrice} variant="label" className="font-bold text-white" />
              </View>
              <Button
                label={ended ? 'Buy ticket to watch the replay' : 'Buy ticket'}
                loading={buying}
                onPress={onBuy}
              />
            </>
          ) : event.hasTicket && event.status === 'upcoming' ? (
            <View className="flex-row items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-3">
              <Ionicons name="checkmark-circle" size={18} color={semantic.success} />
              <Text variant="label" className="flex-1 text-white">
                You have a ticket. This screen opens the stream automatically.
              </Text>
            </View>
          ) : ended && !event.replayAvailable ? (
            <Button label="Back to live events" variant="secondary" onPress={() => router.back()} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function LiveStage({ event, ticket }: { event: LiveEvent; ticket: LiveTicket }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  useKeepAwake();

  const player = useVideoPlayer(ticket.manifestUrl, (p) => {
    p.loop = false;
    p.play();
  });

  const { data: messages } = useQuery({
    queryKey: ['live', event.id, 'chat'],
    queryFn: () => liveService.messages(event.id),
    enabled: ticket.chatEnabled,
    refetchInterval: ticket.chatEnabled ? 4000 : false,
  });

  const items = useMemo(() => messages?.items ?? [], [messages]);

  const send = async () => {
    if (draft.trim().length === 0) return;
    const body = draft;
    setDraft('');
    try {
      await liveService.send(event.id, body);
      await queryClient.invalidateQueries({ queryKey: ['live', event.id, 'chat'] });
      listRef.current?.scrollToEnd({ animated: true });
    } catch {
      toast.error('Message not sent');
      setDraft(body);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <View style={{ paddingTop: insets.top }}>
        <View style={{ aspectRatio: 16 / 9 }} className="w-full bg-black">
          <VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            nativeControls={false}
          />

          <View className="absolute left-3 top-3 flex-row items-center gap-2">
            <BackButton tone="dark" />
            {event.status === 'live' ? (
              <View className="flex-row items-center gap-1.5 rounded-lg bg-danger px-2 py-1">
                <View className="h-1.5 w-1.5 rounded-full bg-white" />
                <Text variant="caption" className="font-bold uppercase text-white">
                  Live
                </Text>
              </View>
            ) : (
              <View className="rounded-lg bg-black/70 px-2 py-1">
                <Text variant="caption" className="font-bold text-white">
                  Replay
                </Text>
              </View>
            )}
          </View>

          <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-lg bg-black/60 px-2 py-1">
            <Ionicons name="eye" size={11} color="#FFFFFF" />
            <Text variant="caption" className="font-bold text-white">
              {formatCount(event.viewerCount)}
            </Text>
          </View>
        </View>
      </View>

      <View className="border-b border-white/10 px-4 py-3">
        <Text variant="label" numberOfLines={1} className="font-bold text-white">
          {event.title}
        </Text>
        <Text variant="caption" className="text-white/50">
          {event.creator.displayName}
          {ticket.latencySeconds > 0 ? ` · about ${ticket.latencySeconds}s behind live` : ''}
        </Text>
      </View>

      {ticket.chatEnabled ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top}
        >
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <View className="flex-row gap-2">
                <Text
                  variant="caption"
                  className={
                    item.role === 'creator'
                      ? 'font-bold text-brand-400'
                      : item.role === 'moderator'
                        ? 'font-bold text-success'
                        : 'font-bold text-white/60'
                  }
                >
                  {item.author}
                </Text>
                <Text variant="caption" className="flex-1 text-white">
                  {item.body}
                </Text>
              </View>
            )}
          />

          <View
            className="flex-row items-center gap-2 border-t border-white/10 px-4 py-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Say something"
              placeholderTextColor={neutral[500]}
              className="h-11 flex-1 rounded-lg bg-white/10 px-3 text-[15px] text-white"
              returnKeyType="send"
              onSubmitEditing={() => void send()}
              maxLength={200}
            />
            <Pressable
              onPress={() => void send()}
              disabled={draft.trim().length === 0}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              className={`h-11 w-11 items-center justify-center rounded-lg ${
                draft.trim().length === 0 ? 'bg-white/10' : 'bg-brand-500'
              }`}
            >
              <Ionicons name="send" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1 items-center justify-center gap-2 px-10">
          <Ionicons name="chatbubbles-outline" size={26} color={neutral[600]} />
          <Text variant="caption" className="text-center text-white/50">
            Chat is closed for replays.
          </Text>
        </View>
      )}
    </View>
  );
}
