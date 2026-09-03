import { money, type Money } from '@/lib/money';
import { canWithdraw, calculateWithdrawalSplit } from '@/lib/earnings';
import type { CryptoDeposit, CryptoNetwork, PayoutAccount, Withdrawal } from '../schemas/payments';
import { appendTransaction, earningsBalance, ledger } from './db';
import { delay, fail, id, nowIso, reference } from './support';
import { pushNotification } from './profile';

/** Wallet currency is CloudPoint (CP). */
export const WALLET_CURRENCY = 'CP' as const;

export const CRYPTO_NETWORKS: CryptoNetwork[] = [
  {
    id: 'usdt-bep20',
    asset: 'USDT',
    network: 'BEP20',
    label: 'USDT (BNB Chain)',
    confirmationsRequired: 15,
    minAmount: money(1000, 'CP'),
    typicalMinutes: 3,
    available: true,
  },
];

/** 1 USDT = 200 CP */
const RATES: Record<string, number> = {
  USDT: 200,
};

const RATE_HOLD_MINUTES = 15;
const ADDRESS_TTL_MINUTES = 30;

interface CryptoJob extends CryptoDeposit {
  createdAt: number;
  /** Simulates what the chain actually delivered. */
  simulateUnderpayment: boolean;
}

const cryptoJobs = new Map<string, CryptoJob>();

/** BEP20 addresses are EVM style, so they look like an Ethereum address. */
function fakeAddress(_asset: string): string {
  const body = Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40);
  return `0x${body}`;
}

/** Crypto amounts are strings on purpose: 8 decimal places do not fit a float. */
function toAssetAmount(target: Money, asset: string): string {
  const rate = RATES[asset]!;
  const units = target.minor / rate;
  return units.toFixed(2);
}

function creditFor(amountString: string, asset: string): Money {
  const units = Number(amountString);
  const rate = RATES[asset]!;
  return money(Math.round(units * rate), WALLET_CURRENCY);
}

export const mockPayments = {
  async networks() {
    await delay();
    return { items: CRYPTO_NETWORKS, nextCursor: null };
  },

  /**
   * Quote and address in one step.
   *
   * The rate is fixed at quote time and held. If the market moves against us in
   * the next fifteen minutes that is our problem, not the user's: nobody should
   * send funds without knowing what they will receive.
   */
  async createCryptoDeposit(target: Money, networkId: string): Promise<CryptoDeposit> {
    await delay();

    const network = CRYPTO_NETWORKS.find((n) => n.id === networkId);
    if (!network || !network.available) throw fail('VALIDATION_FAILED');
    if (target.minor < network.minAmount.minor) {
      throw fail('VALIDATION_FAILED', { minimum: network.minAmount });
    }

    const depositId = id('cdep');
    const expected = toAssetAmount(target, network.asset);

    const deposit: CryptoJob = {
      depositId,
      networkId,
      asset: network.asset,
      address: fakeAddress(network.asset),
      memo: null,
      expectedAmount: expected,
      rate: {
        asset: network.asset,
        currency: WALLET_CURRENCY,
        minorPerUnit: RATES[network.asset]!,
        quotedAt: nowIso(),
        heldUntil: new Date(Date.now() + RATE_HOLD_MINUTES * 60_000).toISOString(),
      },
      expectedCredit: target,
      status: 'awaiting_payment',
      confirmations: 0,
      confirmationsRequired: network.confirmationsRequired,
      receivedAmount: null,
      creditedAmount: null,
      expiresAt: new Date(Date.now() + ADDRESS_TTL_MINUTES * 60_000).toISOString(),
      reference: reference(),
      createdAt: Date.now(),
      // One in five deposits arrives short, which is common enough in practice
      // that the UI must handle it rather than assume exact payment.
      simulateUnderpayment: Math.random() < 0.2,
    };

    cryptoJobs.set(depositId, deposit);
    return strip(deposit);
  },

  /**
   * Chain progress. In production this is driven by the provider's webhook;
   * here it advances on a timer so the confirming UI is exercised for real.
   */
  async cryptoStatus(depositId: string): Promise<CryptoDeposit> {
    const job = cryptoJobs.get(depositId);
    if (!job) throw fail('NOT_FOUND');

    if (job.status === 'completed' || job.status === 'underpaid') return strip(job);

    const elapsed = Date.now() - job.createdAt;

    if (elapsed > ADDRESS_TTL_MINUTES * 60_000) {
      job.status = 'expired';
      return strip(job);
    }

    // Funds "arrive" after a few seconds, then confirmations tick up.
    if (elapsed < 4000) {
      job.status = 'awaiting_payment';
      return strip(job);
    }

    if (job.receivedAmount === null) {
      job.receivedAmount = job.simulateUnderpayment
        ? (Number(job.expectedAmount) * 0.82).toFixed(2)
        : job.expectedAmount;
    }

    job.status = 'confirming';
    job.confirmations = Math.min(
      Math.floor((elapsed - 4000) / 900),
      job.confirmationsRequired,
    );

    if (job.confirmations >= job.confirmationsRequired) {
      // Credit what actually arrived, at the rate we quoted. Crediting the
      // expected amount when less turned up would be giving money away.
      const credited = creditFor(job.receivedAmount, job.asset);
      job.creditedAmount = credited;
      job.status = job.simulateUnderpayment ? 'underpaid' : 'completed';

      appendTransaction({
        type: 'deposit',
        direction: 'credit',
        amount: credited,
        status: 'completed',
        description: `Wallet top up, ${job.asset} ${job.receivedAmount}`,
      });
    }

    return strip(job);
  },
};

