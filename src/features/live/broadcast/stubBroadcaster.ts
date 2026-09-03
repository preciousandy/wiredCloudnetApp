import {
  IDLE_SNAPSHOT,
  type Broadcaster,
  type BroadcastCredentials,
  type BroadcastHealth,
  type BroadcastSnapshot,
} from './types';

const TICK_MS = 1000;
const CONNECT_MS = 1400;

/** Target uplink for a 720p broadcast, bits per second. */
const TARGET_BITRATE = 2_500_000;

function qualityFor(bitrate: number, dropped: number): BroadcastHealth['quality'] {
  if (dropped > 40 || bitrate < TARGET_BITRATE * 0.4) return 'poor';
  if (dropped > 10 || bitrate < TARGET_BITRATE * 0.75) return 'fair';
  return 'good';
}

/**
 * The broadcaster used until a development build exists.
 *
 * Not a no-op. It runs the real state machine on real timers, so every screen
 * built against it handles connecting, reconnecting, degraded uplink and a hard
 * failure the way it will in production. A stub that always succeeds would let
 * us ship a dashboard with no reconnect path and no one would notice until a
 * creator lost a paid event.
 *
 * Health drifts rather than sitting still, and roughly one broadcast in twelve
 * hits a wobble around the sixty second mark, which is where an unstable mobile
 * uplink usually shows itself.
 */
export function createStubBroadcaster(): Broadcaster {
  let snapshot: BroadcastSnapshot = { ...IDLE_SNAPSHOT };
  let listeners: ((s: BroadcastSnapshot) => void)[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let wobbleAt: number | null = null;

  const emit = (patch: Partial<BroadcastSnapshot>) => {
    snapshot = {
      ...snapshot,
      ...patch,
      health: { ...snapshot.health, ...(patch.health ?? {}) },
      devices: { ...snapshot.devices, ...(patch.devices ?? {}) },
    };
    listeners.forEach((listener) => listener(snapshot));
  };

  const stopTimers = () => {
    if (timer) clearInterval(timer);
    if (connectTimer) clearTimeout(connectTimer);
    timer = null;
    connectTimer = null;
  };

  const tick = () => {
    const elapsed = snapshot.elapsedSeconds + 1;

    // A wobble: the uplink degrades, drops frames, then recovers. This is the
    // path most live dashboards forget to design for.
    if (wobbleAt !== null && elapsed >= wobbleAt && elapsed < wobbleAt + 6) {
      const dropped = snapshot.health.droppedFrames + Math.round(6 + Math.random() * 10);
      emit({
        state: elapsed >= wobbleAt + 2 ? 'reconnecting' : 'live',
        elapsedSeconds: elapsed,
        health: {
          bitrate: Math.round(TARGET_BITRATE * (0.2 + Math.random() * 0.2)),
          droppedFrames: dropped,
          latencyMs: Math.round(400 + Math.random() * 500),
          quality: 'poor',
        },
      });
      return;
    }

    if (wobbleAt !== null && elapsed >= wobbleAt + 6) wobbleAt = null;

    const bitrate = Math.round(TARGET_BITRATE * (0.9 + Math.random() * 0.15));
    const latencyMs = Math.round(90 + Math.random() * 70);
    emit({
      state: 'live',
      elapsedSeconds: elapsed,
      health: {
        bitrate,
        droppedFrames: snapshot.health.droppedFrames,
        latencyMs,
        quality: qualityFor(bitrate, snapshot.health.droppedFrames),
      },
    });
  };

  return {
    // False on purpose. Screens read this to explain why the camera is a
    // placeholder rather than pretending the preview is real.
    isSupported: false,

    async startPreview() {
      if (snapshot.state === 'previewing' || snapshot.state === 'live') return;
      emit({ state: 'previewing', error: null });
    },

    async stopPreview() {
      if (snapshot.state === 'live' || snapshot.state === 'connecting') return;
      stopTimers();
      emit({ state: 'idle', elapsedSeconds: 0 });
    },

    async connect(credentials: BroadcastCredentials) {
      if (snapshot.state === 'connecting' || snapshot.state === 'live') return;

      if (!credentials.ingestUrl || !credentials.streamKey) {
        emit({ state: 'failed', error: 'This event has no stream key yet. Close and reopen it.' });
        return;
      }

      emit({ state: 'connecting', error: null, elapsedSeconds: 0 });

      connectTimer = setTimeout(() => {
        wobbleAt = Math.random() < 1 / 12 ? 55 + Math.round(Math.random() * 20) : null;
        emit({
          state: 'live',
          health: {
            bitrate: TARGET_BITRATE,
            droppedFrames: 0,
            latencyMs: 120,
            quality: 'good',
          },
        });
        timer = setInterval(tick, TICK_MS);
      }, CONNECT_MS);
    },

    async disconnect() {
      stopTimers();
      emit({ state: 'ended' });
    },

    async setCameraFacing(cameraFacing) {
      emit({ devices: { ...snapshot.devices, cameraFacing } });
    },

    async setCameraEnabled(cameraEnabled) {
      emit({ devices: { ...snapshot.devices, cameraEnabled } });
    },

    async setMicrophoneEnabled(microphoneEnabled) {
      emit({ devices: { ...snapshot.devices, microphoneEnabled } });
    },

    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
        if (listeners.length === 0) stopTimers();
      };
    },
  };
}
