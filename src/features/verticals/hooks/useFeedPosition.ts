import { create } from 'zustand';

interface FeedPositionState {
  /** creatorId -> index of the vertical they were last on. */
  positions: Record<string, number>;
  /** Sound preference survives navigation and app restarts within a session. */
  muted: boolean;

  remember: (creatorId: string, index: number) => void;
  positionFor: (creatorId: string) => number;
  toggleMuted: () => void;
}

/**
 * Feed position and sound live outside the component tree on purpose.
 *
 * The pagers unmount aggressively to keep memory down, so anything stored in
 * component state would be lost exactly when we need it. Leaving a creator
 * part-way through and coming back should resume, not restart.
 */
export const useFeedPosition = create<FeedPositionState>((set, get) => ({
  positions: {},
  muted: false,

  remember: (creatorId, index) =>
    set((state) => ({ positions: { ...state.positions, [creatorId]: index } })),

  positionFor: (creatorId) => get().positions[creatorId] ?? 0,

  toggleMuted: () => set((state) => ({ muted: !state.muted })),
}));
