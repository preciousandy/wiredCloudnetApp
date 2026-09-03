import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, MoneyText, Screen, Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { useSession } from '@/store/session';
import { useWallet } from '@/features/wallet/hooks/useWallet';

interface Item {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href?: string;
  danger?: boolean;
}

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Profile', href: '/(tabs)/profile' },
      { icon: 'notifications-outline', label: 'Notifications', href: '/notifications' },
      { icon: 'wallet-outline', label: 'Wallet and transactions', href: '/wallet' },
      { icon: 'bookmark-outline', label: 'My library', href: '/(tabs)/library' },
      { icon: 'receipt-outline', label: 'Purchase history', href: '/wallet/transactions' },
      { icon: 'bookmark-outline', label: 'Watchlist', href: '/watchlist' },
      { icon: 'radio-outline', label: 'Live events', href: '/live' },
    ],
  },
  {
    title: 'Creating',
    items: [
      { icon: 'cloud-upload-outline', label: 'Upload with CloudIt', href: '/(tabs)/cloudit' },
      { icon: 'stats-chart-outline', label: 'Creator dashboard', href: '/creator/dashboard' },
      { icon: 'albums-outline', label: 'My uploads', href: '/creator/manage' },
      { icon: 'cash-outline', label: 'Earnings and payouts', href: '/creator/dashboard' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help and FAQ', href: '/help' },
      { icon: 'chatbubble-ellipses-outline', label: 'Contact support', href: '/support' },
      { icon: 'document-text-outline', label: 'Terms and privacy', href: '/legal/terms' },
      { icon: 'settings-outline', label: 'Settings', href: '/settings' },
    ],
  },
];

export default function Menu() {
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const { data: wallet } = useWallet();

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Menu</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-6 flex-row items-center gap-3 rounded-lg bg-neutral-50 p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-500">
            <Text variant="heading" className="text-white">
              {(user?.displayName ?? 'C').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text variant="heading">{user?.displayName ?? 'Your account'}</Text>
            <Text variant="caption">@{user?.username ?? 'cloudnet'}</Text>
          </View>
          {wallet ? (
            <View className="items-end">
              <Text variant="caption">Balance</Text>
              <MoneyText value={wallet.balance} variant="label" className="font-bold" />
            </View>
          ) : null}
        </View>

        {GROUPS.map((group) => (
          <View key={group.title} className="mt-7">
            <Text variant="caption" className="mb-2 ml-1 uppercase tracking-widest">
              {group.title}
            </Text>

            <View className="overflow-hidden rounded-lg border border-neutral-200">
              {group.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  onPress={item.href ? () => router.push(item.href as never) : undefined}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  className={`flex-row items-center gap-3 px-4 py-3.5 ${
                    index > 0 ? 'border-t border-neutral-100' : ''
                  }`}
                >
                  <Ionicons name={item.icon} size={19} color={neutral[600]} />
                  <Text variant="body" className="flex-1">
                    {item.label}
                  </Text>
                  {item.href ? (
                    <Ionicons name="chevron-forward" size={16} color={neutral[300]} />
                  ) : (
                    <Text variant="caption" className="text-neutral-300">
                      Soon
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => {
            void signOut();
            router.replace('/(auth)/sign-in');
          }}
          accessibilityRole="button"
          className="mt-8 h-12 flex-row items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/5"
        >
          <Ionicons name="log-out-outline" size={18} color={brand[700]} />
          <Text variant="label" className="font-bold text-danger">
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
