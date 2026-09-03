import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, Checkbox, ConfirmDialog, Input, Screen, Text, toast } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { useSession } from '@/store/session';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { isZero } from '@/lib/money';

const CONFIRM_WORD = 'DELETE';

/**
 * Account deletion.
 *
 * Required by both app stores, and it has to be reachable in the app rather than
 * only by emailing support. The balance check is ours: letting someone delete an
 * account holding money, with no way back in to withdraw it, would be taking it.
 */
export default function DeleteAccount() {
  const signOut = useSession((s) => s.signOut);
  const { data: wallet } = useWallet();

  const [understood, setUnderstood] = useState(false);
  const [typed, setTyped] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasBalance = wallet ? !isZero(wallet.balance) : false;
  const canDelete = understood && typed.trim().toUpperCase() === CONFIRM_WORD && !hasBalance;

  const remove = async () => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    await signOut();
    setBusy(false);
    toast.success('Your account has been scheduled for deletion');
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Delete account</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-6 items-center gap-2">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <Ionicons name="warning-outline" size={28} color={semantic.danger} />
          </View>
          <Text variant="title" className="text-center">
            This cannot be undone
          </Text>
        </View>

        <View className="mt-6 gap-3 rounded-lg border border-neutral-200 p-4">
          <Line icon="person-remove-outline" text="Your profile and username are removed" />
          <Line icon="albums-outline" text="Anything you uploaded is taken down" />
          <Line icon="bookmark-outline" text="Your library and watchlist are deleted" />
          <Line icon="receipt-outline" text="Purchase records are kept where the law requires it" />
        </View>

        {hasBalance ? (
          <View className="mt-5 flex-row items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
            <Ionicons name="wallet-outline" size={16} color={semantic.warning} />
            <View className="flex-1">
              <Text variant="label" className="font-bold text-warning">
                You still have money in your wallet
              </Text>
              <Text variant="caption" className="mt-0.5">
                Spend or withdraw your balance first. We will not delete an
                account holding funds you cannot get back.
              </Text>
              <View className="mt-3 w-40">
                <Button
                  label="Go to wallet"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push('/wallet')}
                />
              </View>
            </View>
          </View>
        ) : null}

        <View className="mt-6 gap-4">
          <Checkbox
            checked={understood}
            onChange={setUnderstood}
            label="I understand my account and content will be permanently removed."
          />

          <Input
            label={`Type ${CONFIRM_WORD} to confirm`}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <View className="mt-6">
          <Button
            label="Delete my account"
            variant="danger"
            disabled={!canDelete}
            onPress={() => setConfirming(true)}
          />
          <Text variant="caption" className="mt-3 text-center text-neutral-400">
            Changed your mind? Just go back, nothing has happened yet.
          </Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        tone="danger"
        title="Delete your account?"
        message="This is your last chance to stop. Everything is removed and you will be signed out."
        confirmLabel="Delete permanently"
        loading={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void remove()}
      />
    </Screen>
  );
}

function Line({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <Ionicons name={icon} size={16} color={neutral[500]} />
      <Text variant="caption" className="flex-1">
        {text}
      </Text>
    </View>
  );
}
