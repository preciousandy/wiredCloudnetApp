/**
 * Environment driven Expo config.
 *
 * Plain JavaScript rather than TypeScript, deliberately.
 *
 * EAS reads this file in a separate process before any of our tooling is
 * involved, and its TypeScript loader failed against our tsconfig with
 * "Cannot read properties of undefined (reading 'CommonJS')". A config file is
 * forty lines of static data read by external tools; making it depend on a
 * transpiler is risk with no payoff. The JSDoc type below gives the same editor
 * checking without the load step.
 *
 * @type {import('expo/config').ExpoConfig}
 */
const config = {
  name: 'CloudNet',
  slug: 'cloudnet',
  // Must match the EAS account that owns the project, or builds go looking for
  // a personal project that does not exist.
  owner: 'innovatemie',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'cloudnet',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  // One source image for everything: the logo itself.
  // Note for store builds: iOS rejects transparency in the app icon, so before
  // we ship we will need a square opaque version. It does not matter in Expo Go.
  icon: './assets/logo.png',
  splash: {
    image: './assets/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.cloudnet.app',
  },
  android: {
    package: 'com.cloudnet.app',
    adaptiveIcon: {
      foregroundImage: './assets/logo.png',
      backgroundColor: '#FFFFFF',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-video', 'expo-updates'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Written by hand because EAS cannot edit a dynamic config for us. If EAS
    // ever reports an id mismatch, take the real one from the project page on
    // expo.dev and replace it here.
    eas: {
      projectId: '2f577b2c-5c9d-4050-8028-ddff2e04ed38',
    },
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false',
    env: process.env.EXPO_PUBLIC_ENV ?? 'development',
  },
};

module.exports = config;
