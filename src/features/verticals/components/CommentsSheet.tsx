import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, BottomSheet, Text, toast } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { verticalsService } from '@/api/services';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { useVerticalInteractions } from '@/store/verticalInteractions';
import type { VerticalComment } from '@/api/schemas/verticals';

interface Thread {
  root: VerticalComment;
  replies: VerticalComment[];
}

export function CommentsSheet({
  verticalId,
  visible,
  onClose,
}: {
  verticalId: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<VerticalComment | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ['verticals', 'comments', verticalId],
    queryFn: () => verticalsService.comments(String(verticalId)),
    enabled: visible && Boolean(verticalId),
  });

  /** Flat list from the API, grouped into one level of threads for display. */
  const threads: Thread[] = useMemo(() => {
    const all = data?.items ?? [];
    return all
      .filter((comment) => comment.parentId === null)
      .map((root) => ({
        root,
        replies: all.filter((comment) => comment.parentId === root.id),
      }));
  }, [data]);

  const submit = async () => {
    if (!verticalId || draft.trim().length === 0 || sending) return;
    setSending(true);
    try {
      const newComment = await verticalsService.addComment(verticalId, draft, replyingTo?.id ?? null);
      // Keep a thread open once you have replied into it.
      if (replyingTo) {
        setExpanded((current) => new Set(current).add(replyingTo.parentId ?? replyingTo.id));
      }
      setDraft('');
      setReplyingTo(null);

      // Immediately update query cache so comment renders on screen without waiting for refetch
      const currentItems = data?.items ?? [];
      const updatedItems = currentItems.some((c) => c.id === newComment.id) ? currentItems : [...currentItems, newComment];

      queryClient.setQueryData(['verticals', 'comments', verticalId], {
        ...(data || {}),
        items: updatedItems,
      });

      // Update vertical interaction store so action rail count syncs
      useVerticalInteractions.getState().apply(verticalId, {
        commentCount: updatedItems.length,
      });

      queryClient.invalidateQueries({ queryKey: ['verticals', 'comments', verticalId] });
      queryClient.invalidateQueries({ queryKey: ['verticals', 'feed'] });
      toast.success(replyingTo ? 'Reply posted' : 'Comment posted');
    } catch {
      toast.error('Could not post that');
    } finally {
      setSending(false);
    }
  };

  const likeComment = async (commentId: string) => {
    if (!verticalId) return;
    try {
      await verticalsService.toggleCommentLike(verticalId, commentId);
      await queryClient.invalidateQueries({ queryKey: ['verticals', 'comments', verticalId] });
    } catch {
      toast.error('Could not save that like');
    }
  };

  const toggleThread = (rootId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });

  const total = data?.items?.length ?? 0;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={0.78}
      title={total === 1 ? '1 comment' : `${formatCount(total)} comments`}
    >
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={threads}
          keyExtractor={(thread) => thread.root.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text variant="body" className="mt-10 text-center text-neutral-400">
              {isPending ? 'Loading comments...' : 'No comments yet. Say something.'}
            </Text>
          }
          renderItem={({ item: thread }) => {
            const open = expanded.has(thread.root.id);
            return (
              <View className="gap-3">
                <CommentRow
                  comment={thread.root}
                  onReply={() => setReplyingTo(thread.root)}
                  onLike={() => void likeComment(thread.root.id)}
                />

                {thread.replies.length > 0 ? (
                  <View className="ml-11 gap-3">
                    {open ? (
                      thread.replies.map((reply) => (
                        <CommentRow
                          key={reply.id}
                          comment={reply}
                          compact
                          onReply={() => setReplyingTo(reply)}
                          onLike={() => void likeComment(reply.id)}
                        />
                      ))
                    ) : null}

                    <Pressable
                      onPress={() => toggleThread(thread.root.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      className="flex-row items-center gap-1.5"
                    >
                      <View className="h-px w-5 bg-neutral-300" />
                      <Text variant="caption" className="font-bold text-neutral-500">
                        {open
                          ? 'Hide replies'
                          : `View ${thread.replies.length} ${
                              thread.replies.length === 1 ? 'reply' : 'replies'
                            }`}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          }}
        />

        {replyingTo ? (
          <View className="flex-row items-center gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-2">
            <Ionicons name="return-down-forward" size={14} color={neutral[500]} />
            <Text variant="caption" className="flex-1 text-neutral-600">
              Replying to {replyingTo.author.displayName}
            </Text>
            <Pressable onPress={() => setReplyingTo(null)} hitSlop={8} accessibilityLabel="Cancel reply">
              <Ionicons name="close" size={15} color={neutral[500]} />
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center gap-2 border-t border-neutral-100 px-4 py-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={replyingTo ? `Reply to ${replyingTo.author.displayName}` : 'Add a comment'}
            placeholderTextColor={neutral[400]}
            className="h-11 flex-1 rounded-lg bg-neutral-100 px-3 text-[15px] text-neutral-900"
            returnKeyType="send"
            onSubmitEditing={() => void submit()}
            maxLength={300}
          />
          <Pressable
            onPress={() => void submit()}
            disabled={draft.trim().length === 0 || sending}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            className={`h-11 w-11 items-center justify-center rounded-lg ${
              draft.trim().length === 0 ? 'bg-neutral-200' : 'bg-brand-500'
            }`}
          >
            <Ionicons name="send" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

function CommentRow({
  comment,
  compact,
  onReply,
  onLike,
}: {
  comment: VerticalComment;
  compact?: boolean;
  onReply: () => void;
  onLike: () => void;
}) {
  return (
    <View className="flex-row gap-3">
      <Avatar
        name={comment.author.displayName}
        uri={comment.author.avatarUrl}
        size={compact ? 28 : 36}
      />

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text variant="label" className="font-bold">
            {comment.author.displayName}
          </Text>
          <Text variant="caption">{formatRelativeTime(comment.createdAt)}</Text>
        </View>

        <Text variant="body" className="mt-0.5">
          {comment.body}
        </Text>

        <Pressable onPress={onReply} hitSlop={6} accessibilityRole="button" className="mt-1">
          <Text variant="caption" className="font-bold text-neutral-500">
            Reply
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onLike}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={comment.liked ? 'Unlike comment' : 'Like comment'}
        className="items-center gap-0.5"
      >
        <Ionicons
          name={comment.liked ? 'heart' : 'heart-outline'}
          size={15}
          color={comment.liked ? brand[500] : neutral[400]}
        />
        <Text variant="caption">{comment.likeCount}</Text>
      </Pressable>
    </View>
  );
}
