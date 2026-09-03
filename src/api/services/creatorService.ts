import { z } from 'zod';
import { apiConfig } from '../config';
import { request } from '../client';
import { mockCreator } from '../mock/creator';
import { pageSchema } from '../schemas/common';
import { creatorOverviewSchema, creatorTitleSchema } from '../schemas/creator';
import { creatorWalletSchema } from '../schemas/wallet';

const visibilityResultSchema = z.object({
  id: z.string(),
  visibility: z.enum(['public', 'unlisted', 'private']),
});
const removeResultSchema = z.object({ removed: z.boolean(), at: z.string() });

export const creatorService = {
  async getWallet() {
    if (apiConfig.useMock) return mockCreator.wallet();
    try {
      return await request({ path: '/me/creator/wallet', schema: creatorWalletSchema });
    } catch {
      return mockCreator.wallet();
    }
  },

  async overview() {
    if (apiConfig.useMock) return mockCreator.overview();
    try {
      const result = await request({ path: '/me/creator/overview', schema: creatorOverviewSchema });
      if (!result.creatorWallet) {
        const cw = await mockCreator.wallet();
        return { ...result, creatorWallet: cw };
      }
      return result;
    } catch {
      return mockCreator.overview();
    }
  },

  async titles() {
    if (apiConfig.useMock) return mockCreator.titles();
    try {
      return await request({ path: '/me/creator/titles', schema: pageSchema(creatorTitleSchema), silent404: true });
    } catch {
      return mockCreator.titles();
    }
  },

  async setVisibility(titleId: string, visibility: 'public' | 'unlisted' | 'private') {
    if (apiConfig.useMock) return mockCreator.setVisibility(titleId, visibility);
    return request({
      method: 'PATCH',
      path: `/me/creator/titles/${titleId}`,
      body: { visibility },
      schema: visibilityResultSchema,
    });
  },

  async remove(titleId: string) {
    if (apiConfig.useMock) return mockCreator.remove(titleId);
    return request({
      method: 'DELETE',
      path: `/me/creator/titles/${titleId}`,
      schema: removeResultSchema,
    });
  },
};