function strip(job: CryptoJob): CryptoDeposit {
  const { createdAt: _c, simulateUnderpayment: _s, ...rest } = job;
  return rest;
}

// ---- withdrawals ----

const payoutAccounts: PayoutAccount[] = [
  { id: 'pa_1', label: 'Bank Payout', masked: '**** 4471', kind: 'bank' },
  { id: 'pa_2', label: 'USDT (BEP20)', masked: '0x4f...9fQ2', kind: 'crypto' },
];

const withdrawals: Withdrawal[] = [];

export const WITHDRAWAL_MIN = money(1000, WALLET_CURRENCY);
const WITHDRAWAL_FEE = money(20, WALLET_CURRENCY);

export const mockWithdrawals = {
  async accounts() {
    await delay();
    return { items: payoutAccounts, nextCursor: null };
  },

  async list() {
    await delay();
    return { items: [...withdrawals], nextCursor: null };
  },

  async request(amount: Money, accountId: string, twoFactorCode: string): Promise<Withdrawal> {
    await delay();

    const account = payoutAccounts.find((a) => a.id === accountId);
    if (!account) throw fail('VALIDATION_FAILED');

    // Withdrawals are the one action where a stolen session costs real money,
    // so they sit behind a second factor rather than trusting the session alone.
    if (twoFactorCode !== '654321') throw fail('FORBIDDEN');

    const { available } = earningsBalance();
    const check = canWithdraw(amount, available);
    if (!check.allowed) {
      throw fail(
        amount.minor > available.minor ? 'INSUFFICIENT_FUNDS' : 'VALIDATION_FAILED',
        { required: amount, available },
      );
    }

    const split = calculateWithdrawalSplit(amount);
    const net = money(split.creatorShare.minor - WITHDRAWAL_FEE.minor, WALLET_CURRENCY);

    const txn = appendTransaction({
      type: 'withdrawal',
      direction: 'debit',
      amount,
      status: 'pending',
      account: 'creator_movie',
      description: `Withdrawal to ${account.label} (Creator 70%: ${split.creatorShare.minor.toLocaleString()} CP, Platform 30%: ${split.platformCut.minor.toLocaleString()} CP)`,
    });

    const withdrawal: Withdrawal = {
      id: id('wd'),
      amount: split.creatorShare,
      fee: WITHDRAWAL_FEE,
      netAmount: net,
      destination: `${account.label} ${account.masked}`,
      status: 'pending_review',
      reference: txn.reference,
      createdAt: nowIso(),
    };

    pushNotification({
      type: 'wallet',
      title: `Withdrawal Requested (${txn.reference})`,
      body: `Your withdrawal request of ${amount.minor.toLocaleString()} CP to ${account.label} is under review. Creator Share (70%): ${split.creatorShare.minor.toLocaleString()} CP, Platform Cut (30%): ${split.platformCut.minor.toLocaleString()} CP. Net Payout: ${net.minor.toLocaleString()} CP.`,
      href: '/wallet/transactions',
    });

    console.log(`[EMAIL NOTIFICATION SENT] To: creator@cloudnet.ng - Subject: Withdrawal Requested (Ref: ${txn.reference}) - Requested: ${amount.minor.toLocaleString()} CP, Creator 70% Payout: ${split.creatorShare.minor.toLocaleString()} CP, Platform 30% Cut: ${split.platformCut.minor.toLocaleString()} CP, Net Payout: ${net.minor.toLocaleString()} CP`);

    withdrawals.unshift(withdrawal);
    return withdrawal;
  },
};

// ---- promotions ----

const PROMOS: Record<string, { credit: Money; description: string }> = {
  CLOUDNET50: { credit: money(500, WALLET_CURRENCY), description: 'Launch bonus' },
  WELCOME10: { credit: money(100, WALLET_CURRENCY), description: 'Welcome credit' },
  POINTS100: { credit: money(200, WALLET_CURRENCY), description: 'Special reward' },
};

const redeemed = new Set<string>();

export const mockPromos = {
  async redeem(rawCode: string) {
    await delay();

    const code = rawCode.trim().toUpperCase();
    if (code.length === 0) throw fail('VALIDATION_FAILED');

    const promo = PROMOS[code];
    if (!promo) throw fail('NOT_FOUND');

    // One redemption per code per account. Without this, a code is free money.
    if (redeemed.has(code)) throw fail('VALIDATION_FAILED', { reason: 'already_redeemed' });
    redeemed.add(code);

    appendTransaction({
      type: 'bonus',
      direction: 'credit',
      amount: promo.credit,
      status: 'completed',
      description: `Promo code ${code}`,
    });

    return { code, credited: promo.credit, description: promo.description };
  },
};

export function findTransaction(transactionId: string) {
  return ledger.find((t) => t.id === transactionId) ?? null;
}
