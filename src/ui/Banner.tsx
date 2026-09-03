import { View } from 'react-native';
import { Text } from './Text';

export interface BannerProps {
  tone: 'error' | 'success' | 'info';
  message: string;
}

const TONES = {
  error: 'bg-danger/10 border-danger/30',
  success: 'bg-success/10 border-success/30',
  info: 'bg-brand-50 border-brand-200',
} as const;

const TEXT = {
  error: 'text-danger',
  success: 'text-success',
  info: 'text-brand-700',
} as const;

/** Inline feedback. Preferred over toasts for form errors, it stays put. */
export function Banner({ tone, message }: BannerProps) {
  return (
    <View className={`rounded-lg border px-3 py-2.5 ${TONES[tone]}`} accessibilityRole="alert">
      <Text variant="label" className={TEXT[tone]}>
        {message}
      </Text>
    </View>
  );
}
