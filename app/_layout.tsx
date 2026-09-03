import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/api/errors';
import { useSession } from '@/store/session';
import { ToastHost } from '@/ui';
import '../src/ui/theme/global.css';

// Expo Router renders this instead of a blank screen when a route throws.
// Without it, every runtime error looks identical: a black page and nothing else.
export { ErrorBoundary } from '@/ui/RouteErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Never auto-retry auth or validation failures, only transient ones.
        if (error instanceof ApiError) return error.isRetryable && failureCount < 2;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
    mutations: {
      // Money mutations carry idempotency keys and are retried explicitly
      // by their own state machines, never blindly by the query layer.
      retry: false,
    },
  },
});

export default function RootLayout() {
  const restore = useSession((s) => s.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            {/* No back gesture: an account is being created behind this screen. */}
            <Stack.Screen name="setup" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="watch/[id]" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
          </Stack>

          {/* Above every screen, so a toast raised from a hook or a service is
              visible no matter which route is on top. */}
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
