import type { Report, ReportReason } from '../schemas/moderation';
import { URGENT_REASONS } from '../schemas/moderation';
import { delay, fail, id, nowIso, reference } from './support';

const reports: Report[] = [];
const blocked = new Set<string>();
const hidden = new Set<string>();

export const mockModeration = {
  async report(
    targetType: Report['targetType'],
    targetId: string,
    reason: ReportReason,
    note: string | null,
  ) {
    await delay();
    if (!targetId) throw fail('VALIDATION_FAILED');

    const report: Report = {
      id: id('rpt'),
      targetType,
      targetId,
      reason,
      note: note?.trim() || null,
      createdAt: nowIso(),
      reference: reference(),
    };
    reports.unshift(report);

    // Child safety and violence do not wait in a queue. The content comes down
    // pending review rather than staying up while a human gets to it.
    if (URGENT_REASONS.includes(reason)) hidden.add(targetId);

    return report;
  },

  async block(userId: string) {
    await delay();
    if (!userId) throw fail('VALIDATION_FAILED');
    const wasBlocked = blocked.has(userId);
    if (wasBlocked) blocked.delete(userId);
    else blocked.add(userId);
    return { userId, blocked: !wasBlocked };
  },

  async blockedUsers() {
    await delay();
    return { items: [...blocked], nextCursor: null };
  },

  isBlocked(userId: string) {
    return blocked.has(userId);
  },

  isHidden(targetId: string) {
    return hidden.has(targetId);
  },

  async myReports() {
    await delay();
    return { items: [...reports], nextCursor: null };
  },
};
