import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export interface SliderProps {
  /** 0 to 1. */
  value: number;
  onSlidingStart?: () => void;
  /** Fires continuously while dragging, for a live time readout. */
  onValueChange?: (value: number) => void;
  /** Fires once on release. Do the actual seek here. */
  onSlidingComplete: (value: number) => void;
  /** 0 to 1. Rendered behind the fill, e.g. how much video is buffered. */
  bufferedValue?: number;
  disabled?: boolean;
  height?: number;
  tone?: 'light' | 'dark';
  accessibilityLabel?: string;
}

const THUMB = 14;

/** Animated.View cannot take className, so the brand colour is referenced directly. */
const BRAND = '#F2702D';

/**
 * Gesture-driven slider.
 *
 * Built rather than installed because the player needs three things off-the-shelf
 * sliders do not give us together: a buffered track behind the fill, a thumb that
 * grows on touch, and a value that stops following the prop while the user is
 * dragging. That last one matters most. Without it, every playback tick yanks the
 * thumb back under the finger and scrubbing a long film becomes impossible.
 */
export function Slider({
  value,
  onSlidingStart,
  onValueChange,
  onSlidingComplete,
  bufferedValue = 0,
  disabled = false,
  height = 4,
  tone = 'dark',
  accessibilityLabel = 'Seek',
}: SliderProps) {
  const [width, setWidth] = useState(0);

  const progress = useSharedValue(value);
  const isDragging = useSharedValue(false);

  // Follow the prop only when the user is not the one moving it.
  useDerivedValue(() => {
    if (!isDragging.value) progress.value = value;
  }, [value]);

  const clamp = (n: number) => Math.min(Math.max(n, 0), 1);

  const commit = (next: number) => {
    onSlidingComplete(next);
  };

  const begin = () => {
    onSlidingStart?.();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && width > 0)
    // Claim the gesture immediately: inside a player the parent is usually a
    // tap-to-toggle-controls Pressable, which would otherwise swallow the drag.
    .activeOffsetX([-2, 2])
    .onBegin((event) => {
      isDragging.value = true;
      runOnJS(begin)();
      progress.value = clamp(event.x / width);
      if (onValueChange) runOnJS(onValueChange)(progress.value);
    })
    .onChange((event) => {
      progress.value = clamp(event.x / width);
      if (onValueChange) runOnJS(onValueChange)(progress.value);
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(commit)(progress.value);
    });

  const tap = Gesture.Tap()
    .enabled(!disabled && width > 0)
    .onEnd((event) => {
      const next = clamp(event.x / width);
      progress.value = next;
      runOnJS(commit)(next);
    });

  const gesture = Gesture.Race(pan, tap);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
    transform: [
      { translateX: -THUMB / 2 },
      { scale: withTiming(isDragging.value ? 1.35 : 1, { duration: 120 }) },
    ],
  }));

  const trackColour = tone === 'dark' ? 'bg-white/25' : 'bg-neutral-200';
  const bufferColour = tone === 'dark' ? 'bg-white/40' : 'bg-neutral-300';

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <GestureDetector gesture={gesture}>
      {/* Generous vertical padding: a 4px track is far too thin to hit reliably. */}
      <View
        onLayout={onLayout}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
        className="w-full justify-center py-3"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <View className={`w-full overflow-hidden rounded-full ${trackColour}`} style={{ height }}>
          <View
            className={`absolute h-full ${bufferColour}`}
            style={{ width: `${Math.min(Math.max(bufferedValue, 0), 1) * 100}%` }}
          />
          <Animated.View style={[{ height: '100%', backgroundColor: BRAND }, fillStyle]} />
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: BRAND,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
