import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadService } from '@/api/services';
import { ApiError, toApiError } from '@/api/errors';
import { useUploadQueue, type QueuedUpload } from '@/store/uploadQueue';

const POLL_MS = 600;

export interface PickedFile {
  uri: string;
  name: string;
  sizeBytes: number;
  contentType: string;
}

/**
 * Owns one file's journey: request a target, push the bytes, then poll until
 * the asset is transcoded and ready to attach to a title.
 */
export function useMediaUpload(kind: 'video' | 'thumbnail') {
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const enqueue = useUploadQueue((s) => s.enqueue);
  const update = useUploadQueue((s) => s.update);
  const remove = useUploadQueue((s) => s.remove);
  const upload = useUploadQueue((s) => (uploadId ? s.uploads[uploadId] : undefined));

  const stopPolling = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const start = useCallback(
    async (file: PickedFile) => {
      setError(null);
      try {
        const target = await uploadService.createTarget(file.name, file.sizeBytes, file.contentType);

        const queued: QueuedUpload = {
          uploadId: target.uploadId,
          filename: file.name,
          sizeBytes: file.sizeBytes,
          kind,
          status: 'uploading',
          progress: 0,
          assetId: null,
          failureReason: null,
        };
        enqueue(queued);
        setUploadId(target.uploadId);

        // In production the bytes go straight to `target.uploadUrl` in parts.
        // The mock advances on a timer; polling is identical either way.
        stopPolling();
        timer.current = setInterval(async () => {
          try {
            const status = await uploadService.status(target.uploadId);
            update(target.uploadId, {
              status: status.status,
              progress: status.progress,
              assetId: status.assetId,
              failureReason: status.failureReason,
            });
            if (status.status === 'ready' || status.status === 'failed') stopPolling();
          } catch (cause) {
            setError(toApiError(cause));
            stopPolling();
          }
        }, POLL_MS);
      } catch (cause) {
        setError(toApiError(cause));
      }
    },
    [enqueue, update, kind, stopPolling],
  );

  const cancel = useCallback(async () => {
    stopPolling();
    if (uploadId) {
      await uploadService.cancel(uploadId).catch(() => undefined);
      remove(uploadId);
    }
    setUploadId(null);
    setError(null);
  }, [uploadId, remove, stopPolling]);

  return {
    upload,
    error,
    start,
    cancel,
    isReady: upload?.status === 'ready',
    assetId: upload?.assetId ?? null,
  };
}
