import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';

/**
 * The commercial hook.
 *
 * When a vertical promotes a full title, this is the shortest path from a free
 * 20-second clip to a wallet purchase. It is the reason the feed earns its keep
 * rather than just consuming attention.
 */
export function TrailerCTA({ titleId, titleName }: { titleId: string; titleName: string }) {
  return (
    <Pressable
      onPress={() => router.push(`/title/${titleId}`)}
      accessibilityRole="button"
      accessibilityLabel={`Watch the full title, ${titleName}`}
      className="flex-row items-center gap-2 rounded-lg border border-white/25 bg-black/45 px-3 py-2.5"
    >
      <View className="h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
        <Ionicons name="play" size={14} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text variant="caption" className="text-white/70">
          Watch the full film
        </Text>
        <Text variant="label" numberOfLines={1} className="font-bold text-white">
          {titleName}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
    </Pressable>
  );
}
