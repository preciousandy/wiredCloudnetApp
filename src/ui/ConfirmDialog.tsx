import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Text } from './Text';
import { semantic } from './theme/colors';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * For anything irreversible: deleting an upload, signing out, spending money.
 *
 * Deliberately not the platform Alert. Alert cannot show a loading state, so a
 * confirm that fires a network call leaves the user staring at a dismissed
 * dialog wondering whether it worked.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const danger = tone === 'danger';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View className="flex-1 items-center justify-center px-8">
        <Pressable
          className="absolute inset-0 bg-black/55"
          onPress={loading ? undefined : onCancel}
          accessibilityLabel={cancelLabel}
        />

        <View className="w-full gap-3 rounded-lg bg-white p-5">
          <View
            className={`h-11 w-11 items-center justify-center rounded-full ${
              danger ? 'bg-danger/10' : 'bg-brand-50'
            }`}
          >
            <Ionicons
              name={danger ? 'warning-outline' : 'help-circle-outline'}
              size={22}
              color={danger ? semantic.danger : '#DB5A19'}
            />
          </View>

          <Text variant="heading">{title}</Text>
          <Text variant="body" className="text-neutral-500">
            {message}
          </Text>

          <View className="mt-3 gap-2.5">
            <Button
              label={confirmLabel}
              variant={danger ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            />
            <Button
              label={cancelLabel}
              variant="secondary"
              disabled={loading}
              onPress={onCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
