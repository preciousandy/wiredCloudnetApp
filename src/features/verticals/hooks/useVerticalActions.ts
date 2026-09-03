import { useCallback } from 'react';
import { verticalsService } from '@/api/services';
import { toast } from '@/store/toast';
import { useVerticalInteractions } from '@/store/verticalInteractions';
import type { CreatorReel, Vertical } from '@/api/schemas/verticals';

/**
 * Like and save, applied locally first.
 *
 * No await before the UI moves, and no feed refetch afterwards. The server is
 * still the authority; if it disagrees we take the change back and say so.
 */
export function useVerticalActions() {
  const apply = useVerticalInteractions((s) => s.apply);

  const toggleLike = useCallback(
    (item: Vertical, currentLiked: boolean, currentCount: number) => {
      const nextLiked = !currentLiked;
      apply(item.id, {
        liked: nextLiked,
        likeCount: Math.max(currentCount + (nextLiked ? 1 : -1), 0),
      });

      void verticalsService.toggleLike(item.id).catch(() => {
        apply(item.id, { liked: currentLiked, likeCount: currentCount });
        toast.error('Could not save that like');
      });
    },
    [apply],
  );

  const toggleSave = useCallback(
    (item: Vertical, currentSaved: boolean, currentCount = 0) => {
      const nextSaved = !currentSaved;
      apply(item.id, {
        saved: nextSaved,
        saveCount: Math.max(currentCount + (nextSaved ? 1 : -1), 0),
      });
      toast.success(nextSaved ? 'Saved' : 'Removed from saved');

      void verticalsService.toggleSave(item.id).catch(() => {
        apply(item.id, { saved: currentSaved, saveCount: currentCount });
        toast.error('Could not save that');
      });
    },
    [apply],
  );

  const incrementShare = useCallback(
    (item: Vertical, currentCount: number) => {
      apply(item.id, { shareCount: currentCount + 1 });
      void verticalsService.incrementShare(item.id).catch(() => {});
    },
    [apply],
  );

  const applyFollow = useVerticalInteractions.getState().applyFollow;

  const toggleFollow = useCallback(
    (creator: CreatorReel['creator'], currentFollowing: boolean, currentCount: number) => {
      const nextFollowing = !currentFollowing;
      applyFollow(creator.id, {
        following: nextFollowing,
        followerCount: Math.max(currentCount + (nextFollowing ? 1 : -1), 0),
      });
      toast.success(nextFollowing ? `Following ${creator.displayName}` : 'Unfollowed');

      void verticalsService
        .toggleFollow(creator.id)
        .then((res) => {
          if (res && typeof res.following === 'boolean') {
            applyFollow(creator.id, {
              following: res.following,
              followerCount: res.followerCount,
            });
          }
        })
        .catch(() => {
          applyFollow(creator.id, { following: currentFollowing, followerCount: currentCount });
          toast.error('Could not update follow');
        });
    },
    [applyFollow],
  );

  return { toggleLike, toggleSave, toggleFollow, incrementShare };
}

/** Merges server follow state with any local override. */
export function useCreatorState(creator: CreatorReel['creator']) {
  const overlay = useVerticalInteractions((s) => s.follows[creator.id]);
  return {
    following: overlay?.following ?? creator.following,
    followerCount: overlay?.followerCount ?? creator.followerCount,
  };
}

export function followingOf(creator: CreatorReel['creator']): boolean {
  return useVerticalInteractions.getState().follows[creator.id]?.following ?? creator.following;
}

export function followerCountOf(creator: CreatorReel['creator']): number {
  return (
    useVerticalInteractions.getState().follows[creator.id]?.followerCount ?? creator.followerCount
  );
}

/** Merges server data with any local override for this clip. */
export function useVerticalState(item: Vertical) {
  const overlay = useVerticalInteractions((s) => s.overlays[item.id]);

  return {
    liked: overlay?.liked ?? item.liked,
    likeCount: overlay?.likeCount ?? item.likeCount,
    saved: overlay?.saved ?? item.saved,
    saveCount: overlay?.saveCount ?? (overlay?.saved ?? item.saved ? 1 : 0),
    commentCount: overlay?.commentCount ?? item.commentCount,
    shareCount: overlay?.shareCount ?? item.shareCount,
  };
}

/**
 * Non-hook readers for callbacks, where calling useVerticalState would break
 * the rules of hooks. Reads the same store the hook does.
 */
export function likedOf(item: Vertical): boolean {
  return useVerticalInteractions.getState().overlays[item.id]?.liked ?? item.liked;
}

export function likeCountOf(item: Vertical): number {
  return useVerticalInteractions.getState().overlays[item.id]?.likeCount ?? item.likeCount;
}

export function savedOf(item: Vertical): boolean {
  return useVerticalInteractions.getState().overlays[item.id]?.saved ?? item.saved;
}

export function saveCountOf(item: Vertical): number {
  const overlay = useVerticalInteractions.getState().overlays[item.id];
  return overlay?.saveCount ?? (overlay?.saved ?? item.saved ? 1 : 0);
}

export function shareCountOf(item: Vertical): number {
  return useVerticalInteractions.getState().overlays[item.id]?.shareCount ?? item.shareCount;
}
