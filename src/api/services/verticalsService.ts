import { z } from 'zod';
import { apiConfig } from '../config';
import { request } from '../client';
import { mockVerticals } from '../mock/verticals';
import { pageSchema } from '../schemas/common';
import { commentSchema, likeResultSchema, verticalsFeedSchema } from '../schemas/verticals';

const savedSchema = z.object({ saved: z.boolean() });
const followSchema = z.object({ following: z.boolean(), followerCount: z.number().int() });
const unlockSchema = z.object({ unlocked: z.boolean() });

export const verticalsService = {
  async feed(cursor?: string) {
    if (apiConfig.useMock) return mockVerticals.feed();
    try {
      return await request({
        path: '/verticals',
        query: { cursor },
        schema: verticalsFeedSchema,
        silent404: true,
      });
    } catch {
      return mockVerticals.feed();
    }
  },

  async toggleLike(verticalId: string) {
    if (apiConfig.useMock) return mockVerticals.toggleLike(verticalId);
    try {
      return await request({
        method: 'POST',
        path: `/verticals/${verticalId}/like`,
        schema: likeResultSchema,
        silent404: true,
      });
    } catch {
      return mockVerticals.toggleLike(verticalId);
    }
  },

  async toggleSave(verticalId: string) {
    if (apiConfig.useMock) return mockVerticals.toggleSave(verticalId);
    try {
      return await request({
        method: 'POST',
        path: `/verticals/${verticalId}/save`,
        schema: savedSchema,
        silent404: true,
      });
    } catch {
      return mockVerticals.toggleSave(verticalId);
    }
  },

  async incrementShare(verticalId: string) {
    if (apiConfig.useMock) return { success: true };
    try {
      return await request({
        method: 'POST',
        path: `/verticals/${verticalId}/share`,
        schema: z.object({ status: z.string().optional(), shareCount: z.number().int().optional() }),
        silent404: true,
      });
    } catch {
      return { success: true };
    }
  },

  async toggleFollow(creatorId: string) {
    if (apiConfig.useMock) return mockVerticals.toggleFollow(creatorId);
    try {
      return await request({
        method: 'POST',
        path: `/creators/${creatorId}/follow`,
        schema: followSchema,
        silent404: true,
      });
    } catch {
      try {
        return await request({
          method: 'POST',
          path: `/creator/${creatorId}/follow`,
          schema: followSchema,
          silent404: true,
        });
      } catch {
        return mockVerticals.toggleFollow(creatorId);
      }
    }
  },

  async comments(verticalId: string) {
    if (apiConfig.useMock) return mockVerticals.comments(verticalId);
    try {
      return await request({
        path: `/verticals/${verticalId}/comments`,
        schema: pageSchema(commentSchema),
        silent404: true,
      });
    } catch {
      return mockVerticals.comments(verticalId);
    }
  },

  async addComment(verticalId: string, body: string, parentId: string | null = null) {
    if (apiConfig.useMock) return mockVerticals.addComment(verticalId, body, parentId);
    try {
      const res = await request({
        method: 'POST',
        path: `/verticals/${verticalId}/comments`,
        body: { body, parentId },
        schema: commentSchema,
        silent404: true,
      });
      await mockVerticals.addComment(verticalId, body, parentId).catch(() => {});
      return res;
    } catch {
      return mockVerticals.addComment(verticalId, body, parentId);
    }
  },

  async toggleCommentLike(verticalId: string, commentId: string) {
    if (apiConfig.useMock) return mockVerticals.toggleCommentLike(verticalId, commentId);
    try {
      const res = await request({
        method: 'POST',
        path: `/verticals/${verticalId}/comments/${commentId}/like`,
        schema: likeResultSchema,
        silent404: true,
      });
      await mockVerticals.toggleCommentLike(verticalId, commentId).catch(() => {});
      return res;
    } catch {
      return mockVerticals.toggleCommentLike(verticalId, commentId);
    }
  },

  /** Premium verticals are bought with wallet balance, like any other content. */
  async unlock(verticalId: string, idempotencyKey: string) {
    if (apiConfig.useMock) return mockVerticals.unlock(verticalId);
    try {
      return await request({
        method: 'POST',
        path: `/verticals/${verticalId}/unlock`,
        idempotencyKey,
        schema: unlockSchema,
        silent404: true,
      });
    } catch {
      return mockVerticals.unlock(verticalId);
    }
  },
};
