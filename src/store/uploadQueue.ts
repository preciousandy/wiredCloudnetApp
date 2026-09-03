import { create } from 'zustand';
import type { UploadStatus } from '@/api/schemas/upload';

export interface QueuedUpload {
  uploadId: string;
  filename: string;
  sizeBytes: number;
  kind: 'video' | 'thumbnail';
  status: UploadStatus['status'];
  progress: number;
  assetId: string | null;
  failureReason: string | null;
}

interface UploadQueueState {
  uploads: Record<string, QueuedUpload>;
  enqueue: (upload: QueuedUpload) => void;
  update: (uploadId: string, patch: Partial<QueuedUpload>) => void;
  remove: (uploadId: string) => void;
  clear: () => void;
}

/**
 * Upload state lives outside the screen on purpose.
 *
 * A creator uploading a 90-minute film should be able to leave the form, browse,
 * and come back to a progress bar that is still moving. Holding this in
 * component state would cancel the whole thing the moment they navigated away.
 */
export const useUploadQueue = create<UploadQueueState>((set) => ({
  uploads: {},

  enqueue: (upload) =>
    set((state) => ({ uploads: { ...state.uploads, [upload.uploadId]: upload } })),

  update: (uploadId, patch) =>
    set((state) => {
      const existing = state.uploads[uploadId];
      if (!existing) return state;
      return { uploads: { ...state.uploads, [uploadId]: { ...existing, ...patch } } };
    }),

  remove: (uploadId) =>
    set((state) => {
      const next = { ...state.uploads };
      delete next[uploadId];
      return { uploads: next };
    }),

  clear: () => set({ uploads: {} }),
}));
