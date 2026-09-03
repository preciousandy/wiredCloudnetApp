import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/ui';
import { formatMoney, fromMajor, parseMoneyInput, type Money } from '@/lib/money';
import { neutral } from '@/ui/theme/colors';

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

export interface AmountFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  minimum?: Money;
}

/**
 * Amount entry.
 *
 * The raw string is kept in state rather than a parsed number, so a half-typed
 * "1." does not get mangled while the user is still typing. Conversion to Money
 * happens once, at submit.
 */
export function AmountField({ value, onChangeText, error, minimum }: AmountFieldProps) {
  const parsed = parseMoneyInput(value, 'CP');
  const points = parsed?.minor ?? 0;
  const usdEquivalent = (points / 200).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View className="w-full">
      <View className="mb-1 ml-1 flex-row items-center justify-between">
        <Text variant="label">CloudPoint Amount</Text>
        <Text variant="caption" className="font-semibold text-brand-600">
          1 USD = 200 CP
        </Text>
      </View>

      <View
        className={`h-16 flex-row items-center rounded-lg border px-4 ${
          error ? 'border-danger bg-danger/5' : 'border-neutral-200 bg-neutral-50'
        }`}
      >
        <TextInput
          value={value}
          onChangeText={(raw) => onChangeText(raw.replace(/[^\d.]/g, ''))}
          keyboardType="numeric"
          inputMode="numeric"
          placeholder="0"
          placeholderTextColor={neutral[300]}
          autoFocus
          accessibilityLabel="Amount to add"
          className="flex-1 text-[28px] font-bold text-neutral-900"
        />
        <View className="items-end">
          <Text variant="title" className="font-bold text-brand-600">
            CP
          </Text>
          {points > 0 ? (
            <Text variant="caption" className="font-medium text-neutral-500">
              ≈ ${usdEquivalent} USD
            </Text>
          ) : null}
        </View>
      </View>

      {error ? (
        <Text variant="caption" className="mt-1 ml-1 text-danger">
          {error}
        </Text>
      ) : minimum ? (
        <Text variant="caption" className="mt-1 ml-1">
          Minimum {formatMoney(minimum, { compactWhole: true })}
        </Text>
      ) : null}

      {points > 0 ? (
        <View className="mt-2.5 flex-row items-center justify-between rounded-lg bg-brand-50/80 px-3.5 py-2">
          <Text variant="caption" className="font-medium text-brand-800">
            You receive: <Text variant="caption" className="font-bold text-brand-900">{points.toLocaleString()} CP</Text>
          </Text>
          <Text variant="caption" className="font-bold text-brand-700">
            Cost: ${usdEquivalent} USD
          </Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => {
          const money = fromMajor(amount, 'CP');
          const selected = parsed?.minor === money.minor;
          const usd = (amount / 200).toFixed(2);
          return (
            <Pressable
              key={amount}
              onPress={() => onChangeText(String(amount))}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`h-10 justify-center rounded-lg border px-3 ${
                selected ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 bg-white'
              }`}
            >
              <Text
                variant="label"
                className={selected ? 'font-bold text-brand-700' : 'text-neutral-700'}
              >
                {formatMoney(money, { compactWhole: true })}{' '}
                <Text variant="caption" className={selected ? 'text-brand-600 font-medium' : 'text-neutral-400'}>
                  (${usd})
                </Text>
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
