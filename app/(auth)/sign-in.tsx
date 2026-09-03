import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Divider, GoogleButton, Input, PasswordInput, Screen, Text } from '@/ui';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { authCopy } from '@/copy/auth';

/**
 * Enhanced SignIn screen connected to Laravel API backend.
 * Provides clear validation feedback, loading state, and error clearing.
 */
export default function SignIn() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isLoading, clearError } = useLogin();
  const copy = authCopy.signIn;

  const canSubmit = identity.trim().length > 0 && password.length > 0 && !isLoading;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    const ok = await login(identity.trim(), password);
    if (ok) router.replace('/(tabs)');
  };

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
          label={copy.identity}
          placeholder="Email address or username"
          value={identity}
          onChangeText={(v) => {
            setIdentity(v);
            if (error) clearError();
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          keyboardType="email-address"
          returnKeyType="next"
        />

        <View>
          <PasswordInput
            label={copy.password}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) clearError();
            }}
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={() => canSubmit && handleSignIn()}
          />
          <Text
            variant="label"
            className="mt-2 self-end font-bold text-brand-500"
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            {copy.forgot}
          </Text>
        </View>
      </View>

      <View className="mt-8 gap-4">
        <Button
          label={isLoading ? 'Signing in...' : copy.submit}
          onPress={handleSignIn}
          disabled={!canSubmit}
        />
        <Divider label="or" />
        <GoogleButton label="Sign in with Google" />
      </View>

      <View className="mt-auto flex-row items-center justify-center gap-1 pb-6">
        <Text variant="label" className="text-neutral-500">
          {copy.noAccount}
        </Text>
        <Text
          variant="label"
          className="font-bold text-brand-500"
          onPress={() => router.replace('/(auth)/sign-up')}
        >
          {copy.create}
        </Text>
      </View>
    </Screen>
  );
}

