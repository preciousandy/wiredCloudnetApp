import { useCallback, useState } from 'react';
import { authService } from '@/api/services';
import { ApiError, toApiError } from '@/api/errors';
import { useSession } from '@/store/session';

export function useLogin() {
  const setSession = useSession((s) => s.setSession);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (identity: string, password: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const session = await authService.login(identity, password);
        await setSession(session);
        return true;
      } catch (cause) {
        setError(toApiError(cause));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession],
  );

  return { login, error, isLoading, clearError };
}

