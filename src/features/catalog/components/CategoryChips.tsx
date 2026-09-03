import { Pressable, ScrollView } from 'react-native';
import { Text } from '@/ui';
import type { Category } from '@/api/schemas/catalog';

export function CategoryChips({
  categories,
  value,
  onChange,
  onLongPress,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  /** Long press opens the full browse screen for that category. */
  onLongPress?: (id: string, label: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {categories.map((category) => {
        const active = category.id === value;
        return (
          <Pressable
            key={category.id}
            onPress={() => onChange(category.id)}
            onLongPress={() => onLongPress?.(category.id, category.label)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`h-9 justify-center rounded-lg border px-3.5 ${
              active ? 'border-brand-500 bg-brand-500' : 'border-neutral-200 bg-white'
            }`}
          >
            <Text
              variant="label"
              className={active ? 'font-bold text-white' : 'text-neutral-600'}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
