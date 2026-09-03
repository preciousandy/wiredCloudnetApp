import { useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Banner, Button, PasswordInput, Screen, Text } from '@/ui';
import { useRegistrationFlow } from '@/features/auth/hooks/useRegistration';
import { checkPassword, passwordsMatch } from '@/lib/validation';
import { authCopy } from '@/copy/auth';
import { useRegistration } from '@/store/registration';

export default function SetPassword() {
  const verificationToken = useRegistration((s) => s.verificationToken);
  const { submitPassword, kind, error, clearError } = useRegistrationFlow();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const copy = authCopy.setPassword;

  // Guard: no verified token means this step was reached out of order.
  if (!verificationToken) return <Redirect href="/(auth)/method" />;

  const check = checkPassword(password);
  const matches = passwordsMatch(password, confirm);
  const canSubmit = check.error === null && matches;

  return (
    <Screen>
      <View className="mt-14 gap-2">
        <Text variant="title">{kind === 'reset' ? 'Set a new password' : copy.title}</Text>
        <Text variant="body" className="text-neutral-500">
          {copy.subtitle}
        </Text>
      </View>

      {error ? (
        <View className="mt-6">
          <Banner tone="error" message={error.message} />
        </View>
      ) : null}

      <View className="mt-8 gap-5">
        <PasswordInput
          label={copy.password}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) clearError();
          }}
          autoComplete="new-password"
          showStrength
          autoFocus
        />

        <PasswordInput
          label={copy.confirm}
          value={confirm}
          onChangeText={setConfirm}
          autoComplete="new-password"
          error={confirm.length > 0 && !matches ? copy.mismatch : undefined}
        />
      </View>

      <View className="mt-auto pb-6">
        <Button
          label={copy.submit}
          disabled={!canSubmit}
          onPress={() => {
            void submitPassword(password);
          }}
        />
      </View>
    </Screen>
  );
}
