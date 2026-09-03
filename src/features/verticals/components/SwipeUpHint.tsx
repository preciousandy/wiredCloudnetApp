import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';

/**
 * Shown when a creator's last vertical finishes.
 *
 * We stop rather than auto-jumping to the next creator: sliding someone into a
 * different person's work without asking makes the app feel like it lost their
 * place, and the whole point of grouping by creator is that you know whose work
 * you are watching.
 */
export function SwipeUpHint({ nextCreator }: { nextCreator?: string }) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withSequence(withTiming(-7, { duration: 700 }), withTiming(0, { duration: 700 })),
      -1,
      false,
    );
  }, [offset]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center">
      <View className="items-center gap-2 rounded-lg bg-black/55 px-5 py-4">
        <Animated.View style={style}>
          <Ionicons name="chevron-up" size={26} color="#FFFFFF" />
        </Animated.View>
        <Text variant="label" className="font-bold text-white">
          Swipe up for the next creator
        </Text>
        {nextCreator ? (
          <Text variant="caption" className="text-white/70">
            Next: {nextCreator}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
