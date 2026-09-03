import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { brand, neutral } from './theme/colors';

export interface SwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

/**
 * Our own switch rather than React Native's, which renders differently enough
 * on iOS and Android to break a settings list visually.
 */
export function Switch({ value, onChange, disabled, accessibilityLabel }: SwitchProps) {
  const offset = useSharedValue(value ? 20 : 2);

  useEffect(() => {
    offset.value = withTiming(value ? 20 : 2, { duration: 160 });
  }, [value, offset]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        backgroundColor: value ? brand[500] : neutral[300],
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Animated.View
        style={[
          {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#FFFFFF',
          },
          knob,
        ]}
      />
    </Pressable>
  );
}
