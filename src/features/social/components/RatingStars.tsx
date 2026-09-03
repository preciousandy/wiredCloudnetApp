import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';

export function RatingStars({
  value,
  onChange,
  size = 20,
  count,
}: {
  value: number | null;
  onChange?: (rating: number) => void;
  size?: number;
  count?: number;
}) {
  const readOnly = !onChange;

  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value !== null && star <= Math.round(value);
        const Wrapper = readOnly ? View : Pressable;

        return (
          <Wrapper
            key={star}
            {...(readOnly
              ? {}
              : {
                  onPress: () => onChange(star),
                  hitSlop: 6,
                  accessibilityRole: 'button' as const,
                  accessibilityLabel: `Rate ${star} out of 5`,
                })}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? brand[500] : neutral[300]}
            />
          </Wrapper>
        );
      })}

      {value !== null ? (
        <Text variant="caption" className="ml-1 font-bold text-neutral-700">
          {value.toFixed(1)}
        </Text>
      ) : null}

      {count !== undefined && count > 0 ? (
        <Text variant="caption" className="text-neutral-400">
          ({count})
        </Text>
      ) : null}
    </View>
  );
}
