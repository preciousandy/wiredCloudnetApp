import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface Preferences {
  autoplayNext: boolean;
  /** Caps streaming quality and stops autoplay previews on mobile data. */
  dataSaver: boolean;
  downloadOverWifiOnly: boolean;
  notifyNewUploads: boolean;
  notifyWallet: boolean;
  notifyPromotions: boolean;
  captionsByDefault: boolean;
  /** The CloudIt intro is shown once, then never again. */
  clouditIntroSeen: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'app' | 'email';
}

const DEFAULTS: Preferences = {
  autoplayNext: true,
  dataSaver: false,
  downloadOverWifiOnly: true,
  notifyNewUploads: true,
  notifyWallet: true,
  notifyPromotions: false,
  captionsByDefault: false,
  clouditIntroSeen: false,
  twoFactorEnabled: false,
  twoFactorMethod: 'email',
};

const STORAGE_KEY = 'cn.preferences';

interface PreferencesState extends Preferences {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetAll: () => void;
}

/**
 * Device preferences, persisted locally.
 *
 * These are settings, not secrets, so AsyncStorage rather than SecureStore.
 * They persist across restarts because a data-saver toggle that resets itself
 * every launch is worse than not offering it at all.
 */
export const usePreferences = create<PreferencesState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        // Spread over defaults so a preference added in a later release does not
        // arrive as undefined for existing users.
        set({ ...DEFAULTS, ...parsed, hydrated: true });
        return;
      }
    } catch {
      /* corrupt or unavailable storage falls back to defaults */
    }
    set({ hydrated: true });
  },

  set: (key, value) => {
    set({ [key]: value } as Pick<PreferencesState, typeof key>);
    const { hydrated: _h, hydrate: _hy, set: _s, resetAll: _r, ...rest } = get();
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  },

  resetAll: () => {
    set({ ...DEFAULTS });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
  },
}));
