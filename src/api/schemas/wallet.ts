import { z } from 'zod';
import { isoDateSchema, moneySchema } from './common';

/**
 * Which pot a movement belongs to.
 *
 * The single most important field in the ledger. Deposited credit and earned
 * money are legally different things: one is prepaid credit for our own goods,
 * the other is money we owe a person. Letting them share a balance is what
 * turns a shop into a money transmitter.
 */
export const ledgerAccountSchema = z.enum(['spendable', 'earnings', 'creator_movie']);

export const walletSchema = z.object({
  walletId: z.string(),
  /**
   * Deposited credit. Spendable on CloudNet, never withdrawable.
   * Kept as `balance` so nothing downstream breaks; it is the viewer balance.
   */
  balance: moneySchema,
  /**
   * One currency per wallet, set from the user's country at signup and not
   * changed afterwards. A multi currency balance means FX inside the ledger,
   * and that is where money quietly goes missing.
   */
  currency: z.enum(['CP', 'USD', 'NGN']),
  status: z.enum(['active', 'frozen']),
  updatedAt: isoDateSchema,
});

export const creatorWalletSchema = z.object({
  walletId: z.string(),
  /** Gross earnings from movie purchases/rentals */
  grossBalance: moneySchema,
  /** Available cleared balance withdrawable by creator */
  availableToWithdraw: moneySchema,
  /** Creator share (70%) of cleared balance */
  userShareAvailable: moneySchema,
  /** Platform share (30%) of cleared balance */
  platformCutTotal: moneySchema,
  currency: z.enum(['CP', 'USD', 'NGN']),
  status: z.enum(['active', 'frozen']),
  updatedAt: isoDateSchema,
});


export const transactionTypeSchema = z.enum([
  'deposit',
  'purchase',
  'refund',
  'cashback',
  'bonus',
  'referral',
  'withdrawal',
  /** A sale of your own content. Credits earnings, never spendable. */
  'sale',
]);

export const transactionStatusSchema = z.enum(['pending', 'completed', 'failed', 'reversed']);

export const transactionSchema = z.object({
  id: z.string(),
  /** Human-readable. Support will live on this field. */
  reference: z.string(),
  type: transactionTypeSchema,
  direction: z.enum(['credit', 'debit']),
  amount: moneySchema,
  balanceAfter: moneySchema,
  status: transactionStatusSchema,
  account: ledgerAccountSchema,
  /**
   * When an earnings entry becomes withdrawable. Null for anything that is
   * available immediately, which is everything in the spendable account.
   */
  clearsAt: isoDateSchema.nullable(),
  description: z.string(),
  relatedTitleId: z.string().nullable(),
  createdAt: isoDateSchema,
});

export const entitlementSchema = z.object({
  titleId: z.string(),
  type: z.enum(['purchase', 'rental']),
  expiresAt: isoDateSchema.nullable(),
  grantedAt: isoDateSchema,
});

export const purchaseResultSchema = z.object({
  purchaseId: z.string(),
  status: z.enum(['completed', 'pending', 'failed']),
  entitlement: entitlementSchema.nullable(),
  transaction: transactionSchema,
});

export const depositIntentSchema = z.object({
  depositId: z.string(),
  status: z.enum(['pending', 'completed', 'failed']),
  amount: moneySchema.optional(),
  /** PSP handoff: hosted checkout URL, or null when handled in-app. */
  checkoutUrl: z.string().url().nullable().optional(),
  reference: z.string(),
});

/**
 * Funding routes. `kind` drives how the client hands off:
 *   redirect  open the PSP's hosted checkout
 *   inapp     collect details in our own sheet
 *   crypto    send coins to an address we issue, credited on confirmation
 * We never touch card numbers ourselves, which is the whole point of riding
 * on a licensed PSP.
 */
export const paymentMethodSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  kind: z.enum(['redirect', 'inapp', 'crypto']),
  available: z.boolean(),
  minAmount: moneySchema,
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type CreatorWallet = z.infer<typeof creatorWalletSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Entitlement = z.infer<typeof entitlementSchema>;
export type PurchaseResult = z.infer<typeof purchaseResultSchema>;
export type DepositIntent = z.infer<typeof depositIntentSchema>;
export type LedgerAccount = z.infer<typeof ledgerAccountSchema>;

