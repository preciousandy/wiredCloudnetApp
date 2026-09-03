/**
 * Money & CloudPoint (CP).
 *
 * The single most important module in this codebase. Read before touching.
 *
 * RULE 1, Money is never a plain number. It is { minor, currency }.
 *          `minor` is an INTEGER in the smallest unit.
 *          For CloudPoint (CP), exponent is 0 (1 CP = 1 point unit).
 *          500 CP is { minor: 500, currency: 'CP' }.
 *
 * RULE 2, Exchange Rate Invariant: 1 USD = 200 CP (1 CP = $0.005).
 *
 * RULE 3, Never use floats for balance calculations.
 *
 * RULE 4, Arithmetic here is for DISPLAY ONLY. The authoritative wallet balance
 *          always comes from the server.
 */

export type Currency = 'CP' | 'USD' | 'NGN';

export const DEFAULT_CURRENCY: Currency = 'CP';

/** 1 USD = 200 CP */
export const CP_PER_USD = 200;

export interface Money {
  readonly minor: number;
  readonly currency: Currency;
}

const CURRENCY_META: Record<Currency, { symbol: string; exponent: number; locale: string; isSuffix?: boolean }> = {
  CP: { symbol: ' CP', exponent: 0, locale: 'en-US', isSuffix: true },
  USD: { symbol: '$', exponent: 2, locale: 'en-US', isSuffix: false },
  NGN: { symbol: '₦', exponent: 2, locale: 'en-NG', isSuffix: false },
};

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** Construct Money from minor units. Rejects anything non-integer. */
export function money(minor: number, currency: Currency = DEFAULT_CURRENCY): Money {
  if (!Number.isInteger(minor)) {
    throw new MoneyError(
      `Money must be an integer in minor units, received ${minor}. ` +
        `Did you pass a major-unit float? Use fromMajor() instead.`,
    );
  }
  if (!Number.isSafeInteger(minor)) {
    throw new MoneyError(`Money value ${minor} exceeds safe integer range.`);
  }
  return { minor, currency };
}

export function zero(currency: Currency = DEFAULT_CURRENCY): Money {
  return { minor: 0, currency };
}

/**
 * Convert a major-unit amount (what a human types: "500", "19.99") to Money.
 * Rounds half-up at the minor unit, never trust the caller to have done it.
 */
export function fromMajor(major: number, currency: Currency = DEFAULT_CURRENCY): Money {
  if (!Number.isFinite(major)) {
    throw new MoneyError(`Cannot convert non-finite value ${major} to Money.`);
  }
  const { exponent } = CURRENCY_META[currency];
  const factor = 10 ** exponent;
  return money(Math.round(major * factor), currency);
}

/** For display/analytics only. Never feed the result back into arithmetic. */
export function toMajor(value: Money): number {
  const { exponent } = CURRENCY_META[value.currency];
  return value.minor / 10 ** exponent;
}

/** Convert USD to equivalent CloudPoints (1 USD = 200 CP) */
export function usdToCp(usd: number): Money {
  return money(Math.round(usd * CP_PER_USD), 'CP');
}

/** Convert CloudPoints to equivalent USD (200 CP = 1 USD) */
export function cpToUsd(value: Money | number): number {
  const points = typeof value === 'number' ? value : toMajor(value);
  return Number((points / CP_PER_USD).toFixed(2));
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(
      `Cannot combine ${a.currency} and ${b.currency}. ` +
        `Currency conversion is a server responsibility, never a client one.`,
    );
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.minor + b.minor, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.minor - b.minor, a.currency);
}

export function multiply(value: Money, factor: number): Money {
  if (!Number.isFinite(factor)) {
    throw new MoneyError(`Cannot multiply Money by non-finite ${factor}.`);
  }
  return money(Math.round(value.minor * factor), value.currency);
}

export function sum(values: readonly Money[], currency: Currency = DEFAULT_CURRENCY): Money {
  return values.reduce<Money>((acc, v) => add(acc, v), zero(currency));
}

/** -1 if a < b, 0 if equal, 1 if a > b. */
export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.minor < b.minor) return -1;
  if (a.minor > b.minor) return 1;
  return 0;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.minor === b.minor;
}

export function isZero(value: Money): boolean {
  return value.minor === 0;
}

export function isNegative(value: Money): boolean {
  return value.minor < 0;
}

export function isPositive(value: Money): boolean {
  return value.minor > 0;
}

/** Can `balance` cover `price`? Display affordance only, the server decides. */
export function covers(balance: Money, price: Money): boolean {
  assertSameCurrency(balance, price);
  return balance.minor >= price.minor;
}

/** How far short the balance falls. Returns zero when it covers the price. */
export function shortfall(balance: Money, price: Money): Money {
  assertSameCurrency(balance, price);
  const diff = price.minor - balance.minor;
  return money(diff > 0 ? diff : 0, price.currency);
}

export interface FormatOptions {
  /** Hide the decimal part for whole amounts, e.g. "300 CP" instead of "300.00 CP". */
  compactWhole?: boolean;
  /** Render the ISO code instead of the symbol, e.g. "CP 300". */
  useCode?: boolean;
}

/**
 * The only approved way to turn Money into a string.
 * UI must call this (or <MoneyText />), never build the string by hand.
 */
export function formatMoney(value: Money, options: FormatOptions = {}): string {
  const { compactWhole = false, useCode = false } = options;
  const meta = CURRENCY_META[value.currency] ?? CURRENCY_META.CP;

  const negative = value.minor < 0;
  const absMinor = Math.abs(value.minor);
  const factor = 10 ** meta.exponent;
  const isWhole = absMinor % factor === 0;
  const fractionDigits = compactWhole && isWhole ? 0 : meta.exponent;

  const formattedNumber = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(absMinor / factor);

  if (meta.isSuffix) {
    const label = useCode ? ` ${value.currency}` : meta.symbol;
    return `${negative ? '-' : ''}${formattedNumber}${label}`;
  }

  const prefix = useCode ? `${value.currency} ` : meta.symbol;
  return `${negative ? '-' : ''}${prefix}${formattedNumber}`;
}

/** Parse user keyboard input ("500" / "2,000" / "19.99") into Money. Null if invalid. */
export function parseMoneyInput(input: string, currency: Currency = DEFAULT_CURRENCY): Money | null {
  const cleaned = input
    .replace(/[\s,]/g, '')
    .replace(/(CP|cp|USD|usd|NGN|ngn)/gi, '')
    .replace(/^[₦$]/, '');
  if (cleaned === '' || !/^\d*\.?\d*$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return fromMajor(parsed, currency);
}
