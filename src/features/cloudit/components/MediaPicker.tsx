import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import type { QueuedUpload } from '@/store/uploadQueue';

export interface MediaPickerProps {
  title: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  aspect?: 'video' | 'wide' | 'portrait';
  previewUri?: string | null;
  upload?: QueuedUpload;
  error?: string;
  onPick: () => void;
  onClear: () => void;
}

const STATUS_COPY: Record<QueuedUpload['status'], string> = {
  uploading: 'Uploading',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

/**
 * File chooser plus progress in one control.
 *
 * Upload and transcode share a single bar. Splitting them produces the familiar
 * "stuck at 100%" that makes people force-quit and upload the same film twice.
 */
export function MediaPicker({
  title,
  hint,
  icon,
  aspect = 'wide',
  previewUri,
  upload,
  error,
  onPick,
  onClear,
}: MediaPickerProps) {
  const busy = upload?.status === 'uploading' || upload?.status === 'processing';
  const failed = upload?.status === 'failed';
  const ready = upload?.status === 'ready';
  const height = aspect === 'video' ? 190 : aspect === 'portrait' ? 260 : 150;

  return (
    <View className="w-full">
      <Pressable
        onPress={busy ? undefined : onPick}
        accessibilityRole="button"
        accessibilityLabel={title}
        className={`items-center justify-center overflow-hidden rounded-lg border border-dashed ${
          failed || error
            ? 'border-danger bg-danger/5'
            : ready
              ? 'border-success bg-success/5'
              : 'border-neutral-300 bg-neutral-50'
        }`}
        style={{ height }}
      >
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : null}

        {previewUri ? <View className="absolute inset-0 bg-black/35" /> : null}

        <View className="items-center gap-1.5 px-6">
          <Ionicons
            name={ready ? 'checkmark-circle' : failed ? 'alert-circle' : icon}
            size={26}
            color={previewUri ? '#FFFFFF' : ready ? '#16A34A' : failed ? '#DC2626' : brand[500]}
          />
          <Text
            variant="label"
            className={`text-center font-bold ${previewUri ? 'text-white' : 'text-neutral-900'}`}
          >
            {upload ? `${STATUS_COPY[upload.status]} ${upload.filename}` : title}
          </Text>
          <Text
            variant="caption"
            className={`text-center ${previewUri ? 'text-white/80' : ''}`}
          >
            {failed ? (upload?.failureReason ?? 'Something went wrong') : hint}
          </Text>
        </View>
      </Pressable>

      {upload && !ready ? (
        <View className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200">
          <View
            className={failed ? 'h-full bg-danger' : 'h-full bg-brand-500'}
            style={{ width: `${Math.round((upload.progress || 0) * 100)}%` }}
          />
        </View>
      ) : null}

      {upload ? (
        <View className="mt-2 flex-row items-center justify-between">
          <Text variant="caption">
            {busy ? `${Math.round((upload.progress || 0) * 100)}%` : STATUS_COPY[upload.status]}
          </Text>
          <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Remove file">
            <Text variant="caption" className="font-bold text-danger">
              {busy ? 'Cancel' : 'Remove'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <Text variant="caption" className="mt-1 ml-1 text-danger">
          {error}
        </Text>
      ) : null}

      {!upload && !error ? (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name="information-circle-outline" size={13} color={neutral[400]} />
          <Text variant="caption">You can leave this screen, uploads keep running.</Text>
        </View>
      ) : null}
    </View>
  );
}
