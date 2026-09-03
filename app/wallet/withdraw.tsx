import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  BackButton,
  Banner,
  Button,
  Input,
  ListRow,
  MoneyText,
  Screen,
  Text,
  toast,
} from '@/ui';
import { brand, neutral, semantic } from '@/ui/theme/colors';
import { formatMoney, parseMoneyInput, subtract } from '@/lib/money';
import { creatorService, paymentsService } from '@/api/services';
import { toApiError, type ApiError } from '@/api/errors';
import { newIdempotencyKey } from '@/lib/idempotency';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { AmountField } from '@/features/wallet/components/AmountField';

const FEE_MINOR = 10000;
const MIN_MINOR = 500000;

export default function Withdraw() {
  const { data: wallet } = useWallet();
  const queryClient = useQueryClient();

  const { data: creatorWalletData } = useQuery({
    queryKey: ['creator', 'wallet'],
    queryFn: () => creatorService.getWallet(),
  });

  const { data: creatorOverview } = useQuery({
    queryKey: ['creator', 'overview'],
    queryFn: () => creatorService.overview(),
  });

  const [raw, setRaw] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const { data: accountsPage } = useQuery({
    queryKey: ['wallet', 'payout-accounts'],
    queryFn: () => paymentsService.payoutAccounts(),
  });

  const accounts = accountsPage?.items ?? [];
  const amount = useMemo(() => parseMoneyInput(raw, 'CP'), [raw]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0]!.id);
  }, [accounts, accountId]);

  const creatorBalance =
    creatorWalletData?.userShareAvailable ??
    creatorOverview?.creatorWallet?.userShareAvailable ??
    creatorOverview?.stats?.available ??
    wallet?.balance;

  const amountError =
    touched && !amount
      ? 'Enter an amount.'
      : touched && amount && amount.minor < MIN_MINOR
        ? `Minimum withdrawal is ${formatMoney({ minor: MIN_MINOR, currency: 'CP' }, { compactWhole: true })}.`
        : touched && amount && creatorBalance && amount.minor > creatorBalance.minor
          ? 'More than your available creator balance.'
          : undefined;

  const canSubmit = Boolean(amount && accountId && !amountError && code.length === 6);

  const submit = async () => {
    setTouched(true);
    if (!amount || !accountId) return;

    setSubmitting(true);
    setError(null);
    try {
      const withdrawal = await paymentsService.requestWithdrawal(
        amount,
        accountId,
        code,
        newIdempotencyKey(),
      );
      await queryClient.invalidateQueries({ queryKey: ['creator'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      setDone(withdrawal.reference);
      toast.success('Withdrawal requested');
    } catch (cause) {
      setError(toApiError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Ionicons name="checkmark-circle" size={34} color={semantic.success} />
          </View>
          <Text variant="title" className="text-center">
            Withdrawal requested
          </Text>
          <Text variant="body" className="text-center text-neutral-500">
            The amount has been held from your balance and is now under review.
            Payouts usually land within one working day.
          </Text>
          <Text variant="caption">Reference {done}</Text>
          <View className="mt-4 w-full">
            <Button label="Back to wallet" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Withdraw</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {error ? (
            <View className="mt-5">
              <Banner tone="error" message={error.message} />
            </View>
          ) : null}

          {creatorBalance ? (
            <View className="mt-5 flex-row items-center justify-between rounded-lg bg-neutral-50 p-4 border border-neutral-200">
              <View>
                <Text variant="label" className="font-bold text-neutral-800">
                  Creator Movie Wallet
                </Text>
                <Text variant="caption" className="text-neutral-500">
                  Available (70% creator share)
                </Text>
              </View>
              <MoneyText value={creatorBalance} variant="heading" />
            </View>
          ) : null}

          <View className="mt-6">
            <AmountField
              value={raw}
              onChangeText={(v) => {
                setRaw(v);
                if (touched) setTouched(false);
              }}
              error={amountError}
              minimum={{ minor: MIN_MINOR, currency: 'CP' }}
            />
          </View>

          {amount ? (
            <View className="mt-4 gap-1.5 rounded-lg bg-neutral-50 p-4">
              <Row label="Requested Withdrawal" value={`${formatMoney(amount, { compactWhole: true })} (≈ $${(amount.minor / 200).toFixed(2)} USD)`} />
              <Row
                label="Creator Share (70%)"
                value={`${formatMoney({ minor: Math.round(amount.minor * 0.7), currency: 'CP' }, { compactWhole: true })} (≈ $${((amount.minor * 0.7) / 200).toFixed(2)} USD)`}
                bold
              />
              <Row
                label="Platform Cut (30%)"
                value={`${formatMoney({ minor: Math.round(amount.minor * 0.3), currency: 'CP' }, { compactWhole: true })} (≈ $${((amount.minor * 0.3) / 200).toFixed(2)} USD)`}
              />
              <Row
                label="Bank Processing Fee"
                value={`${formatMoney({ minor: FEE_MINOR, currency: 'CP' }, { compactWhole: true })} (≈ $${(FEE_MINOR / 200).toFixed(2)} USD)`}
              />
              <View className="my-1 h-px bg-neutral-200" />
              <Row
                label="Net Payout to You"
                value={`${formatMoney({ minor: Math.max(Math.round(amount.minor * 0.7) - FEE_MINOR, 0), currency: 'CP' }, { compactWhole: true })} (≈ $${(Math.max(Math.round(amount.minor * 0.7) - FEE_MINOR, 0) / 200).toFixed(2)} USD)`}
                bold
              />
            </View>
          ) : null}

          <View className="mt-4 flex-row items-start gap-2 rounded-lg bg-brand-50 border border-brand-200 p-3">
            <Ionicons name="information-circle-outline" size={17} color="#DB5A19" />
            <Text variant="caption" className="flex-1 text-brand-800 font-medium">
              100% of movie purchases and rentals are credited to your Creator Wallet. On withdrawal, 70% goes to you and 30% goes to the platform.
            </Text>
          </View>

          <Text variant="label" className="mb-2 ml-1 mt-8">
            Pay out to
          </Text>
          <View className="overflow-hidden rounded-lg border border-neutral-200">
            {accounts.map((account, index) => (
              <ListRow
                key={account.id}
                first={index === 0}
                icon={account.kind === 'bank' ? 'business-outline' : 'logo-bitcoin'}
                label={account.label}
                description={account.masked}
                onPress={() => setAccountId(account.id)}
                right={
                  <Ionicons
                    name={account.id === accountId ? 'radio-button-on' : 'radio-button-off'}
                    size={19}
                    color={account.id === accountId ? brand[500] : neutral[300]}
                  />
                }
              />
            ))}
          </View>

          <View className="mt-8">
            <Input
              label="Two-factor code"
              placeholder="6 digits"
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              hint="Required for withdrawals. Mock code is 654321."
              leftSlot={<Ionicons name="shield-checkmark-outline" size={17} color={neutral[400]} />}
            />
          </View>

          <View className="mt-4 flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
            <Ionicons name="lock-closed-outline" size={15} color={neutral[400]} />
            <Text variant="caption" className="flex-1">
              A stolen session should never be able to move money out. Withdrawals
              always ask for a second factor, even when you are already signed in.
            </Text>
          </View>
        </ScrollView>

        <View className="pb-4 pt-3">
          <Button
            label="Request withdrawal"
            loading={submitting}
            disabled={!canSubmit}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="caption" className={bold ? 'font-bold text-neutral-900' : ''}>
        {label}
      </Text>
      <Text variant="label" className={bold ? 'font-bold' : 'text-neutral-600'}>
        {value}
      </Text>
    </View>
  );
}
