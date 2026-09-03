import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { Vertical } from '@/api/schemas/verticals';

export interface VerticalPlayerProps {
  item: Vertical;
  isActive: boolean;
  muted: boolean;
  paused: boolean;
  onEnded: () => void;
  onProgress: (fraction: number) => void;
}

/**
 * One video surface.
 *
 * Mounted only for the active clip and its immediate neighbour. `isActive`
 * controls playback rather than mounting, so the neighbour is buffered and
 * starts instantly when the user swipes to it.
 */
export function VerticalPlayer({
  item,
  isActive,
  muted,
  paused,
  onEnded,
  onProgress,
}: VerticalPlayerProps) {
  const [ready, setReady] = useState(false);
  const endedRef = useRef(false);

  const player = useVideoPlayer(item.videoUrl, (p) => {
    p.loop = false;
    p.muted = muted;
    p.timeUpdateEventInterval = 0.25;
  });

  // Playback follows the active flag, so swiping stops the old clip immediately.
  useEffect(() => {
    if (isActive && !paused) {
      endedRef.current = false;
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, paused, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setReady(true);
    });

    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      const duration = player.duration || item.durationSeconds;
      if (duration > 0) onProgress(currentTime / duration);
    });

    // playToEnd can fire more than once on some devices; guard so the feed does
    // not skip two clips at a time.
    const endSub = player.addListener('playToEnd', () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onEnded();
    });

    return () => {
      statusSub.remove();
      timeSub.remove();
      endSub.remove();
    };
  }, [player, item.durationSeconds, onEnded, onProgress]);

  return (
    <View className="absolute inset-0 bg-black">
      {/* Poster stays underneath until the first frame is decoded, so there is
          never a black flash between clips. */}
      {!ready ? (
        <Image
          source={{ uri: item.posterUrl }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : null}

      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}
