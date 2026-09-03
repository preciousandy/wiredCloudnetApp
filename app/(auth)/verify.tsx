import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { BackButton, Banner, Button, OtpInput, Screen, Text } from '@/ui';
import { useRegistrationFlow } from '@/features/auth/hooks/useRegistration';
import { authCopy } from '@/copy/auth';

const RESEND_SECONDS = 30;

export default function Verify() {
  const { identity, identityType, verifyCode, resendCode, error, isLoading, clearError } =
    useRegistrationFlow();

  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);
  const copy = authCopy.verify;

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  // Guard: this step is meaningless without an identity. Deep-linking straight
  // here (or hot-reloading mid-flow) sends you back rather than showing a
  // half-broken screen.
  if (!identity || !identityType) return <Redirect href="/(auth)/method" />;

  const handleResend = async () => {
    const ok = await resendCode();
    if (ok) {
      setSeconds(RESEND_SECONDS);
      setResent(true);
      setCode('');
    }
  };

  return (
    <Screen>
      <View className="mt-4">
        <BackButton />
      </View>

      <View className="mt-8 gap-2">
        <Text variant="title">{copy.title(identityType)}</Text>
        <Text variant="body" className="text-neutral-500">
          {copy.sentTo} <Text className="font-bold text-neutral-900">{identity}</Text>
        </Text>
      </View>

      {error ? (
        <View className="mt-6">
          <Banner tone="error" message={error.message} />
        </View>
      ) : resent ? (
        <View className="mt-6">
          <Banner tone="success" message="A new code is on its way." />
        </View>
      ) : null}

      <View className="mt-10">
        <OtpInput
          length={4}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) clearError();
            if (resent) setResent(false);
          }}
          onComplete={(v) => {
            if (!isLoading && v.length === 4) {
              void verifyCode(v);
            }
          }}
          state={error ? 'error' : 'default'}
        />
      </View>

      <View className="mt-8 items-center gap-2">
        <View className="flex-row items-center gap-1">
          <Text variant="label" className="text-neutral-500">
            {copy.noCode}
          </Text>
          <Text
            variant="label"
            className={seconds > 0 || isLoading ? 'text-neutral-300' : 'font-bold text-brand-500'}
            onPress={seconds > 0 || isLoading ? undefined : handleResend}
          >
            {copy.resend}
            {seconds > 0 ? ` (${seconds}s)` : ''}
          </Text>
        </View>

        <Text
          variant="label"
          className="font-bold text-neutral-800"
          onPress={() => router.back()}
        >
          {copy.wrongIdentity(identityType)}
        </Text>
      </View>

      <View className="mt-auto pb-6">
        <Button
          label={isLoading ? 'Verifying...' : copy.submit}
          disabled={code.length < 4 || isLoading}
          onPress={() => {
            void verifyCode(code);
          }}
        />
      </View>
    </Screen>
  );
}

