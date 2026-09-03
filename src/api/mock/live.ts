import { money } from '@/lib/money';
import type {
  BroadcastSession,
  CreateLiveEventInput,
  CreatorLiveEvent,
  LiveEvent,
  LiveMessage,
  LiveStats,
} from '../schemas/live';
import { currentBalance, appendTransaction } from './db';
import { delay, fail, id, nowIso } from './support';

const CREATOR = {
  id: 'c_4',
  handle: 'lagosstudio',
  displayName: 'Lagos Studio',
  avatarUrl: null,
};

const events: LiveEvent[] = [
  {
    id: 'live_owambe',
    title: 'Owambe: The Live Session',
    description: 'A full night of highlife and afrobeats, streamed from Lagos.',
    posterUrl: 'https://picsum.photos/seed/owambelive/1280/720',
    creator: CREATOR,
    status: 'live',
    startsAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    endedAt: null,
    ticketPrice: money(200, 'CP'),
    hasTicket: false,
    viewerCount: 1_284,
    replayAvailable: true,
  },
  {
    id: 'live_premiere',
    title: 'Harmattan, premiere and Q and A',
    description: 'Watch the premiere, then stay for questions with the director.',
    posterUrl: 'https://picsum.photos/seed/harmattanlive/1280/720',
    creator: CREATOR,
    status: 'upcoming',
    // Deliberately close, so the countdown is worth watching in development.
    startsAt: new Date(Date.now() + 4 * 60_000).toISOString(),
    endedAt: null,
    ticketPrice: money(300, 'CP'),
    hasTicket: false,
    viewerCount: 0,
    replayAvailable: true,
  },
  {
    id: 'live_workshop',
    title: 'Shooting on a phone, free workshop',
    description: 'Practical camera work for creators with no budget.',
    posterUrl: 'https://picsum.photos/seed/workshoplive/1280/720',
    creator: CREATOR,
    status: 'ended',
    startsAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    endedAt: new Date(Date.now() - 3 * 86_400_000 + 5_400_000).toISOString(),
    ticketPrice: null,
    hasTicket: true,
    viewerCount: 0,
    replayAvailable: true,
  },
];

const chat = new Map<string, LiveMessage[]>();

function seedChat(eventId: string): LiveMessage[] {
  const seeded: LiveMessage[] = [
    { id: id('lm'), author: 'Lagos Studio', body: 'We are live. Sound check done.', role: 'creator', createdAt: nowIso() },
    { id: id('lm'), author: 'Tolu', body: 'Finally! Been waiting all week', role: 'viewer', createdAt: nowIso() },
    { id: id('lm'), author: 'Ngozi', body: 'The lighting looks incredible', role: 'viewer', createdAt: nowIso() },
  ];
  chat.set(eventId, seeded);
  return seeded;
}

function refreshStatus(event: LiveEvent): LiveEvent {
  // Upcoming events go live on their own once the clock passes, so the lobby
  // transitions without the user reopening the screen.
  if (event.status === 'upcoming' && new Date(event.startsAt).getTime() <= Date.now()) {
    event.status = 'live';
    event.viewerCount = 42;
  }
  return event;
}

