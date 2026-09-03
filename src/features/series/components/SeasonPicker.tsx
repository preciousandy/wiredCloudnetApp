import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/ui';
import type { Season } from '@/api/schemas/series';

/**
 * Chips when there are few seasons. A dropdown for two options is a tap the user
 * should not have to make.
 */
export function SeasonPicker({
  seasons,
  value,
  onChange,
}: {
  seasons: Season[];
  value: number;
  onChange: (seasonNumber: number) => void;
}) {
  if (seasons.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {seasons.map((season) => {
        const active = season.seasonNumber === value;
        return (
          <Pressable
            key={season.seasonNumber}
            onPress={() => onChange(season.seasonNumber)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`h-9 justify-center rounded-lg border px-3.5 ${
              active ? 'border-brand-500 bg-brand-500' : 'border-neutral-200'
            }`}
          >
            <Text
              variant="label"
              className={active ? 'font-bold text-white' : 'text-neutral-600'}
            >
              {season.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
