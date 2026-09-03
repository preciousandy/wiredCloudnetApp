import { apiConfig } from '../config';
import { request } from '../client';
import { mockPlayback } from '../mock/handlers';
import { emptySchema } from '../schemas/common';
import { playbackTicketSchema } from '../schemas/playback';

export const playbackService = {
  /** Throws FORBIDDEN when the user is not entitled. The server decides. */
  async ticket(titleId: string) {
    if (apiConfig.useMock) return mockPlayback.ticket(titleId);
    return request({ method: 'POST', path: `/titles/${titleId}/playback`, schema: playbackTicketSchema });
  },

  async reportProgress(titleId: string, positionSeconds: number) {
    if (apiConfig.useMock) return;
    await request({
      method: 'POST',
      path: `/playback/${titleId}/progress`,
      body: { positionSeconds, at: new Date().toISOString() },
      schema: emptySchema,
    });
  },
};
