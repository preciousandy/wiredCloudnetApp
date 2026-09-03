import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MoneyText, Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { formatDuration } from '@/lib/format';
import type { Episode } from '@/api/schemas/series';

export interface EpisodeRowProps {
  episode: Episode;
  onPlay: () => void;
  onBuy: () => void;
}

function releaseLabel(iso: string | null): string {
  if (!iso) return 'Coming soon';
  const date = new Date(iso);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'Available soon';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * One episode.
 *
 * Upcoming episodes are shown rather than hidden, so a viewer can see a run is
 * ongoing, but they are visibly inert: no price, no play, no way to pay for
 * something that does not exist yet.
 */
export function EpisodeRow({ episode, onPlay, onBuy }: EpisodeRowProps) {
  const upcoming = !episode.released;
  const owned = episode.entitled || episode.price === null;
  const watched = episode.progressSeconds ?? 0;
  const progress = episode.durationSeconds > 0 ? watched / episode.durationSeconds : 0;

  const action = upcoming ? undefined : owned ? onPlay : onBuy;

  return (
    <Pressable
      onPress={action}
      disabled={upcoming}
      accessibilityRole="button"
      accessibilityLabel={
        upcoming
          ? `Episode ${episode.episodeNumber}, ${episode.title}, ${releaseLabel(episode.releasesAt)}`
          : owned
            ? `Play episode ${episode.episodeNumber}, ${episode.title}`
            : `Buy episode ${episode.episodeNumber}, ${episode.title}`
      }
      className={`flex-row gap-3 py-3 ${upcoming ? 'opacity-55' : ''}`}
    >
      <View className="overflow-hidden rounded-lg bg-neutral-100" style={{ width: 124, height: 70 }}>
        <Image
          source={{ uri: episode.stillUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
        />

        {upcoming ? (
          <View className="absolute inset-0 items-center justify-center bg-black/45">
            <Ionicons name="time-outline" size={18} color="#FFFFFF" />
          </View>
        ) : !owned ? (
          <View className="absolute inset-0 items-center justify-center bg-black/35">
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
          </View>
        ) : (
          <View className="absolute inset-0 items-center justify-center">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-black/55">
              <Ionicons name="play" size={14} color="#FFFFFF" />
            </View>
          </View>
        )}

        {progress > 0.01 && progress < 0.95 ? (
          <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
            <View className="h-full bg-brand-500" style={{ width: `${progress * 100}%` }} />
          </View>
        ) : null}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text variant="label" className="font-bold text-neutral-900">
            {episode.episodeNumber}. {episode.title}
          </Text>
        </View>

        <Text variant="caption" numberOfLines={2} className="mt-0.5 text-neutral-500">
          {episode.synopsis}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-2">
          {upcoming ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={11} color={neutral[400]} />
              <Text variant="caption" className="text-neutral-400">
                {releaseLabel(episode.releasesAt)}
              </Text>
            </View>
          ) : (
            <>
              <Text variant="caption" className="text-neutral-400">
                {formatDuration(episode.durationSeconds)}
              </Text>

              {episode.entitled ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
                  <Text variant="caption" className="font-bold text-success">
                    Owned
                  </Text>
                </View>
              ) : episode.price === null ? (
                <Text variant="caption" className="font-bold text-success">
                  Free
                </Text>
              ) : (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="wallet-outline" size={11} color={brand[600]} />
                  <MoneyText
                    value={episode.price}
                    variant="caption"
                    className="font-bold text-brand-700"
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}
