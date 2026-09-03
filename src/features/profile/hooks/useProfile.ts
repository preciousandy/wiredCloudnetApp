import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/api/services';

export function useProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.me(),
    staleTime: 30_000,
  });
}

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => profileService.watchlist(),
    staleTime: 15_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => profileService.notifications(),
    staleTime: 20_000,
  });
}
