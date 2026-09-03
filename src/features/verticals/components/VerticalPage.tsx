import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from '@/ui';
import { formatTimecode } from '@/lib/format';
import type { CreatorReel, Vertical } from '@/api/schemas/verticals';
import { ActionRail } from './ActionRail';
import { CreatorStrip } from './CreatorStrip';
import { LockOverlay } from './LockOverlay';
import { TrailerCTA } from './TrailerCTA';
import { VerticalPlayer } from './VerticalPlayer';
import { useVerticalState } from '../hooks/useVerticalActions';

export interface VerticalPageProps {
  /** Horizontal scroll offset of the pager, shared across all pages. */
  scrollX: SharedValue<number>;
  pageIndex: number;
  item: Vertical;
  creator: CreatorReel['creator'];
  width: number;
  height: number;
  bottomInset: number;
  isActive: boolean;
  mountPlayer: boolean;
  muted: boolean;
  onToggleMuted: () => void;
  onEnded: () => void;
  onProgress: (fraction: number) => void;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
  onComment: () => void;
  onShare: () => void;
  onMore: () => void;
  onUnlock: () => void;
  onCreate: () => void;
  unlocking: boolean;
}

const DOUBLE_TAP_MS = 260;

export function VerticalPage({
  scrollX,
  pageIndex,
  item,
  creator,
  width,
  height,
  bottomInset,
  isActive,
  mountPlayer,
  muted,
  onToggleMuted,
  onEnded,
  onProgress,
  onLike,
  onSave,
  onFollow,
  onComment,
  onShare,
  onMore,
  onUnlock,
  onCreate,
  unlocking,
}: VerticalPageProps) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);

  const locked = item.price !== null && !item.unlocked;
  const { liked } = useVerticalState(item);

  /**
   * Depth as you swipe. The clip scales down slightly and dims as it leaves,
   * and the overlay slides at a different rate to the video underneath.
   *
   * Driven by scroll position rather than a timer, so it tracks the finger
   * exactly and reverses cleanly on a half swipe.
   */
  const range = [(pageIndex - 1) * width, pageIndex * width, (pageIndex + 1) * width];

  const mediaStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollX.value, range, [0.9, 1, 0.9], Extrapolation.CLAMP) },
      // Slight counter movement gives the video parallax against the frame.
      {
        translateX: interpolate(
          scrollX.value,
          range,
          [width * 0.16, 0, -width * 0.16],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(scrollX.value, range, [0.45, 1, 0.45], Extrapolation.CLAMP),
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollX.value, range, [26, 0, 26], Extrapolation.CLAMP),
      },
    ],
  }));

  /**
   * One tap pauses, two taps like. We resolve the ambiguity by delaying the
   * pause slightly, which is the only way to tell the two apart without a
   * gesture library.
   */
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (!liked) onLike();
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current !== 0 && Date.now() - lastTap.current >= DOUBLE_TAP_MS) {
        setPaused((p) => !p);
        lastTap.current = 0;
      }
    }, DOUBLE_TAP_MS);
  }, [liked, onLike]);

  return (
    <View style={{ width, height }} className="bg-black">
      <Animated.View style={[{ position: 'absolute', width, height }, mediaStyle]}>
      {mountPlayer && !locked ? (
        <VerticalPlayer
          item={item}
          isActive={isActive}
          muted={muted}
          paused={paused}
          onEnded={onEnded}
          onProgress={(fraction) => {
            setProgress(fraction);
            onProgress(fraction);
          }}
        />
      ) : (
        <Image
          source={{ uri: item.posterUrl }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
        />
      )}
      </Animated.View>

      {/* Long press hides everything for a clean look at the video. */}
      <Pressable
        onPress={handleTap}
        onLongPress={() => setChromeHidden(true)}
        onPressOut={() => setChromeHidden(false)}
        delayLongPress={220}
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Play' : 'Pause'}
        className="absolute inset-0"
      />

      {paused && !locked ? (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-black/45">
            <Ionicons name="play" size={30} color="#FFFFFF" />
          </View>
        </View>
      ) : null}

      {burst ? (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(320)}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={110} color="rgba(242,112,45,0.92)" />
        </Animated.View>
      ) : null}

      {!chromeHidden ? (
        <Animated.View style={[{ position: 'absolute', width, height }, overlayStyle]} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.75)']}
            locations={[0, 0.35, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            pointerEvents="none"
          />

          <Pressable
            onPress={onToggleMuted}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            className="absolute right-4 top-14 h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-black/35"
          >
            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={17} color="#FFFFFF" />
          </Pressable>

          <View
            className="absolute right-3"
            style={{ bottom: bottomInset + 96 }}
          >
            <ActionRail
              item={item}
              onLike={onLike}
              onComment={onComment}
              onSave={onSave}
              onShare={onShare}
              onMore={onMore}
              onCreate={onCreate}
            />
          </View>

          <View
            className="absolute left-0 right-0 gap-3 px-4"
            style={{ bottom: bottomInset + 16, paddingRight: 76 }}
          >
            <CreatorStrip creator={creator} onFollow={onFollow} />

            <Text variant="body" numberOfLines={2} className="text-white">
              {item.caption}
            </Text>

            {item.linkedTitleId && item.linkedTitleName ? (
              <TrailerCTA titleId={item.linkedTitleId} titleName={item.linkedTitleName} />
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {/* Playback progress for this clip. Sits below the tab bar inset so it is
          always visible, even while the chrome is hidden by a long press. */}
      {!locked ? (
        <View
          className="absolute left-0 right-0"
          style={{ bottom: bottomInset }}
          pointerEvents="none"
        >
          {!chromeHidden ? (
            <View className="mb-1.5 flex-row justify-end px-4">
              <View className="rounded-lg bg-black/55 px-2 py-0.5">
                <Text variant="caption" className="font-bold text-white">
                  {formatTimecode(progress * item.durationSeconds)} /{' '}
                  {formatTimecode(item.durationSeconds)}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="h-[3px] w-full bg-white/20">
            <View
              className="h-full bg-brand-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
            />
          </View>
        </View>
      ) : null}

      {locked ? (
        <LockOverlay price={item.price!} onUnlock={onUnlock} busy={unlocking} />
      ) : null}
    </View>
  );
}
