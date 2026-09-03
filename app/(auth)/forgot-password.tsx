import { View } from 'react-native';
import { BackButton, Screen, Text } from '@/ui';
import { IdentityForm } from '@/features/auth/components/IdentityForm';
import { useRegistrationFlow } from '@/features/auth/hooks/useRegistration';
import { authCopy } from '@/copy/auth';

export default function ForgotPassword() {
  const { startFlow, error, clearError } = useRegistrationFlow();
  const copy = authCopy.forgot;

  return (
    <Screen>
      <View className="mt-4">
        <BackButton />
      </View>

      <View className="mb-8 mt-8 gap-2">
        <Text variant="title">{copy.title}</Text>
        <Text variant="body" className="text-neutral-500">
          {copy.subtitle}
        </Text>
      </View>

      <IdentityForm
        submitLabel={copy.submit}
        errorMessage={error?.message}
        onClearError={clearError}
        onSubmit={(identity, type) => {
          void startFlow(identity, type, 'reset');
        }}
      />
    </Screen>
  );
}
