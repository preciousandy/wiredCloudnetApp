import { z } from 'zod';
import { moneySchema } from './common';

export const contentRatingSchema = z
  .union([
    z.string(),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => {
    if (!val || typeof val !== 'string') return 'all';
    const trimmed = val.trim();
    const lower = trimmed.toLowerCase();
    if (['all', '13+', '16+', '18+', 'pg', 'pg-13', 'r', 'g', 'tv-ma', 'tv-14'].includes(lower)) return lower;
    if (trimmed === '13+' || lower.includes('13')) return '13+';
    if (trimmed === '16+' || lower.includes('16')) return '16+';
    if (trimmed === '18+' || lower.includes('18')) return '18+';
    return lower || 'all';
  })
  .catch('all');
export const titleKindSchema = z.enum(['movie', 'series', 'short', 'live', 'music']);

export const accessSchema = z.object({
  type: z.enum(['free', 'purchase', 'rental']),
  price: moneySchema.nullable(),
});

export const creatorRefSchema = z.object({
  id: z.string(),
  handle: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable().optional(),
});

export const titleSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: titleKindSchema,
  posterUrl: z.string(),
  backdropUrl: z.string().nullable().optional(),
  trailerUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  durationSeconds: z.number().int().nonnegative(),
  rating: contentRatingSchema,
  access: accessSchema,
  /** Server-resolved per user. The client must never infer this. */
  entitled: z.boolean(),
  saved: z.boolean().optional(),
  creator: creatorRefSchema,

  /** Present only on continue-watching items. */
  progressSeconds: z.number().int().nonnegative().nullable().optional(),
  /** Set when the server wants a row badge, e.g. NEW or LIVE. */
  badge: z.string().nullable().optional(),
});

export const titleDetailSchema = titleSummarySchema.extend({
  description: z.string(),
  category: z.string(),
  releasedAt: z.string().nullable(),
  viewCount: z.number().int().nonnegative(),

  /**
   * Set when this record is an episode rather than a standalone title. Lets the
   * player and the purchase sheet treat episodes as first class without a
   * separate code path for each.
   */
  seriesId: z.string().nullable().optional(),
  seriesTitle: z.string().nullable().optional(),
  seasonNumber: z.number().int().nullable().optional(),
  episodeNumber: z.number().int().nullable().optional(),
});

export const categorySchema = z.object({
  id: z.string(),
  label: z.string(),
});

/**
 * Section types the home feed can return. The client renders whatever the
 * server sends, so merchandising changes need no app release.
 */
export const homeSectionSchema = z.object({
  id: z.string(),
  type: z.enum(['hero', 'carousel', 'grid', 'continue', 'spotlight', 'landscape', 'portrait', 'continue_watching', 'featured']).catch('landscape'),
  title: z.string().nullable(),
  /** Shows a "See all" affordance when present. */
  seeAllQuery: z.string().nullable().optional(),
  items: z.array(titleSummarySchema),
});

export const homeSchema = z.object({
  greetingName: z.string().nullable().optional(),
  categories: z.array(categorySchema),
  sections: z.array(homeSectionSchema),
  hero: titleSummarySchema.nullable().optional(),
});

export const creatorProfileSchema = z.object({
  creator: creatorRefSchema.extend({
    followerCount: z.number().int().nonnegative(),
    following: z.boolean(),
  }),
  titles: z.array(titleSummarySchema),
  verticals: z.array(z.unknown()),
});

export type CreatorProfile = z.infer<typeof creatorProfileSchema>;
export type TitleSummary = z.infer<typeof titleSummarySchema>;
export type TitleDetail = z.infer<typeof titleDetailSchema>;
export type HomeSection = z.infer<typeof homeSectionSchema>;
export type HomeFeed = z.infer<typeof homeSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ContentRating = z.infer<typeof contentRatingSchema>;
