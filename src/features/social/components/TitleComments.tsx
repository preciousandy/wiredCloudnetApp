import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Input, Skeleton, Text, toast } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { titleSocialService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { formatRelativeTime } from '@/lib/format';
import { RatingStars } from './RatingStars';

/**
 * Reviews on a title.
 *
 * Only people who own it can post, which is the difference between a review
 * section and a comment war. The gate is enforced by the server too; this just
 * stops the form appearing for someone who cannot use it.
 */
export function TitleComments({
  titleId,
  canReview,
}: {
  titleId: string;
  canReview: boolean;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ['title', titleId, 'comments'],
    queryFn: () => titleSocialService.comments(titleId),
    enabled: Boolean(titleId),
  });

  const submit = async () => {
    setBusy(true);
    try {
      await titleSocialService.addComment(titleId, body, rating);
      setBody('');
      setRating(null);
      setWriting(false);
      await queryClient.invalidateQueries({ queryKey: ['title', titleId, 'comments'] });
      toast.success('Review posted');
    } catch (cause) {
      toast.error(toApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };

  if (isPending) {
    return (
      <View className="gap-3 pt-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text variant="heading" className="text-[17px]">
            Reviews
          </Text>
          <View className="mt-1">
            <RatingStars value={data?.average ?? null} count={data?.ratingCount} size={15} />
          </View>
        </View>

        {canReview && !writing ? (
          <Pressable
            onPress={() => setWriting(true)}
            accessibilityRole="button"
            accessibilityLabel="Write a review"
            className="h-9 flex-row items-center gap-1.5 rounded-lg border border-neutral-200 px-3"
          >
            <Ionicons name="create-outline" size={14} color={neutral[600]} />
            <Text variant="caption" className="font-bold text-neutral-700">
              {data?.myRating ? 'Edit' : 'Write'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!canReview ? (
        <View className="flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
          <Ionicons name="lock-closed-outline" size={14} color={neutral[400]} />
          <Text variant="caption" className="flex-1">
            Reviews come from people who bought this, so you know they watched it.
          </Text>
        </View>
      ) : null}

      {writing ? (
        <View className="gap-3 rounded-lg border border-neutral-200 p-4">
          <Text variant="label">Your rating</Text>
          <RatingStars value={rating} onChange={setRating} size={26} />

          <Input
            placeholder="What did you think?"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={500}
            style={{ height: 84, textAlignVertical: 'top', paddingTop: 10 }}
          />

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Post"
                size="sm"
                loading={busy}
                disabled={body.trim().length < 3}
                onPress={() => void submit()}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Cancel"
                size="sm"
                variant="secondary"
                onPress={() => {
                  setWriting(false);
                  setBody('');
                  setRating(null);
                }}
              />
            </View>
          </View>
        </View>
      ) : null}

      {data && data.items.length > 0 ? (
        <View className="divide-y divide-neutral-100">
          {data.items.map((comment) => (
            <View key={comment.id} className="flex-row gap-3 py-3">
              <Avatar name={comment.author} size={34} />
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text variant="label" className="font-bold">
                    {comment.author}
                  </Text>
                  <Text variant="caption">{formatRelativeTime(comment.createdAt)}</Text>
                </View>
                {comment.rating !== null ? (
                  <View className="mt-0.5">
                    <RatingStars value={comment.rating} size={12} />
                  </View>
                ) : null}
                <Text variant="body" className="mt-1 text-neutral-700">
                  {comment.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="caption" className="py-4 text-center text-neutral-400">
          No reviews yet.
        </Text>
      )}
    </View>
  );
}
