import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type Edge = 'top' | 'bottom';

export interface ScreenProps {
  children: ReactNode;
  className?: string;
  edges?: readonly Edge[];
  padded?: boolean;
}

/**
 * Screen container.
 *
 * Uses a plain View plus useSafeAreaInsets rather than <SafeAreaView>.
 *
 * Why: NativeWind only maps `className` onto React Native's own components.
 * SafeAreaView comes from react-native-safe-area-context, so `className` on it
 * was silently dropped, `flex-1 bg-white` never applied, every screen lost its
 * flex context, and bottom-anchored layout (`mt-auto`) collapsed. The result
 * rendered as unstyled document flow.
 *
 * Rule of thumb: className is safe on core RN components (View, Text,
 * Pressable, TextInput, ScrollView, Image). Anything from a library needs an
 * explicit style prop or a cssInterop registration.
 */
export function Screen({
  children,
  className = '',
  edges = ['top', 'bottom'],
  padded = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
      }}
      className="bg-white"
    >
      <View className={`flex-1 ${padded ? 'px-4' : ''} ${className}`}>{children}</View>
    </View>
  );
}
