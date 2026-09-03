import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { authService } from '@/api/services';
import { ApiError, toApiError } from '@/api/errors';
import {
  useRegistration as useRegistrationStore,
  type FlowKind,
  type IdentityType,
} from '@/store/registration';
import { useSession } from '@/store/session';

/**
 * Owns every async step of registration and password reset.
 * Screens hold layout and input state only, they never call a service.
 */
export function useRegistrationFlow() {
  const store = useRegistrationStore();
  const setSession = useSession((s) => s.setSession);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Step 1, identity entered. Sends the code, then moves to verify.
   * The type comes from the tab the user chose, so there is nothing to infer.
   */
  const startFlow = useCallback(
    async (identity: string, type: IdentityType, kind: FlowKind) => {
      setError(null);
      setIsLoading(true);

      try {
        const challenge =
          kind === 'register'
            ? await authService.startRegistration(identity.trim(), type)
            : await authService.startPasswordReset(identity.trim());

        store.begin(kind, identity.trim(), type, challenge.challengeId);
        router.push('/(auth)/verify');
        return true;
      } catch (cause) {
        setError(toApiError(cause));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [store],
  );

  /** Step 2, code entered. */
  const verifyCode = useCallback(
    async (code: string) => {
      setError(null);
      if (!store.challengeId) {
        setError(new ApiError({ code: 'VALIDATION_FAILED', message: 'Start again, this step expired.' }));
        return false;
      }

      setIsLoading(true);
      try {
        const { verificationToken } =
          store.kind === 'reset'
            ? await authService.verifyPasswordResetOtp(store.challengeId, code)
            : await authService.verifyOtp(store.challengeId, code);

        store.setVerified(verificationToken);
        router.push('/(auth)/set-password');
        return true;
      } catch (cause) {
        setError(toApiError(cause));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [store],
  );

  const resendCode = useCallback(async () => {
    setError(null);
    if (!store.challengeId && !store.identity) return false;
    setIsLoading(true);
    try {
      const challenge =
        store.kind === 'reset'
          ? await authService.startPasswordReset(store.identity || store.challengeId || '')
          : await authService.resendOtp(store.challengeId || store.identity || '');

      store.setChallenge(challenge.challengeId);
      return true;
    } catch (cause) {
      setError(toApiError(cause));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [store]);


  /**
   * Step 3, password chosen.
   * Registration continues to username; reset finishes here.
   */
  const submitPassword = useCallback(
    async (password: string) => {
      setError(null);
      if (!store.verificationToken) {
        setError(new ApiError({ code: 'VALIDATION_FAILED', message: 'Start again, this step expired.' }));
        return false;
      }

      if (store.kind === 'reset') {
        setIsLoading(true);
        try {
          const email = store.identityType === 'email' ? store.identity ?? undefined : undefined;
          await authService.resetPassword(store.verificationToken, password, email);
          store.reset();
          router.replace('/(auth)/sign-in');
          return true;
        } catch (cause) {
          setError(toApiError(cause));
          return false;
        } finally {
          setIsLoading(false);
        }
      }

      store.setPassword(password);
      router.push('/(auth)/set-username');
      return true;
    },
    [store],
  );

  /**
   * Step 4, username chosen.
   */
  const reserveUsername = useCallback(
    async (username: string, name?: string) => {
      setError(null);
      if (!store.verificationToken || !store.password) {
        setError(new ApiError({ code: 'VALIDATION_FAILED', message: 'Start again, this step expired.' }));
        return false;
      }

      setIsLoading(true);
      try {
        const availability = await authService.checkUsername(username.trim());
        if (!availability.available) {
          setError(new ApiError({ code: 'VALIDATION_FAILED', message: 'That username is taken.' }));
          return false;
        }

        store.setUsername(username.trim());
        if (name) store.setName(name.trim());
        router.push('/setup');
        return true;
      } catch (cause) {
        setError(toApiError(cause));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [store],
  );

  /**
   * Step 5, the real work.
   * Completes registration with full details.
   */
  const createAccount = useCallback(async () => {
    const { verificationToken, password, username, identity, identityType, name } = store;
    if (!verificationToken || !password || !username) {
      throw new ApiError({ code: 'VALIDATION_FAILED', message: 'Start again, this step expired.' });
    }

    const email = identityType === 'email' ? identity ?? undefined : undefined;
    const phoneNumber = identityType === 'phone' ? identity ?? undefined : undefined;

    const session = await authService.completeRegistration({
      verificationToken,
      username,
      password,
      email,
      name: name || username,
      phoneNumber,
    });

    store.reset();
    await setSession(session);
    return session;
  }, [store, setSession]);

  return {
    identity: store.identity,
    identityType: store.identityType,
    kind: store.kind,
    error,
    isLoading,
    clearError,
    startFlow,
    verifyCode,
    resendCode,
    submitPassword,
    reserveUsername,
    createAccount,
    username: store.username,
    name: store.name,
  };
}

