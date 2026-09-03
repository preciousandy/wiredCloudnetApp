import { View } from 'react-native';
import { Text } from './Text';

export function Divider({ label }: { label?: string }) {
  if (!label) return <View className="h-px w-full bg-neutral-200" />;

  return (
    <View className="w-full flex-row items-center">
      <View className="h-px flex-1 bg-neutral-200" />
      <Text variant="caption" className="px-4 uppercase tracking-widest text-neutral-400">
        {label}
      </Text>
      <View className="h-px flex-1 bg-neutral-200" />
    </View>
  );
}
