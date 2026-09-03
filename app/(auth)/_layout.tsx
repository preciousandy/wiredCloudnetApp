import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/store/session';

export default function AuthLayout() {
  const status = useSession((s) => s.status);

  if (status === 'booting') return null;
  // Signed-in users have no business on the auth stack.
  if (status === 'authenticated') return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
