import { z } from 'zod';
import { apiConfig } from '../config';
import { request } from '../client';
import { mockPayments, mockPromos, mockWithdrawals } from '../mock/payments';
import { pageSchema } from '../schemas/common';
import {
  cryptoDepositSchema,
  cryptoNetworkSchema,
  payoutAccountSchema,
  promoResultSchema,
  withdrawalSchema,
} from '../schemas/payments';
import type { Money } from '@/lib/money';

export const paymentsService = {
  async cryptoNetworks() {
    if (apiConfig.useMock) return mockPayments.networks();
    return request({ path: '/wallet/crypto/networks', schema: pageSchema(cryptoNetworkSchema) });
  },

  /**
   * Quote plus address. Carries an idempotency key because a retried request
   * must return the same address, never issue a second one for the same intent.
   */
  async createCryptoDeposit(amount: Money, networkId: string, idempotencyKey: string) {
    if (apiConfig.useMock) return mockPayments.createCryptoDeposit(amount, networkId);
    return request({
      method: 'POST',
      path: '/wallet/crypto/deposits',
      body: { amount, networkId },
      idempotencyKey,
      schema: cryptoDepositSchema,
    });
  },

  async cryptoStatus(depositId: string) {
    if (apiConfig.useMock) return mockPayments.cryptoStatus(depositId);
    return request({ path: `/wallet/crypto/deposits/${depositId}`, schema: cryptoDepositSchema });
  },

  async payoutAccounts() {
    if (apiConfig.useMock) return mockWithdrawals.accounts();
    return request({ path: '/wallet/payout-accounts', schema: pageSchema(payoutAccountSchema) });
  },

  async withdrawals() {
    if (apiConfig.useMock) return mockWithdrawals.list();
    return request({ path: '/wallet/withdrawals', schema: pageSchema(withdrawalSchema) });
  },

  async requestWithdrawal(
    amount: Money,
    accountId: string,
    twoFactorCode: string,
    idempotencyKey: string,
  ) {
    if (apiConfig.useMock) return mockWithdrawals.request(amount, accountId, twoFactorCode);
    return request({
      method: 'POST',
      path: '/wallet/withdrawals',
      body: { amount, accountId, twoFactorCode },
      idempotencyKey,
      schema: withdrawalSchema,
    });
  },

  async redeemPromo(code: string, idempotencyKey: string) {
    if (apiConfig.useMock) return mockPromos.redeem(code);
    return request({
      method: 'POST',
      path: '/wallet/promos',
      body: { code },
      idempotencyKey,
      schema: promoResultSchema,
    });
  },
};

export const receiptSchema = z.object({ ok: z.boolean() });
