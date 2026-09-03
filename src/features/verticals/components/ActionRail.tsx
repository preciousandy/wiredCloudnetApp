import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/ui';
import { brand } from '@/ui/theme/colors';
import { formatCount } from '@/lib/format';
import type { Vertical } from '@/api/schemas/verticals';
import { useVerticalState } from '../hooks/useVerticalActions';

export interface ActionRailProps {
  item: Vertical;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  onMore: () => void;
  onCreate: () => void;
}

/** Right-hand rail: like, comment, save, share, more. */
export function ActionRail({
  item,
  onLike,
  onComment,
  onSave,
  onShare,
  onMore,
  onCreate,
}: ActionRailProps) {
  const state = useVerticalState(item);

  return (
    <View className="items-center gap-5">
      <LikeButton liked={state.liked} count={state.likeCount} onPress={onLike} />

      <RailButton
        icon="chatbubble-ellipses"
        label={formatCount(state.commentCount)}
        onPress={onComment}
        accessibilityLabel="Comments"
      />
      <RailButton
        icon={state.saved ? 'bookmark' : 'bookmark-outline'}
        active={state.saved}
        label={formatCount(state.saveCount)}
        onPress={onSave}
        accessibilityLabel={state.saved ? 'Remove from saved' : 'Save'}
      />
      <RailButton
        icon="arrow-redo"
        label={formatCount(state.shareCount)}
        onPress={onShare}
        accessibilityLabel="Share"
      />
      <RailButton icon="ellipsis-horizontal" onPress={onMore} accessibilityLabel="More options" />

      {/* Posting lives here rather than in the CloudIt tab: people decide to
          make a clip while watching clips, not while thinking about uploading a
          film. Separated by a rule so it does not read as another reaction. */}
      <View className="h-px w-7 bg-white/25" />

      <Pressable
        onPress={onCreate}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Post a vertical"
        className="h-11 w-11 items-center justify-center rounded-full bg-brand-500"
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

/**
 * The like button pops and throws a few hearts on the way up.
 *
 * The animation starts on the press itself, not when the request returns, which
 * is what made this feel sluggish before. Whether the server agrees is settled
 * afterwards and silently.
 */
function LikeButton({
  liked,
  count,
  onPress,
}: {
  liked: boolean;
  count: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const [burstKey, setBurstKey] = useState(0);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(1.32, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 9, stiffness: 320 }),
    );
    if (!liked) setBurstKey((key) => key + 1);
    onPress();
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Unlike' : 'Like'}
      className="items-center gap-1"
    >
      <View>
        {burstKey > 0 ? <HeartBurst key={burstKey} /> : null}

        <Animated.View style={style}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={30}
            color={liked ? brand[500] : '#FFFFFF'}
          />
        </Animated.View>
      </View>

      <Text variant="caption" className="font-bold text-white">
        {formatCount(count)}
      </Text>
    </Pressable>
  );
}

/** Three small hearts drifting up and fading. Remounted per like via key. */
function HeartBurst() {
  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      {[0, 1, 2].map((index) => (
        <Particle key={index} index={index} />
      ))}
    </View>
  );
}

function Particle({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 620 + index * 90,
      easing: Easing.out(Easing.quad),
    });
  }, [index, progress]);

  const drift = (index - 1) * 16;

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: -progress.value * (44 + index * 10) },
      { translateX: drift * progress.value },
      { scale: 0.5 + progress.value * 0.5 },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute' }, style]}>
      <Ionicons name="heart" size={14} color={brand[400]} />
    </Animated.View>
  );
}

function RailButton({
  icon,
  label,
  active,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  active?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.88, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 340 }),
    );
    onPress();
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="items-center gap-1"
    >
      <Animated.View style={style}>
        <Ionicons name={icon} size={28} color={active ? brand[500] : '#FFFFFF'} />
      </Animated.View>
      {label ? (
        <Text variant="caption" className="font-bold text-white">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
