import { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet, ConfirmDialog, ListRow, toast } from '@/ui';
import { moderationService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { shareLink } from '../lib/share';
import { ReportSheet } from './ReportSheet';
import type { Report } from '@/api/schemas/moderation';

/**
 * The overflow menu behind every piece of content.
 *
 * Share, save, report, block. Kept in one component so a creator cannot be
 * reportable in one place and unreachable in another.
 */
export function MoreSheet({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
  shareUrl,
  creatorId,
  creatorName,
  onNotInterested,
}: {
  visible: boolean;
  onClose: () => void;
  targetType: Report['targetType'];
  targetId: string;
  targetName: string;
  shareUrl: string;
  creatorId?: string;
  creatorName?: string;
  onNotInterested?: () => void;
}) {
  const [reporting, setReporting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  const block = async () => {
    if (!creatorId) return;
    setBusy(true);
    try {
      const result = await moderationService.block(creatorId);
      toast.success(
        result.blocked
          ? `You will not see ${creatorName ?? 'this creator'} again`
          : 'Unblocked',
      );
      setConfirmBlock(false);
      onClose();
    } catch (cause) {
      toast.error(toApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BottomSheet visible={visible && !reporting && !confirmBlock} onClose={onClose}>
        <View className="pb-2">
          <ListRow
            first
            icon="share-social-outline"
            label="Share"
            onPress={() => {
              onClose();
              setTimeout(() => {
                void shareLink(shareUrl, `Watch ${targetName} on CloudNet`);
              }, 350);
            }}
          />


          {onNotInterested ? (
            <ListRow
              icon="eye-off-outline"
              label="Not interested"
              description="Show me less like this"
              onPress={() => {
                onClose();
                onNotInterested();
                toast.success('We will show you less like this');
              }}
            />
          ) : null}

          <ListRow
            icon="flag-outline"
            label="Report"
            description="Tell us what is wrong with this"
            onPress={() => setReporting(true)}
          />

          {creatorId ? (
            <ListRow
              icon="ban-outline"
              label={`Block ${creatorName ?? 'this creator'}`}
              danger
              onPress={() => setConfirmBlock(true)}
            />
          ) : null}
        </View>
      </BottomSheet>

      <ReportSheet
        visible={reporting}
        onClose={() => {
          setReporting(false);
          onClose();
        }}
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
      />

      <ConfirmDialog
        visible={confirmBlock}
        tone="danger"
        title={`Block ${creatorName ?? 'this creator'}?`}
        message="You will stop seeing their content anywhere in CloudNet. Anything you already bought stays yours."
        confirmLabel="Block"
        loading={busy}
        onCancel={() => setConfirmBlock(false)}
        onConfirm={() => void block()}
      />
    </>
  );
}
