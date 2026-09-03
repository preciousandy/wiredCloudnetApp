import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface SkeletonProps {
  className?: string;
}

/**
 * Placeholder block for loading states.
 *
 * The className lives on an inner View rather than on Animated.View,
 * Animated.View is a Reanimated component, and NativeWind does not map
 * className onto library components. Same trap that broke Screen.
 */
export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style}>
      <View className={`rounded-lg bg-neutral-200 ${className}`} />
    </Animated.View>
  );
}
