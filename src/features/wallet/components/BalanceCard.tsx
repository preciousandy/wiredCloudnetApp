import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MoneyText, Skeleton, Text } from '@/ui';
import type { Wallet } from '@/api/schemas/wallet';

export function BalanceCard({ wallet, loading }: { wallet?: Wallet; loading: boolean }) {
  return (
    <View className="overflow-hidden rounded-lg">
      <LinearGradient colors={['#F2702D', '#DB5A19']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="gap-1 p-5">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" className="text-white/80">
              Available balance
            </Text>
            {wallet?.status === 'frozen' ? (
              <View className="rounded-lg bg-black/25 px-2 py-0.5">
                <Text variant="caption" className="font-bold text-white">
                  Frozen
                </Text>
              </View>
            ) : null}
          </View>

          {loading || !wallet ? (
            <Skeleton className="mt-1 h-10 w-44 bg-white/30" />
          ) : (
            <View>
              <MoneyText value={wallet.balance} variant="display" className="text-white" />
              <Text variant="caption" className="mt-0.5 font-medium text-white/90">
                ≈ ${(wallet.balance.minor / 200).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </Text>
            </View>
          )}

          <Text variant="caption" className="mt-1 text-white/70">
            Wallet ID {wallet?.walletId ?? '...'}
          </Text>

          <View className="mt-4 flex-row gap-2.5">
            <Pressable
              onPress={() => router.push('/wallet/fund')}
              accessibilityRole="button"
              accessibilityLabel="Add money to your wallet"
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-white"
            >
              <Ionicons name="add-circle" size={18} color="#DB5A19" />
              <Text variant="label" className="font-bold text-brand-700">
                Add money
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/wallet/transactions')}
              accessibilityRole="button"
              accessibilityLabel="View all transactions"
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/10"
            >
              <Ionicons name="receipt-outline" size={17} color="#FFFFFF" />
              <Text variant="label" className="font-bold text-white">
                History
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
