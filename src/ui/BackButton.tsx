import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { neutral } from './theme/colors';

export interface BackButtonProps {
  onPress?: () => void;
  /** Use on dark surfaces such as the player. */
  tone?: 'light' | 'dark';
}

/**
 * The one back affordance in the app.
 *
 * Every screen imports this rather than drawing its own, a back arrow that
 * changes shape between screens is the kind of small inconsistency that makes
 * an app feel unfinished. If the icon ever changes, it changes here once.
 */
export function BackButton({ onPress, tone = 'light' }: BackButtonProps) {
  const isDark = tone === 'dark';

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      className={`h-10 w-10 items-center justify-center rounded-lg border ${
        isDark ? 'border-white/20 bg-white/10' : 'border-neutral-200 bg-white'
      }`}
    >
      <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : neutral[800]} />
    </Pressable>
  );
}
