import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoneyText, Text } from '@/ui';
import type { TitleSummary } from '@/api/schemas/catalog';

/**
 * Price, or the absence of one, in a single consistent chip.
 *
 * Entitlement wins over price: once a user owns something, showing the price
 * again is confusing and feels like being asked to pay twice.
 */
export function PriceTag({ title, size = 'md' }: { title: TitleSummary; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  if (title.entitled) {
    return (
      <View className={`flex-row items-center gap-1 rounded-lg bg-neutral-900/85 ${pad}`}>
        <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
        <Text variant="caption" className="font-bold text-white">
          Owned
        </Text>
      </View>
    );
  }

  if (title.access.type === 'free' || !title.access.price) {
    return (
      <View className={`rounded-lg bg-neutral-900/85 ${pad}`}>
        <Text variant="caption" className="font-bold text-white">
          Free
        </Text>
      </View>
    );
  }

  return (
    <View className={`rounded-lg bg-success ${pad}`}>
      <MoneyText
        value={title.access.price}
        variant="caption"
        className="font-bold text-white"
      />
    </View>
  );
}
