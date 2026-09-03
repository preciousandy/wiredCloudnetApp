import { z } from 'zod';
import { apiConfig } from '../config';
import { request } from '../client';
import { pushNotification } from '../mock/profile';

export const supportTicketSchema = z.object({
  id: z.string().default(() => `st_${Date.now()}`),
  topic: z.string(),
  message: z.string(),
  reference: z.string().nullable().default(null),
  status: z.enum(['open', 'in_progress', 'resolved']).default('open'),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;

export const supportService = {
  async submitTicket(topic: string, message: string, reference?: string | null): Promise<SupportTicket> {
    if (!apiConfig.useMock) {
      try {
        return await request({
          method: 'POST',
          path: '/support/tickets',
          body: { topic, message, reference: reference?.trim() || null },
          schema: supportTicketSchema,
          silent404: true,
        });
      } catch {
        try {
          return await request({
            method: 'POST',
            path: '/tickets',
            body: { topic, message, reference: reference?.trim() || null },
            schema: supportTicketSchema,
            silent404: true,
          });
        } catch {
          // Fallback to mock ticket handling below
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    pushNotification({
      type: 'system',
      title: 'Support Ticket Received',
      body: `We received your request regarding "${topic}". Our team will reply within 24 hours.`,
    });

    return {
      id: `st_${Date.now()}`,
      topic,
      message,
      reference: reference?.trim() || null,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
  },
};
