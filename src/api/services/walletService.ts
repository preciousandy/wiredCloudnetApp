import type { Money } from '@/lib/money';
import { apiConfig } from '../config';
import { request } from '../client';
import { mockWallet } from '../mock/handlers';
import { pageSchema } from '../schemas/common';
import {
  depositIntentSchema,
  paymentMethodSchema,
  entitlementSchema,
  purchaseResultSchema,
  transactionSchema,
  walletSchema,
} from '../schemas/wallet';

export const walletService = {
  async get() {
    if (apiConfig.useMock) return mockWallet.get();
    return request({ path: '/wallet', schema: walletSchema });
  },

  async transactions(cursor?: string) {
    if (apiConfig.useMock) return mockWallet.transactions(cursor);
    return request({
      path: '/wallet/transactions',
      query: { cursor },
      schema: pageSchema(transactionSchema),
    });
  },

  async methods(country?: string) {
    if (apiConfig.useMock) return mockWallet.methods(country);
    return request({
      path: '/wallet/methods',
      query: country ? { country } : undefined,
      schema: pageSchema(paymentMethodSchema),
    });
  },

  async depositStatus(depositId: string) {
    if (apiConfig.useMock) return mockWallet.depositStatus(depositId);
    return request({ path: `/wallet/deposits/${depositId}`, schema: depositIntentSchema });
  },

  async deposit(amount: Money, method: string, idempotencyKey: string, country?: string) {
    if (apiConfig.useMock) return mockWallet.deposit(amount, method);
    return request({
      method: 'POST',
      path: '/wallet/deposits',
      body: { amount, method, country },
      idempotencyKey,
      schema: depositIntentSchema,
    });
  },

  /**
   * Only `titleId` is sent, never an amount. If the client could name the
   * price, we would have built a free-content generator.
   */
  async purchase(titleId: string, idempotencyKey: string) {
    if (apiConfig.useMock) return mockWallet.purchase(titleId, idempotencyKey);
    return request({
      method: 'POST',
      path: '/purchases',
      body: { titleId },
      idempotencyKey,
      schema: purchaseResultSchema,
    });
  },

  async entitlements(cursor?: string) {
    if (apiConfig.useMock) return mockWallet.entitlements();
    return request({
      path: '/entitlements',
      query: { cursor },
      schema: pageSchema(entitlementSchema),
    });
  },
};
