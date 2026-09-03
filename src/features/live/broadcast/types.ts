/**
 * The broadcaster boundary.
 *
 * Everything in the creator live flow talks to this interface and nothing else.
 * Swapping the stub for a real SDK is one file: `index.ts` picks the
 * implementation, exactly like `EXPO_PUBLIC_USE_MOCK_API` picks the API adapter.
 *
 * Why a boundary rather than calling an SDK directly:
 *
 * Camera to viewers needs native code, so it cannot run in Expo Go. Building the
 * screens against a stub means the whole flow, every screen, every state, every
 * error path, is real and testable today. When the development build lands, the
 * screens do not change.
 *
 * The shape is modelled on the WebRTC and RTMP SDKs generally (Amazon IVS,
 * LiveKit, Mux) rather than on any one of them, so the adapter stays thin
 * whichever way that decision goes.
 */

export type BroadcastState =
  | 'idle'
  /** Camera and mic are running locally. Nothing is being sent yet. */
  | 'previewing'
  | 'connecting'
  | 'live'
  /** Connection dropped, the SDK is retrying. Frames are being lost. */
  | 'reconnecting'
  | 'ended'
  | 'failed';

/**
 * What the creator needs to see before they trust the stream.
 *
 * Bitrate and dropped frames are the two numbers that predict a bad broadcast,
 * so they are first class rather than buried in a debug panel.
 */
export interface BroadcastHealth {
  /** What we are actually sending, bits per second. */
  bitrate: number;
  /** Rising dropped frames means the uplink cannot keep up. */
  droppedFrames: number;
  /** Round trip to the ingest endpoint, milliseconds. Null before connecting. */
  latencyMs: number | null;
  quality: 'good' | 'fair' | 'poor';
}

export interface BroadcastDeviceState {
  cameraFacing: 'front' | 'back';
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
}

export interface BroadcastSnapshot {
  state: BroadcastState;
  health: BroadcastHealth;
  devices: BroadcastDeviceState;
  /** Seconds since the stream went live. Zero until then. */
  elapsedSeconds: number;
  /** Set when state is 'failed'. Written for a creator, not a developer. */
  error: string | null;
}

export interface BroadcastCredentials {
  /** Where the encoder sends frames. */
  ingestUrl: string;
  /** Secret. Never rendered in full and never logged. */
  streamKey: string;
}

/**
 * A running or startable broadcast.
 *
 * Every method is safe to call twice. The creator screens fire these from taps
 * and a double tap on "Go live" must not open two connections.
 */
export interface Broadcaster {
  /** True only in a development build with the native module linked. */
  readonly isSupported: boolean;

  /** Camera and mic on, nothing transmitted. Requires permissions first. */
  startPreview(): Promise<void>;
  stopPreview(): Promise<void>;

  connect(credentials: BroadcastCredentials): Promise<void>;
  disconnect(): Promise<void>;

  setCameraFacing(facing: 'front' | 'back'): Promise<void>;
  setCameraEnabled(enabled: boolean): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;

  getSnapshot(): BroadcastSnapshot;
  /** Returns an unsubscribe function. */
  subscribe(listener: (snapshot: BroadcastSnapshot) => void): () => void;
}

export const IDLE_SNAPSHOT: BroadcastSnapshot = {
  state: 'idle',
  health: { bitrate: 0, droppedFrames: 0, latencyMs: null, quality: 'good' },
  devices: { cameraFacing: 'front', cameraEnabled: true, microphoneEnabled: true },
  elapsedSeconds: 0,
  error: null,
};
