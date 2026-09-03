import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text } from '@/ui';
import { formatDuration } from '@/lib/format';
import type { TitleSummary } from '@/api/schemas/catalog';
import { PriceTag } from './PriceTag';

export interface TitleCardProps {
  title: TitleSummary;
  width: number;
}

/** Poster tile used by carousels and grids so both stay visually identical. */
export function TitleCard({ title, width }: TitleCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/title/${title.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${title.title}, ${formatDuration(title.durationSeconds)}`}
      style={{ width }}
    >
      <View className="overflow-hidden rounded-lg bg-neutral-100" style={{ height: width * 1.45 }}>
        <Image
          source={{ uri: title.posterUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={180}
        />

        <View className="absolute left-2 top-2">
          <PriceTag title={title} size="sm" />
        </View>

        {title.badge ? (
          <View className="absolute right-2 top-2 rounded-lg bg-brand-500 px-1.5 py-0.5">
            <Text variant="caption" className="font-bold uppercase text-white">
              {title.badge}
            </Text>
          </View>
        ) : null}
      </View>

      <Text variant="label" numberOfLines={1} className="mt-2 font-bold text-neutral-900">
        {title.title}
      </Text>
      <Text variant="caption" numberOfLines={1}>
        {formatDuration(title.durationSeconds)} · {title.creator.displayName}
      </Text>
    </Pressable>
  );
}
