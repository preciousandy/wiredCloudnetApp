import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Text } from './Text';
import { neutral, semantic } from './theme/colors';

interface ErrorBoundaryProps {
  error: Error;
  retry: () => Promise<void>;
}

/**
 * Expo Router renders this instead of a blank screen when a route throws.
 *
 * Two audiences, one component. Users get an apology and a way out; developers
 * get the stack, but only in development. Shipping a stack trace to a paying
 * customer tells them nothing and makes the product look broken, which is
 * exactly what this screen is meant to avoid.
 *
 * The crash itself still needs reporting. Once Sentry is wired up, that call
 * goes in here, where every uncaught render error already passes through.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <Ionicons name="refresh-circle-outline" size={34} color={semantic.warning} />
        </View>

        <Text variant="title" className="text-center">
          Something went wrong
        </Text>

        <Text variant="body" className="text-center text-neutral-500">
          This screen ran into a problem. Trying again usually sorts it. If it
          keeps happening, let us know and we will fix it.
        </Text>

        <View className="mt-5 w-full gap-3">
          <Button label="Try again" onPress={() => retry()} />
          <Button label="Go home" variant="secondary" onPress={() => router.replace('/(tabs)')} />
        </View>

        <Pressable
          onPress={() => router.push('/support')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Contact support"
          className="mt-2"
        >
          <Text variant="caption" className="font-bold text-brand-500">
            Contact support
          </Text>
        </Pressable>
      </View>

      {/* Developer detail, kept out of production builds entirely. */}
      {isDev ? (
        <View className="border-t border-neutral-200 bg-neutral-50 px-5 pb-8 pt-4">
          <Pressable
            onPress={() => setShowDetails((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Toggle developer details"
            className="flex-row items-center gap-2"
          >
            <Ionicons name="bug-outline" size={15} color={neutral[500]} />
            <Text variant="caption" className="flex-1 font-bold text-neutral-600">
              Developer details
            </Text>
            <Ionicons
              name={showDetails ? 'chevron-down' : 'chevron-forward'}
              size={14}
              color={neutral[400]}
            />
          </Pressable>

          {showDetails ? (
            <>
              <Text variant="caption" className="mt-2 font-bold text-danger">
                {error.message}
              </Text>
              <ScrollView className="mt-2 max-h-56 rounded-lg bg-white p-3">
                <Text variant="caption" className="font-mono text-neutral-600">
                  {error.stack ?? 'No stack trace available.'}
                </Text>
              </ScrollView>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
