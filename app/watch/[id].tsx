import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, toast } from '@/ui';
import { catalogService, playbackService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { usePreferences } from '@/store/preferences';
import { usePlayerState } from '@/features/player/hooks/usePlayerState';
import { useChrome } from '@/features/player/hooks/useChrome';
import { useFullscreen } from '@/features/player/hooks/useFullscreen';
import { useNextUp } from '@/features/player/hooks/useNextUp';
import { clampSeek } from '@/features/player/lib/time';
import {
  BufferingIndicator,
  CenterControls,
  GestureLayer,
  LockedOverlay,
  NextUp,
  ResumePrompt,
  Scrubber,
  SettingsSheet,
  TopBar,
} from '@/features/player/components';
import type { PlaybackTicket } from '@/api/schemas/playback';

/** Below this we resume silently; above it we ask. */
const ASK_TO_RESUME_AFTER = 60;
const SLOW_BUFFER_MS = 4000;

export default function Watch() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: title } = useQuery({
    queryKey: ['title', id],
    queryFn: () => catalogService.detail(String(id)),
    enabled: Boolean(id),
  });

  const {
    data: ticket,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['playback', id],
    queryFn: () => playbackService.ticket(String(id)),
    enabled: Boolean(id),
    retry: false,
  });

  if (isError) {
    const apiError = toApiError(error);
    const locked = apiError.code === 'FORBIDDEN';

    return (
      <View className="flex-1 items-center justify-center gap-3 bg-black px-10">
        <StatusBar style="light" />
        <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <Ionicons
            name={locked ? 'lock-closed' : 'alert-circle-outline'}
            size={28}
            color="#FFFFFF"
          />
        </View>
        <Text variant="title" className="text-center text-white">
          {locked ? 'You do not own this yet' : 'Could not start playback'}
        </Text>
        <Text variant="body" className="text-center text-white/60">
          {locked
            ? 'Buy it with your wallet balance and it will play straight away.'
            : apiError.message}
        </Text>
        <View className="mt-3 w-52 gap-3">
          {locked ? (
            <Button label="See the title" onPress={() => router.replace(`/title/${id}`)} />
          ) : (
            <Button label="Try again" onPress={() => void refetch()} />
          )}
          <Button label="Go back" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (isPending || !ticket) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <StatusBar style="light" />
        <ActivityIndicator color="#F2702D" />
      </View>
    );
  }

  return (
    <PlayerSurface
      titleId={String(id)}
      titleName={title?.title ?? ''}
      creatorName={title?.creator.displayName}
      category={title?.category}
      seriesId={title?.seriesId ?? null}
      episodeLabel={
        title?.seasonNumber && title?.episodeNumber
          ? `${title.seriesTitle ?? ''} S${title.seasonNumber} E${title.episodeNumber}`.trim()
          : undefined
      }
      ticket={ticket}
    />
  );
}

