import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import type { BroadcastHealth } from '../broadcast';

const TONE: Record<BroadcastHealth['quality'], { color: string; label: string }> = {
  good: { color: '#22C55E', label: 'Good' },
  fair: { color: '#F59E0B', label: 'Fair' },
  poor: { color: '#EF4444', label: 'Poor' },
};

/**
 * Connection quality, in three bars.
 *
 * Deliberately not a bitrate number. A creator mid broadcast cannot act on
 * "1.9 Mbps"; they can act on "poor, move closer to the router". The raw figures
 * are still available to support through the ordinary logs.
 */
export function HealthBadge({ health }: { health: BroadcastHealth }) {
  const tone = TONE[health.quality];
  const bars = health.quality === 'good' ? 3 : health.quality === 'fair' ? 2 : 1;

  return (
    <View
      className="flex-row items-center gap-1.5 rounded bg-black/55 px-2.5 py-1.5"
      accessibilityLabel={`Connection ${tone.label}`}
    >
      <View className="flex-row items-end gap-0.5">
        {[6, 9, 12].map((height, index) => (
          <View
            key={height}
            style={{
              width: 3,
              height,
              borderRadius: 1,
              backgroundColor: index < bars ? tone.color : 'rgba(255,255,255,0.28)',
            }}
          />
        ))}
      </View>
      {health.quality !== 'good' ? (
        <Text variant="caption" className="font-bold text-white">
          {tone.label}
        </Text>
      ) : null}
      {health.droppedFrames > 0 ? (
        <View className="flex-row items-center gap-1">
          <Ionicons name="alert-circle-outline" size={11} color="rgba(255,255,255,0.7)" />
          <Text variant="caption" className="text-white/70">
            {health.droppedFrames}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
