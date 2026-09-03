import { z } from 'zod';
import { isoDateSchema } from './common';

export const playbackTicketSchema = z.object({
  /** Signed and short-lived. A permanent URL means the paid catalogue leaks. */
  manifestUrl: z.string().url(),
  protocol: z.enum(['hls', 'dash', 'progressive']),
  expiresAt: isoDateSchema,
  startPositionSeconds: z.number().nonnegative(),
  subtitles: z.array(
    z.object({ lang: z.string(), label: z.string(), url: z.string().url() }),
  ),
});

export type PlaybackTicket = z.infer<typeof playbackTicketSchema>;
