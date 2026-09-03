import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { verticalsService } from '@/api/services';
import {
  followerCountOf,
  followingOf,
  likeCountOf,
  likedOf,
  saveCountOf,
  savedOf,
  shareCountOf,
  useVerticalActions,
} from '../hooks/useVerticalActions';
import { newIdempotencyKey } from '@/lib/idempotency';
import type { CreatorReel, Vertical } from '@/api/schemas/verticals';
import { advanceOnEnd, clampIndex, resumeIndex, shouldMountPlayer } from '../lib/advance';
import { useFeedPosition } from '../hooks/useFeedPosition';
import { MoreSheet } from '@/features/social/components/MoreSheet';
import { shareLink, verticalUrl } from '@/features/social/lib/share';
import { SegmentedProgress } from './SegmentedProgress';
import { SwipeUpHint } from './SwipeUpHint';
import { VerticalPage } from './VerticalPage';

export interface CreatorReelPagerProps {
  reel: CreatorReel;
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  isActive: boolean;
  nextCreatorName?: string;
  onOpenComments: (verticalId: string) => void;
}

/**
 * The horizontal axis: one creator's verticals, in order.
 *
 * When a clip ends we page sideways to the next one. On the last clip we stop
 * and show the swipe-up hint rather than jumping to another creator.
 */
/**
 * createAnimatedComponent erases the list's generic, so every renderItem
 * argument arrives as `unknown`. Re-declaring the type here restores it and
 * keeps the item typed at every call site below.
 */
const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList,
) as unknown as typeof FlatList<Vertical>;

export function CreatorReelPager({
  reel,
  width,
  height,
  topInset,
  bottomInset,
  isActive,
  nextCreatorName,
  onOpenComments,
}: CreatorReelPagerProps) {
  const listRef = useRef<FlatList>(null);

  /** Drives the depth effect as slides move. */
  const scrollX = useSharedValue(0);
  const { toggleLike, toggleSave, toggleFollow, incrementShare } = useVerticalActions();
  const queryClient = useQueryClient();

  const remember = useFeedPosition((s) => s.remember);
  const remembered = useFeedPosition((s) => s.positions[reel.creator.id]);
  const muted = useFeedPosition((s) => s.muted);
  const toggleMuted = useFeedPosition((s) => s.toggleMuted);

  const [index, setIndex] = useState(() => resumeIndex(remembered, reel.items.length));
  const [progress, setProgress] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [moreFor, setMoreFor] = useState<string | null>(null);

  // Restore the user's place when this creator scrolls back into view.
  useEffect(() => {
    if (!isActive) return;
    const target = resumeIndex(remembered, reel.items.length);
    if (target !== index) {
      setIndex(target);
      listRef.current?.scrollToOffset({ offset: target * width, animated: false });
    }
    // Only on becoming active; re-running on every index change would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const goTo = useCallback(
    (next: number, animated = true) => {
      const clamped = clampIndex(next, reel.items.length);
      setIndex(clamped);
      setProgress(0);
      remember(reel.creator.id, clamped);
      listRef.current?.scrollToOffset({ offset: clamped * width, animated });
    },
    [reel.items.length, reel.creator.id, remember, width],
  );

  const handleEnded = useCallback(() => {
    const result = advanceOnEnd(index, reel.items.length);
    if (result.reachedEnd) {
      setAtEnd(true);
      return;
    }
    goTo(result.index);
  }, [index, reel.items.length, goTo]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next === index) return;
      setAtEnd(false);
      setProgress(0);
      setIndex(next);
      remember(reel.creator.id, next);
    },
    [index, width, remember, reel.creator.id],
  );

  const refreshFeed = () => queryClient.invalidateQueries({ queryKey: ['verticals', 'feed'] });

  const handleFollow = () =>
    toggleFollow(reel.creator, followingOf(reel.creator), followerCountOf(reel.creator));

  const handleUnlock = async (verticalId: string) => {
    setUnlocking(true);
    try {
      // Same idempotency discipline as any other spend: one key per intent.
      await verticalsService.unlock(verticalId, newIdempotencyKey());
      await Promise.all([refreshFeed(), queryClient.invalidateQueries({ queryKey: ['wallet'] })]);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <View style={{ width, height }} className="bg-black">
      <AnimatedFlatList
        ref={listRef as never}
        data={reel.items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialScrollIndex={index}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        renderItem={({ item, index: itemIndex }) => (
          <VerticalPage
            scrollX={scrollX}
            pageIndex={itemIndex}
            item={item}
            creator={reel.creator}
            width={width}
            height={height}
            bottomInset={bottomInset}
            isActive={isActive && itemIndex === index && !atEnd}
            mountPlayer={shouldMountPlayer(itemIndex, index, isActive)}
            muted={muted}
            onToggleMuted={toggleMuted}
            onEnded={handleEnded}
            onProgress={setProgress}
            onLike={() => toggleLike(item, likedOf(item), likeCountOf(item))}
            onSave={() => toggleSave(item, savedOf(item), saveCountOf(item))}
            onFollow={handleFollow}
            onComment={() => onOpenComments(item.id)}
            onShare={() => {
              incrementShare(item, shareCountOf(item));
              void shareLink(verticalUrl(item.id), `Watch this on CloudNet`);
            }}
            onMore={() => setMoreFor(item.id)}
            onUnlock={() => void handleUnlock(item.id)}
            onCreate={() => router.push('/verticals/new')}
            unlocking={unlocking}
          />
        )}
      />

      <View
        className="absolute left-0 right-0 px-4"
        style={{ top: topInset + 8 }}
        pointerEvents="none"
      >
        <SegmentedProgress count={reel.items.length} index={index} progress={progress} />
      </View>

      {atEnd && isActive ? <SwipeUpHint nextCreator={nextCreatorName} /> : null}

      <MoreSheet
        visible={moreFor !== null}
        onClose={() => setMoreFor(null)}
        targetType="vertical"
        targetId={moreFor ?? ''}
        targetName={reel.items.find((i) => i.id === moreFor)?.caption ?? 'this clip'}
        shareUrl={verticalUrl(moreFor ?? '')}
        creatorId={reel.creator.id}
        creatorName={reel.creator.displayName}
      />
    </View>
  );
}
