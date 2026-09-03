import { View } from 'react-native';
import { Button, Text } from '@/ui';
import { formatTimecode } from '@/lib/format';

/**
 * Shown when a title is reopened part way through.
 *
 * Resuming silently is usually right, but not always: someone who finished a
 * film last week and reopened it probably wants the start. Asking costs one tap
 * and removes the guess.
 */
export function ResumePrompt({
  position,
  onResume,
  onRestart,
}: {
  position: number;
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/70 px-10">
      <Text variant="heading" className="text-center text-white">
        Pick up where you left off?
      </Text>
      <Text variant="body" className="mt-1 text-center text-white/60">
        You stopped at {formatTimecode(position)}
      </Text>

      <View className="mt-6 w-full gap-3">
        <Button label={`Resume from ${formatTimecode(position)}`} onPress={onResume} />
        <Button label="Start from the beginning" variant="secondary" onPress={onRestart} />
      </View>
    </View>
  );
}
