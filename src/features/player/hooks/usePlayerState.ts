import { useEffect, useState } from 'react';
import type { VideoPlayer } from 'expo-video';

export interface PlayerState {
  position: number;
  duration: number;
  /** Seconds of media buffered ahead, as a 0 to 1 fraction of duration. */
  buffered: number;
  playing: boolean;
  /** True while the player has stalled waiting for data, not while seeking. */
  buffering: boolean;
  failed: boolean;
}

/**
 * Everything the controls need to render, in one subscription.
 *
 * Deliberately not exposing the player itself to the UI: components that reach
 * into a native object tend to touch it after it has been released, which is
 * how we got "Cannot use shared object that was already released" the first time.
 */
export function usePlayerState(player: VideoPlayer, initialPosition = 0): PlayerState {
  const [position, setPosition] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timeSub = player.addListener('timeUpdate', ({ currentTime, bufferedPosition }) => {
      setPosition(currentTime);

      const total = player.duration;
      if (total > 0) {
        setDuration(total);
        if (typeof bufferedPosition === 'number') {
          setBuffered(Math.min(bufferedPosition / total, 1));
        }
      }
    });

    const playSub = player.addListener('playingChange', ({ isPlaying }) => setPlaying(isPlaying));

    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      setBuffering(status === 'loading');
      setFailed(status === 'error' || Boolean(error));
    });

    return () => {
      timeSub.remove();
      playSub.remove();
      statusSub.remove();
    };
  }, [player]);

  return { position, duration, buffered, playing, buffering, failed };
}
