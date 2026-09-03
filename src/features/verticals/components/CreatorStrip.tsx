import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Text } from '@/ui';
import { formatCount } from '@/lib/format';
import type { CreatorReel } from '@/api/schemas/verticals';
import { useCreatorState } from '../hooks/useVerticalActions';

export function CreatorStrip({
  creator,
  onFollow,
}: {
  creator: CreatorReel['creator'];
  onFollow: () => void;
}) {
  const { following, followerCount } = useCreatorState(creator);

  return (
    <View className="flex-row items-center gap-2.5">
      <Pressable
        onPress={() => router.push(`/creator/${creator.handle}`)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${creator.displayName}'s profile`}
        className="active:opacity-80"
      >
        <Avatar name={creator.displayName} uri={creator.avatarUrl} size={40} />
      </Pressable>

      <View className="flex-1">
        <Text variant="label" numberOfLines={1} className="font-bold text-white">
          @{creator.handle}
        </Text>
        <Text variant="caption" className="text-white/70">
          {formatCount(followerCount)} followers
        </Text>
      </View>

      <Pressable
        onPress={onFollow}
        accessibilityRole="button"
        accessibilityLabel={following ? 'Unfollow' : 'Follow'}
        className={`h-8 justify-center rounded-lg px-3 ${
          following ? 'border border-white/40' : 'bg-brand-500'
        }`}
      >
        <Text variant="caption" className="font-bold text-white">
          {following ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}
