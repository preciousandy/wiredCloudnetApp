import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Input, PhoneInput, SegmentedTabs, type SegmentOption } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { DEFAULT_COUNTRY, type Country } from '@/lib/countries';
import { isEmail, toE164, validateNationalNumber } from '@/lib/validation';

export type IdentityType = 'email' | 'phone';

const TABS: readonly SegmentOption<IdentityType>[] = [
  { value: 'email', label: 'Email', icon: 'mail-outline' },
  { value: 'phone', label: 'Phone', icon: 'call-outline' },
];

export interface IdentityFormProps {
  submitLabel: string;
  errorMessage?: string;
  onClearError?: () => void;
  onSubmit: (identity: string, type: IdentityType) => void | Promise<void>;
}

/**
 * Email and phone are different kinds of input, so they get different fields:
 * an email keyboard and autofill for one, a numeric keypad and country code for
 * the other. A single shared box would mean the wrong keyboard half the time
 * and nowhere to put a dial code.
 *
 * Shared by the signup and password reset screens so the two cannot drift.
 */
export function IdentityForm({
  submitLabel,
  errorMessage,
  onClearError,
  onSubmit,
}: IdentityFormProps) {
  const [tab, setTab] = useState<IdentityType>('email');
  const [email, setEmail] = useState('');
  const [national, setNational] = useState('');
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [touched, setTouched] = useState(false);

  const phoneError = touched ? validateNationalNumber(national, country) : null;
  const emailError =
    touched && email.length > 0 && !isEmail(email) ? 'Enter a valid email address.' : null;

  const canSubmit =
    tab === 'email' ? isEmail(email) : validateNationalNumber(national, country) === null;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    if (tab === 'email') return onSubmit(email.trim().toLowerCase(), 'email');
    return onSubmit(toE164(country.dial, national), 'phone');
  };

  const clear = () => {
    if (touched) setTouched(false);
    onClearError?.();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <SegmentedTabs
        options={TABS}
        value={tab}
        onChange={(next) => {
          setTab(next);
          clear();
        }}
      />

      {errorMessage ? (
        <View className="mt-5">
          <Banner tone="error" message={errorMessage} />
        </View>
      ) : null}

      <View className="mt-6">
        {tab === 'email' ? (
          <Input
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              clear();
            }}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            error={emailError ?? undefined}
            onSubmitEditing={handleSubmit}
            leftSlot={<Ionicons name="mail-outline" size={18} color={neutral[400]} />}
          />
        ) : (
          <PhoneInput
            country={country}
            onCountryChange={(c) => {
              setCountry(c);
              clear();
            }}
            value={national}
            onChangeText={(v) => {
              setNational(v);
              clear();
            }}
            error={phoneError ?? undefined}
            autoFocus
            onSubmitEditing={handleSubmit}
          />
        )}
      </View>

      {/* Sits directly above the keyboard rather than under it. */}
      <View className="mt-auto pb-4 pt-4">
        <Button label={submitLabel} onPress={handleSubmit} disabled={!canSubmit} />
      </View>
    </KeyboardAvoidingView>
  );
}
