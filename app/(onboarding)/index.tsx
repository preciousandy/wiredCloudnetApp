import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button, PagerDots, Screen, Text } from '@/ui';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '@/copy/onboarding';

const AUTOPLAY_MS = 4500;

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);

  // Autoplay stops for good on the first touch. Continuing to advance under
  // someone's finger is the kind of thing that makes a carousel feel broken.
  const [autoplay, setAutoplay] = useState(true);

  const frameWidth = width - 32;

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % ONBOARDING_SLIDES.length;
        listRef.current?.scrollToOffset({ offset: next * frameWidth, animated: true });
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [autoplay, frameWidth]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }).current;

  const stopAutoplay = useCallback(() => setAutoplay(false), []);

  const slide = ONBOARDING_SLIDES[index] ?? ONBOARDING_SLIDES[0]!;

  return (
    <Screen>
      <View className="h-10 flex-row items-center justify-end">
        <Pressable onPress={() => router.push('/(auth)/sign-up')} hitSlop={12}>
          <Text variant="label" className="font-bold text-neutral-500">
            Skip
          </Text>
        </Pressable>
      </View>

      {/*
        Copy sits above the frame and swaps as the images slide beneath it.
        Keyed on slide id so React remounts it and the fade actually runs.
      */}
      <View className="h-32 justify-end pb-5">
        <Animated.View key={slide.id} entering={FadeIn.duration(260)} exiting={FadeOut.duration(120)}>
          <Text variant="title">{slide.title}</Text>
          <Text variant="body" className="mt-2 text-neutral-500">
            {slide.body}
          </Text>
        </Animated.View>
      </View>

      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={frameWidth}
          decelerationRate="fast"
          onScrollBeginDrag={stopAutoplay}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          getItemLayout={(_, i) => ({ length: frameWidth, offset: frameWidth * i, index: i })}
          renderItem={({ item }) => (
            <View style={{ width: frameWidth }} className="h-full">
              <Image
                source={item.image}
                style={{ width: '100%', height: '100%', borderRadius: 8 }}
                contentFit="cover"
                transition={200}
                accessibilityLabel={item.title}
              />
            </View>
          )}
        />
      </View>

      <View className="py-5">
        <PagerDots count={ONBOARDING_SLIDES.length} index={index} />
      </View>

      <View className="gap-3 pb-6">
        <Button label="Get started" onPress={() => router.push('/(auth)/sign-up')} />
        <Button
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in')}
        />
      </View>
    </Screen>
  );
}
