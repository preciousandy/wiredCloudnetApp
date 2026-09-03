import { z } from 'zod';
import { isoDateSchema, moneySchema } from './common';
import { contentRatingSchema, titleKindSchema } from './catalog';

/**
 * Presigned direct-to-storage upload.
 *
 * Large video must never proxy through our API. A 4GB feature film pushed
 * through an app server on Nigerian mobile data will time out, and every retry
 * starts from zero. The client uploads straight to storage; the API only hands
 * out the credentials and records the result.
 */
export const uploadTargetSchema = z.object({
  uploadId: z.string(),
  uploadUrl: z.string().url(),
  /** Present when the provider wants chunked, resumable parts. */
  partSizeBytes: z.number().int().positive().nullable(),
  expiresAt: isoDateSchema,
});

export const uploadStatusSchema = z.object({
  uploadId: z.string(),
  status: z.enum(['uploading', 'processing', 'ready', 'failed']),
  /** 0 to 1. Covers upload then transcode, so the bar never stalls at 100%. */
  progress: z.number().min(0).max(1),
  assetId: z.string().nullable(),
  failureReason: z.string().nullable(),
});

export const visibilitySchema = z.enum(['public', 'unlisted', 'private']);
export const moderationStateSchema = z.enum(['pending_review', 'published', 'rejected']);

export const createTitleInputSchema = z.object({
  assetId: z.string(),
  trailerAssetId: z.string().nullable().optional(),
  /**
   * Two images, never three.
   *
   * A 16:9 backdrop and a 2:3 poster cannot be derived from each other without
   * throwing away most of the frame, so both are real fields. A square, on the
   * other hand, is a safe centre crop of the poster, so we never ask for one.
   */
  posterAssetId: z.string(),
  backdropAssetId: z.string().nullable(),
  hashtags: z.array(z.string().min(1).max(30)).max(10),
  title: z.string().min(2).max(120),
  description: z.string().max(2000),
  category: z.string(),
  kind: titleKindSchema,
  visibility: visibilitySchema,
  rating: contentRatingSchema,
  /** Null means free. */
  price: moneySchema.nullable(),
  /** Recorded and timestamped server-side; this is our position if a takedown lands. */
  rightsConfirmed: z.literal(true),
});

export const createdTitleSchema = z.object({
  id: z.string(),
  title: z.string(),
  moderation: moderationStateSchema,
  submittedAt: isoDateSchema,
});

/**
 * A vertical is not a film with fields hidden.
 *
 * Caption instead of title and description, hashtags instead of a category
 * taxonomy, and the cover is a frame from the clip rather than a separate image
 * upload. Sharing the film form would have meant asking creators for things a
 * 40 second clip does not have.
 */
export const createVerticalInputSchema = z.object({
  assetId: z.string(),
  caption: z.string().max(300),
  hashtags: z.array(z.string()).max(10),
  /** Seconds into the clip to freeze for the cover. */
  coverAtSeconds: z.number().nonnegative(),
  /** Null means free to watch. */
  price: moneySchema.nullable(),
  /** Attaches this clip to a full title, which is where the sales come from. */
  linkedTitleId: z.string().nullable(),
  allowComments: z.boolean(),
  rightsConfirmed: z.literal(true),
});

export const createdVerticalSchema = z.object({
  id: z.string(),
  caption: z.string(),
  moderation: moderationStateSchema,
  submittedAt: isoDateSchema,
});

export type CreateVerticalInput = z.infer<typeof createVerticalInputSchema>;
export type CreatedVertical = z.infer<typeof createdVerticalSchema>;
export type UploadTarget = z.infer<typeof uploadTargetSchema>;
export type UploadStatus = z.infer<typeof uploadStatusSchema>;
export type CreateTitleInput = z.infer<typeof createTitleInputSchema>;
export type CreatedTitle = z.infer<typeof createdTitleSchema>;
export type Visibility = z.infer<typeof visibilitySchema>;
