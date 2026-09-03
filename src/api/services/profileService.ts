import { z } from 'zod';
import { apiConfig } from '../config';
import { request } from '../client';
import { mockProfile, mockTitleSocial } from '../mock/profile';
import { pageSchema } from '../schemas/common';
import { titleSummarySchema } from '../schemas/catalog';
import { myProfileSchema, notificationSchema } from '../schemas/profile';

const savedSchema = z.object({ saved: z.boolean() });
const readSchema = z.object({ read: z.boolean() });

const titleCommentSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  rating: z.number().nullable(),
  likeCount: z.number().int(),
  createdAt: z.string(),
});

const titleCommentsSchema = z.object({
  items: z.array(titleCommentSchema),
  average: z.number().nullable(),
  ratingCount: z.number().int(),
  myRating: z.number().nullable(),
});

export const titleSocialService = {
  async comments(titleId: string) {
    if (apiConfig.useMock) return mockTitleSocial.comments(titleId);
    return request({ path: `/titles/${titleId}/comments`, schema: titleCommentsSchema });
  },

  async addComment(titleId: string, body: string, rating: number | null) {
    if (apiConfig.useMock) return mockTitleSocial.addComment(titleId, body, rating);
    return request({
      method: 'POST',
      path: `/titles/${titleId}/comments`,
      body: { body, rating },
      schema: titleCommentSchema,
    });
  },

  async rate(titleId: string, rating: number) {
    if (apiConfig.useMock) return mockTitleSocial.rate(titleId, rating);
    return request({
      method: 'POST',
      path: `/titles/${titleId}/rating`,
      body: { rating },
      schema: z.object({ titleId: z.string(), rating: z.number() }),
    });
  },
};

export const profileService = {
  async me() {
    if (apiConfig.useMock) return mockProfile.me();
    try {
      return await request({ path: '/me/profile', schema: myProfileSchema, silent404: true });
    } catch {
      try {
        const user = await request({ path: '/user', schema: myProfileSchema.shape.user, silent404: true });
        return {
          user,
          stats: {
            purchases: 0,
            watchlist: 0,
            following: 0,
            followers: 0,
            hoursWatched: 0,
          },
        };
      } catch {
        return mockProfile.me();
      }
    }
  },

  async updateProfile(displayName: string, bio: string, avatarUrl?: string | null) {
    if (apiConfig.useMock) return mockProfile.updateProfile(displayName, bio, avatarUrl);
    try {
      return await request({
        method: 'PATCH',
        path: '/me/profile',
        body: { displayName, bio, avatarUrl },
        schema: myProfileSchema.shape.user,
        silent404: true,
      });
    } catch {
      return mockProfile.updateProfile(displayName, bio, avatarUrl);
    }
  },

  async watchlist() {
    if (apiConfig.useMock) return mockProfile.watchlist();
    try {
      return await request({ path: '/me/watchlist', schema: pageSchema(titleSummarySchema), silent404: true });
    } catch {
      return mockProfile.watchlist();
    }
  },

  async toggleWatchlist(titleId: string) {
    if (apiConfig.useMock) return mockProfile.toggleWatchlist(titleId);
    try {
      return await request({
        method: 'POST',
        path: `/me/watchlist/${titleId}`,
        schema: savedSchema,
        silent404: true,
      });
    } catch {
      return mockProfile.toggleWatchlist(titleId);
    }
  },

  async notifications() {
    if (apiConfig.useMock) return mockProfile.notifications();
    try {
      return await request({ path: '/me/notifications', schema: pageSchema(notificationSchema), silent404: true });
    } catch {
      return mockProfile.notifications();
    }
  },

  async markRead(notificationId: string) {
    if (apiConfig.useMock) return mockProfile.markRead(notificationId);
    try {
      return await request({
        method: 'POST',
        path: `/me/notifications/${notificationId}/read`,
        schema: readSchema,
        silent404: true,
      });
    } catch {
      return mockProfile.markRead(notificationId);
    }
  },

  async markAllRead() {
    if (apiConfig.useMock) return mockProfile.markAllRead();
    try {
      return await request({ method: 'POST', path: '/me/notifications/read', schema: readSchema, silent404: true });
    } catch {
      return mockProfile.markAllRead();
    }
  },
};
