import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedWordmark, Text } from '@/ui';

/**
 * Wordmark, live, wallet and notifications, sitting on the hero artwork.
 *
 * The hamburger is gone: everything it held now lives on Profile, which is one
 * tap away in the tab bar. A menu that duplicates a tab is a second route to the
 * same place and only ever splits people's habits.
 *
 * Live left too. It is content, not chrome, so it appears as a row in the feed
 * when something is actually on. A permanent button for something usually empty
 * wastes the most valuable space on the screen, and the balance beside it needs
 * that width once it reaches seven figures.
 *
 * Backgrounds are solid enough to read against any poster. The earlier version
 * was near transparent, which looked fine over a dark frame and vanished over a
 * bright one.
 */
export function HeroTopBar({ balanceLabel }: { balanceLabel?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <AnimatedWordmark size={18} />

      <View className="flex-row items-center gap-2">
        {balanceLabel}

        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-black/60"
        >
          <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
