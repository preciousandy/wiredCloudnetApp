import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Divider, GoogleButton, Screen, Text } from '@/ui';
import { authCopy } from '@/copy/auth';

export default function SignUp() {
  const copy = authCopy.signUp;

  return (
    <Screen>
      <View className="mt-14 items-center gap-2">
        <Text variant="title">{copy.title}</Text>
        <Text variant="body" className="text-center text-neutral-500">
          {copy.subtitle}
        </Text>
      </View>

      <View className="mt-12 gap-4">
        <Button label={copy.phoneOrEmail} onPress={() => router.push('/(auth)/method')} />
        <Divider label="or" />
        <GoogleButton label={copy.google} />
      </View>

      <View className="mt-auto gap-6 pb-6">
        <Text variant="caption" className="text-center text-neutral-400">
          {copy.legal}
        </Text>

        <View className="flex-row items-center justify-center gap-1">
          <Text variant="label" className="text-neutral-500">
            {copy.haveAccount}
          </Text>
          <Text
            variant="label"
            className="font-bold text-brand-500"
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            {copy.logIn}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
