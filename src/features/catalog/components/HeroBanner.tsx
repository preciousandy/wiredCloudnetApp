import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoneyText, Text } from '@/ui';
import { formatDuration } from '@/lib/format';
import type { TitleSummary } from '@/api/schemas/catalog';
import { HeroTopBar } from './HeroTopBar';
import { useWatchlistToggle } from '@/features/profile/hooks/useWatchlistToggle';
import { useWatchlist } from '@/features/profile/hooks/useProfile';

const AUTOPLAY_MS = 5500;

/**
 * The featured rail at the top of Home.
 *
 * Rotates through several titles on its own. Autoplay stops for good on the
 * first touch: continuing to advance under someone's finger is how a carousel
 * earns its reputation.
 *
 * The chrome above and the dots below stay put while the artwork and metadata
 * move, so the top bar does not jitter with every slide.
 */
export function HeroBanner({
  titles,
  balanceLabel,
}: {
  titles: TitleSummary[];
  balanceLabel?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<TitleSummary>>(null);

  const indexRef = useRef(0);
  const [autoplay, setAutoplay] = useState(true);

  const height = Math.min(width * 1.26, 540);

  useEffect(() => {
    if (!autoplay || titles.length < 2) return;
    const timer = setInterval(() => {
      // Kept in a ref rather than state: with no dots to render, advancing the
      // carousel should not re-render the whole hero every few seconds.
      const next = (indexRef.current + 1) % titles.length;
      indexRef.current = next;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [autoplay, titles.length, width]);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      indexRef.current = Math.round(event.nativeEvent.contentOffset.x / width);
    },
    [width],
  );

  if (titles.length === 0) return null;

  return (
    <View style={{ width, height }} className="bg-neutral-900">
      <FlatList
        ref={listRef}
        data={titles}
        keyExtractor={(item) => `hero-${item.id}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setAutoplay(false)}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => <HeroSlide title={item} width={width} height={height} />}
      />

      {/* Chrome sits above the moving artwork so it never shifts. */}
      <View style={{ paddingTop: insets.top + 6 }} className="absolute left-0 right-0 px-4">
        <HeroTopBar balanceLabel={balanceLabel} />

        <Pressable
          onPress={() => router.push('/search')}
          accessibilityRole="search"
          accessibilityLabel="Search movies, music and creators"
          className="mt-3 overflow-hidden rounded-lg border border-white/20"
        >
          <BlurView intensity={55} tint="dark">
            <View className="h-11 flex-row items-center gap-2 bg-black/35 px-3">
              <Ionicons name="search" size={17} color="rgba(255,255,255,0.95)" />
              <Text variant="body" className="text-white/90">
                Search movies, music, creators
              </Text>
            </View>
          </BlurView>
        </Pressable>
      </View>

    </View>
  );
}

function HeroSlide({
  title,
  width,
  height,
}: {
  title: TitleSummary;
  width: number;
  height: number;
}) {
  const { data: watchlist } = useWatchlist();
  const isSavedInWatchlist = watchlist?.items.some((item) => item.id === title.id) ?? false;
  const { saved, toggle, busy } = useWatchlistToggle(title.id, isSavedInWatchlist);

  const priceLabel = title.access.type === 'free' ? 'Free' : title.entitled ? 'Owned' : null;

  return (
    <View style={{ width, height }}>
      <Image
        source={{ uri: title.backdropUrl ?? title.posterUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={260}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <View
        className="absolute bottom-0 left-0 right-0 gap-2.5 px-4"
        // Was padded to clear the paging dots. They are gone, so the controls sit lower.
        style={{ paddingBottom: 14 }}
      >
        <Text variant="display" numberOfLines={2} className="text-white">
          {title.title}
        </Text>

        {/* Rating, duration and creator all change with the slide. */}
        <View className="flex-row items-center gap-2">
          <View className="rounded-lg border border-white/40 px-1.5 py-0.5">
            <Text variant="caption" className="font-bold text-white">
              {title.rating.toUpperCase()}
            </Text>
          </View>
          <Text variant="caption" className="text-white/85">
            {formatDuration(title.durationSeconds)}
          </Text>
          <Text variant="caption" className="text-white/50">
            ·
          </Text>
          <Text variant="caption" numberOfLines={1} className="flex-1 text-white/85">
            {title.creator.displayName}
          </Text>
        </View>

        <View className="mt-1 flex-row items-center gap-2.5">
          <Pressable
            onPress={() => router.push(`/title/${title.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${title.title}`}
            className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brand-500"
          >
            <Ionicons name="play" size={18} color="#FFFFFF" />
            <Text variant="label" className="font-bold text-white">
              {title.entitled ? 'Play now' : 'Watch'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void toggle()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            accessibilityLabel={saved ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`h-11 w-11 items-center justify-center rounded-lg border ${
              saved ? 'border-brand-500 bg-brand-500' : 'border-white/30 bg-black/50'
            }`}
          >
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color="#FFFFFF" />
          </Pressable>

          {/* Price follows whichever title is showing. */}
          <View className="h-11 items-center justify-center rounded-lg border border-white/25 bg-black/50 px-3">
            {priceLabel ? (
              <Text variant="label" className="font-bold text-white">
                {priceLabel}
              </Text>
            ) : (
              <MoneyText
                value={title.access.price!}
                variant="label"
                className="font-bold text-white"
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
