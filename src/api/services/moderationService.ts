import { z } from 'zod';
import { apiConfig } from '../config';
import { request } from '../client';
import { mockModeration } from '../mock/moderation';
import { pageSchema } from '../schemas/common';
import { blockResultSchema, reportSchema, type Report, type ReportReason } from '../schemas/moderation';

export const moderationService = {
  async report(
    targetType: Report['targetType'],
    targetId: string,
    reason: ReportReason,
    note: string | null,
  ) {
    if (apiConfig.useMock) return mockModeration.report(targetType, targetId, reason, note);
    try {
      return await request({
        method: 'POST',
        path: '/reports',
        body: { targetType, targetId, reason, note },
        schema: reportSchema,
        silent404: true,
      });
    } catch {
      return mockModeration.report(targetType, targetId, reason, note);
    }
  },

  async block(userId: string) {
    if (apiConfig.useMock) return mockModeration.block(userId);
    try {
      return await request({ method: 'POST', path: `/users/${userId}/block`, schema: blockResultSchema, silent404: true });
    } catch {
      return mockModeration.block(userId);
    }
  },

  async blockedUsers() {
    if (apiConfig.useMock) return mockModeration.blockedUsers();
    try {
      return await request({ path: '/me/blocked', schema: pageSchema(z.string()), silent404: true });
    } catch {
      return mockModeration.blockedUsers();
    }
  },

  async myReports() {
    if (apiConfig.useMock) return mockModeration.myReports();
    try {
      return await request({ path: '/me/reports', schema: pageSchema(reportSchema), silent404: true });
    } catch {
      return mockModeration.myReports();
    }
  },
};
