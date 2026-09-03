/**
 * CloudNet colour tokens.
 *
 * NOTE: the previous prototype defined `orange` as a rose/crimson ramp
 * (orange.600 was #e11d48, pink). Only orange.500 was the real brand colour,
 * so every hover/pressed state rendered pink. This is the corrected ramp,
 * generated properly around the brand hue #F2702D.
 */

export const brand = {
  50: '#FEF5F0',
  100: '#FDE7DB',
  200: '#FACDB4',
  300: '#F7AC88',
  400: '#F58B5A',
  500: '#F2702D', // brand primary
  600: '#DB5A19',
  700: '#B64614',
  800: '#913716',
  900: '#762F17',
  950: '#3F1508',
} as const;

export const neutral = {
  0: '#FFFFFF',
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  950: '#0B0B0D',
} as const;

export const semantic = {
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  info: '#2563EB',
  infoBg: '#DBEAFE',
} as const;

/**
 * Money-specific colours. Credits and debits must be visually
 * distinguishable at a glance in the transaction ledger.
 */
export const money = {
  credit: '#16A34A',
  debit: '#DC2626',
  pending: '#D97706',
} as const;

export const light = {
  bg: neutral[0],
  bgSubtle: neutral[50],
  bgMuted: neutral[100],
  border: neutral[200],
  borderStrong: neutral[300],
  text: neutral[900],
  textMuted: neutral[500],
  textInverse: neutral[0],
  primary: brand[500],
  primaryPressed: brand[600],
  primaryText: neutral[0],
} as const;

export const dark = {
  bg: neutral[950],
  bgSubtle: neutral[900],
  bgMuted: neutral[800],
  border: neutral[800],
  borderStrong: neutral[700],
  text: neutral[50],
  textMuted: neutral[400],
  textInverse: neutral[950],
  primary: brand[500],
  primaryPressed: brand[400],
  primaryText: neutral[0],
} as const;

export type ThemeColors = typeof light;
