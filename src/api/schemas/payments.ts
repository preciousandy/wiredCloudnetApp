import { z } from 'zod';
import { isoDateSchema, moneySchema } from './common';

/**
 * Crypto funding.
 *
 * CloudNet never holds a crypto balance. Coins arrive, they are converted at a
 * rate quoted up front, and the wallet is credited in the user's own currency.
 * Holding a volatile asset on a user's behalf raises a liability question that
 * a streaming platform has no business answering.
 */
export const cryptoNetworkSchema = z.object({
  id: z.string(),
  asset: z.string(),
  network: z.string(),
  label: z.string(),
  /** Confirmations required before we credit. Varies wildly by chain. */
  confirmationsRequired: z.number().int().positive(),
  minAmount: moneySchema,
  /** Roughly how long the chain takes, for an honest wait estimate. */
  typicalMinutes: z.number().int().positive(),
  available: z.boolean(),
});

export const exchangeRateSchema = z.object({
  asset: z.string(),
  currency: z.enum(['CP', 'NGN', 'USD']),
  /** Units of `currency` per one unit of `asset`, as minor units. */
  minorPerUnit: z.number().int().positive(),
  quotedAt: isoDateSchema,
  /** The quote is honoured until here, even if the market moves. */
  heldUntil: isoDateSchema,
});

export const cryptoDepositSchema = z.object({
  depositId: z.string(),
  networkId: z.string(),
  asset: z.string(),
  /** Where the user sends funds. Single use. */
  address: z.string(),
  /** Some chains need a memo or tag; ignoring it loses the deposit. */
  memo: z.string().nullable(),
  expectedAmount: z.string(),
  rate: exchangeRateSchema,
  /** What we will credit if the expected amount arrives. */
  expectedCredit: moneySchema,
  status: z.enum(['awaiting_payment', 'confirming', 'completed', 'expired', 'underpaid']),
  confirmations: z.number().int().nonnegative(),
  confirmationsRequired: z.number().int().positive(),
  /** Actually received, which is not always what was asked for. */
  receivedAmount: z.string().nullable(),
  creditedAmount: moneySchema.nullable(),
  expiresAt: isoDateSchema,
  reference: z.string(),
});

export const withdrawalSchema = z.object({
  id: z.string(),
  amount: moneySchema,
  fee: moneySchema,
  netAmount: moneySchema,
  destination: z.string(),
  status: z.enum(['pending_review', 'processing', 'paid', 'rejected']),
  reference: z.string(),
  createdAt: isoDateSchema,
});

export const payoutAccountSchema = z.object({
  id: z.string(),
  label: z.string(),
  masked: z.string(),
  kind: z.enum(['bank', 'crypto']),
});

export const promoResultSchema = z.object({
  code: z.string(),
  credited: moneySchema,
  description: z.string(),
});

export type CryptoNetwork = z.infer<typeof cryptoNetworkSchema>;
export type CryptoDeposit = z.infer<typeof cryptoDepositSchema>;
export type Withdrawal = z.infer<typeof withdrawalSchema>;
export type PayoutAccount = z.infer<typeof payoutAccountSchema>;
export type ExchangeRate = z.infer<typeof exchangeRateSchema>;
