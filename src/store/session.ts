import { create } from 'zustand';
import { registerRefreshHandler } from '@/api/client';
import { authService } from '@/api/services';
import type { Session, User } from '@/api/schemas/auth';
import { STORAGE_KEYS, secureStorage } from '@/lib/storage';

type Status = 'booting' | 'authenticated' | 'anonymous';

interface SessionState {
  status: Status;
  user: User | null;
  restore: () => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
}

async function persist(session: Session): Promise<void> {
  const tasks: Promise<void>[] = [
    secureStorage.set(STORAGE_KEYS.accessToken, session.accessToken),
    secureStorage.set(STORAGE_KEYS.refreshToken, session.refreshToken),
    secureStorage.set(STORAGE_KEYS.sessionExpiry, session.expiresAt),
  ];
  if (session.user) {
    tasks.push(secureStorage.set(STORAGE_KEYS.user, JSON.stringify(session.user)));
    if (session.user.email) {
      tasks.push(secureStorage.set(STORAGE_KEYS.userEmail, session.user.email));
    }
  }
  await Promise.all(tasks);
}

async function clear(): Promise<void> {
  await Promise.all([
    secureStorage.remove(STORAGE_KEYS.accessToken),
    secureStorage.remove(STORAGE_KEYS.refreshToken),
    secureStorage.remove(STORAGE_KEYS.sessionExpiry),
    secureStorage.remove(STORAGE_KEYS.user),
    secureStorage.remove(STORAGE_KEYS.userEmail),
  ]);
}

export const useSession = create<SessionState>((set, get) => ({
  status: 'booting',
  user: null,

  async restore() {
    const refreshToken = await secureStorage.get(STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
      set({ status: 'anonymous', user: null });
      return;
    }

    const savedUserJson = await secureStorage.get(STORAGE_KEYS.user);
    const savedUser = savedUserJson ? (JSON.parse(savedUserJson) as User) : null;

    try {
      const session = await authService.refresh(refreshToken);
      const user = session.user?.email ? session.user : savedUser ?? session.user;
      await persist({ ...session, user });
      set({ status: 'authenticated', user });
    } catch {
      if (savedUser) {
        set({ status: 'authenticated', user: savedUser });
      } else {
        await clear();
        set({ status: 'anonymous', user: null });
      }
    }
  },

  async setSession(session) {
    await persist(session);
    set({ status: 'authenticated', user: session.user });
  },

  async signOut() {
    const refreshToken = await secureStorage.get(STORAGE_KEYS.refreshToken);
    if (refreshToken) {
      // Best-effort server-side revocation; local sign-out must succeed regardless.
      try {
        await authService.logout(refreshToken);
      } catch {
        /* ignore */
      }
    }
    await clear();
    set({ status: 'anonymous', user: null });
    void get;
  },
}));

/**
 * Lets the api client refresh an expired token without importing the store
 * (which would create a cycle: client -> store -> service -> client).
 */
registerRefreshHandler(async () => {
  const refreshToken = await secureStorage.get(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return false;

  try {
    const session = await authService.refresh(refreshToken);
    await persist(session);
    useSession.setState({ status: 'authenticated', user: session.user });
    return true;
  } catch {
    await clear();
    useSession.setState({ status: 'anonymous', user: null });
    return false;
  }
});
