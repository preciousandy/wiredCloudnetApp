import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Button, Input, ListRow, Text, toast } from '@/ui';
import { brand, semantic } from '@/ui/theme/colors';
import { moderationService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { REPORT_LABELS, URGENT_REASONS, type ReportReason } from '@/api/schemas/moderation';
import type { Report } from '@/api/schemas/moderation';

export function ReportSheet({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
}: {
  visible: boolean;
  onClose: () => void;
  targetType: Report['targetType'];
  targetId: string;
  targetName?: string;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      const report = await moderationService.report(targetType, targetId, reason, note || null);
      setSent(report.reference);
    } catch (cause) {
      toast.error(toApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setReason(null);
    setNote('');
    setSent(null);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="Report" height={0.75} dismissable={!busy}>
      {sent ? (
        <View className="items-center gap-3 p-6">
          <Ionicons name="checkmark-circle" size={38} color={semantic.success} />
          <Text variant="heading" className="text-center">
            Thank you, we are on it
          </Text>
          <Text variant="body" className="text-center text-neutral-500">
            Our team reviews every report. We will not tell the creator who
            reported them.
          </Text>
          <Text variant="caption">Reference {sent}</Text>
          <View className="mt-3 w-full">
            <Button label="Done" onPress={close} />
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
            {targetName ? (
              <Text variant="caption" className="px-5 pb-1 pt-4">
                Reporting {targetName}
              </Text>
            ) : null}

            <View className="mt-2">
              {(Object.keys(REPORT_LABELS) as ReportReason[]).map((key, index) => (
                <ListRow
                  key={key}
                  first={index === 0}
                  label={REPORT_LABELS[key]}
                  description={
                    URGENT_REASONS.includes(key) ? 'Reviewed urgently' : undefined
                  }
                  onPress={() => setReason(key)}
                  right={
                    <Ionicons
                      name={reason === key ? 'radio-button-on' : 'radio-button-off'}
                      size={19}
                      color={reason === key ? brand[500] : '#D4D4D8'}
                    />
                  }
                />
              ))}
            </View>

            <View className="px-5 pt-4">
              <Input
                label="Anything else, optional"
                placeholder="Tell us what you saw"
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={500}
                style={{ height: 84, textAlignVertical: 'top', paddingTop: 10 }}
              />
            </View>
          </ScrollView>

          <View className="border-t border-neutral-100 p-5">
            <Button
              label="Send report"
              loading={busy}
              disabled={!reason}
              onPress={() => void submit()}
            />
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
