/**
 * Pure feed-advance rules, kept out of the components so they can be tested
 * without mounting a video player.
 *
 * The model is a grid: horizontal within one creator, vertical between them.
 *
 *   Creator A:  A1 -> A2 -> A3 -> A4
 *      | (swipe up)
 *   Creator B:  B1 -> B2 -> B3
 */

export interface AdvanceResult {
  /** Index to move to within the current creator. */
  index: number;
  /** True when the creator's last vertical just finished. */
  reachedEnd: boolean;
}

/**
 * Where to go when a vertical finishes playing.
 * We stop at the end of a creator's set rather than jumping to the next creator,
 * so the user always knows whose work they are watching.
 */
export function advanceOnEnd(currentIndex: number, itemCount: number): AdvanceResult {
  if (itemCount <= 0) return { index: 0, reachedEnd: true };

  const next = currentIndex + 1;
  if (next >= itemCount) {
    return { index: Math.max(itemCount - 1, 0), reachedEnd: true };
  }
  return { index: next, reachedEnd: false };
}

/** Clamps a manual swipe so a gesture overshoot cannot land out of bounds. */
export function clampIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  if (index < 0) return 0;
  if (index > itemCount - 1) return itemCount - 1;
  return index;
}

/**
 * Which items should hold a live video player.
 *
 * Only the active clip and the one after it. A grid feed is the quickest way to
 * exhaust memory on a low-end Android phone, so the budget is deliberate: every
 * other page renders its poster instead.
 */
export function shouldMountPlayer(
  itemIndex: number,
  activeIndex: number,
  creatorIsActive: boolean,
): boolean {
  if (!creatorIsActive) return false;
  return itemIndex === activeIndex || itemIndex === activeIndex + 1;
}

/** Resume rules: come back to where the user left a creator, not to the start. */
export function resumeIndex(remembered: number | undefined, itemCount: number): number {
  if (remembered === undefined) return 0;
  return clampIndex(remembered, itemCount);
}