function PlayerSurface({
  titleId,
  titleName,
  creatorName,
  category,
  seriesId,
  episodeLabel,
  ticket,
}: {
  titleId: string;
  titleName: string;
  creatorName?: string;
  category?: string;
  seriesId?: string | null;
  episodeLabel?: string;
  ticket: PlaybackTicket;
}) {
  const insets = useSafeAreaInsets();
  const autoplayNext = usePreferences((s) => s.autoplayNext);

  // A film should not put the screen to sleep at the quiet bit.
  useKeepAwake();

  const startAt = ticket.startPositionSeconds;
  const [askResume, setAskResume] = useState(startAt > ASK_TO_RESUME_AFTER);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsKey, setSettingsKey] = useState(0);
  const [ended, setEnded] = useState(false);
  const [slowBuffer, setSlowBuffer] = useState(false);
  const [volume, setVolumeState] = useState(1);

  const lastPosition = useRef(startAt);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(ticket.manifestUrl, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.4;
    p.currentTime = startAt;
  });

  const state = usePlayerState(player, startAt);
  const { data: nextTitle } = useNextUp(titleId, category, seriesId);
  const chrome = useChrome();
  const fullscreen = useFullscreen();

  // Hold playback until the resume question is answered.
  useEffect(() => {
    if (!askResume) player.play();
  }, [askResume, player]);

  useEffect(() => {
    lastPosition.current = state.position;
  }, [state.position]);

  useEffect(() => {
    const endSub = player.addListener('playToEnd', () => setEnded(true));
    return () => endSub.remove();
  }, [player]);

  // Only call a buffer "slow" after it has actually been slow.
  useEffect(() => {
    if (state.buffering) {
      slowTimer.current = setTimeout(() => setSlowBuffer(true), SLOW_BUFFER_MS);
    } else {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setSlowBuffer(false);
    }
    return () => {
      if (slowTimer.current) clearTimeout(slowTimer.current);
    };
  }, [state.buffering]);

  useEffect(() => {
    if (state.failed) toast.error('Playback stopped. Check your connection.');
  }, [state.failed]);

  /** Fire and forget on exit; a lost resume point beats a blocked back button. */
  useEffect(() => {
    return () => {
      const seconds = Math.floor(lastPosition.current);
      if (seconds > 5) void playbackService.reportProgress(titleId, seconds);
    };
  }, [titleId]);

  const seekTo = useCallback(
    (seconds: number) => {
      player.currentTime = clampSeek(seconds, state.duration);
      chrome.keepAlive();
    },
    [player, chrome, state.duration],
  );

  const seekBy = useCallback(
    (delta: number) => {
      seekTo(player.currentTime + delta);
    },
    [player, seekTo],
  );

  const togglePlay = useCallback(() => {
    if (state.playing) player.pause();
    else player.play();
    chrome.keepAlive();
  }, [state.playing, player, chrome]);

  const setVolume = useCallback(
    (next: number) => {
      player.volume = next;
      setVolumeState(next);
    },
    [player],
  );

  const showChrome = chrome.visible && !chrome.locked && !askResume && !ended;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" hidden={!showChrome} />

      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        nativeControls={false}
        allowsPictureInPicture
      />

      {/* Gestures sit under the controls so buttons always win a touch. */}
      <GestureLayer
        enabled={!chrome.locked && !askResume && !ended}
        onTap={chrome.toggle}
        onSeekBy={seekBy}
        onVolumeChange={setVolume}
        getVolume={() => volume}
      />

      {state.buffering && !askResume ? <BufferingIndicator slow={slowBuffer} /> : null}

      {showChrome ? (
        <>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.35, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            pointerEvents="none"
          />

          <TopBar
            title={titleName}
            subtitle={episodeLabel ?? creatorName}
            paddingTop={insets.top + 8}
            onLock={() => {
              chrome.setLocked(true);
              toast.info('Controls locked');
            }}
            onSettings={() => {
              setSettingsKey((k) => k + 1);
              setSettingsOpen(true);
              chrome.hold();
            }}
          />

          <CenterControls
            playing={state.playing}
            buffering={state.buffering}
            onTogglePlay={togglePlay}
            onSeekBy={seekBy}
          />

          <View
            style={{ paddingBottom: insets.bottom + 10 }}
            className="absolute bottom-0 left-0 right-0 px-4"
          >
            <Scrubber
              position={state.position}
              duration={state.duration}
              buffered={state.buffered}
              onSeek={seekTo}
              onScrubStart={chrome.hold}
              onScrubEnd={chrome.keepAlive}
            />

            <View className="mt-1 flex-row items-center justify-end gap-4">
              <Pressable
                onPress={() => setVolume(volume > 0 ? 0 : 1)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={volume > 0 ? 'Mute' : 'Unmute'}
              >
                <Ionicons
                  name={volume > 0 ? 'volume-high' : 'volume-mute'}
                  size={19}
                  color="#FFFFFF"
                />
              </Pressable>

              <Pressable
                onPress={() => void fullscreen.toggle()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={fullscreen.landscape ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <Ionicons
                  name={fullscreen.landscape ? 'contract-outline' : 'expand-outline'}
                  size={19}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>
        </>
      ) : null}

      {chrome.locked ? <LockedOverlay onUnlock={() => chrome.setLocked(false)} /> : null}

      {askResume ? (
        <ResumePrompt
          position={startAt}
          onResume={() => setAskResume(false)}
          onRestart={() => {
            player.currentTime = 0;
            setAskResume(false);
          }}
        />
      ) : null}

      {ended && nextTitle ? (
        <NextUp
          title={nextTitle}
          autoplay={autoplayNext}
          onPlay={() => router.replace(`/watch/${nextTitle.id}`)}
          onDismiss={() => router.back()}
        />
      ) : ended ? (
        <View className="absolute inset-0 items-center justify-center gap-3 bg-black/85 px-10">
          <Text variant="heading" className="text-center text-white">
            That is the end
          </Text>
          <View className="mt-2 w-52 gap-3">
            <Button
              label="Watch again"
              onPress={() => {
                setEnded(false);
                player.currentTime = 0;
                player.play();
              }}
            />
            <Button label="Done" variant="secondary" onPress={() => router.back()} />
          </View>
        </View>
      ) : null}

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          chrome.keepAlive();
        }}
        player={player}
        refreshKey={settingsKey}
      />
    </View>
  );
}
