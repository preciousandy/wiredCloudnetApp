import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  /** Optional single action, e.g. Undo or View. */
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

interface ToastState {
  queue: ToastItem[];
  show: (input: Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;

/**
 * Toasts live in a store rather than context so any layer can raise one:
 * hooks, services, error boundaries, code with no component above it.
 *
 * The queue is capped. Three stacked toasts is already too many, and an
 * unbounded queue turns a retry loop into a wall of identical messages.
 */
const MAX_VISIBLE = 3;

export const useToastStore = create<ToastState>((set, get) => ({
  queue: [],

  show: ({ tone, message, actionLabel, onAction, durationMs }) => {
    counter += 1;
    const id = `toast_${counter}`;

    const item: ToastItem = {
      id,
      tone,
      message,
      actionLabel,
      onAction,
      // Errors linger; confirmations get out of the way.
      durationMs: durationMs ?? (tone === 'error' ? 5000 : 2800),
    };

    // Collapse an identical message already on screen instead of stacking it.
    const existing = get().queue.find((t) => t.message === message && t.tone === tone);
    if (existing) return existing.id;

    set((state) => ({ queue: [...state.queue, item].slice(-MAX_VISIBLE) }));
    return id;
  },

  dismiss: (id) => set((state) => ({ queue: state.queue.filter((t) => t.id !== id) })),

  clear: () => set({ queue: [] }),
}));

/** Convenience wrapper. Screens should reach for this, not the store. */
export const toast = {
  success: (message: string, options?: { actionLabel?: string; onAction?: () => void }) =>
    useToastStore.getState().show({ tone: 'success', message, ...options }),
  error: (message: string, options?: { actionLabel?: string; onAction?: () => void }) =>
    useToastStore.getState().show({ tone: 'error', message, ...options }),
  info: (message: string, options?: { actionLabel?: string; onAction?: () => void }) =>
    useToastStore.getState().show({ tone: 'info', message, ...options }),
};
