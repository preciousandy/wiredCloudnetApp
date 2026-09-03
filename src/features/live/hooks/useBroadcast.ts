import { useCallback, useEffect, useState } from 'react';
import { broadcaster, type BroadcastCredentials, type BroadcastSnapshot } from '../broadcast';

/**
 * React's view of the broadcaster.
 *
 * The broadcaster is a plain object with its own lifetime because it must
 * outlive any one screen: the creator can navigate from the green room to the
 * dashboard without the stream dropping. This hook only mirrors its state into
 * React and never owns it.
 */
export function useBroadcast() {
  const [snapshot, setSnapshot] = useState<BroadcastSnapshot>(() => broadcaster.getSnapshot());

  useEffect(() => {
    setSnapshot(broadcaster.getSnapshot());
    return broadcaster.subscribe(setSnapshot);
  }, []);

  const startPreview = useCallback(() => broadcaster.startPreview(), []);
  const stopPreview = useCallback(() => broadcaster.stopPreview(), []);
  const connect = useCallback(
    (credentials: BroadcastCredentials) => broadcaster.connect(credentials),
    [],
  );
  const disconnect = useCallback(() => broadcaster.disconnect(), []);

  const flipCamera = useCallback(
    () =>
      broadcaster.setCameraFacing(
        broadcaster.getSnapshot().devices.cameraFacing === 'front' ? 'back' : 'front',
      ),
    [],
  );

  const toggleCamera = useCallback(
    () => broadcaster.setCameraEnabled(!broadcaster.getSnapshot().devices.cameraEnabled),
    [],
  );

  const toggleMicrophone = useCallback(
    () => broadcaster.setMicrophoneEnabled(!broadcaster.getSnapshot().devices.microphoneEnabled),
    [],
  );

  return {
    ...snapshot,
    isSupported: broadcaster.isSupported,
    isLive: snapshot.state === 'live' || snapshot.state === 'reconnecting',
    startPreview,
    stopPreview,
    connect,
    disconnect,
    flipCamera,
    toggleCamera,
    toggleMicrophone,
  };
}
