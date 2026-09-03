import { useCallback, useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Films are wide. The player allows landscape and returns the rest of the app to
 * portrait on exit, rather than leaving the whole app rotated because someone
 * watched something sideways.
 */
export function useFullscreen() {
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    return () => {
      // Always restore portrait, even if the screen was closed mid rotation.
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (landscape) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setLandscape(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setLandscape(true);
      }
    } catch {
      /* rotation can be refused by the OS; the player still works upright */
    }
  }, [landscape]);

  return { landscape, toggle };
}
