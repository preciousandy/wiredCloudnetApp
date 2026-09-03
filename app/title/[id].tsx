import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, MoneyText, Skeleton, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { catalogService } from '@/api/services';
import { formatCount, formatDuration } from '@/lib/format';
import { PurchaseSheet } from '@/features/wallet/components/PurchaseSheet';
import { useWatchlistToggle } from '@/features/profile/hooks/useWatchlistToggle';
import { EpisodeList } from '@/features/series/components';
import { TitleComments } from '@/features/social/components/TitleComments';
import { MoreSheet } from '@/features/social/components/MoreSheet';
import { titleUrl } from '@/features/social/lib/share';
import type { Money } from '@/lib/money';

type Tab = 'episodes' | 'about';

interface PurchaseTarget {
  id: string;
  name: string;
  price: Money;
}

function TitleMediaHero({
  trailerUrl,
  backdropUrl,
  posterUrl,
  width,
  insetsTop,
  onMorePress,
}: {
  trailerUrl?: string | null;
  backdropUrl?: string | null;
  posterUrl: string;
  width: number;
  insetsTop: number;
  onMorePress: () => void;
}) {
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(trailerUrl ?? '', (p) => {
    p.loop = true;
    p.muted = true;
    if (trailerUrl) {
      p.play();
    }
  });

  useEffect(() => {
    if (!trailerUrl || !player) return;
    player.muted = muted;
  }, [muted, player, trailerUrl]);

  useEffect(() => {
    if (!trailerUrl || !player) return;
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        setHasError(true);
      }
    });
    return () => sub.remove();
  }, [player, trailerUrl]);

  const togglePlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const showVideo = Boolean(trailerUrl && !hasError);

  return (
    <View style={{ height: width * 0.85 }} className="relative bg-black overflow-hidden">
      {showVideo ? (
        <Pressable onPress={togglePlay} className="flex-1 w-full h-full">
          <VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            nativeControls={false}
          />
        </Pressable>
      ) : (
        <Image
          source={{ uri: backdropUrl ?? posterUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(255,255,255,1)']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        pointerEvents="none"
      />

      <View
        style={{ paddingTop: insetsTop + 8 }}
        className="absolute left-4 right-4 flex-row items-center justify-between z-10"
      >
        <BackButton tone="dark" />
        <Pressable
          onPress={onMorePress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="More options"
          className="h-10 w-10 items-center justify-center rounded-lg border border-white/25 bg-black/25"
        >
          <Ionicons name="ellipsis-horizontal" size={19} color="#FFFFFF" />
        </Pressable>
      </View>

      {showVideo ? (
        <View className="absolute bottom-9 left-4 right-4 flex-row items-center justify-between z-10">
          <View className="flex-row items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
            <Ionicons name="videocam" size={13} color="#F2702D" />
            <Text variant="caption" className="text-[11px] font-bold tracking-wider text-white">
              TRAILER
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={togglePlay}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause trailer' : 'Play trailer'}
              className="h-8 w-8 items-center justify-center rounded-full bg-black/60"
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={15} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={() => setMuted((m) => !m)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={muted ? 'Unmute trailer' : 'Mute trailer'}
              className="h-8 w-8 items-center justify-center rounded-full bg-black/60"
            >
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function TitleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [buying, setBuying] = useState<PurchaseTarget | null>(null);
  const [tab, setTab] = useState<Tab>('episodes');
  const [moreOpen, setMoreOpen] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ['title', id],
    queryFn: () => catalogService.detail(String(id)),
    enabled: Boolean(id),
  });

  const { saved, toggle } = useWatchlistToggle(String(id), data?.saved ?? false);

  if (isPending || !data) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <Skeleton className="h-72 w-full rounded-none" />
        <View className="gap-3 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </View>
      </View>
    );
  }

  const isSeries = data.kind === 'series' && !data.seriesId;

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <TitleMediaHero
          trailerUrl={data.trailerUrl}
          backdropUrl={data.backdropUrl}
          posterUrl={data.posterUrl}
          width={width}
          insetsTop={insets.top}
          onMorePress={() => setMoreOpen(true)}
        />

        <View className="-mt-6 gap-3 px-4">
          <Text variant="title">{data.title}</Text>

          <View className="flex-row items-center gap-2">
            <View className="rounded-lg border border-neutral-300 px-1.5 py-0.5">
              <Text variant="caption" className="font-bold">
                {data.rating.toUpperCase()}
              </Text>
            </View>
            {!isSeries ? (
              <Text variant="caption">{formatDuration(data.durationSeconds)}</Text>
            ) : null}
            <Text variant="caption" className="text-neutral-300">
              ·
            </Text>
            <Text variant="caption">{data.category}</Text>
            <Text variant="caption" className="text-neutral-300">
              ·
            </Text>
            <Text variant="caption">{formatCount(data.viewCount)} views</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text variant="label" className="text-neutral-500">
              By {data.creator.displayName}
            </Text>

            <Pressable
              onPress={() => void toggle()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ selected: saved }}
              accessibilityLabel={saved ? 'Remove from watchlist' : 'Save to watchlist'}
              className="h-9 flex-row items-center gap-1.5 rounded-lg border border-neutral-200 px-3"
            >
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={15}
                color={saved ? '#F2702D' : neutral[500]}
              />
              <Text variant="caption" className={saved ? 'font-bold text-brand-600' : ''}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
          </View>

          {isSeries ? (
            <SeriesBody
              seriesId={data.id}
              description={data.description}
              tab={tab}
              onTabChange={setTab}
              onBuyEpisode={(episode) =>
                setBuying({
                  id: episode.id,
                  name: `${data.title}, ${episode.title}`,
                  price: episode.price!,
                })
              }
            />
          ) : (
            <>
              <FilmBody
                data={data}
                onBuy={() =>
                  setBuying({ id: data.id, name: data.title, price: data.access.price! })
                }
              />

              <View className="mt-8">
                <TitleComments titleId={data.id} canReview={data.entitled} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <MoreSheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        targetType="title"
        targetId={data.id}
        targetName={data.title}
        shareUrl={titleUrl(data.id)}
        creatorId={data.creator.id}
        creatorName={data.creator.displayName}
      />

      {buying ? (
        <PurchaseSheet
          visible
          onClose={() => setBuying(null)}
          titleId={buying.id}
          titleName={buying.name}
          price={buying.price}
        />
      ) : null}
    </View>
  );
}

function FilmBody({
  data,
  onBuy,
}: {
  data: { id: string; description: string; entitled: boolean; access: { type: string; price: Money | null } };
  onBuy: () => void;
}) {
  return (
    <>
      <Text variant="body" className="text-neutral-600">
        {data.description}
      </Text>

      <View className="mt-4 gap-3">
        {data.entitled ? (
          <Button label="Play now" onPress={() => router.push(`/watch/${data.id}`)} />
        ) : data.access.type === 'free' ? (
          <Button label="Watch free" onPress={() => router.push(`/watch/${data.id}`)} />
        ) : (
          <View className="gap-2">
            <View className="flex-row items-baseline gap-2">
              <Text variant="label" className="text-neutral-500">
                Price
              </Text>
              <MoneyText value={data.access.price!} variant="heading" />
            </View>
            <Button label="Buy with wallet" onPress={onBuy} />
          </View>
        )}
      </View>
    </>
  );
}

function SeriesBody({
  seriesId,
  description,
  tab,
  onTabChange,
  onBuyEpisode,
}: {
  seriesId: string;
  description: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onBuyEpisode: (episode: { id: string; title: string; price: Money | null }) => void;
}) {
  return (
    <View className="mt-2">
      <View className="flex-row border-b border-neutral-200">
        {(['episodes', 'about'] as Tab[]).map((option) => {
          const active = option === tab;
          return (
            <Pressable
              key={option}
              onPress={() => onTabChange(option)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`flex-1 items-center pb-3 ${active ? 'border-b-2 border-brand-500' : ''}`}
            >
              <Text
                variant="label"
                className={active ? 'font-bold text-neutral-900' : 'text-neutral-500'}
              >
                {option === 'episodes' ? 'Episodes' : 'About'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="pt-3">
        {tab === 'episodes' ? (
          <>
            <View className="mb-2 flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
              <Ionicons name="information-circle-outline" size={15} color={neutral[400]} />
              <Text variant="caption" className="flex-1">
                Episodes are bought one at a time, so you only pay for what has
                actually been released.
              </Text>
            </View>

            <EpisodeList
              seriesId={seriesId}
              onBuy={(episode) => onBuyEpisode(episode)}
            />
          </>
        ) : (
          <Text variant="body" className="text-neutral-600">
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}
