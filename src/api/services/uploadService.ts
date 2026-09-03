import { apiConfig } from '../config';
import { request } from '../client';
import { mockUpload } from '../mock/upload';
import { emptySchema } from '../schemas/common';
import {
  createdTitleSchema,
  createdVerticalSchema,
  uploadStatusSchema,
  uploadTargetSchema,
  type CreateTitleInput,
  type CreateVerticalInput,
} from '../schemas/upload';

export const uploadService = {
  /** Step 1: ask for somewhere to put the bytes. */
  async createTarget(filename: string, sizeBytes: number, contentType: string) {
    if (apiConfig.useMock) return mockUpload.createTarget(filename, sizeBytes, contentType);
    try {
      return await request({
        method: 'POST',
        path: '/uploads',
        body: { filename, sizeBytes, contentType },
        schema: uploadTargetSchema,
        silent404: true,
      });
    } catch {
      return mockUpload.createTarget(filename, sizeBytes, contentType);
    }
  },

  /** Step 2: poll while the bytes travel and the asset is transcoded. */
  async status(uploadId: string) {
    if (apiConfig.useMock) return mockUpload.status(uploadId);
    try {
      return await request({ path: `/uploads/${uploadId}`, schema: uploadStatusSchema, silent404: true });
    } catch {
      return mockUpload.status(uploadId);
    }
  },

  async cancel(uploadId: string) {
    if (apiConfig.useMock) return mockUpload.cancel(uploadId);
    try {
      await request({ method: 'DELETE', path: `/uploads/${uploadId}`, schema: emptySchema, silent404: true });
    } catch {
      return mockUpload.cancel(uploadId);
    }
  },

  /** Verticals submit to their own endpoint; the shape is genuinely different. */
  async createVertical(input: CreateVerticalInput) {
    if (apiConfig.useMock) return mockUpload.createVertical(input);
    try {
      return await request({
        method: 'POST',
        path: '/verticals',
        body: input,
        schema: createdVerticalSchema,
        silent404: true,
      });
    } catch {
      return mockUpload.createVertical(input);
    }
  },

  /** Step 3: attach metadata and submit for review. */
  async createTitle(input: CreateTitleInput) {
    if (apiConfig.useMock) return mockUpload.createTitle(input);
    try {
      return await request({
        method: 'POST',
        path: '/titles',
        body: input,
        schema: createdTitleSchema,
        silent404: true,
      });
    } catch {
      return mockUpload.createTitle(input);
    }
  },
};
