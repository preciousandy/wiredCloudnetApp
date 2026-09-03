import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Text, toast } from '@/ui';
import { neutral } from '@/ui/theme/colors';

/**
 * The address panel.
 *
 * QR first, because nobody types a 34 character address from a phone screen,
 * and a single wrong character sends the funds nowhere recoverable.
 */
export function CryptoAddress({
  address,
  memo,
  asset,
  amount,
}: {
  address: string;
  memo: string | null;
  asset: string;
  amount: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View className="items-center gap-4">
      <View className="rounded-lg bg-white p-3">
        <QRCode value={address} size={168} backgroundColor="#FFFFFF" color="#18181B" />
      </View>

      <View className="w-full gap-1">
        <Text variant="caption" className="ml-1">
          Send exactly
        </Text>
        <Pressable
          onPress={() => void copy(amount, 'Amount')}
          accessibilityRole="button"
          accessibilityLabel={`Copy amount ${amount} ${asset}`}
          className="h-12 flex-row items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3"
        >
          <Text variant="heading">
            {amount} {asset}
          </Text>
          <Ionicons name="copy-outline" size={17} color={neutral[500]} />
        </Pressable>
      </View>

      <View className="w-full gap-1">
        <Text variant="caption" className="ml-1">
          To this address
        </Text>
        <Pressable
          onPress={() => void copy(address, 'Address')}
          accessibilityRole="button"
          accessibilityLabel="Copy deposit address"
          className="flex-row items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
        >
          <Text variant="caption" className="flex-1 text-neutral-700">
            {address}
          </Text>
          <Ionicons
            name={copied ? 'checkmark-circle' : 'copy-outline'}
            size={17}
            color={copied ? '#16A34A' : neutral[500]}
          />
        </Pressable>
      </View>

      {memo ? (
        <View className="w-full gap-1">
          <Text variant="caption" className="ml-1 text-danger">
            Memo required, the deposit is lost without it
          </Text>
          <Pressable
            onPress={() => void copy(memo, 'Memo')}
            className="flex-row items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3"
          >
            <Text variant="label" className="flex-1">
              {memo}
            </Text>
            <Ionicons name="copy-outline" size={17} color={neutral[500]} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
