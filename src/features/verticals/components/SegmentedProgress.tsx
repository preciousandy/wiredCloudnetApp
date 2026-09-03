import { View } from 'react-native';

export interface SegmentedProgressProps {
  count: number;
  index: number;
  /** 0 to 1 through the current item. */
  progress: number;
}

/**
 * Stories-style position indicator.
 *
 * A horizontal feed without this feels directionless: you cannot tell whether
 * you are on the creator's second clip or their last. Each segment is one
 * vertical, the active one fills as the video plays.
 */
export function SegmentedProgress({ count, index, progress }: SegmentedProgressProps) {
  return (
    <View className="flex-row gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
          <View
            className="h-full bg-white"
            style={{ width: i < index ? '100%' : i === index ? `${Math.min(progress, 1) * 100}%` : '0%' }}
          />
        </View>
      ))}
    </View>
  );
}
