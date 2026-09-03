import { describe, expect, it } from 'vitest';
import {
  add,
  compare,
  covers,
  cpToUsd,
  formatMoney,
  fromMajor,
  isNegative,
  money,
  MoneyError,
  parseMoneyInput,
  shortfall,
  subtract,
  sum,
  toMajor,
  usdToCp,
  zero,
} from '../money';

describe('construction', () => {
  it('accepts integer minor units for CP', () => {
    expect(money(500, 'CP')).toEqual({ minor: 500, currency: 'CP' });
  });

  it('rejects non-integers, the bug class this module exists to prevent', () => {
    expect(() => money(300.5, 'CP')).toThrow(MoneyError);
  });

  it('rejects unsafe integers', () => {
    expect(() => money(Number.MAX_SAFE_INTEGER + 2, 'CP')).toThrow(MoneyError);
  });

  it('converts major units for CP and USD', () => {
    expect(fromMajor(500, 'CP').minor).toBe(500);
    expect(fromMajor(19.99, 'USD').minor).toBe(1999);
    expect(fromMajor(0.005, 'USD').minor).toBe(1);
  });

  it('round-trips major and minor units', () => {
    expect(toMajor(fromMajor(500, 'CP'))).toBe(500);
  });

  it('converts between USD and CloudPoints at 1 USD = 200 CP', () => {
    expect(usdToCp(1)).toEqual({ minor: 200, currency: 'CP' });
    expect(usdToCp(2.5)).toEqual({ minor: 500, currency: 'CP' });
    expect(usdToCp(5)).toEqual({ minor: 1000, currency: 'CP' });
    expect(usdToCp(10)).toEqual({ minor: 2000, currency: 'CP' });
    expect(cpToUsd(money(500, 'CP'))).toBe(2.5);
    expect(cpToUsd(1000)).toBe(5);
  });
});

describe('float safety', () => {
  it('does not reproduce the 0.1 + 0.2 defect', () => {
    const a = fromMajor(0.1, 'USD');
    const b = fromMajor(0.2, 'USD');
    const total = add(a, b);
    expect(total.minor).toBe(30);
    expect(formatMoney(total)).toBe('$0.30');
  });

  it('sums a long receipt without drift', () => {
    const items = Array.from({ length: 1000 }, () => fromMajor(5, 'CP'));
    expect(sum(items, 'CP').minor).toBe(5000);
  });
});

describe('currency safety', () => {
  it('refuses to mix currencies', () => {
    expect(() => add(money(100, 'CP'), money(100, 'USD'))).toThrow(MoneyError);
    expect(() => compare(money(100, 'CP'), money(100, 'USD'))).toThrow(MoneyError);
  });
});

describe('arithmetic', () => {
  it('subtracts and can go negative', () => {
    const result = subtract(money(1000, 'CP'), money(1500, 'CP'));
    expect(result.minor).toBe(-500);
    expect(isNegative(result)).toBe(true);
  });

  it('sums an empty list to zero', () => {
    expect(sum([], 'CP')).toEqual(zero('CP'));
  });
});

describe('affordability', () => {
  const balance = money(1700, 'CP'); // 1,700 CP ($8.50)

  it('covers a cheaper price', () => {
    expect(covers(balance, money(300, 'CP'))).toBe(true);
  });

  it('covers an exactly equal price', () => {
    expect(covers(balance, money(1700, 'CP'))).toBe(true);
  });

  it('does not cover a higher price', () => {
    expect(covers(balance, money(2000, 'CP'))).toBe(false);
  });

  it('reports the shortfall', () => {
    expect(shortfall(balance, money(2000, 'CP')).minor).toBe(300);
  });

  it('reports zero shortfall when affordable', () => {
    expect(shortfall(balance, money(100, 'CP')).minor).toBe(0);
  });
});

describe('formatting', () => {
  it('formats CloudPoints with CP suffix', () => {
    expect(formatMoney(money(500, 'CP'))).toBe('500 CP');
  });

  it('formats USD', () => {
    expect(formatMoney(money(2000, 'USD'))).toBe('$20.00');
  });

  it('formats negatives with the sign outside', () => {
    expect(formatMoney(money(-300, 'CP'))).toBe('-300 CP');
  });

  it('supports the ISO code form', () => {
    expect(formatMoney(money(300, 'CP'), { useCode: true })).toBe('300 CP');
  });

  it('handles micro-point pricing', () => {
    expect(formatMoney(money(20, 'CP'))).toBe('20 CP');
    expect(formatMoney(money(40, 'CP'))).toBe('40 CP');
  });
});

describe('user input parsing', () => {
  it('parses plain and grouped input', () => {
    expect(parseMoneyInput('500', 'CP')?.minor).toBe(500);
    expect(parseMoneyInput('2,000', 'CP')?.minor).toBe(2000);
    expect(parseMoneyInput('500 CP', 'CP')?.minor).toBe(500);
    expect(parseMoneyInput('19.99', 'USD')?.minor).toBe(1999);
  });

  it('rejects junk and negatives', () => {
    expect(parseMoneyInput('abc', 'CP')).toBeNull();
    expect(parseMoneyInput('-500', 'CP')).toBeNull();
    expect(parseMoneyInput('', 'CP')).toBeNull();
    expect(parseMoneyInput('1.2.3', 'CP')).toBeNull();
  });
});
