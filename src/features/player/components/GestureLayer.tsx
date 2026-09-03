import { useCallback, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Brightness from 'expo-brightness';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';

export interface GestureLayerProps {
  onTap: () => void;
  onSeekBy: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  getVolume: () => number;
  enabled: boolean;
}

type Hud = { kind: 'brightness' | 'volume'; value: number } | null;

const DOUBLE_TAP_SEEK = 10;
/** Full screen height equals a full sweep of the range. */
const SWEEP_SENSITIVITY = 1.6;

/**
 * Drag gestures over the video.
 *
 * Left half is brightness, right half is volume, the convention every video app
 * has trained people on. Volume adjusts the player rather than the device: a
 * video app that hijacks system volume is a nuisance, and on Android it needs a
 * permission we should not be asking for.
 */
export function GestureLayer({
  onTap,
  onSeekBy,
  onVolumeChange,
  getVolume,
  enabled,
}: GestureLayerProps) {
  const { width, height } = useWindowDimensions();
  const [hud, setHud] = useState<Hud>(null);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startValue = useRef(0);
  const isLeft = useRef(false);

  const showHud = useCallback((next: NonNullable<Hud>) => {
    setHud(next);
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHud(null), 700);
  }, []);

  const beginDrag = useCallback(
    async (x: number) => {
      isLeft.current = x < width / 2;
      if (isLeft.current) {
        try {
          startValue.current = await Brightness.getBrightnessAsync();
        } catch {
          startValue.current = 0.5;
        }
      } else {
        startValue.current = getVolume();
      }
    },
    [width, getVolume],
  );

  const applyDrag = useCallback(
    (translationY: number) => {
      const delta = (-translationY / height) * SWEEP_SENSITIVITY;
      const next = Math.min(Math.max(startValue.current + delta, 0), 1);

      if (isLeft.current) {
        void Brightness.setBrightnessAsync(next).catch(() => undefined);
        showHud({ kind: 'brightness', value: next });
      } else {
        onVolumeChange(next);
        showHud({ kind: 'volume', value: next });
      }
    },
    [height, onVolumeChange, showHud],
  );

  const handleDoubleTap = useCallback(
    (x: number) => {
      onSeekBy(x < width / 2 ? -DOUBLE_TAP_SEEK : DOUBLE_TAP_SEEK);
    },
    [width, onSeekBy],
  );

  const pan = Gesture.Pan()
    .enabled(enabled)
    // Vertical only, so a horizontal swipe still belongs to navigation.
    .activeOffsetY([-12, 12])
    .failOffsetX([-20, 20])
    .onBegin((event) => runOnJS(beginDrag)(event.x))
    .onUpdate((event) => runOnJS(applyDrag)(event.translationY));

  const doubleTap = Gesture.Tap()
    .enabled(enabled)
    .numberOfTaps(2)
    .maxDuration(260)
    .onEnd((event) => runOnJS(handleDoubleTap)(event.x));

  const singleTap = Gesture.Tap()
    .enabled(enabled)
    .numberOfTaps(1)
    .onEnd(() => runOnJS(onTap)());

  // Double tap must lose to nothing and win over single tap.
  const gesture = Gesture.Race(pan, Gesture.Exclusive(doubleTap, singleTap));

  return (
    <GestureDetector gesture={gesture}>
      <View className="absolute inset-0">
        {hud ? (
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <View className="items-center gap-2 rounded-lg bg-black/60 px-5 py-4">
              <Ionicons
                name={hud.kind === 'brightness' ? 'sunny' : 'volume-high'}
                size={22}
                color="#FFFFFF"
              />
              <View className="h-1 w-24 overflow-hidden rounded-full bg-white/25">
                <View className="h-full bg-white" style={{ width: `${hud.value * 100}%` }} />
              </View>
              <Text variant="caption" className="font-bold text-white">
                {Math.round(hud.value * 100)}%
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}
