import { View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './Text';

export interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

/** Falls back to an initial so a missing photo never looks like a broken image. */
export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-brand-500"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text
        className="font-bold text-white"
        style={{ fontSize: Math.max(size * 0.4, 12) }}
      >
        {name.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}
