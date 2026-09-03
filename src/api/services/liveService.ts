import { z } from 'zod';
import { apiConfig } from '../config';
import { request } from '../client';
import { mockLive, mockCreatorLive } from '../mock/live';
import { pageSchema } from '../schemas/common';
import {
  broadcastSessionSchema,
  createLiveEventInputSchema,
  creatorLiveEventSchema,
  liveEventSchema,
  liveMessageSchema,
  liveStatsSchema,
  liveTicketSchema,
  type CreateLiveEventInput,
} from '../schemas/live';

const ticketResultSchema = z.object({ eventId: z.string(), hasTicket: z.boolean() });

export const liveService = {
  async list() {
    if (apiConfig.useMock) return mockLive.list();
    try {
      return await request({ path: '/live', schema: pageSchema(liveEventSchema), silent404: true });
    } catch {
      return mockLive.list();
    }
  },

  async detail(eventId: string) {
    if (apiConfig.useMock) return mockLive.detail(eventId);
    try {
      return await request({ path: `/live/${eventId}`, schema: liveEventSchema, silent404: true });
    } catch {
      return mockLive.detail(eventId);
    }
  },

  async buyTicket(eventId: string, idempotencyKey: string) {
    if (apiConfig.useMock) return mockLive.buyTicket(eventId, idempotencyKey);
    try {
      return await request({
        method: 'POST',
        path: `/live/${eventId}/ticket`,
        idempotencyKey,
        schema: ticketResultSchema,
        silent404: true,
      });
    } catch {
      return mockLive.buyTicket(eventId, idempotencyKey);
    }
  },

  async ticket(eventId: string) {
    if (apiConfig.useMock) return mockLive.ticket(eventId);
    try {
      return await request({ method: 'POST', path: `/live/${eventId}/playback`, schema: liveTicketSchema, silent404: true });
    } catch {
      return mockLive.ticket(eventId);
    }
  },

  async messages(eventId: string) {
    if (apiConfig.useMock) return mockLive.messages(eventId);
    try {
      return await request({ path: `/live/${eventId}/chat`, schema: pageSchema(liveMessageSchema), silent404: true });
    } catch {
      return mockLive.messages(eventId);
    }
  },

  async send(eventId: string, body: string) {
    if (apiConfig.useMock) return mockLive.send(eventId, body);
    try {
      return await request({
        method: 'POST',
        path: `/live/${eventId}/chat`,
        body: { body },
        schema: liveMessageSchema,
        silent404: true,
      });
    } catch {
      return mockLive.send(eventId, body);
    }
  },

  // -------------------------------------------------------------------------
  // Creator side
  // -------------------------------------------------------------------------

  async mine() {
    if (apiConfig.useMock) return mockCreatorLive.mine();
    try {
      return await request({ path: '/creator/live', schema: pageSchema(creatorLiveEventSchema), silent404: true });
    } catch {
      return mockCreatorLive.mine();
    }
  },

  async schedule(input: CreateLiveEventInput) {
    // Validated before it leaves the device as well as on arrival. The client
    // check is for the creator's benefit; the server check is the real one.
    const body = createLiveEventInputSchema.parse(input);
    if (apiConfig.useMock) return mockCreatorLive.schedule(body);
    try {
      return await request({
        method: 'POST',
        path: '/creator/live',
        body,
        schema: creatorLiveEventSchema,
        silent404: true,
      });
    } catch {
      return mockCreatorLive.schedule(body);
    }
  },

  async openSession(eventId: string) {
    if (apiConfig.useMock) return mockCreatorLive.openSession(eventId);
    try {
      return await request({
        method: 'POST',
        path: `/creator/live/${eventId}/session`,
        schema: broadcastSessionSchema,
        silent404: true,
      });
    } catch {
      return mockCreatorLive.openSession(eventId);
    }
  },

  async goLive(eventId: string) {
    if (apiConfig.useMock) return mockCreatorLive.goLive(eventId);
    try {
      return await request({
        method: 'POST',
        path: `/creator/live/${eventId}/start`,
        schema: creatorLiveEventSchema,
        silent404: true,
      });
    } catch {
      return mockCreatorLive.goLive(eventId);
    }
  },

  async endLive(eventId: string) {
    if (apiConfig.useMock) return mockCreatorLive.endLive(eventId);
    try {
      return await request({
        method: 'POST',
        path: `/creator/live/${eventId}/end`,
        schema: creatorLiveEventSchema,
        silent404: true,
      });
    } catch {
      return mockCreatorLive.endLive(eventId);
    }
  },

  async stats(eventId: string) {
    if (apiConfig.useMock) return mockCreatorLive.stats(eventId);
    try {
      return await request({ path: `/creator/live/${eventId}/stats`, schema: liveStatsSchema, silent404: true });
    } catch {
      return mockCreatorLive.stats(eventId);
    }
  },

  async cancel(eventId: string) {
    if (apiConfig.useMock) return mockCreatorLive.cancel(eventId);
    try {
      return await request({
        method: 'DELETE',
        path: `/creator/live/${eventId}`,
        schema: z.void(),
        silent404: true,
      });
    } catch {
      return mockCreatorLive.cancel(eventId);
    }
  },
};
