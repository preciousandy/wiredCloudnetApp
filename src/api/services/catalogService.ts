import { apiConfig } from '../config';
import { request } from '../client';
import { mockCatalog } from '../mock/handlers';
import {
  creatorProfileSchema,
  homeSchema,
  titleDetailSchema,
  titleSummarySchema,
} from '../schemas/catalog';
import { seriesDetailSchema } from '../schemas/series';
import { z } from 'zod';
import { pageSchema } from '../schemas/common';

export const catalogService = {
  async home() {
    if (apiConfig.useMock) return mockCatalog.home();
    return request({ path: '/home', schema: homeSchema });
  },

  async detail(titleId: string) {
    if (apiConfig.useMock) return mockCatalog.detail(titleId);
    return request({ path: `/titles/${titleId}`, schema: titleDetailSchema });
  },

  async nextEpisode(episodeId: string) {
    if (apiConfig.useMock) return mockCatalog.nextEpisode(episodeId);
    return request({
      path: `/episodes/${episodeId}/next`,
      schema: z.object({ next: titleSummarySchema.nullable() }),
    });
  },

  async seasons(seriesId: string) {
    if (apiConfig.useMock) return mockCatalog.seasons(seriesId);
    return request({ path: `/titles/${seriesId}/seasons`, schema: seriesDetailSchema });
  },

  async creator(handle: string) {
    if (apiConfig.useMock) return mockCatalog.creator(handle);
    try {
      return await request({ path: `/creators/${handle}`, schema: creatorProfileSchema, silent404: true });
    } catch {
      try {
        return await request({ path: `/creator/${handle}`, schema: creatorProfileSchema, silent404: true });
      } catch {
        return mockCatalog.creator(handle);
      }
    }
  },

  async byCategory(categoryId: string, cursor?: string) {
    if (apiConfig.useMock) return mockCatalog.byCategory(categoryId, cursor);
    return request({
      path: '/titles',
      query: { category: categoryId, cursor },
      schema: pageSchema(titleSummarySchema),
    });
  },

  async search(query: string, cursor?: string) {
    if (apiConfig.useMock) return mockCatalog.search(query, cursor);
    return request({
      path: '/search',
      query: { q: query, cursor },
      schema: pageSchema(titleSummarySchema),
    });
  },
};
