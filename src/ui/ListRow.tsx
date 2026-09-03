import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { neutral } from './theme/colors';

export interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  first?: boolean;
}

/**
 * The row that settings, menus and profile all share, so those three screens
 * cannot drift into three different visual languages.
 */
export function ListRow({
  icon,
  label,
  description,
  value,
  right,
  onPress,
  danger,
  first,
}: ListRowProps) {
  const content = (
    <View
      className={`flex-row items-center gap-3 px-4 py-3.5 ${
        first ? '' : 'border-t border-neutral-100'
      }`}
    >
      {icon ? (
        <Ionicons name={icon} size={19} color={danger ? '#DC2626' : neutral[600]} />
      ) : null}

      <View className="flex-1">
        <Text variant="body" className={danger ? 'text-danger' : ''}>
          {label}
        </Text>
        {description ? <Text variant="caption">{description}</Text> : null}
      </View>

      {value ? (
        <Text variant="label" className="text-neutral-500">
          {value}
        </Text>
      ) : null}

      {right}

      {onPress && !right ? (
        <Ionicons name="chevron-forward" size={16} color={neutral[300]} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </Pressable>
  );
}

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="mt-6">
      {title ? (
        <Text variant="caption" className="mb-2 ml-1 uppercase tracking-widest">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {children}
      </View>
    </View>
  );
}
