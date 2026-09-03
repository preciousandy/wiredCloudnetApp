import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Two tiers, deliberately separated:
 *   secureStorage, auth tokens only. Encrypted at rest (Keychain / Keystore).
 *   Never put a token anywhere else.
 *
 * On web, SecureStore is unavailable. We fall back to sessionStorage so tokens
 * die with the tab rather than persisting in localStorage where any injected
 * script can read them.
 */

const isWeb = Platform.OS === 'web';

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return globalThis.sessionStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        globalThis.sessionStorage?.setItem(key, value);
      } catch {
        /* storage unavailable, treat as session-only */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async remove(key: string): Promise<void> {
    if (isWeb) {
      try {
        globalThis.sessionStorage?.removeItem(key);
      } catch {
        /* no-op */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const STORAGE_KEYS = {
  accessToken: 'cn.auth.access',
  refreshToken: 'cn.auth.refresh',
  sessionExpiry: 'cn.auth.expires',
  user: 'cn.auth.user',
  userEmail: 'cn.auth.email',
} as const;
