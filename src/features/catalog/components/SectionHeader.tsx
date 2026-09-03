import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { brand } from '@/ui/theme/colors';

export function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-4">
      <Text variant="heading" className="text-[19px]">
        {title}
      </Text>

      {onSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
          className="flex-row items-center gap-0.5"
        >
          <Text variant="label" className="font-bold text-brand-500">
            See all
          </Text>
          <Ionicons name="chevron-forward" size={14} color={brand[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}
