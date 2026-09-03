/**
 * One radius, app-wide.
 *
 * Mixed corner radii are the fastest way to make an interface look assembled
 * rather than designed. There is a single value; `pill` exists only for
 * genuinely circular elements (avatars, progress bars).
 */
export const radius = 8;

export const radii = {
  none: 0,
  base: radius,
  pill: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
