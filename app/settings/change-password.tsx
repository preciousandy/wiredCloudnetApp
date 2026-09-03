import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { BackButton, Banner, Button, Input, Screen, Text, toast } from '@/ui';
import { authService } from '@/api/services/authService';
import { toApiError, type ApiError } from '@/api/errors';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const errors: Record<string, string> = {};
  if (currentPassword.length > 0 && currentPassword.length < 6) {
    errors.currentPassword = 'Enter your current password.';
  }
  if (newPassword.length > 0 && newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters.';
  }
  if (confirmPassword.length > 0 && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  const canSave =
    currentPassword.length >= 6 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword &&
    !saving;

  const submit = async () => {
    setError(null);
    if (!canSave) return;

    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      router.back();
    } catch (cause) {
      setError(toApiError(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Change password</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text variant="body" className="mt-4 text-neutral-500">
            Update your password to keep your account and wallet secure.
          </Text>

          {error ? (
            <View className="mt-4">
              <Banner tone="error" message={error.message} />
            </View>
          ) : null}

          <View className="mt-6 gap-4">
            <Input
              label="Current password"
              placeholder="••••••••"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              error={errors.currentPassword}
            />

            <Input
              label="New password"
              placeholder="••••••••"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              hint="Must be at least 8 characters"
              error={errors.newPassword}
            />

            <Input
              label="Confirm new password"
              placeholder="••••••••"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
            />
          </View>
        </ScrollView>

        <View className="pb-4 pt-3">
          <Button
            label="Update password"
            loading={saving}
            disabled={!canSave}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
