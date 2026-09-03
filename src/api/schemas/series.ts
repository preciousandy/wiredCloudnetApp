import { z } from 'zod';
import { isoDateSchema, moneySchema } from './common';
import { contentRatingSchema } from './catalog';

/**
 * An episode is the unit people buy.
 *
 * Deliberately not a season or a whole series: a creator releasing weekly cannot
 * honestly sell a season that does not exist yet, and buying episode one lets
 * them earn from week one rather than waiting for a finished run.
 */
export const episodeSchema = z.object({
  id: z.string(),
  seriesId: z.string(),
  seasonNumber: z.number().int().positive(),
  episodeNumber: z.number().int().positive(),
  title: z.string(),
  synopsis: z.string(),
  stillUrl: z.string().url(),
  durationSeconds: z.number().int().nonnegative(),
  rating: contentRatingSchema,

  /** Null means free. Every episode carries its own price. */
  price: moneySchema.nullable(),
  entitled: z.boolean(),

  /**
   * False for episodes announced but not yet uploaded. They appear in the list
   * so viewers can see what is coming, and cannot be bought or played.
   */
  released: z.boolean(),
  releasesAt: isoDateSchema.nullable(),

  /** Seconds watched, for the progress bar on the row. */
  progressSeconds: z.number().int().nonnegative().nullable(),
});

export const seasonSchema = z.object({
  seasonNumber: z.number().int().positive(),
  title: z.string(),
  episodeCount: z.number().int().nonnegative(),
  releasedCount: z.number().int().nonnegative(),
  episodes: z.array(episodeSchema),
});

export const seriesDetailSchema = z.object({
  seriesId: z.string(),
  seasons: z.array(seasonSchema),
  /** Where the viewer should land: their next unwatched released episode. */
  nextEpisodeId: z.string().nullable(),
});

export type Episode = z.infer<typeof episodeSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type SeriesDetail = z.infer<typeof seriesDetailSchema>;
