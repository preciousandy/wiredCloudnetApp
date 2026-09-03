import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Banner, BottomSheet, Button, Screen, Text } from '@/ui';
import { brand, neutral, semantic } from '@/ui/theme/colors';
import { formatMoney, parseMoneyInput, type Money } from '@/lib/money';
import { AmountField } from '@/features/wallet/components/AmountField';
import { MethodPicker } from '@/features/wallet/components/MethodPicker';
import { useDeposit, usePaymentMethods } from '@/features/wallet/hooks/useDeposit';

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  provider: 'paystack' | 'razorpay' | 'card';
  providerName: string;
  providerTagline: string;
}

export const COUNTRIES: CountryOption[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    provider: 'paystack',
    providerName: 'Paystack',
    providerTagline: 'Cards, Bank Transfer, USSD & Apple Pay',
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    provider: 'razorpay',
    providerName: 'Razorpay',
    providerTagline: 'UPI, NetBanking, Paytm & Indian Cards',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    provider: 'card',
    providerName: 'Debit / Credit Card',
    providerTagline: 'Visa, Mastercard, Amex & Apple Pay',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    provider: 'card',
    providerName: 'Debit / Credit Card',
    providerTagline: 'Visa, Mastercard & Apple Pay',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    provider: 'card',
    providerName: 'Debit / Credit Card',
    providerTagline: 'Visa, Mastercard & Interac',
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    provider: 'card',
    providerName: 'Debit / Credit Card',
    providerTagline: 'Cards & Mobile Money',
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    provider: 'card',
    providerName: 'Debit / Credit Card',
    providerTagline: 'Cards & M-Pesa Cards',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    provider: 'card',
    providerName: 'Debit / Credit Card',
    providerTagline: 'Visa, Mastercard & EFT',
  },
  {
    code: 'OTHER',
    name: 'Other Country',
    flag: '🌍',
    provider: 'card',
    providerName: 'Debit / Credit Card',
    providerTagline: 'Global Visa, Mastercard & Apple Pay',
  },
];

