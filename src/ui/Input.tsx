import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, leftSlot, rightSlot, className = '', onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-danger bg-danger/5'
    : focused
      ? 'border-brand-500'
      : 'border-neutral-200 bg-neutral-50';

  return (
    <View className="w-full">
      {label ? (
        <Text variant="label" className="mb-1 ml-1">
          {label}
        </Text>
      ) : null}

      {/**
       * A multiline field cannot share the single line container.
       *
       * The box is a fixed h-12; give the TextInput inside it a taller height
       * and the text renders outside the border, which is what the description
       * field was doing. Multiline gets its own box that grows instead.
       */}
      <View
        className={`flex-row gap-2 rounded-lg border px-3 ${borderClass} ${
          rest.multiline ? 'min-h-[112px] items-start py-2.5' : 'h-12 items-center'
        }`}
      >
        {leftSlot}
        <TextInput
          ref={ref}
          className={`flex-1 text-[15px] leading-[21px] text-neutral-900 ${className}`}
          textAlignVertical={rest.multiline ? 'top' : 'center'}
          style={rest.multiline ? [{ height: 92 }, rest.style] : rest.style}
          placeholderTextColor="#A1A1AA"
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightSlot}
      </View>

      {error ? (
        <Text variant="caption" className="mt-1 ml-1 text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" className="mt-1 ml-1">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
