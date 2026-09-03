import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@/ui';
import { CommentsSheet, CreatorReelPager } from '@/features/verticals/components';
import { useVerticalsFeed } from '@/features/verticals/hooks/useVerticalsFeed';
import { toApiError } from '@/api/errors';

const TAB_BAR_HEIGHT = 64;

/**
 * Verticals: a two-axis feed.
 *
 *   horizontal  one creator's clips, in order
 *   vertical    between creators
 *
 * You stay inside a creator's work until you deliberately swipe up, which is
 * what makes people actually remember whose video they watched. That matters on
 * a platform where creators sell things.
 */
export default function Verticals() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, error, refetch } = useVerticalsFeed();

  const [activeReel, setActiveReel] = useState(0);
  const [screenFocused, setScreenFocused] = useState(true);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const pageHeight = height - TAB_BAR_HEIGHT - insets.bottom;

  /**
   * Pause everything when the tab loses focus. Without this the audio keeps
   * playing while the user browses Home, which feels broken and drains battery.
   */
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.y / pageHeight);
      setActiveReel(next);
    },
    [pageHeight],
  );

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <StatusBar style="light" />
        <ActivityIndicator color="#F2702D" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-black px-10">
        <StatusBar style="light" />
        <Text variant="heading" className="text-center text-white">
          Could not load Verticals
        </Text>
        <Text variant="body" className="text-center text-white/60">
          {toApiError(error).message}
        </Text>
        <View className="mt-2 w-40">
          <Button label="Try again" variant="secondary" onPress={() => void refetch()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={data.reels}
        keyExtractor={(reel) => reel.creator.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={pageHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: pageHeight, offset: pageHeight * i, index: i })}
        windowSize={3}
        maxToRenderPerBatch={1}
        initialNumToRender={1}
        removeClippedSubviews
        ListEmptyComponent={
          <View className="items-center justify-center gap-4 px-8" style={{ height: pageHeight }}>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="film-outline" size={32} color="#FFFFFF" />
            </View>
            <Text variant="heading" className="text-center text-white">
              No Verticals Yet
            </Text>
            <Text variant="body" className="text-center text-white/60">
              Be the first creator to post a short video clip on CloudNet.
            </Text>
            <View className="mt-2 w-48">
              <Button label="Post a Vertical" onPress={() => router.push('/verticals/new')} />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <CreatorReelPager
            reel={item}
            width={width}
            height={pageHeight}
            topInset={insets.top}
            bottomInset={0}
            isActive={index === activeReel && screenFocused && commentsFor === null}
            nextCreatorName={data.reels[index + 1]?.creator.displayName}
            onOpenComments={setCommentsFor}
          />
        )}
      />

      <CommentsSheet
        verticalId={commentsFor}
        visible={commentsFor !== null}
        onClose={() => setCommentsFor(null)}
      />
    </View>
  );
}
