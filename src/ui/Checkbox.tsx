import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
}

export function Checkbox({ checked, onChange, label, error }: CheckboxProps) {
  return (
    <View className="w-full">
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        className="flex-row items-start gap-3"
      >
        <View
          className={`mt-0.5 h-5 w-5 items-center justify-center rounded-lg border ${
            checked
              ? 'border-brand-500 bg-brand-500'
              : error
                ? 'border-danger'
                : 'border-neutral-300'
          }`}
        >
          {checked ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
        </View>

        <View className="flex-1">
          {typeof label === 'string' ? <Text variant="label">{label}</Text> : label}
        </View>
      </Pressable>

      {error ? (
        <Text variant="caption" className="ml-8 mt-1 text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
