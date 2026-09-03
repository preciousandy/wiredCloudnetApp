/**
 * Player time maths, kept pure so it can be tested without a video surface.
 *
 * Seeking is where off-by-one errors become user visible: land one frame past
 * the end and the player fires "ended" on a skip forward, which looks like the
 * app deciding the film is over.
 */

/** Never before zero, never past the end. Leaves a small tail so a forward skip near the end does not terminate playback. */
export function clampSeek(seconds: number, duration: number, tail = 0.5): number {
  // NaN carries no direction, so the only safe answer is the start.
  // Infinity does carry one: it means "as far as you can go".
  if (Number.isNaN(seconds)) return 0;
  if (seconds < 0) return 0;
  if (duration <= 0) return seconds;
  const max = Math.max(duration - tail, 0);
  return Math.min(seconds, max);
}

/** 0 to 1, safe when duration is still unknown. */
export function progressFraction(position: number, duration: number): number {
  if (duration <= 0 || !Number.isFinite(position)) return 0;
  return Math.min(Math.max(position / duration, 0), 1);
}

export function remainingSeconds(position: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.max(duration - position, 0);
}

/** True once close enough to the end that we should offer the next title. */
export function isNearEnd(position: number, duration: number, threshold = 15): boolean {
  if (duration <= 0) return false;
  return duration - position <= threshold;
}
