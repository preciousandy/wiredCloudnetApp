import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, Input, Screen, Select, Text, toast } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { useWallet } from '@/features/wallet/hooks/useWallet';

import { supportService } from '@/api/services/supportService';
import { toApiError } from '@/api/errors';

const TOPICS = [
  { value: 'payment', label: 'Payment or wallet' },
  { value: 'playback', label: 'Video will not play' },
  { value: 'upload', label: 'Upload or review' },
  { value: 'account', label: 'Account access' },
  { value: 'report', label: 'Report content' },
  { value: 'other', label: 'Something else' },
];

export default function Support() {
  const { data: wallet } = useWallet();
  const [topic, setTopic] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!topic || message.trim().length < 10) return;
    setBusy(true);
    try {
      await supportService.submitTicket(topic, message, reference);
      setSent(true);
      toast.success('Message sent');
    } catch (cause) {
      toast.error(toApiError(cause).message || 'Failed to send support ticket');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Ionicons name="checkmark-circle" size={38} color={semantic.success} />
          <Text variant="title" className="text-center">
            Message sent
          </Text>
          <Text variant="body" className="text-center text-neutral-500">
            We reply within one working day, to the email on your account.
          </Text>
          <View className="mt-4 w-full">
            <Button label="Back" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Contact support</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="mt-5 gap-4">
            <Select
              label="What is this about?"
              placeholder="Choose a topic"
              value={topic}
              options={TOPICS}
              onChange={setTopic}
            />

            <Input
              label="Message"
              placeholder="Tell us what happened"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              style={{ height: 130, textAlignVertical: 'top', paddingTop: 10 }}
            />

            <Input
              label="Transaction reference, optional"
              placeholder="CN-2026-000000"
              value={reference}
              onChangeText={setReference}
              autoCapitalize="characters"
              hint="Speeds up anything about money. Find it in Wallet, Transactions."
            />
          </View>

          {/* Attached automatically so an agent does not have to ask. */}
          <View className="mt-5 gap-1 rounded-lg bg-neutral-50 p-4">
            <Text variant="caption" className="font-bold text-neutral-700">
              Sent with your message
            </Text>
            <Text variant="caption">App version 0.1.0</Text>
            <Text variant="caption">Wallet {wallet?.walletId ?? 'unknown'}</Text>
            <Text variant="caption">Platform {Platform.OS}</Text>
          </View>

          <View className="mt-4 flex-row items-start gap-2">
            <Ionicons name="lock-closed-outline" size={14} color={neutral[400]} />
            <Text variant="caption" className="flex-1">
              Never send your password or card details to support. We will never
              ask for them.
            </Text>
          </View>
        </ScrollView>

        <View className="pb-4 pt-3">
          <Button
            label="Send message"
            loading={busy}
            disabled={!topic || message.trim().length < 10}
            onPress={() => void send()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
