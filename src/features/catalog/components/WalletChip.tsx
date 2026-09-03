import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MoneyText, Text } from '@/ui';
import { useWallet } from '@/features/wallet/hooks/useWallet';

/**
 * Balance in reach at all times. Almost everything on Home costs money, and
 * making someone hunt for their balance mid-purchase is how carts get abandoned.
 * Read from the server on mount, never predicted locally.
 */
export function WalletChip({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { data, isPending } = useWallet();
  const onArtwork = tone === 'dark';

  return (
    <Pressable
      onPress={() => router.push('/wallet')}
      accessibilityRole="button"
      accessibilityLabel="Open your wallet"
      className={`h-10 flex-row items-center gap-1.5 rounded-lg px-2.5 ${
        onArtwork ? 'border border-white/30 bg-black/60' : 'bg-brand-50'
      }`}
    >
      <Ionicons
        name="wallet-outline"
        size={16}
        color={onArtwork ? '#FFFFFF' : '#DB5A19'}
      />
      {isPending || !data ? (
        <Text variant="label" className={onArtwork ? 'font-bold text-white' : 'font-bold text-brand-700'}>
          ...
        </Text>
      ) : (
        <MoneyText
          value={data.balance}
          variant="label"
          className={onArtwork ? 'font-bold text-white' : 'font-bold text-brand-700'}
        />
      )}
    </Pressable>
  );
}
