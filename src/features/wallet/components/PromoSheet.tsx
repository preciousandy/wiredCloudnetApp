import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Button, Input, MoneyText, Text, toast } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { paymentsService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { newIdempotencyKey } from '@/lib/idempotency';
import type { Money } from '@/lib/money';

export function PromoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credited, setCredited] = useState<Money | null>(null);
  const queryClient = useQueryClient();

  const redeem = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await paymentsService.redeemPromo(code, newIdempotencyKey());
      setCredited(result.credited);
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      toast.success(`${result.description} applied`);
    } catch (cause) {
      const apiError = toApiError(cause);
      // The server distinguishes "no such code" from "already used"; saying
      // which one is far less annoying than a generic failure.
      setError(
        apiError.details?.reason === 'already_redeemed'
          ? 'You have already used this code.'
          : apiError.code === 'NOT_FOUND'
            ? 'That code is not valid.'
            : apiError.message,
      );
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setCode('');
    setError(null);
    setCredited(null);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="Redeem a code">
      <View className="gap-4 p-5">
        {credited ? (
          <View className="items-center gap-2 py-4">
            <Ionicons name="gift" size={34} color={semantic.success} />
            <Text variant="heading" className="text-center">
              Credit added
            </Text>
            <MoneyText value={credited} variant="title" className="text-success" />
            <View className="mt-3 w-full">
              <Button label="Done" onPress={close} />
            </View>
          </View>
        ) : (
          <>
            <Input
              label="Promo code"
              placeholder="CLOUDNET50"
              value={code}
              onChangeText={(v) => {
                setCode(v.toUpperCase().replace(/\s/g, ''));
                if (error) setError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              error={error ?? undefined}
              leftSlot={<Ionicons name="pricetag-outline" size={17} color={neutral[400]} />}
            />

            <Button
              label="Redeem"
              loading={busy}
              disabled={code.trim().length === 0}
              onPress={() => void redeem()}
            />
          </>
        )}
      </View>
    </BottomSheet>
  );
}
