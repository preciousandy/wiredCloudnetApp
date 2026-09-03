import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, SegmentedTabs, Text, type SegmentOption } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { formatMoney, multiply, parseMoneyInput, subtract } from '@/lib/money';

export type PricingMode = 'free' | 'premium';

const MODES: readonly SegmentOption<PricingMode>[] = [
  { value: 'free', label: 'Free', icon: 'globe-outline' },
  { value: 'premium', label: 'Premium', icon: 'diamond-outline' },
];

export function PricingSection({
  mode,
  onModeChange,
  price,
  onPriceChange,
  error,
}: {
  mode: PricingMode;
  onModeChange: (mode: PricingMode) => void;
  price: string;
  onPriceChange: (value: string) => void;
  error?: string;
}) {
  const parsed = parseMoneyInput(price, 'CP');

  return (
    <View className="gap-4">
      <SegmentedTabs options={MODES} value={mode} onChange={onModeChange} />

      {mode === 'premium' ? (
        <View className="gap-3">
          <Input
            label="Price (in CloudPoints)"
            placeholder="500"
            value={price}
            onChangeText={(v) => onPriceChange(v.replace(/[^\d.]/g, ''))}
            keyboardType="numeric"
            inputMode="numeric"
            error={error}
            leftSlot={
              <Text variant="caption" className="font-bold text-brand-600">
                CP
              </Text>
            }
            rightSlot={
              parsed ? (
                <Text variant="caption" className="font-medium text-neutral-500">
                  ≈ ${(parsed.minor / 200).toFixed(2)} USD
                </Text>
              ) : undefined
            }
            hint="Exchange rate: 1 USD = 200 CP (1 CP = $0.005)"
          />
        </View>
      ) : (
        <View className="flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
          <Ionicons name="information-circle-outline" size={15} color={neutral[400]} />
          <Text variant="caption" className="flex-1">
            Free content reaches the widest audience and still counts toward your
            follower growth.
          </Text>
        </View>
      )}
    </View>
  );
}
