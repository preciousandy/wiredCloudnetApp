import { useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { brand } from './theme/colors';

/** CLOUD stays white, NET takes the brand colour. */
const LETTERS = [
  { char: 'C', brandColour: false },
  { char: 'L', brandColour: false },
  { char: 'O', brandColour: false },
  { char: 'U', brandColour: false },
  { char: 'D', brandColour: false },
  { char: 'N', brandColour: true },
  { char: 'E', brandColour: true },
  { char: 'T', brandColour: true },
];

/**
 * Every letter bobs on its own clock.
 *
 * The durations and delays below are deliberately awkward numbers. Give letters
 * a shared period, or periods that divide into each other, and within a few
 * seconds they drift into step and the whole word pulses as one block. Sizes
 * that never divide evenly keep them permanently out of phase, which is what
 * makes it read as floating rather than flashing.
 */
export function AnimatedWordmark({ size = 18 }: { size?: number }) {
  return (
    <View
      className="flex-row items-center gap-2"
      accessibilityRole="header"
      accessibilityLabel="CloudNet"
    >
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: size * 2.1, height: size * 1.15 }}
        contentFit="contain"
      />

      <View className="flex-row items-center">
        {LETTERS.map((letter, index) => (
          <Letter
            key={`${letter.char}-${index}`}
            char={letter.char}
            index={index}
            size={size}
            brandColour={letter.brandColour}
          />
        ))}
      </View>
    </View>
  );
}

function Letter({
  char,
  index,
  size,
  brandColour,
}: {
  char: string;
  index: number;
  size: number;
  brandColour: boolean;
}) {
  const float = useSharedValue(0);

  useEffect(() => {
    // Prime-ish spacing so no two letters share a rhythm.
    const duration = 1180 + index * 173;
    const startDelay = (index * 337) % 1100;

    float.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration + 91, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, float]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -float.value * 3.2 }],
    opacity: 0.82 + float.value * 0.18,
  }));

  return (
    <Animated.Text
      style={[
        {
          color: brandColour ? brand[500] : '#FFFFFF',
          fontSize: size,
          fontWeight: '800',
          letterSpacing: 1.4,
        },
        style,
      ]}
    >
      {char}
    </Animated.Text>
  );
}
