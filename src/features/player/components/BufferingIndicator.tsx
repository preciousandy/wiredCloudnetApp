import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/ui';

export function BufferingIndicator({ slow }: { slow: boolean }) {
  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      <View className="items-center gap-2 rounded-lg bg-black/45 px-5 py-4">
        <ActivityIndicator color="#F2702D" />
        {/* Only after a long wait, so a normal one second buffer stays quiet. */}
        {slow ? (
          <Text variant="caption" className="text-white/80">
            Slow connection, still loading
          </Text>
        ) : null}
      </View>
    </View>
  );
}
