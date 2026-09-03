import { useState } from 'react';
import { View } from 'react-native';
import { Slider, Text } from '@/ui';
import { formatTimecode } from '@/lib/format';
import { progressFraction, remainingSeconds } from '../lib/time';

export interface ScrubberProps {
  position: number;
  duration: number;
  buffered: number;
  onSeek: (seconds: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  disabled?: boolean;
}

/**
 * The scrub bar.
 *
 * While dragging we show the dragged time, not the playing time. Showing live
 * playback position under a finger that has moved elsewhere is disorienting, and
 * it is the single thing that made the old bar unusable, on top of not moving at all.
 */
export function Scrubber({
  position,
  duration,
  buffered,
  onSeek,
  onScrubStart,
  onScrubEnd,
  disabled,
}: ScrubberProps) {
  const [scrubbing, setScrubbing] = useState(false);
  const [preview, setPreview] = useState(0);

  const value = progressFraction(position, duration);
  const shown = scrubbing ? preview * duration : position;
  const remaining = remainingSeconds(shown, duration);

  return (
    <View className="w-full">
      <Slider
        value={value}
        bufferedValue={buffered}
        disabled={disabled || duration === 0}
        accessibilityLabel="Seek through the video"
        onSlidingStart={() => {
          setScrubbing(true);
          onScrubStart();
        }}
        onValueChange={setPreview}
        onSlidingComplete={(next) => {
          setScrubbing(false);
          onSeek(next * duration);
          onScrubEnd();
        }}
      />

      <View className="mt-0.5 flex-row items-center justify-between">
        <Text variant="caption" className="text-white/85">
          {formatTimecode(shown)}
        </Text>
        <Text variant="caption" className="text-white/60">
          {duration > 0 ? `-${formatTimecode(remaining)}` : '--:--'}
        </Text>
      </View>
    </View>
  );
}
