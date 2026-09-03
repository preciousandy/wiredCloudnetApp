import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text } from '@/ui';
import type { TitleSummary } from '@/api/schemas/catalog';

const COUNTDOWN_SECONDS = 8;

/**
 * End card.
 *
 * Autoplay counts down rather than jumping straight in, and the countdown stops
 * the moment the user touches anything. Sliding someone into another title
 * unasked is how autoplay earns its bad reputation.
 */
export function NextUp({
  title,
  autoplay,
  onPlay,
  onDismiss,
}: {
  title: TitleSummary;
  autoplay: boolean;
  onPlay: () => void;
  onDismiss: () => void;
}) {
  const [remaining, setRemaining] = useState(autoplay ? COUNTDOWN_SECONDS : -1);

  useEffect(() => {
    if (remaining < 0) return;
    if (remaining === 0) {
      onPlay();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onPlay]);

  const cancelCountdown = () => setRemaining(-1);

  return (
    <View className="absolute inset-0 justify-center bg-black/85 px-6">
      <Text variant="caption" className="text-white/60">
        {remaining > 0 ? `Playing next in ${remaining}` : 'Up next'}
      </Text>

      <Pressable
        onPress={() => {
          cancelCountdown();
          onPlay();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Play ${title.title}`}
        className="mt-3 flex-row items-center gap-3"
      >
        <Image
          source={{ uri: title.posterUrl }}
          style={{ width: 78, height: 112, borderRadius: 8 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text variant="heading" numberOfLines={2} className="text-white">
            {title.title}
          </Text>
          <Text variant="caption" numberOfLines={1} className="mt-1 text-white/60">
            {title.creator.displayName}
          </Text>
        </View>
        <Ionicons name="play-circle" size={38} color="#F2702D" />
      </Pressable>

      <View className="mt-6 gap-3">
        <Button
          label="Play now"
          onPress={() => {
            cancelCountdown();
            onPlay();
          }}
        />
        <Button
          label="Done watching"
          variant="secondary"
          onPress={() => {
            cancelCountdown();
            onDismiss();
          }}
        />
      </View>
    </View>
  );
}
