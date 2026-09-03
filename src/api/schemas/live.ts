import { z } from 'zod';
import { isoDateSchema, moneySchema } from './common';
import { creatorRefSchema } from './catalog';

/**
 * A live event.
 *
 * Differs from on demand in three ways that matter: it has a start time people
 * wait for, a ticket rather than a purchase, and a stream that only exists while
 * it is running.
 */
export const liveEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  posterUrl: z.string().url(),
  creator: creatorRefSchema,

  status: z.enum(['upcoming', 'live', 'ended']),
  startsAt: isoDateSchema,
  /** Null while it is still running. */
  endedAt: isoDateSchema.nullable(),

  /** Null means free to attend. */
  ticketPrice: moneySchema.nullable(),
  hasTicket: z.boolean(),

  viewerCount: z.number().int().nonnegative(),
  /** Whether a recording will be available afterwards. */
  replayAvailable: z.boolean(),
});

export const liveMessageSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  /** Creator and moderator messages are highlighted in chat. */
  role: z.enum(['viewer', 'creator', 'moderator']),
  createdAt: isoDateSchema,
});

export const liveTicketSchema = z.object({
  eventId: z.string(),
  manifestUrl: z.string().url(),
  /** Live streams run behind the broadcast by a few seconds. */
  latencySeconds: z.number().nonnegative(),
  chatEnabled: z.boolean(),
});

export type LiveEvent = z.infer<typeof liveEventSchema>;
export type LiveMessage = z.infer<typeof liveMessageSchema>;
export type LiveTicket = z.infer<typeof liveTicketSchema>;

// ---------------------------------------------------------------------------
// Creator side
// ---------------------------------------------------------------------------

/**
 * Scheduling an event.
 *
 * Deliberately close to `createTitleInput`: a live event is a title that has not
 * happened yet. Same poster requirement, same rights confirmation, same pricing
 * shape, so a creator who has uploaded a film already knows this form.
 */
export const createLiveEventInputSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(20).max(2000),
  posterAssetId: z.string(),
  /** Must be in the future. Enforced again on the server. */
  startsAt: isoDateSchema,
  /** Null means free to attend. */
  ticketPrice: moneySchema.nullable(),
  /** Whether the recording stays available after the event. */
  replayAvailable: z.boolean(),
  /** Chat can be turned off entirely for an event. */
  chatEnabled: z.boolean(),
  rightsConfirmed: z.literal(true),
});

/**
 * The credentials the encoder needs, issued per event.
 *
 * Separate from the event itself because a stream key is a secret with a
 * different lifetime: it is issued when the creator opens the green room and
 * revoked when the event ends. Bundling it into the event object would mean
 * every list request carried live secrets.
 */
export const broadcastSessionSchema = z.object({
  eventId: z.string(),
  ingestUrl: z.string(),
  streamKey: z.string(),
  /** Server clock, so a wrong device clock cannot start an event early. */
  issuedAt: isoDateSchema,
  expiresAt: isoDateSchema,
});

/** What the creator watches while they are live. */
export const liveStatsSchema = z.object({
  eventId: z.string(),
  viewerCount: z.number().int().nonnegative(),
  peakViewerCount: z.number().int().nonnegative(),
  ticketsSold: z.number().int().nonnegative(),
  /** Creator share only, after the platform commission. */
  earnings: moneySchema,
  chatMessageCount: z.number().int().nonnegative(),
});

/** An event as its own creator sees it, including things viewers never see. */
export const creatorLiveEventSchema = liveEventSchema.extend({
  chatEnabled: z.boolean(),
  ticketsSold: z.number().int().nonnegative(),
  earnings: moneySchema,
  peakViewerCount: z.number().int().nonnegative(),
});

export type CreateLiveEventInput = z.infer<typeof createLiveEventInputSchema>;
export type BroadcastSession = z.infer<typeof broadcastSessionSchema>;
export type LiveStats = z.infer<typeof liveStatsSchema>;
export type CreatorLiveEvent = z.infer<typeof creatorLiveEventSchema>;
