import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { semantic } from './theme/colors';
import { useToastStore, type ToastItem, type ToastTone } from '@/store/toast';

const TONE: Record<ToastTone, { icon: keyof typeof Ionicons.glyphMap; colour: string }> = {
  success: { icon: 'checkmark-circle', colour: semantic.success },
  error: { icon: 'alert-circle', colour: semantic.danger },
  info: { icon: 'information-circle', colour: '#FFFFFF' },
};

function ToastRow({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), item.durationMs);
    return () => clearTimeout(timer);
  }, [item.id, item.durationMs, dismiss]);

  const tone = TONE[item.tone];

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(160)}
      layout={Layout.duration(180)}
    >
      <Pressable
        onPress={() => dismiss(item.id)}
        accessibilityRole="alert"
        accessibilityLabel={item.message}
        className="mb-2 flex-row items-center gap-2.5 rounded-lg bg-neutral-900 px-3.5 py-3"
      >
        <Ionicons name={tone.icon} size={18} color={tone.colour} />

        <Text variant="label" numberOfLines={2} className="flex-1 text-white">
          {item.message}
        </Text>

        {item.actionLabel ? (
          <Pressable
            onPress={() => {
              item.onAction?.();
              dismiss(item.id);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={item.actionLabel}
          >
            <Text variant="label" className="font-bold text-brand-400">
              {item.actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Rendered once at the root, above every screen.
 *
 * Toasts sit at the top rather than the bottom: the bottom of this app is a tab
 * bar, a player scrubber or a comment field, and covering any of those with a
 * transient message is how people mis-tap.
 */
export function ToastHost() {
  const queue = useToastStore((s) => s.queue);
  const insets = useSafeAreaInsets();

  if (queue.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, zIndex: 999 }}
    >
      {queue.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}

export { toast } from '@/store/toast';
