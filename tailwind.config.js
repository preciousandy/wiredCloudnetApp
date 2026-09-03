/** @type {import('tailwindcss').Config} */
// NativeWind v4 uses Tailwind v3 config format. Tokens are the single source of
// truth in src/ui/theme/colors.ts, mirrored here so className styling stays in sync.
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF5F0',
          100: '#FDE7DB',
          200: '#FACDB4',
          300: '#F7AC88',
          400: '#F58B5A',
          500: '#F2702D',
          600: '#DB5A19',
          700: '#B64614',
          800: '#913716',
          900: '#762F17',
          950: '#3F1508',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        credit: '#16A34A',
        debit: '#DC2626',
      },
      // Weight utilities (font-bold, font-semibold, font-medium) map to
      // fontWeight and work everywhere. We deliberately do NOT name a custom
      // family here: referencing a font that has not been loaded renders as a
      // silent fallback that differs per platform. Inter gets wired properly as
      // a polish pass, in one place, once we add expo-font.
      fontFamily: {
        sans: ['System'],
      },
      // ONE radius for the whole app. Every alias resolves to the same value,
      // so `rounded-md`, `rounded-lg` and `rounded-xl` cannot drift apart, // whichever a developer reaches for, the result is identical.
      // `rounded-full` is left alone for genuinely circular elements.
      borderRadius: {
        DEFAULT: '8px',
        sm: '8px',
        md: '8px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
        '3xl': '8px',
      },
    },
  },
  plugins: [],
};
