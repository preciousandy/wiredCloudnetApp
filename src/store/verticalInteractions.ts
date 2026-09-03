import { create } from 'zustand';

interface Overlay {
  liked?: boolean;
  likeCount?: number;
  saved?: boolean;
  saveCount?: number;
  commentCount?: number;
  shareCount?: number;
}

interface FollowOverlay {
  following?: boolean;
  followerCount?: number;
}

interface VerticalInteractionState {
  /** verticalId -> local overrides applied on top of the fetched feed. */
  overlays: Record<string, Overlay>;
  /** creatorId -> local follow overrides. */
  follows: Record<string, FollowOverlay>;
  apply: (verticalId: string, patch: Overlay) => void;
  applyFollow: (creatorId: string, patch: FollowOverlay) => void;
  clear: (verticalId: string) => void;
}

/**
 * Local overrides for taps that must feel instant.
 *
 * A like used to await the network and then refetch the whole feed, so the heart
 * changed two round trips after the tap. Now the tap writes here, the icon moves
 * immediately, and the request settles in the background. If it fails we roll
 * back, which is the only honest way to be optimistic.
 *
 * Kept outside React Query on purpose: rewriting cached feed pages on every tap
 * re-renders every mounted video page.
 */
export const useVerticalInteractions = create<VerticalInteractionState>((set) => ({
  overlays: {},
  follows: {},

  applyFollow: (creatorId, patch) =>
    set((state) => ({
      follows: { ...state.follows, [creatorId]: { ...state.follows[creatorId], ...patch } },
    })),

  apply: (verticalId, patch) =>
    set((state) => ({
      overlays: {
        ...state.overlays,
        [verticalId]: { ...state.overlays[verticalId], ...patch },
      },
    })),

  clear: (verticalId) =>
    set((state) => {
      const next = { ...state.overlays };
      delete next[verticalId];
      return { overlays: next };
    }),
}));
