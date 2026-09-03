import { z } from 'zod';
import { isoDateSchema } from './common';
import { titleSummarySchema } from './catalog';
import { baseUserSchema, userPreprocess, type User } from './auth';

export const profileStatsSchema = z.object({
  purchases: z.number().int().nonnegative().default(0),
  watchlist: z.number().int().nonnegative().default(0),
  following: z.number().int().nonnegative().default(0),
  followers: z.number().int().nonnegative().default(0),
  hoursWatched: z.number().nonnegative().default(0),
});

export interface ProfileUser extends User {
  bio: string | null;
  joinedAt: string;
}

export const profileUserSchema = z.preprocess(
  userPreprocess,
  baseUserSchema.extend({
    bio: z.string().nullable().default(null),
    joinedAt: z.string().default(() => new Date().toISOString()),
  })
) as unknown as z.ZodType<ProfileUser>;

export const myProfileSchema = z.object({
  user: profileUserSchema,
  stats: profileStatsSchema,
});



export const updateProfileInputSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(300),
});

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(['upload', 'purchase', 'wallet', 'system', 'follow']),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  /** Where tapping it should take the user, or null for informational ones. */
  href: z.string().nullable(),
  createdAt: isoDateSchema,
});

export const watchlistSchema = z.object({
  items: z.array(titleSummarySchema),
  nextCursor: z.string().nullable(),
});

export type MyProfile = z.infer<typeof myProfileSchema>;
export type ProfileStats = z.infer<typeof profileStatsSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