export const mockLive = {
  async list() {
    await delay();
    return { items: events.map(refreshStatus), nextCursor: null };
  },

  async detail(eventId: string) {
    await delay();
    const found = events.find((e) => e.id === eventId);
    if (!found) throw fail('NOT_FOUND');

    const event = refreshStatus(found);
    // Viewer counts drift while you watch; a frozen number looks broken.
    if (event.status === 'live') {
      event.viewerCount = Math.max(1, event.viewerCount + Math.floor(Math.random() * 21) - 8);
    }
    return event;
  },

  async buyTicket(eventId: string, idempotencyKey: string) {
    await delay();
    const event = events.find((e) => e.id === eventId);
    if (!event) throw fail('NOT_FOUND');
    if (event.hasTicket) throw fail('ALREADY_ENTITLED');
    if (event.status === 'ended') throw fail('VALIDATION_FAILED');

    const price = event.ticketPrice;
    if (!price) {
      event.hasTicket = true;
      return { eventId, hasTicket: true };
    }

    if (currentBalance().minor < price.minor) {
      throw fail('INSUFFICIENT_FUNDS', { required: price, available: currentBalance() });
    }

    appendTransaction({
      type: 'purchase',
      direction: 'debit',
      amount: price,
      status: 'completed',
      description: `Live ticket, ${event.title}`,
      relatedTitleId: eventId,
    });

    event.hasTicket = true;
    void idempotencyKey;
    return { eventId, hasTicket: true };
  },

  async ticket(eventId: string) {
    await delay();
    const event = events.find((e) => e.id === eventId);
    if (!event) throw fail('NOT_FOUND');

    // A ticket is required whether the event is running or being replayed.
    if (event.ticketPrice !== null && !event.hasTicket) throw fail('FORBIDDEN');
    if (event.status === 'upcoming') throw fail('VALIDATION_FAILED');
    if (event.status === 'ended' && !event.replayAvailable) throw fail('NOT_FOUND');

    return {
      eventId,
      manifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      latencySeconds: event.status === 'live' ? 6 : 0,
      chatEnabled: event.status === 'live',
    };
  },

  async messages(eventId: string) {
    await delay();
    return { items: chat.get(eventId) ?? [], nextCursor: null };
  },

  async send(eventId: string, body: string) {
    await delay();
    if (body.trim().length === 0) throw fail('VALIDATION_FAILED');

    let list = chat.get(eventId);
    if (!list) {
      list = [];
      chat.set(eventId, list);
    }
    const message: LiveMessage = {
      id: id('lm'),
      author: 'You',
      body: body.trim(),
      role: 'creator',
      createdAt: nowIso(),
    };
    list.push(message);
    return message;
  },
};

// ---------------------------------------------------------------------------
// Creator side
// ---------------------------------------------------------------------------

/** Events owned by the signed in creator, keyed by event id. */
const myEvents: CreatorLiveEvent[] = [];

/** Issued stream keys. Cleared when an event ends, like the real thing. */
const sessions = new Map<string, BroadcastSession>();

/** Ticket sales accumulate here so the dashboard has something honest to show. */
const salesByEvent = new Map<string, number>();

const PLATFORM_SHARE = 0.3;

function creatorShare(amountMinor: number): number {
  return Math.round(amountMinor * (1 - PLATFORM_SHARE));
}

function getOrEnsureEvent(eventId: string): CreatorLiveEvent {
  let found = myEvents.find((e) => e.id === eventId);
  if (found) return found;

  const publicEvent = events.find((e) => e.id === eventId);
  found = {
    id: eventId,
    title: publicEvent?.title ?? 'Live Stream Session',
    description: publicEvent?.description ?? 'Live stream session on CloudNet',
    posterUrl: publicEvent?.posterUrl ?? 'https://picsum.photos/seed/live/1280/720',
    creator: CREATOR,
    status: publicEvent?.status ?? 'upcoming',
    startsAt: publicEvent?.startsAt ?? nowIso(),
    endedAt: publicEvent?.endedAt ?? null,
    ticketPrice: publicEvent?.ticketPrice ?? null,
    hasTicket: true,
    viewerCount: publicEvent?.viewerCount ?? 0,
    replayAvailable: publicEvent?.replayAvailable ?? true,
    chatEnabled: true,
    ticketsSold: 0,
    earnings: money(0, 'CP'),
    peakViewerCount: 0,
  };
  myEvents.unshift(found);
  return found;
}

