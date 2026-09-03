import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Fraction of screen height, or 'auto' to hug the content. */
  height?: number | 'auto';
  /** Disable dismissal while something important is in flight. */
  dismissable?: boolean;
}

const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 800;

/**
 * The one sheet.
 *
 * Before this, every sheet in the app was hand rolled, which is how a codebase
 * ends up with three different corner radii and two different backdrop opacities.
 *
 * Drag to dismiss follows the finger and only closes past a distance or a flick,
 * so a slow half-drag springs back instead of vanishing.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  height = 'auto',
  dismissable = true,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);

  const close = () => {
    translateY.value = 0;
    onClose();
  };

  const pan = Gesture.Pan()
    .enabled(dismissable)
    .onChange((event) => {
      // Downward only. Dragging up should not detach the sheet from the bottom.
      translateY.value = Math.max(0, translateY.value + event.changeY);
    })
    .onEnd((event) => {
      const shouldClose =
        translateY.value > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;

      if (shouldClose) {
        translateY.value = withTiming(600, { duration: 160 }, () => {
          runOnJS(close)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismissable ? close : undefined}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={dismissable ? close : undefined}
          accessibilityLabel="Close"
        />

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              sheetStyle,
              height === 'auto' ? undefined : { height: `${height * 100}%` },
              {
                paddingBottom: insets.bottom + 12,
                // NativeWind does not map className onto Animated.View, so the
                // sheet's own surface styling is explicit here.
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              },
            ]}
          >
            <View className="items-center pb-1 pt-3">
              <View className="h-1 w-10 rounded-full bg-neutral-300" />
            </View>

            {title ? (
              <View className="border-b border-neutral-100 px-5 pb-3 pt-1">
                <Text variant="heading">{title}</Text>
              </View>
            ) : null}

            <View className={height === 'auto' ? '' : 'flex-1'}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
