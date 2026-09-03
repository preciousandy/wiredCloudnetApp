import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Screen, Text } from '@/ui';
import { brand, semantic } from '@/ui/theme/colors';

import { catalogService, walletService } from '@/api/services';
import { toApiError, type ApiError } from '@/api/errors';
import { useRegistrationFlow } from '@/features/auth/hooks/useRegistration';
import { useSession } from '@/store/session';

type StepKey = 'account' | 'wallet' | 'feed';
type StepState = 'waiting' | 'working' | 'done';

const STEPS: { key: StepKey; label: string; detail: string }[] = [
  {
    key: 'account',
    label: 'Creating your account',
    detail: 'Reserving your handle and securing your details',
  },
  {
    key: 'wallet',
    label: 'Opening your wallet',
    detail: 'Every purchase on CloudNet comes from here',
  },
  {
    key: 'feed',
    label: 'Getting your feed ready',
    detail: 'Loading films, series and live events',
  },
];

/**
 * The moment between "Finish" and the home screen.
 *
 * This screen exists because signup used to end with an instant jump to Home,
 * which told the user nothing about what had just been created for them. It is
 * also the only place in the app where a wait is genuinely appropriate: an
 * account, a wallet and a catalogue all have to exist before Home means
 * anything.
 *
 * Every step is a real await, not a timer. The wallet and feed steps prefetch
 * into the React Query cache, so Home renders complete instead of opening on
 * skeletons. The wait does actual work and earns itself back immediately.
 *
 * Lives at the root rather than inside (auth) on purpose: that group redirects
 * authenticated users straight to the tabs, and the session lands here at step
 * one, which would throw the user out halfway through their own setup.
 */
export default function Setup() {
  const queryClient = useQueryClient();
  const { createAccount } = useRegistrationFlow();
  const user = useSession((s) => s.user);

  const [states, setStates] = useState<Record<StepKey, StepState>>({
    account: 'waiting',
    wallet: 'waiting',
    feed: 'waiting',
  });
  const [phase, setPhase] = useState<'working' | 'done' | 'failed'>('working');
  const [error, setError] = useState<ApiError | null>(null);

  // React 18 mounts effects twice in development. Creating an account twice is
  // not something to leave to chance.
  const started = useRef(false);

  const mark = (key: StepKey, state: StepState) =>
    setStates((prev) => ({ ...prev, [key]: state }));

  const run = useCallback(async () => {
    setError(null);
    setPhase('working');
    setStates({ account: 'waiting', wallet: 'waiting', feed: 'waiting' });

    try {
      mark('account', 'working');
      await createAccount();
      mark('account', 'done');

      // Warm the cache the tabs are about to read. Failing here is not fatal:
      // the screens will fetch for themselves, they will just show a skeleton
      // first. An account that exists must never be blocked by a slow catalogue.
      mark('wallet', 'working');
      await queryClient
        .prefetchQuery({ queryKey: ['wallet'], queryFn: () => walletService.get() })
        .catch(() => undefined);
      mark('wallet', 'done');

      mark('feed', 'working');
      await queryClient
        .prefetchQuery({ queryKey: ['home'], queryFn: () => catalogService.home() })
        .catch(() => undefined);
      mark('feed', 'done');

      setPhase('done');
    } catch (cause) {
      setError(toApiError(cause));
      setPhase('failed');
    }
  }, [createAccount, queryClient]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  if (phase === 'done') {
    return (
      <Screen>
        <StatusBar style="dark" />
        {/* Explicit style, not className. NativeWind does not map className onto
            Animated.View, so the layout would silently collapse. */}
        <Animated.View
          entering={FadeIn.duration(260)}
          style={{ flex: 1, justifyContent: 'center', gap: 12 }}
        >
          <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Ionicons name="checkmark" size={34} color={semantic.success} />
          </View>

          <Text variant="display">You are in</Text>
          <Text variant="body" className="leading-6 text-neutral-500">
            Welcome to CloudNet{user?.username ? `, @${user.username}` : ''}. Your
            account and wallet are ready.
          </Text>

          <View className="mt-6 gap-3">
            <Ready
              icon="wallet-outline"
              title="Your wallet is open"
              body="Top it up once, then buy anything on CloudNet in a tap. No card details each time."
            />
            <Ready
              icon="videocam-outline"
              title="You can upload straight away"
              body="Post a short clip from Verticals, or a full film from CloudIt. You keep 70 percent of every sale."
            />
            <Ready
              icon="shield-checkmark-outline"
              title="You decide who sees what"
              body="Every upload is public, unlisted or private, and you can change it whenever you like."
            />
          </View>
        </Animated.View>

        <View className="pb-6">
          <Button label="Start watching" onPress={() => router.replace('/(tabs)')} />
        </View>
      </Screen>
    );
  }

  if (phase === 'failed') {
    return (
      <Screen>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center gap-3 px-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-danger/10">
            <Ionicons name="alert-circle-outline" size={34} color={semantic.danger} />
          </View>
          <Text variant="title" className="text-center">
            We could not finish setting up
          </Text>
          <Text variant="body" className="text-center leading-6 text-neutral-500">
            {error?.message ?? 'Something went wrong on our side.'}
          </Text>
          <Text variant="caption" className="mt-1 text-center text-neutral-400">
            Nothing was charged and no account was created. Trying again is safe.
          </Text>

          <View className="mt-6 w-full gap-3">
            <Button label="Try again" onPress={() => void run()} />
            <Button
              label="Start over"
              variant="secondary"
              onPress={() => router.replace('/(auth)/method')}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar style="dark" />
      <View className="flex-1 justify-center gap-2">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-lg bg-brand-50">
          <ActivityIndicator color={brand[500]} />
        </View>

        <Text variant="display">Setting up{'\n'}your account</Text>
        <Text variant="body" className="mb-8 leading-6 text-neutral-500">
          This takes a few seconds. Do not close the app.
        </Text>

        <View className="gap-5">
          {STEPS.map((step, index) => (
            <Animated.View
              key={step.key}
              entering={FadeInDown.delay(index * 90).duration(280)}
              style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}
            >
              <StepIcon state={states[step.key]} />
              <View className="flex-1">
                <Text
                  variant="label"
                  className={
                    states[step.key] === 'waiting' ? 'text-neutral-400' : 'font-bold text-neutral-900'
                  }
                >
                  {step.label}
                </Text>
                <Text variant="caption" className="mt-0.5 leading-5 text-neutral-400">
                  {step.detail}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-success">
        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
      </View>
    );
  }
  if (state === 'working') {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-50">
        <ActivityIndicator size="small" color={brand[500]} />
      </View>
    );
  }
  return <View className="h-7 w-7 rounded-full border-2 border-neutral-200" />;
}

function Ready({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
        <Ionicons name={icon} size={17} color={brand[500]} />
      </View>
      <View className="flex-1">
        <Text variant="label" className="font-bold">
          {title}
        </Text>
        <Text variant="caption" className="mt-0.5 leading-5 text-neutral-500">
          {body}
        </Text>
      </View>
    </View>
  );
}