export const mockCreatorLive = {
  async mine() {
    await delay();
    // Fresh objects every call. Returning the stored array lets React Query see
    // an unchanged reference after a mutation and skip the re-render, which is
    // exactly the bug the verticals feed had.
    return {
      items: myEvents.map((event) => ({ ...event, creator: { ...event.creator } })),
      nextCursor: null,
    };
  },

  async schedule(input: CreateLiveEventInput): Promise<CreatorLiveEvent> {
    await delay();

    if (input.title.trim().length < 1) throw fail('VALIDATION_FAILED');
    if (!input.rightsConfirmed) throw fail('VALIDATION_FAILED');
    if (input.ticketPrice && input.ticketPrice.minor <= 0) throw fail('VALIDATION_FAILED');

    // Checked against the server clock, not the device's. A phone with the wrong
    // date could otherwise schedule an event into the past.
    if (new Date(input.startsAt).getTime() <= Date.now()) throw fail('VALIDATION_FAILED');

    const event: CreatorLiveEvent = {
      id: id('live'),
      title: input.title.trim(),
      description: input.description.trim(),
      posterUrl: `https://picsum.photos/seed/${input.posterAssetId}/1280/720`,
      creator: CREATOR,
      status: 'upcoming',
      startsAt: input.startsAt,
      endedAt: null,
      ticketPrice: input.ticketPrice,
      hasTicket: true,
      viewerCount: 0,
      replayAvailable: input.replayAvailable,
      chatEnabled: input.chatEnabled,
      ticketsSold: 0,
      earnings: money(0, 'CP'),
      peakViewerCount: 0,
    };

    myEvents.unshift(event);
    events.unshift({ ...event });
    return { ...event };
  },

  /**
   * Issues the encoder credentials for one event.
   *
   * Deliberately not part of the event object: a stream key is a secret with its
   * own lifetime. Anyone holding it can broadcast as this creator, so it is
   * fetched only when the green room opens and dropped when the event ends.
   */
  async openSession(eventId: string): Promise<BroadcastSession> {
    await delay();
    const event = getOrEnsureEvent(eventId);
    if (event.status === 'ended') throw fail('FORBIDDEN');

    const existing = sessions.get(eventId);
    if (existing && new Date(existing.expiresAt).getTime() > Date.now()) return { ...existing };

    const session: BroadcastSession = {
      eventId,
      ingestUrl: `rtmps://ingest.cloudnet.ng:443/live/${eventId}`,
      streamKey: `sk_${eventId}_${Math.random().toString(36).slice(2, 14)}`,
      issuedAt: nowIso(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60_000).toISOString(),
    };
    sessions.set(eventId, session);
    return { ...session };
  },

  async goLive(eventId: string): Promise<CreatorLiveEvent> {
    await delay();
    const event = getOrEnsureEvent(eventId);
    if (event.status === 'ended') throw fail('FORBIDDEN');
    
    if (!sessions.has(eventId)) {
      sessions.set(eventId, {
        eventId,
        ingestUrl: `rtmps://ingest.cloudnet.ng:443/live/${eventId}`,
        streamKey: `sk_${eventId}_${Math.random().toString(36).slice(2, 14)}`,
        issuedAt: nowIso(),
        expiresAt: new Date(Date.now() + 6 * 60 * 60_000).toISOString(),
      });
    }

    event.status = 'live';
    const mirror = events.find((e) => e.id === eventId);
    if (mirror) mirror.status = 'live';
    return { ...event };
  },

  async endLive(eventId: string): Promise<CreatorLiveEvent> {
    await delay();
    const event = getOrEnsureEvent(eventId);

    event.status = 'ended';
    event.endedAt = nowIso();
    event.viewerCount = 0;

    const mirror = events.find((e) => e.id === eventId);
    if (mirror) {
      mirror.status = 'ended';
      mirror.endedAt = event.endedAt;
      mirror.viewerCount = 0;
    }

    // The key dies with the event. A key that outlives its broadcast is a way
    // back in for anyone who saw it.
    sessions.delete(eventId);
    return { ...event };
  },

  async stats(eventId: string): Promise<LiveStats> {
    await delay();
    const event = getOrEnsureEvent(eventId);

    if (event.status === 'live') {
      // People arrive faster than they leave early on, then it settles.
      const drift = Math.floor(Math.random() * 9) - 3;
      event.viewerCount = Math.max(0, event.viewerCount + drift + 2);
      event.peakViewerCount = Math.max(event.peakViewerCount, event.viewerCount);

      if (event.ticketPrice && Math.random() < 0.35) {
        const sold = (salesByEvent.get(eventId) ?? 0) + 1;
        salesByEvent.set(eventId, sold);
        event.ticketsSold = sold;
        event.earnings = money(creatorShare(event.ticketPrice.minor) * sold, 'CP');
      }
    }

    return {
      eventId,
      viewerCount: event.viewerCount,
      peakViewerCount: event.peakViewerCount,
      ticketsSold: event.ticketsSold,
      earnings: { ...event.earnings },
      chatMessageCount: chat.get(eventId)?.length ?? 0,
    };
  },

  async cancel(eventId: string): Promise<void> {
    await delay();
    const index = myEvents.findIndex((e) => e.id === eventId);
    const target = myEvents[index];
    if (index === -1 || !target) throw fail('NOT_FOUND');
    // Cancelling after tickets have sold means refunds, which is a money path,
    // not a delete. The dashboard blocks it and so does this.
    if (target.ticketsSold > 0) throw fail('FORBIDDEN');

    myEvents.splice(index, 1);
    const mirror = events.findIndex((e) => e.id === eventId);
    if (mirror !== -1) events.splice(mirror, 1);
    sessions.delete(eventId);
  },
};
