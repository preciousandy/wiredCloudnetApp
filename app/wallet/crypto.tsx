import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BackButton,
  Banner,
  Button,
  ListRow,
  MoneyText,
  Screen,
  Skeleton,
  Text,
} from '@/ui';
import { brand, neutral, semantic } from '@/ui/theme/colors';
import { formatMoney, parseMoneyInput } from '@/lib/money';
import { AmountField } from '@/features/wallet/components/AmountField';
import { CryptoAddress } from '@/features/wallet/components/CryptoAddress';
import { useCryptoDeposit, useCryptoNetworks } from '@/features/wallet/hooks/useCryptoDeposit';

export default function CryptoFund() {
  const [raw, setRaw] = useState('');
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const { data: networksPage } = useCryptoNetworks();
  const { deposit, error, creating, create, reset } = useCryptoDeposit();

  const networks = networksPage?.items ?? [];
  const network = networks.find((n) => n.id === networkId) ?? null;
  const amount = useMemo(() => parseMoneyInput(raw, 'NGN'), [raw]);

  useEffect(() => {
    if (!networkId && networks.length > 0) {
      setNetworkId(networks.find((n) => n.available)?.id ?? null);
    }
  }, [networks, networkId]);

  // A held rate needs a visible clock, otherwise "rate locked" is just a claim.
  useEffect(() => {
    if (!deposit) return;
    const tick = () => {
      const ms = new Date(deposit.rate.heldUntil).getTime() - Date.now();
      setSecondsLeft(Math.max(Math.floor(ms / 1000), 0));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deposit]);

  const amountError =
    touched && !amount
      ? 'Enter an amount.'
      : touched && amount && network && amount.minor < network.minAmount.minor
        ? `Minimum is ${formatMoney(network.minAmount, { compactWhole: true })}.`
        : undefined;

  const canSubmit = Boolean(amount && network && !amountError);

  if (deposit) {
    const settled = deposit.status === 'completed' || deposit.status === 'underpaid';
    const progress =
      deposit.confirmationsRequired > 0
        ? deposit.confirmations / deposit.confirmationsRequired
        : 0;

    return (
      <Screen>
        <View className="mt-2 flex-row items-center justify-between">
          <BackButton onPress={() => (settled ? router.back() : reset())} />
          <Text variant="heading">{settled ? 'Deposit complete' : 'Send crypto'}</Text>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {settled ? (
            <View className="items-center gap-3 py-10">
              <View
                className={`h-16 w-16 items-center justify-center rounded-full ${
                  deposit.status === 'underpaid' ? 'bg-warning/10' : 'bg-success/10'
                }`}
              >
                <Ionicons
                  name={deposit.status === 'underpaid' ? 'alert-circle' : 'checkmark-circle'}
                  size={34}
                  color={deposit.status === 'underpaid' ? semantic.warning : semantic.success}
                />
              </View>

              <Text variant="title" className="text-center">
                {deposit.status === 'underpaid' ? 'Received less than expected' : 'Wallet topped up'}
              </Text>

              {deposit.status === 'underpaid' ? (
                <Text variant="body" className="text-center text-neutral-500">
                  You sent {deposit.receivedAmount} {deposit.asset} instead of{' '}
                  {deposit.expectedAmount}. We credited what arrived at the rate we
                  quoted you, nothing is lost.
                </Text>
              ) : (
                <Text variant="body" className="text-center text-neutral-500">
                  {deposit.receivedAmount} {deposit.asset} received and converted.
                </Text>
              )}

              {deposit.creditedAmount ? (
                <View className="mt-2 items-center">
                  <Text variant="caption">Credited</Text>
                  <MoneyText value={deposit.creditedAmount} variant="title" />
                </View>
              ) : null}

              <Text variant="caption" className="mt-1">
                Reference {deposit.reference}
              </Text>

              <View className="mt-4 w-full gap-3">
                <Button label="Back to wallet" onPress={() => router.back()} />
                <Button
                  label="Top up again"
                  variant="secondary"
                  onPress={() => {
                    reset();
                    setRaw('');
                    setTouched(false);
                  }}
                />
              </View>
            </View>
          ) : (
            <>
              <View className="mt-5">
                <CryptoAddress
                  address={deposit.address}
                  memo={deposit.memo}
                  asset={deposit.asset}
                  amount={deposit.expectedAmount}
                />
              </View>

              <View className="mt-6 gap-2 rounded-lg bg-neutral-50 p-4">
                <Row
                  label="You will receive"
                  value={<MoneyText value={deposit.expectedCredit} variant="label" className="font-bold" />}
                />
                <Row
                  label={`1 ${deposit.asset}`}
                  value={
                    <Text variant="label">
                      {formatMoney(
                        { minor: deposit.rate.minorPerUnit, currency: deposit.rate.currency },
                        { compactWhole: true },
                      )}
                    </Text>
                  }
                />
                <Row
                  label="Rate held for"
                  value={
                    <Text variant="label" className={secondsLeft < 120 ? 'text-danger' : ''}>
                      {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s
                    </Text>
                  }
                />
              </View>

              <View className="mt-5 gap-2 rounded-lg border border-neutral-200 p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name={deposit.status === 'awaiting_payment' ? 'time-outline' : 'sync-outline'}
                    size={17}
                    color={brand[500]}
                  />
                  <Text variant="label" className="flex-1 font-bold">
                    {deposit.status === 'awaiting_payment'
                      ? 'Waiting for your transfer'
                      : `Confirming, ${deposit.confirmations} of ${deposit.confirmationsRequired}`}
                  </Text>
                </View>

                <View className="h-1 overflow-hidden rounded-full bg-neutral-200">
                  <View className="h-full bg-brand-500" style={{ width: `${progress * 100}%` }} />
                </View>

                <Text variant="caption">
                  {deposit.status === 'awaiting_payment'
                    ? 'This screen updates on its own once the network sees your transfer.'
                    : 'Your funds are on the chain. Credited once confirmed.'}
                </Text>
              </View>

              <View className="mt-4 flex-row items-start gap-2 rounded-lg bg-danger/5 p-3">
                <Ionicons name="warning-outline" size={15} color={semantic.danger} />
                <Text variant="caption" className="flex-1">
                  Send only {deposit.asset} on this network. Anything else sent to
                  this address cannot be recovered.
                </Text>
              </View>

              <Text variant="caption" className="mt-4 text-center text-neutral-400">
                You can leave this screen. The deposit continues without the app open.
              </Text>
            </>
          )}
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Top up with crypto</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {error ? (
          <View className="mt-5">
            <Banner tone="error" message={error.message} />
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
            minimum={network?.minAmount}
          />
        </View>

        <Text variant="label" className="mb-2 ml-1 mt-8">
          Network
        </Text>

        {networks.length === 0 ? (
          <Skeleton className="h-20 w-full" />
        ) : networks.length === 1 ? (
          /* One supported network, so this is information rather than a choice.
             The list form stays below for when we add more. */
          <View className="flex-row items-center gap-3 rounded-lg border border-neutral-200 p-4">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <Ionicons name="logo-usd" size={19} color={brand[600]} />
            </View>
            <View className="flex-1">
              <Text variant="label" className="font-bold">
                {networks[0]!.label}
              </Text>
              <Text variant="caption">
                {networks[0]!.confirmationsRequired} confirmations, about{' '}
                {networks[0]!.typicalMinutes} min
              </Text>
            </View>
          </View>
        ) : (
          <View className="overflow-hidden rounded-lg border border-neutral-200">
            {networks.map((n, index) => (
              <ListRow
                key={n.id}
                first={index === 0}
                label={n.label}
                description={`${n.confirmationsRequired} confirmations, about ${n.typicalMinutes} min`}
                onPress={() => setNetworkId(n.id)}
                right={
                  <Ionicons
                    name={n.id === networkId ? 'radio-button-on' : 'radio-button-off'}
                    size={19}
                    color={n.id === networkId ? brand[500] : neutral[300]}
                  />
                }
              />
            ))}
          </View>
        )}

        <View className="mt-4 flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
          <Ionicons name="information-circle-outline" size={15} color={neutral[400]} />
          <Text variant="caption" className="flex-1">
            Your wallet is held in naira. USDT is converted the moment it
            arrives, at a rate we lock before you send anything, so your balance
            never rises or falls with the market.
          </Text>
        </View>
      </ScrollView>

      <View className="pb-4 pt-3">
        <Button
          label="Get deposit address"
          loading={creating}
          disabled={!canSubmit}
          onPress={() => {
            setTouched(true);
            if (amount && networkId) void create(amount, networkId);
          }}
        />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="caption" className="text-neutral-500">
        {label}
      </Text>
      {value}
    </View>
  );
}
