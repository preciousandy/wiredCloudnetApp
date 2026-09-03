import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';

export interface CenterControlsProps {
  playing: boolean;
  buffering: boolean;
  onTogglePlay: () => void;
  onSeekBy: (seconds: number) => void;
}

const SKIP = 10;

export function CenterControls({
  playing,
  buffering,
  onTogglePlay,
  onSeekBy,
}: CenterControlsProps) {
  return (
    <View
      className="absolute inset-0 flex-row items-center justify-center gap-12"
      pointerEvents="box-none"
    >
      <SkipButton direction="back" onPress={() => onSeekBy(-SKIP)} />

      <Pressable
        onPress={onTogglePlay}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause' : 'Play'}
        className="h-[68px] w-[68px] items-center justify-center rounded-full bg-black/45"
      >
        {/* No spinner here. The buffering indicator owns that, and swapping the
            play icon for a spinner makes the button look unresponsive. */}
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={32}
          color="#FFFFFF"
          style={{ marginLeft: playing ? 0 : 3 }}
        />
      </Pressable>

      <SkipButton direction="forward" onPress={() => onSeekBy(SKIP)} />
    </View>
  );
}

function SkipButton({
  direction,
  onPress,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
}) {
  const back = direction === 'back';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={14}
      accessibilityRole="button"
      accessibilityLabel={back ? `Back ${SKIP} seconds` : `Forward ${SKIP} seconds`}
      className="items-center justify-center"
    >
      <Ionicons name={back ? 'play-back' : 'play-forward'} size={28} color="#FFFFFF" />
      <Text variant="caption" className="mt-0.5 font-bold text-white/80">
        {SKIP}
      </Text>
    </Pressable>
  );
}
