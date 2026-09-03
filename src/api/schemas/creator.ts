import { z } from 'zod';
import { isoDateSchema, moneySchema } from './common';
import { moderationStateSchema, visibilitySchema } from './upload';

export const creatorStatsSchema = z.object({
  views: z.number().int().nonnegative(),
  watchHours: z.number().nonnegative(),
  sales: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  /** Earned in the period, after commission. */
  earned: moneySchema,
  /** Already paid out or in flight. */
  paidOut: moneySchema,
  /** Earned minus paid out. What is actually withdrawable. */
  available: moneySchema,
});

export const creatorTitleSchema = z.object({
  id: z.string(),
  title: z.string(),
  posterUrl: z.string().url(),
  visibility: visibilitySchema,
  moderation: moderationStateSchema,
  /** Present when moderation rejected it, so the creator can fix and resubmit. */
  rejectionReason: z.string().nullable(),
  price: moneySchema.nullable(),
  views: z.number().int().nonnegative(),
  sales: z.number().int().nonnegative(),
  revenue: moneySchema,
  createdAt: isoDateSchema,
});

import { creatorWalletSchema } from './wallet';

export const creatorOverviewSchema = z.object({
  stats: creatorStatsSchema,
  creatorWallet: creatorWalletSchema.optional(),
  topTitles: z.array(creatorTitleSchema),
});

export type CreatorStats = z.infer<typeof creatorStatsSchema>;
export type CreatorTitle = z.infer<typeof creatorTitleSchema>;
export type CreatorOverview = z.infer<typeof creatorOverviewSchema>;
