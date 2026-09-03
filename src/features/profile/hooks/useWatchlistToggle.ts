import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/api/services';
import { toast } from '@/store/toast';

/**
 * Saving is one of the few places optimistic UI is right: it costs nothing if
 * it fails, and a bookmark that waits on the network feels broken. We roll back
 * on error rather than leaving the heart filled on a lie.
 */
export function useWatchlistToggle(titleId: string, initial: boolean) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSaved(initial);
  }, [initial]);

  const toggle = useCallback(async () => {
    if (busy) return;
    const previous = saved;
    setSaved(!previous);
    setBusy(true);

    try {
      const result = await profileService.toggleWatchlist(titleId);
      setSaved(result.saved);
      toast.success(result.saved ? 'Saved to your watchlist' : 'Removed from watchlist');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['title', titleId] }),
      ]);
    } catch {

      // Roll back rather than leaving the bookmark filled on a lie.
      setSaved(previous);
      toast.error('Could not update your watchlist');
    } finally {
      setBusy(false);
    }
  }, [busy, saved, titleId, queryClient]);

  return { saved, toggle, busy };
}
