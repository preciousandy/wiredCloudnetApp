import { money, type Money } from './money';

/**
 * How a creator earns on CloudNet, in one place.
 *
 * ## Where the money comes from
 *
 * A creator earns from what people actually pay for, and nothing else:
 *
 *   - someone buys their film, series episode or premium vertical
 *   - someone buys a ticket to their live event
 *
 * There is deliberately no pay per view. That model only works when views
 * themselves generate revenue, which means advertising, and CloudNet has no
 * ads. A view based fund on a platform with no ad income is paying out of
 * money that does not exist; it looks generous for one quarter and then stops.
 *
 * The consequence to be honest about: a free vertical earns its creator
 * nothing directly. It earns them followers, and followers buy the paid work.
 * Tips and gifts are the usual answer to this and are not built yet.
 *
 * ## The split
 *
 * Creator keeps 70 percent of the sale price. CloudNet keeps 30.
 */
export const COMMISSION_RATE = 0.3;

/**
 * Days a sale sits as pending before it can be withdrawn.
 *
 * Two reasons, both real. A buyer can ask for a refund, and money already paid
 * out is money you are chasing. And the payment provider does not settle to us
 * instantly either, so paying a creator on day zero means fronting cash we have
 * not received.
 */
export const CLEARANCE_DAYS = 7;

/**
 * Smallest withdrawal we will process.
 *
 * A bank transfer costs a flat fee. Below roughly this figure the fee eats a
 * humiliating share of the payout, so it is kinder to make people wait until it
 * is worth moving.
 */
export const MINIMUM_PAYOUT = money(1000, 'CP'); // 1,000 CP ($5.00)

/**
 * The platform's cut.
 *
 * Rounded first, and the creator gets the remainder. This ordering matters: if
 * both sides were rounded independently, the two halves would not add back to
 * the sale price and the ledger would gain or lose a kobo on every single
 * transaction. Over a hundred thousand sales that is a real number that nobody
 * can account for.
 */
export function platformCommission(gross: Money): Money {
  return money(Math.round(gross.minor * COMMISSION_RATE), gross.currency);
}

/** What the creator keeps. Always exactly gross minus commission. */
export function creatorShare(gross: Money): Money {
  return money(gross.minor - platformCommission(gross).minor, gross.currency);
}

/** When a sale made now becomes withdrawable. */
export function clearanceDate(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + CLEARANCE_DAYS);
  return d.toISOString();
}

export function hasCleared(clearsAt: string | null, now: Date = new Date()): boolean {
  if (clearsAt === null) return true;
  return new Date(clearsAt).getTime() <= now.getTime();
}

export interface PayoutCheck {
  allowed: boolean;
  /** Written for a creator, not a developer. Null when allowed. */
  reason: string | null;
}

/**
 * Whether a withdrawal can go ahead.
 *
 * Returns a reason rather than throwing, because every one of these is
 * something the creator can act on, and a screen needs to say which.
 */
export function canWithdraw(amount: Money, available: Money): PayoutCheck {
  if (amount.currency !== available.currency) {
    return { allowed: false, reason: 'That amount is in a different currency to your earnings.' };
  }
  if (amount.minor <= 0) {
    return { allowed: false, reason: 'Enter an amount to withdraw.' };
  }
  if (amount.minor < MINIMUM_PAYOUT.minor) {
    return {
      allowed: false,
      reason: 'The smallest withdrawal is 1,000 CP ($5.00).',
    };
  }
  if (amount.minor > available.minor) {
    return {
      allowed: false,
      reason: 'That is more than you have available. Recent sales stay pending for a few days.',
    };
  }
  return { allowed: true, reason: null };
}

export interface EarningsBreakdown {
  gross: Money;
  commission: Money;
  net: Money;
  /** Cleared and withdrawable. */
  available: Money;
  /** Sold, but still inside the clearance window. */
  pending: Money;
}

/**
 * Roll a set of sales into the numbers a creator actually wants to see.
 *
 * Deliberately takes the raw sales rather than pre-aggregated totals, so
 * pending and available can never drift apart from the ledger they came from.
 */
export function summariseEarnings(
  sales: { gross: Money; clearsAt: string | null }[],
  now: Date = new Date(),
): EarningsBreakdown {
  const currency = sales[0]?.gross.currency ?? 'CP';
  let gross = 0;
  let commission = 0;
  let available = 0;
  let pending = 0;

  for (const sale of sales) {
    const cut = platformCommission(sale.gross).minor;
    const share = sale.gross.minor - cut;
    gross += sale.gross.minor;
    commission += cut;
    if (hasCleared(sale.clearsAt, now)) available += share;
    else pending += share;
  }

  return {
    gross: money(gross, currency),
    commission: money(commission, currency),
    net: money(gross - commission, currency),
    available: money(available, currency),
    pending: money(pending, currency),
  };
}

export interface WithdrawalSplit {
  grossWithdrawal: Money;
  platformCut: Money;
  creatorShare: Money;
}

/**
 * Calculates the 70% Creator / 30% Platform split upon withdrawal.
 */
export function calculateWithdrawalSplit(grossAmount: Money): WithdrawalSplit {
  const platformCut = platformCommission(grossAmount);
  const creatorShareAmount = creatorShare(grossAmount);
  return {
    grossWithdrawal: grossAmount,
    platformCut,
    creatorShare: creatorShareAmount,
  };
}

