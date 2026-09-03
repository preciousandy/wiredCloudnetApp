import { useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSession } from '@/store/session';

/**
 * Boot route. Decides where the user lands once the session is restored.
 * White background so there is no colour flash between the native splash
 * and this screen, they should look like one continuous moment.
 */
export default function Boot() {
  const status = useSession((s) => s.status);

  useEffect(() => {
    if (status === 'booting') return;
    router.replace(status === 'authenticated' ? '/(tabs)' : '/(onboarding)');
  }, [status]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Image
        source={require('../assets/logo.png')}
        style={{ width: 180, height: 100 }}
        contentFit="contain"
      />
    </View>
  );
}
