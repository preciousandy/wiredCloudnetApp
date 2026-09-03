import { z } from 'zod';
import { isoDateSchema } from './common';

/**
 * Reporting and blocking.
 *
 * Both app stores require these on any app carrying user generated content.
 * They are not polish; an app with creator uploads and no report flow is
 * rejected at review.
 */
export const reportReasonSchema = z.enum([
  'sexual_content',
  'violence',
  'hate',
  'harassment',
  'copyright',
  'misinformation',
  'child_safety',
  'spam',
  'other',
]);

export interface Report {
  id: string;
  targetType: 'title' | 'vertical' | 'comment' | 'user';
  targetId: string;
  reason: ReportReason;
  note: string | null;
  createdAt: string;
  reference: string;
}

export const reportSchema: z.ZodType<Report> = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const raw = val as Record<string, unknown>;
      return {
        ...raw,
        reference: String(raw.reference ?? `REP-${Math.floor(Math.random() * 900000 + 100000)}`),
      };
    }
    return val;
  },
  z.object({
    id: z.string(),
    targetType: z.enum(['title', 'vertical', 'comment', 'user']),
    targetId: z.string(),
    reason: reportReasonSchema,
    note: z.string().nullable(),
    createdAt: isoDateSchema,
    reference: z.string(),
  })
) as unknown as z.ZodType<Report>;



export const blockResultSchema = z.object({
  userId: z.string(),
  blocked: z.boolean(),
});

export type ReportReason = z.infer<typeof reportReasonSchema>;


export const REPORT_LABELS: Record<ReportReason, string> = {
  child_safety: 'Child safety',
  sexual_content: 'Sexual content',
  violence: 'Violence or gore',
  hate: 'Hate speech',
  harassment: 'Harassment or bullying',
  copyright: 'Copyright infringement',
  misinformation: 'False information',
  spam: 'Spam or scam',
  other: 'Something else',
};

/** Reports we escalate immediately rather than queueing behind the backlog. */
export const URGENT_REASONS: ReportReason[] = ['child_safety', 'violence', 'hate'];
