import { ActivityIndicator, View } from 'react-native';
import { Text } from './Text';
import { brand } from './theme/colors';

/** Consistent end-of-list feedback, so every paginated list behaves the same. */
export function ListFooter({
  loading,
  hasMore,
  count,
  endLabel = 'That is everything',
}: {
  loading: boolean;
  hasMore: boolean;
  count: number;
  endLabel?: string;
}) {
  if (loading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color={brand[500]} />
      </View>
    );
  }

  // Only claim the end of a list once there is enough in it to be worth saying.
  if (!hasMore && count > 8) {
    return (
      <View className="items-center py-6">
        <Text variant="caption" className="text-neutral-400">
          {endLabel}
        </Text>
      </View>
    );
  }

  return <View className="h-4" />;
}
