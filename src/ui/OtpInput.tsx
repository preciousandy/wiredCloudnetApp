import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Drives the border colour without the parent having to style each box. */
  state?: 'default' | 'error' | 'success';
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

/**
 * Fixed-length code entry.
 *
 * One hidden TextInput sits behind the boxes rather than one input per digit.
 * That single change is what makes SMS autofill, paste, and hardware keyboards
 * behave correctly, per-box inputs fight all three.
 */
export function OtpInput({
  length = 4,
  value,
  onChange,
  state = 'default',
  autoFocus = true,
  onComplete,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) {
      onComplete?.(digits);
    }
  };


  const borderFor = (index: number): string => {
    if (state === 'error') return 'border-danger';
    if (state === 'success') return 'border-success';
    const isActive = focused && index === Math.min(value.length, length - 1);
    if (isActive) return 'border-brand-500';
    if (value[index]) return 'border-neutral-900';
    return 'border-neutral-300';
  };

  return (
    <View className="w-full">
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        accessibilityLabel={`${length} digit verification code`}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0,
          zIndex: 1,
        }}
      />

      <View className="flex-row justify-center gap-3" pointerEvents="none">
        {Array.from({ length }).map((_, index) => (
          <View
            key={index}
            className={`h-16 w-14 items-center justify-center rounded-lg border-2 bg-neutral-50 ${borderFor(index)}`}
          >
            <TextInput
              editable={false}
              value={value[index] ?? ''}
              className="text-center text-[26px] font-bold text-neutral-900"
              pointerEvents="none"
            />
          </View>
        ))}
      </View>
    </View>
  );
}
