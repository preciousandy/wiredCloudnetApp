/**
 * Weights, not families. Naming a font that has not been loaded produces a
 * silent per-platform fallback, worse than using the system face deliberately.
 * Inter is a later polish pass; it changes only this file and tailwind.config.js.
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 18,
  base: 22,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 38,
  '4xl': 44,
} as const;

export type FontSizeToken = keyof typeof fontSize;
