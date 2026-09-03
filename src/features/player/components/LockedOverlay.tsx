import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';

/**
 * When locked, this is the only thing that accepts a touch. Everything beneath
 * it, including the scrubber and the play button, is unreachable until unlocked.
 */
export function LockedOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <View className="absolute inset-0 items-center justify-center">
      <Pressable
        onPress={onUnlock}
        accessibilityRole="button"
        accessibilityLabel="Unlock controls"
        className="items-center gap-2 rounded-lg bg-black/55 px-5 py-4"
      >
        <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
        <Text variant="caption" className="font-bold text-white">
          Tap to unlock
        </Text>
      </Pressable>
    </View>
  );
}
