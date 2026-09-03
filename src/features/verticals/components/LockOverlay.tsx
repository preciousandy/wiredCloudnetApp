import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Button, MoneyText, Text } from '@/ui';
import type { Money } from '@/lib/money';

/**
 * Premium vertical gate.
 *
 * The clip stays visible but blurred, which converts better than a black box:
 * you can see there is something worth paying for. Unlocking goes through the
 * wallet, so the server decides entitlement, never this screen.
 */
export function LockOverlay({
  price,
  onUnlock,
  busy,
}: {
  price: Money;
  onUnlock: () => void;
  busy?: boolean;
}) {
  return (
    <BlurView
      intensity={60}
      tint="dark"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
    >
      <View className="flex-1 items-center justify-center px-10">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white/15">
        <Ionicons name="lock-closed" size={26} color="#FFFFFF" />
      </View>

      <Text variant="heading" className="mt-4 text-center text-white">
        Members only
      </Text>
      <Text variant="body" className="mt-1 text-center text-white/70">
        Unlock this clip with your wallet balance.
      </Text>

      <View className="mt-4 flex-row items-baseline gap-1.5">
        <MoneyText value={price} variant="title" className="text-white" />
      </View>

        <View className="mt-5 w-full">
          <Button label="Unlock now" onPress={onUnlock} loading={busy} />
        </View>
      </View>
    </BlurView>
  );
}
