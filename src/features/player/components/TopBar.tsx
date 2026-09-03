import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Text } from '@/ui';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  onSettings: () => void;
  onLock: () => void;
  paddingTop: number;
}

export function TopBar({ title, subtitle, onSettings, onLock, paddingTop }: TopBarProps) {
  return (
    <View
      style={{ paddingTop }}
      className="absolute left-0 right-0 flex-row items-center gap-3 px-4"
    >
      <BackButton tone="dark" />

      <View className="flex-1">
        <Text variant="label" numberOfLines={1} className="font-bold text-white">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" numberOfLines={1} className="text-white/60">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onLock}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Lock controls"
        className="h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-black/25"
      >
        <Ionicons name="lock-open-outline" size={17} color="#FFFFFF" />
      </Pressable>

      <Pressable
        onPress={onSettings}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Playback settings"
        className="h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-black/25"
      >
        <Ionicons name="settings-outline" size={17} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
