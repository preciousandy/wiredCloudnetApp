import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, MoneyText, Text } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { covers, shortfall, type Money } from '@/lib/money';
import { usePurchase } from '../hooks/usePurchase';
import { useWallet } from '../hooks/useWallet';

export interface PurchaseSheetProps {
  visible: boolean;
  onClose: () => void;
  titleId: string;
  titleName: string;
  price: Money;
  onPurchased?: () => void;
}

/**
 * The buy flow.
 *
 * Every state the purchase machine can be in has a screen here, including the
 * ones people prefer to pretend do not happen: pending confirmation, and not
 * enough money. Those are exactly the moments a user decides whether they trust
 * the product with their money.
 */
export function PurchaseSheet({
  visible,
  onClose,
  titleId,
  titleName,
  price,
  onPurchased,
}: PurchaseSheetProps) {
  const { state, buy, retry, reset } = usePurchase(titleId);
  const { data: wallet } = useWallet();

  const balance = wallet?.balance;
  const affordable = balance ? covers(balance, price) : true;
  const missing = balance ? shortfall(balance, price) : null;

  useEffect(() => {
    if (state.status === 'entitled') onPurchased?.();
  }, [state.status, onPurchased]);

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable className="flex-1 bg-black/50" onPress={close} accessibilityLabel="Close" />

      <View className="rounded-t-lg bg-white px-5 pb-8 pt-4">
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-neutral-200" />

        {state.status === 'entitled' ? (
          <View className="items-center gap-2 py-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <Ionicons name="checkmark-circle" size={32} color={semantic.success} />
            </View>
            <Text variant="title" className="text-center">
              It is yours
            </Text>
            <Text variant="body" className="text-center text-neutral-500">
              {titleName} is now in your library.
            </Text>
            <Text variant="caption" className="text-center">
              Reference {state.result.transaction.reference}
            </Text>
            <View className="mt-4 w-full gap-3">
              <Button
                label="Watch now"
                onPress={() => {
                  close();
                  router.push(`/watch/${titleId}`);
                }}
              />
              <Button label="Later" variant="secondary" onPress={close} />
            </View>
          </View>
        ) : state.status === 'pending' ? (
          <View className="items-center gap-2 py-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <Ionicons name="time-outline" size={30} color={semantic.warning} />
            </View>
            <Text variant="title" className="text-center">
              Confirming payment
            </Text>
            <Text variant="body" className="text-center text-neutral-500">
              This is still being confirmed. It will appear in your library as
              soon as it clears, and you have not been charged twice.
            </Text>
            <View className="mt-4 w-full">
              <Button label="Close" variant="secondary" onPress={close} />
            </View>
          </View>
        ) : state.status === 'insufficient_funds' || !affordable ? (
          <View className="gap-3 py-2">
            <Text variant="title">Not enough balance</Text>
            <Text variant="body" className="text-neutral-500">
              {titleName} costs more than you currently have.
            </Text>

            <View className="mt-1 gap-2 rounded-lg bg-neutral-50 p-4">
              <Row label="Price" value={<MoneyText value={price} variant="label" className="font-bold" />} />
              {balance ? (
                <Row label="Your balance" value={<MoneyText value={balance} variant="label" />} />
              ) : null}
              {missing ? (
                <Row
                  label="You need"
                  value={<MoneyText value={missing} variant="label" className="font-bold text-danger" />}
                />
              ) : null}
            </View>

            {/* Pay another way rather than dead ending on an empty wallet.
                Each route tops up the shortfall, then returns here. */}
            <View className="mt-3 gap-2.5">
              <Text variant="caption" className="text-neutral-500">
                Top up and finish this purchase
              </Text>

              <PayOption
                icon="card-outline"
                label="Debit card"
                onPress={() => {
                  close();
                  router.push('/wallet/fund?method=card');
                }}
              />
              <PayOption
                icon="business-outline"
                label="Bank transfer"
                onPress={() => {
                  close();
                  router.push('/wallet/fund?method=transfer');
                }}
              />
              <PayOption
                icon="logo-usd"
                label="Crypto, USDT on BNB Chain"
                onPress={() => {
                  close();
                  router.push('/wallet/crypto');
                }}
              />

              <View className="mt-2">
                <Button label="Cancel" variant="secondary" onPress={close} />
              </View>
            </View>
          </View>
        ) : state.status === 'already_entitled' ? (
          <View className="items-center gap-2 py-4">
            <Text variant="title" className="text-center">
              You already own this
            </Text>
            <View className="mt-3 w-full">
              <Button
                label="Watch now"
                onPress={() => {
                  close();
                  router.push(`/watch/${titleId}`);
                }}
              />
            </View>
          </View>
        ) : state.status === 'failed' ? (
          <View className="gap-3 py-2">
            <Text variant="title">Payment did not go through</Text>
            <Text variant="body" className="text-neutral-500">
              {state.error.message}
            </Text>
            <Text variant="caption" className="text-neutral-400">
              Nothing has been taken from your wallet.
            </Text>
            <View className="mt-3 gap-3">
              <Button label="Try again" onPress={retry} />
              <Button label="Cancel" variant="secondary" onPress={close} />
            </View>
          </View>
        ) : (
          <View className="gap-3 py-2">
            <Text variant="title">Confirm purchase</Text>

            <View className="mt-1 gap-2 rounded-lg bg-neutral-50 p-4">
              <Row label="Title" value={<Text variant="label" className="font-bold">{titleName}</Text>} />
              <Row label="Price" value={<MoneyText value={price} variant="label" className="font-bold" />} />
              {balance ? (
                <Row label="Balance after" value={<MoneyText value={{ minor: balance.minor - price.minor, currency: balance.currency }} variant="label" />} />
              ) : null}
            </View>

            <View className="flex-row items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
              <Ionicons name="wallet" size={17} color="#DB5A19" />
              <View className="flex-1">
                <Text variant="label" className="font-bold text-brand-700">
                  CloudNet wallet
                </Text>
                <Text variant="caption" className="text-brand-700">
                  One tap, no card details
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={17} color="#DB5A19" />
            </View>

            <View className="mt-3 gap-3">
              <Button
                label="Pay with wallet"
                loading={state.status === 'confirming'}
                onPress={buy}
              />
              <Button label="Cancel" variant="secondary" onPress={close} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function PayOption({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-12 flex-row items-center gap-3 rounded-lg border border-neutral-200 px-3"
    >
      <Ionicons name={icon} size={18} color={neutral[600]} />
      <Text variant="label" className="flex-1">
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={neutral[300]} />
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="label" className="text-neutral-500">
        {label}
      </Text>
      {value}
    </View>
  );
}
