import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountryPicker } from './CountryPicker';
import { Text } from './Text';
import { neutral } from './theme/colors';
import type { Country } from '@/lib/countries';
import { digitsOnly } from '@/lib/validation';

export interface PhoneInputProps {
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

/**
 * Phone field with the country selector inside the input, not beside it.
 *
 * Keeping the flag and dial code within the same bordered container is what
 * makes it read as one field rather than two controls that happen to be
 * adjacent, the dial code is part of the number, so it should look like it.
 */
export function PhoneInput({
  country,
  onCountryChange,
  value,
  onChangeText,
  label = 'Phone number',
  error,
  hint,
  autoFocus,
  onSubmitEditing,
}: PhoneInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-danger bg-danger/5'
    : focused
      ? 'border-brand-500 bg-white'
      : 'border-neutral-200 bg-neutral-50';

  return (
    <View className="w-full">
      {label ? (
        <Text variant="label" className="mb-1 ml-1">
          {label}
        </Text>
      ) : null}

      <View className={`h-12 flex-row items-center rounded-lg border ${borderClass}`}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Country code ${country.dial}, ${country.name}. Tap to change.`}
          className="h-full flex-row items-center gap-1.5 rounded-l-lg px-3"
        >
          <Text className="text-[20px]">{country.flag}</Text>
          <Text variant="body" className="font-semibold text-neutral-900">
            {country.dial}
          </Text>
          <Ionicons name="chevron-down" size={14} color={neutral[500]} />
        </Pressable>

        <View className="h-6 w-px bg-neutral-200" />

        <TextInput
          value={value}
          onChangeText={(raw) => onChangeText(digitsOnly(raw))}
          keyboardType="phone-pad"
          inputMode="tel"
          textContentType="telephoneNumber"
          autoComplete="tel"
          placeholder="801 234 5678"
          placeholderTextColor={neutral[400]}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          maxLength={country.nsnMax + 2}
          className="flex-1 px-3 text-[15px] text-neutral-900"
        />
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

      <CountryPicker
        visible={pickerOpen}
        selectedIso={country.iso}
        onSelect={onCountryChange}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
