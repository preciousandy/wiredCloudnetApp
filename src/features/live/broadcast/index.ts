import { createStubBroadcaster } from './stubBroadcaster';
import type { Broadcaster } from './types';

/**
 * The one place that decides which broadcaster the app uses.
 *
 * Today: the stub, because a real camera to viewers pipeline needs native code
 * and Expo Go cannot load it.
 *
 * When the development build exists, this file becomes:
 *
 *   import { createIvsBroadcaster } from './ivsBroadcaster';
 *   export const broadcaster = NativeBroadcast.isAvailable
 *     ? createIvsBroadcaster()
 *     : createStubBroadcaster();
 *
 * Nothing else in the app changes. Keeping the fallback matters: it is what lets
 * the flow stay openable in Expo Go after the real one lands, and it is the same
 * reason the mock API adapter is still here.
 */
export const broadcaster: Broadcaster = createStubBroadcaster();

export * from './types';
