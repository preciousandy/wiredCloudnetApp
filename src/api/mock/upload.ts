import type {
  CreateTitleInput,
  CreateVerticalInput,
  CreatedTitle,
  CreatedVertical,
  UploadStatus,
  UploadTarget,
} from '../schemas/upload';
import { delay, fail, id, nowIso } from './support';
import { addVerticalToFeed } from './verticals';

/**
 * Mock upload pipeline.
 *
 * Models the two phases the real thing has: bytes going up, then transcoding.
 * They are deliberately separate because they fail for different reasons and
 * the UI has to say which one went wrong.
 */
interface Job {
  uploadId: string;
  startedAt: number;
  sizeBytes: number;
  assetId: string;
  failed: boolean;
}

const jobs = new Map<string, Job>();
export const submittedTitles: (CreatedTitle & { rightsConfirmedAt: string })[] = [];
export const submittedVerticals: (CreatedVertical & { rightsConfirmedAt: string })[] = [];

/** Roughly how long a file of this size takes on a decent mobile connection. */
function estimatedMs(sizeBytes: number): number {
  const megabytes = sizeBytes / (1024 * 1024);
  return Math.max(3000, Math.min(megabytes * 120, 20000));
}

export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
/** Verticals are short by definition; a 2GB one is a film in the wrong form. */
export const MAX_VERTICAL_BYTES = 500 * 1024 * 1024;
export const MAX_VERTICAL_SECONDS = 180;
export const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024;

export const mockUpload = {
  async createTarget(filename: string, sizeBytes: number, contentType: string): Promise<UploadTarget> {
    await delay();

    if (!filename) throw fail('VALIDATION_FAILED');
    if (sizeBytes <= 0) throw fail('VALIDATION_FAILED');

    const isImage = contentType.startsWith('image/');
    const limit = isImage ? MAX_THUMBNAIL_BYTES : MAX_VIDEO_BYTES;
    if (sizeBytes > limit) throw fail('VALIDATION_FAILED', { limitBytes: limit });

    const uploadId = id('up');
    jobs.set(uploadId, {
      uploadId,
      startedAt: Date.now(),
      sizeBytes,
      assetId: id('asset'),
      failed: false,
    });

    return {
      uploadId,
      uploadUrl: `https://storage.cloudnet.test/${uploadId}`,
      partSizeBytes: isImage ? null : 8 * 1024 * 1024,
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    };
  },

  async status(uploadId: string): Promise<UploadStatus> {
    const job = jobs.get(uploadId);
    if (!job) throw fail('NOT_FOUND');

    const elapsed = Date.now() - job.startedAt;
    const total = estimatedMs(job.sizeBytes);

    // First 70% is the upload, the rest is transcoding. Showing them on one bar
    // avoids the classic "stuck at 100%" that makes people force-quit.
    const uploadPhase = Math.min(elapsed / total, 1);
    const transcodePhase = Math.min(Math.max(elapsed - total, 0) / 4000, 1);
    const progress = uploadPhase * 0.7 + transcodePhase * 0.3;

    if (job.failed) {
      return { uploadId, status: 'failed', progress, assetId: null, failureReason: 'Encoding failed' };
    }
    if (uploadPhase < 1) {
      return { uploadId, status: 'uploading', progress, assetId: null, failureReason: null };
    }
    if (transcodePhase < 1) {
      return { uploadId, status: 'processing', progress, assetId: null, failureReason: null };
    }
    return { uploadId, status: 'ready', progress: 1, assetId: job.assetId, failureReason: null };
  },

  async cancel(uploadId: string): Promise<void> {
    await delay();
    jobs.delete(uploadId);
  },

  async createVertical(input: CreateVerticalInput): Promise<CreatedVertical> {
    await delay();

    if (input.caption.trim().length === 0) throw fail('VALIDATION_FAILED');
    if (!input.rightsConfirmed) throw fail('VALIDATION_FAILED');
    if (input.price && input.price.minor <= 0) throw fail('VALIDATION_FAILED');
    if (input.hashtags.length > 10) throw fail('VALIDATION_FAILED');

    const created: CreatedVertical & { rightsConfirmedAt: string } = {
      id: id('v'),
      caption: input.caption.trim(),
      // Moderation approved so the user can immediately see their clip in feed!
      moderation: 'approved',
      submittedAt: nowIso(),
      rightsConfirmedAt: nowIso(),
    };

    submittedVerticals.unshift(created);
    addVerticalToFeed({
      id: created.id,
      caption: created.caption,
      price: input.price,
      linkedTitleId: input.linkedTitleId,
    });

    return created;
  },

  async createTitle(input: CreateTitleInput): Promise<CreatedTitle> {
    await delay();

    if (input.title.trim().length < 2) throw fail('VALIDATION_FAILED');
    if (input.description.trim().length < 20) throw fail('VALIDATION_FAILED');
    if (!input.rightsConfirmed) throw fail('VALIDATION_FAILED');
    if (input.price && input.price.minor <= 0) throw fail('VALIDATION_FAILED');
    // A title with no poster cannot be rendered in any row, so it is rejected
    // here rather than published into a catalogue that cannot display it.
    if (!input.posterAssetId) throw fail('VALIDATION_FAILED');
    if (input.hashtags.length > 10) throw fail('VALIDATION_FAILED');

    const created: CreatedTitle & { rightsConfirmedAt: string } = {
      id: id('t'),
      title: input.title.trim(),
      // Creator uploads do not go straight live. Cheap to add now, expensive later.
      moderation: 'pending_review',
      submittedAt: nowIso(),
      // Timestamped here, on the server side of the boundary, not taken on trust
      // from a client checkbox.
      rightsConfirmedAt: nowIso(),
    };

    submittedTitles.unshift(created);
    return created;
  },
};
