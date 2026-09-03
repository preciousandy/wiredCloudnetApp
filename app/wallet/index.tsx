import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, Screen, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { useTransactions, useWallet } from '@/features/wallet/hooks/useWallet';
import { BalanceCard } from '@/features/wallet/components/BalanceCard';
import { TransactionRow } from '@/features/wallet/components/TransactionRow';

export default function WalletHome() {
  const { data: wallet, isPending } = useWallet();
  const { data: transactions } = useTransactions();

  const recent = transactions?.items.slice(0, 6) ?? [];
  const pendingCount = transactions?.items.filter((t) => t.status === 'pending').length ?? 0;

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Wallet</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-5">
          <BalanceCard wallet={wallet} loading={isPending} />
        </View>

        {pendingCount > 0 ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5">
            <Ionicons name="time-outline" size={17} color="#D97706" />
            <Text variant="label" className="flex-1 text-warning">
              {pendingCount} transaction{pendingCount > 1 ? 's' : ''} still confirming
            </Text>
          </View>
        ) : null}

        {/* Add money and History live on the balance card itself. Nothing else
            belongs here: Withdraw is a creator action and lives in the creator
            dashboard, and Redeem was removed with it. */}

        <View className="mt-7 flex-row items-center justify-between">
          <Text variant="heading" className="text-[19px]">
            Recent activity
          </Text>
          {recent.length > 0 ? (
            <Text
              variant="label"
              className="font-bold text-brand-500"
              onPress={() => router.push('/wallet/transactions')}
            >
              See all
            </Text>
          ) : null}
        </View>

        {recent.length === 0 ? (
          <View className="items-center gap-2 py-14">
            <Ionicons name="receipt-outline" size={30} color={neutral[300]} />
            <Text variant="heading" className="text-center">
              No transactions yet
            </Text>
            <Text variant="body" className="text-center text-neutral-500">
              Add money to your wallet and buy your first title.
            </Text>
            <View className="mt-3 w-44">
              <Button
                label="Add money"
                size="sm"
                onPress={() => router.push('/wallet/fund')}
              />
            </View>
          </View>
        ) : (
          <View className="mt-1 divide-y divide-neutral-100">
            {recent.map((item) => (
              <TransactionRow key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
