import { z } from 'zod';
import { isoDateSchema, moneySchema } from './common';
import { creatorRefSchema } from './catalog';

/**
 * A single vertical video.
 *
 * `linkedTitleId` is the commercial hook: a vertical can be a trailer for a
 * full title, which turns the free feed into the top of the sales funnel.
 */
export const verticalSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  videoUrl: z.string().url(),
  posterUrl: z.string().url(),
  caption: z.string(),
  durationSeconds: z.number().positive(),
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  shareCount: z.number().int().nonnegative(),
  liked: z.boolean(),
  saved: z.boolean(),
  /** Null when the vertical is free to watch. */
  price: moneySchema.nullable(),
  unlocked: z.boolean(),
  /** Set when this clip promotes a full title in the catalogue. */
  linkedTitleId: z.string().nullable(),
  linkedTitleName: z.string().nullable(),
  createdAt: isoDateSchema,
});

/**
 * One creator and their verticals, in order.
 *
 * The feed is grouped rather than flat because the horizontal axis belongs to a
 * creator: you stay inside one person's work until you deliberately leave.
 */
export const creatorReelSchema = z.object({
  creator: creatorRefSchema.extend({
    followerCount: z.number().int().nonnegative(),
    following: z.boolean(),
  }),
  items: z.array(verticalSchema).min(1),
});

export const verticalsFeedSchema = z.object({
  reels: z.array(creatorReelSchema),
  nextCursor: z.string().nullable(),
});

export const commentSchema = z.object({
  id: z.string(),
  author: z.object({ handle: z.string(), displayName: z.string(), avatarUrl: z.string().url().nullable() }),
  body: z.string(),
  likeCount: z.number().int().nonnegative(),
  liked: z.boolean(),
  /**
   * One level of nesting only. Threads deeper than that are unreadable on a
   * phone, and every app that allowed it eventually flattened replies anyway.
   */
  parentId: z.string().nullable(),
  replyCount: z.number().int().nonnegative(),
  createdAt: isoDateSchema,
});

export const likeResultSchema = z.object({
  liked: z.boolean(),
  likeCount: z.number().int().nonnegative(),
});

export type Vertical = z.infer<typeof verticalSchema>;
export type CreatorReel = z.infer<typeof creatorReelSchema>;
export type VerticalsFeed = z.infer<typeof verticalsFeedSchema>;
export type VerticalComment = z.infer<typeof commentSchema>;
