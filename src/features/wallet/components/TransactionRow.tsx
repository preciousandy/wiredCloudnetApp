import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoneyText, Text } from '@/ui';
import { formatDateTime } from '@/lib/format';
import { money as semanticMoney, neutral, semantic } from '@/ui/theme/colors';
import type { Transaction } from '@/api/schemas/wallet';

const ICONS: Record<Transaction['type'], keyof typeof Ionicons.glyphMap> = {
  deposit: 'arrow-down-circle',
  purchase: 'film',
  refund: 'return-down-back',
  cashback: 'gift',
  bonus: 'sparkles',
  referral: 'people',
  withdrawal: 'arrow-up-circle',
  sale: 'cash',
};

/**
 * One ledger line.
 *
 * Status is shown explicitly rather than implied: a pending credit that looks
 * identical to a settled one is how people conclude the app has taken their
 * money and lost it.
 */
export function TransactionRow({ item }: { item: Transaction }) {
  const isCredit = item.direction === 'credit';
  const isPending = item.status === 'pending';
  const isDead = item.status === 'failed' || item.status === 'reversed';

  return (
    <View className="flex-row items-center gap-3 py-3.5">
      <View
        className={`h-10 w-10 items-center justify-center rounded-lg ${
          isDead ? 'bg-neutral-100' : isCredit ? 'bg-success/10' : 'bg-neutral-100'
        }`}
      >
        <Ionicons
          name={ICONS[item.type]}
          size={18}
          color={isDead ? neutral[400] : isCredit ? semanticMoney.credit : neutral[600]}
        />
      </View>

      <View className="flex-1">
        <Text variant="label" numberOfLines={1} className="font-bold text-neutral-900">
          {item.description}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {formatDateTime(item.createdAt)} · {item.reference}
        </Text>
      </View>

      <View className="items-end gap-0.5">
        <MoneyText
          value={item.amount}
          signed={isDead ? undefined : isCredit ? 'credit' : 'debit'}
          variant="label"
          className={`font-bold ${isDead ? 'text-neutral-400 line-through' : ''}`}
        />

        {isPending ? (
          <View className="rounded-lg px-1.5 py-0.5" style={{ backgroundColor: semantic.warningBg }}>
            <Text variant="caption" className="font-bold" style={{ color: semantic.warning }}>
              Pending
            </Text>
          </View>
        ) : isDead ? (
          <Text variant="caption" className="capitalize text-neutral-400">
            {item.status}
          </Text>
        ) : (
          <MoneyText value={item.balanceAfter} variant="caption" className="text-neutral-400" />
        )}
      </View>
    </View>
  );
}
