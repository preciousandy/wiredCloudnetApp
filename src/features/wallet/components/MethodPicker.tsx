import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import type { PaymentMethod } from '@/api/schemas/wallet';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  paystack: 'flash-outline',
  razorpay: 'sparkles-outline',
  card: 'card-outline',
  wallet: 'wallet-outline',
  transfer: 'business-outline',
  crypto: 'logo-usd',
};

export function MethodPicker({
  methods,
  value,
  onChange,
}: {
  methods: PaymentMethod[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <View className="overflow-hidden rounded-lg border border-neutral-200">
      {methods.map((method, index) => {
        const selected = method.id === value;
        const disabled = !method.available;

        return (
          <Pressable
            key={method.id}
            disabled={disabled}
            onPress={() => onChange(method.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            className={`flex-row items-center gap-3 px-4 py-3.5 ${
              index > 0 ? 'border-t border-neutral-100' : ''
            } ${selected ? 'bg-brand-50' : ''} ${disabled ? 'opacity-40' : ''}`}
          >
            <Ionicons
              name={ICONS[method.id] ?? 'wallet-outline'}
              size={20}
              color={selected ? brand[600] : neutral[600]}
            />

            <View className="flex-1">
              <Text variant="label" className="font-bold text-neutral-900">
                {method.label}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {disabled ? 'Coming soon' : method.description}
              </Text>
            </View>

            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={19}
              color={selected ? brand[500] : neutral[300]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
