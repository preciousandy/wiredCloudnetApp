import { create } from 'zustand';

export type IdentityType = 'email' | 'phone';
export type FlowKind = 'register' | 'reset';

interface RegistrationState {
  kind: FlowKind;
  identity: string | null;
  identityType: IdentityType | null;
  challengeId: string | null;
  verificationToken: string | null;
  password: string | null;
  username: string | null;
  name: string | null;

  begin: (kind: FlowKind, identity: string, type: IdentityType, challengeId: string) => void;
  setChallenge: (challengeId: string) => void;
  setVerified: (verificationToken: string) => void;
  setPassword: (password: string) => void;
  setUsername: (username: string) => void;
  setName: (name: string) => void;
  reset: () => void;
}

const EMPTY = {
  kind: 'register' as FlowKind,
  identity: null,
  identityType: null,
  challengeId: null,
  verificationToken: null,
  password: null,
  username: null,
  name: null,
};

/**
 * Multi-step signup state.
 *
 * Deliberately NOT persisted. A half-finished registration should not survive
 * an app restart, resuming into "set your password" with no idea which account
 * it belongs to is worse than starting again.
 *
 * The password is held in memory only between the set-password and
 * set-username steps, then cleared by reset(). It never touches storage.
 */
export const useRegistration = create<RegistrationState>((set) => ({
  ...EMPTY,

  begin: (kind, identity, identityType, challengeId) =>
    set({ ...EMPTY, kind, identity, identityType, challengeId }),

  setChallenge: (challengeId) => set({ challengeId }),
  setVerified: (verificationToken) => set({ verificationToken }),
  setPassword: (password) => set({ password }),
  setUsername: (username) => set({ username }),
  setName: (name) => set({ name }),
  reset: () => set({ ...EMPTY }),
}));

