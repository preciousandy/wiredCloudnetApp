import { useMemo } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import type { Page } from '../schemas/common';

export interface PaginatedResult<T> {
  items: T[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  /** Pass to a list's onEndReached. Safe to call repeatedly. */
  loadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  refresh: () => void;
  isRefreshing: boolean;
}

/**
 * Cursor pagination, in one place.
 *
 * Every list in the app currently loads one page and stops, which is invisible
 * at twelve titles and broken at two hundred. Cursors rather than offsets
 * because the catalogue changes underneath the user: with offsets, a new title
 * appearing shifts everything down and page two repeats a row from page one.
 */
export function usePaginated<T>(
  queryKey: QueryKey,
  fetchPage: (cursor?: string) => Promise<Page<T>>,
  options?: { enabled?: boolean; staleTime?: number },
): PaginatedResult<T> {
  /**
   * Namespaced so an infinite query can never collide with a plain one.
   *
   * An infinite query stores { pages, pageParams }; a plain useQuery on the same
   * key stores the raw page. Share a key between the two and whichever mounts
   * second reads the other's shape: getNextPageParam reaches for `.pages` on an
   * object that has none, and the screen dies with "Cannot read property
   * 'length' of undefined". Suffixing here means callers cannot cause that by
   * accident, and prefix invalidation such as ['wallet', 'transactions'] still
   * matches, so nothing at the call sites has to change.
   */
  const query = useInfiniteQuery({
    queryKey: [...queryKey, 'infinite'],
    queryFn: ({ pageParam }) => fetchPage(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 30_000,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  return {
    items,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    // Guarded so a fast scroll cannot fire three overlapping page requests.
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    refresh: () => void query.refetch(),
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
  };
}
