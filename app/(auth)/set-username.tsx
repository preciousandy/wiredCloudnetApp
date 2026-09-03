import { useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Banner, Button, Input, Screen, Text } from '@/ui';
import { useRegistrationFlow } from '@/features/auth/hooks/useRegistration';
import { validateUsername } from '@/lib/validation';
import { authCopy } from '@/copy/auth';
import { useRegistration } from '@/store/registration';

export default function SetUsername() {
  const password = useRegistration((s) => s.password);
  const { reserveUsername, error, isLoading, clearError } = useRegistrationFlow();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const copy = authCopy.setUsername;

  // Guard: the password is only held in memory between the previous step and
  // this one. If it is gone, the flow was interrupted, start over.
  if (!password) return <Redirect href="/(auth)/method" />;

  const localError = username.length > 0 ? validateUsername(username) : null;
  const canSubmit = username.length > 0 && localError === null && !isLoading;

  return (
    <Screen>
      <View className="mt-14 gap-2">
        <Text variant="title">{copy.title}</Text>
        <Text variant="body" className="text-neutral-500">
          {copy.subtitle}
        </Text>
      </View>

      {error ? (
        <View className="mt-6">
          <Banner tone="error" message={error.message} />
        </View>
      ) : null}

      <View className="mt-8 gap-4">
        <Input
          label="Full name"
          placeholder="e.g. Alex Johnson"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) clearError();
          }}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
        />

        <Input
          label={copy.label}
          placeholder="e.g. alex_j"
          value={username}
          onChangeText={(v) => {
            setUsername(v.replace(/\s/g, '').toLowerCase());
            if (error) clearError();
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          error={localError ?? undefined}
          hint={localError ? undefined : 'Letters, numbers and underscores.'}
        />
      </View>

      <View className="mt-auto pb-6">
        <Button
          label={isLoading ? 'Setting up...' : copy.submit}
          disabled={!canSubmit}
          onPress={() => {
            void reserveUsername(username, name);
          }}
        />
      </View>
    </Screen>
  );
}

