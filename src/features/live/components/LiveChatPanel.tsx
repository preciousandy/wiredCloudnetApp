import { useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { formatRelativeTime } from '@/lib/format';
import { liveService } from '@/api/services';
import type { LiveMessage } from '@/api/schemas/live';

const ROLE_COLOR: Record<LiveMessage['role'], string> = {
  creator: brand[500],
  moderator: '#2563EB',
  viewer: neutral[500],
};

/**
 * Chat, from the creator's side.
 *
 * Polls rather than streams, matching the stats on the dashboard. Messages
 * arrive newest last and the list is inverted, so new ones appear at the thumb
 * end and the creator is not fighting a scroll position while talking.
 */
export function LiveChatPanel({
  visible,
  eventId,
  onClose,
}: {
  visible: boolean;
  eventId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { data } = useQuery({
    queryKey: ['live', eventId, 'chat'],
    queryFn: () => liveService.messages(eventId),
    enabled: visible,
    refetchInterval: visible ? 4_000 : false,
  });

  const send = useMutation({
    mutationFn: (body: string) => liveService.send(eventId, body),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['live', eventId, 'chat'] });
      void queryClient.invalidateQueries({ queryKey: ['creator', 'live', eventId, 'stats'] });
    },
  });

  const messages = [...(data?.items ?? [])].reverse();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Live chat" height={0.75}>
      <View className="flex-1">
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2 px-10">
            <Ionicons name="chatbubbles-outline" size={30} color={neutral[300]} />
            <Text variant="caption" className="text-center text-neutral-400">
              No messages yet. Say hello and people usually start talking.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      variant="caption"
                      className="font-bold"
                      style={{ color: ROLE_COLOR[item.role] }}
                    >
                      {item.author}
                    </Text>
                    {item.role !== 'viewer' ? (
                      <View
                        className="rounded px-1 py-0.5"
                        style={{ backgroundColor: `${ROLE_COLOR[item.role]}1A` }}
                      >
                        <Text
                          variant="caption"
                          className="font-bold"
                          style={{ color: ROLE_COLOR[item.role], fontSize: 10 }}
                        >
                          {item.role === 'creator' ? 'HOST' : 'MOD'}
                        </Text>
                      </View>
                    ) : null}
                    <Text variant="caption" className="text-neutral-300">
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                  <Text variant="body" className="mt-0.5 leading-5">
                    {item.body}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        <View className="flex-row items-center gap-2 border-t border-neutral-100 px-4 py-3">
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder="Say something"
            placeholderTextColor={neutral[400]}
            maxLength={300}
            onSubmitEditing={() => draft.trim() && send.mutate(draft.trim())}
            returnKeyType="send"
            className="h-11 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-[15px] text-neutral-900"
          />
          <Pressable
            onPress={() => draft.trim() && send.mutate(draft.trim())}
            disabled={draft.trim().length === 0 || send.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            className="h-11 w-11 items-center justify-center rounded-lg bg-brand-500"
            style={{ opacity: draft.trim().length === 0 ? 0.4 : 1 }}
          >
            <Ionicons name="arrow-up" size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}