export default function FundWallet() {
  const { method: preselected } = useLocalSearchParams<{ method?: string }>();
  const [raw, setRaw] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const { data: methodsPage } = usePaymentMethods(selectedCountry.code);
  const { state, submit, checkPending, reset } = useDeposit();

  const methods = methodsPage?.items ?? [];
  const method =
    methods.find((m) => m.id === methodId) ??
    methods[0] ?? {
      id: selectedCountry.provider,
      label: selectedCountry.providerName,
      description: selectedCountry.providerTagline,
      kind: 'inapp' as const,
      available: true,
      minAmount: { minor: 100, currency: 'CP' as const },
    };
  const amount: Money | null = useMemo(() => parseMoneyInput(raw, 'CP'), [raw]);

  // When payment methods change or country changes, automatically select the right method
  useEffect(() => {
    if (methods.length > 0) {
      const requested = preselected ? methods.find((m) => m.id === preselected && m.available) : null;
      setMethodId(requested?.id ?? methods.find((m) => m.available)?.id ?? methods[0].id);
    }
  }, [methods, preselected, selectedCountry]);

  // Poll pending deposit until provider confirms
  useEffect(() => {
    if (state.status !== 'pending') return;
    const timer = setInterval(() => void checkPending(state.depositId), 1500);
    return () => clearInterval(timer);
  }, [state, checkPending]);

  const minLimit = Math.min(method?.minAmount?.minor ?? 100, 100);
  const isBelowMin = Boolean(amount && amount.minor < minLimit);

  const amountError =
    touched && !amount
      ? 'Enter an amount.'
      : touched && isBelowMin
        ? `Minimum is ${formatMoney({ minor: minLimit, currency: 'CP' }, { compactWhole: true })}.`
        : undefined;

  const canSubmit = Boolean(amount && amount.minor >= minLimit);

  const handleSubmit = async () => {
    setTouched(true);
    if (!amount || !method) return;

    if (method.kind === 'crypto') {
      router.push('/wallet/crypto');
      return;
    }

    await submit(amount, method.id, selectedCountry.code);
  };

  useEffect(() => {
    if (state.status !== 'pending') return;
    void WebBrowser.maybeCompleteAuthSession();
  }, [state.status]);

  if (state.status === 'completed') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Ionicons name="checkmark-circle" size={36} color={semantic.success} />
          </View>
          <Text variant="title" className="text-center">
            Wallet topped up
          </Text>
          <Text variant="body" className="text-center text-neutral-500">
            Your CloudPoint balance has been credited and is ready to use.
          </Text>
          <Text variant="caption" className="text-center">
            Reference {state.reference}
          </Text>
          <View className="mt-4 w-full gap-3">
            <Button label="Back to wallet" onPress={() => router.back()} />
            <Button
              label="Add more"
              variant="secondary"
              onPress={() => {
                reset();
                setRaw('');
                setTouched(false);
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  if (state.status === 'pending') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <Ionicons name="time-outline" size={34} color={semantic.warning} />
          </View>
          <Text variant="title" className="text-center">
            Confirming your payment
          </Text>
          <Text variant="body" className="text-center text-neutral-500">
            {selectedCountry.providerName} is confirming your transaction. Your
            balance updates the moment payment completes.
          </Text>
          <Text variant="caption" className="text-center">
            Reference {state.reference}
          </Text>
          <Text variant="caption" className="mt-2 text-center text-neutral-400">
            You can leave this screen. Your deposit will be credited automatically.
          </Text>
          <View className="mt-4 w-full">
            <Button label="Back to wallet" variant="secondary" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Add money</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {state.status === 'failed' ? (
            <View className="mt-5">
              <Banner tone="error" message={state.error.message} />
            </View>
          ) : null}

          {/* Amount input */}
          <View className="mt-6">
            <AmountField
              value={raw}
              onChangeText={(v) => {
                setRaw(v);
                if (touched) setTouched(false);
              }}
              error={amountError}
              minimum={method?.minAmount}
            />
          </View>

          {/* Country Selection */}
          <Text variant="label" className="mb-2 ml-1 mt-6">
            Your country
          </Text>
          <Pressable
            onPress={() => setCountrySheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select country"
            className="flex-row items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3.5"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-200/70 border border-neutral-300">
                <Text variant="caption" className="font-bold text-neutral-800">
                  {selectedCountry.code}
                </Text>
              </View>
              <View>
                <Text variant="label" className="font-bold text-neutral-900">
                  {selectedCountry.name}
                </Text>
                <Text variant="caption" className="text-neutral-500">
                  Payment via {selectedCountry.providerName}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <Text variant="caption" className="font-bold text-brand-600">
                Change
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#DB5A19" />
            </View>
          </Pressable>

          {/* Payment Method Details */}
          <Text variant="label" className="mb-2 ml-1 mt-6">
            Payment provider
          </Text>
          <MethodPicker
            methods={methods.length > 0 ? methods : [
              {
                id: selectedCountry.provider,
                label: selectedCountry.providerName,
                description: selectedCountry.providerTagline,
                kind: 'inapp',
                available: true,
                minAmount: { minor: 100, currency: 'CP' },
              },
            ]}
            value={method?.id ?? selectedCountry.provider}
            onChange={setMethodId}
          />

          <View className="mt-4 flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
            <Ionicons name="shield-checkmark-outline" size={16} color="#71717A" />
            <Text variant="caption" className="flex-1">
              Payments are securely encrypted and processed by {selectedCountry.providerName}. CloudNet never stores your payment credentials.
            </Text>
          </View>
        </ScrollView>

        <View className="pb-4 pt-3">
          <Button
            label={
              amount
                ? `Add ${formatMoney(amount, { compactWhole: true })} (Pay $${(amount.minor / 200).toFixed(2)} USD)`
                : 'Add money'
            }
            loading={state.status === 'submitting'}
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Country Selection Sheet */}
      <BottomSheet
        visible={countrySheetOpen}
        onClose={() => setCountrySheetOpen(false)}
        title="Select your country"
      >
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View className="gap-1 pb-4">
            {COUNTRIES.map((country) => {
              const selected = country.code === selectedCountry.code;
              return (
                <Pressable
                  key={country.code}
                  onPress={() => {
                    setSelectedCountry(country);
                    setCountrySheetOpen(false);
                  }}
                  className={`flex-row items-center justify-between rounded-lg p-3 ${
                    selected ? 'bg-brand-50 border border-brand-200' : 'hover:bg-neutral-50'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-200/70 border border-neutral-300">
                      <Text variant="caption" className="font-bold text-neutral-800">
                        {country.code}
                      </Text>
                    </View>
                    <View>
                      <Text variant="label" className="font-bold text-neutral-900">
                        {country.name}
                      </Text>
                      <Text variant="caption" className="text-neutral-500">
                        {country.providerName} · {country.providerTagline}
                      </Text>
                    </View>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={brand[600]} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}
