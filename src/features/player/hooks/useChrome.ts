import { useCallback, useEffect, useRef, useState } from 'react';

const HIDE_AFTER_MS = 3400;

/**
 * Control visibility, auto-hide, and the lock.
 *
 * Lock exists because a phone in a pocket or a hand resting on the screen will
 * otherwise seek a film to a random place. Locked means every touch is ignored
 * except the unlock affordance itself.
 */
export function useChrome() {
  const [visible, setVisible] = useState(true);
  const [locked, setLocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const scheduleHide = useCallback(() => {
    clear();
    timer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS);
  }, [clear]);

  /** Call after any interaction so the controls do not vanish mid-use. */
  const keepAlive = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const toggle = useCallback(() => {
    setVisible((current) => {
      if (current) {
        clear();
        return false;
      }
      scheduleHide();
      return true;
    });
  }, [clear, scheduleHide]);

  /** Freeze the controls open, e.g. while a settings sheet is up. */
  const hold = useCallback(() => {
    clear();
    setVisible(true);
  }, [clear]);

  useEffect(() => {
    scheduleHide();
    return clear;
  }, [scheduleHide, clear]);

  return { visible, locked, setLocked, toggle, keepAlive, hold, scheduleHide };
}
