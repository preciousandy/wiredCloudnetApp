import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { formatTimecode } from '@/lib/format';
import type { TitleSummary } from '@/api/schemas/catalog';

/**
 * Continue watching uses a landscape still with a progress bar rather than a
 * poster. It is a different job from browsing: the user already chose this,
 * they just need to find their place again.
 */
export function ContinueCard({ title, width }: { title: TitleSummary; width: number }) {
  const watched = title.progressSeconds ?? 0;
  const pct = title.durationSeconds > 0 ? Math.min(watched / title.durationSeconds, 1) : 0;
  const remaining = Math.max(title.durationSeconds - watched, 0);

  return (
    <Pressable
      onPress={() => router.push(`/watch/${title.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Resume ${title.title}, ${formatTimecode(remaining)} remaining`}
      style={{ width }}
    >
      <View className="overflow-hidden rounded-lg bg-neutral-100" style={{ height: width * 0.56 }}>
        <Image
          source={{ uri: title.backdropUrl ?? title.posterUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={180}
        />

        <View className="absolute inset-0 items-center justify-center">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-black/55">
            <Ionicons name="play" size={20} color="#FFFFFF" />
          </View>
        </View>

        <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
          <View className="h-full bg-brand-500" style={{ width: `${pct * 100}%` }} />
        </View>
      </View>

      <Text variant="label" numberOfLines={1} className="mt-2 font-bold text-neutral-900">
        {title.title}
      </Text>
      <Text variant="caption">{formatTimecode(remaining)} left</Text>
    </Pressable>
  );
}
