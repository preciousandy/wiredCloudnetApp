import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Input, type InputProps } from './Input';
import { Text } from './Text';
import { checkPassword } from '@/lib/validation';

export interface PasswordInputProps extends Omit<InputProps, 'secureTextEntry' | 'rightSlot'> {
  /** Shows the strength meter and rule checklist. Off for sign-in. */
  showStrength?: boolean;
}

const BAR_COLOURS = ['bg-neutral-200', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-success'];

export function PasswordInput({ showStrength = false, value = '', ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const check = checkPassword(String(value));
  const hasInput = String(value).length > 0;

  return (
    <View className="w-full">
      <Input
        {...rest}
        value={value}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        rightSlot={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          >
            <Text variant="label" className="text-brand-500">
              {visible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        }
      />

      {showStrength && hasInput ? (
        <View className="mt-3">
          <View className="flex-row gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < check.score ? BAR_COLOURS[check.score] : 'bg-neutral-200'
                }`}
              />
            ))}
          </View>

          <Text variant="caption" className="mt-1.5">
            Strength: {check.label}
          </Text>

          <View className="mt-2 gap-1">
            {check.rules.map((rule) => (
              <Text
                key={rule.text}
                variant="caption"
                className={rule.met ? 'text-success' : 'text-neutral-400'}
              >
                {rule.met ? '✓' : '○'}  {rule.text}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
