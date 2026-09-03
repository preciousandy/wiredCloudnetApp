import { describe, expect, it, beforeEach } from 'vitest';
import { money } from '@/lib/money';
import { calculateWithdrawalSplit } from '@/lib/earnings';
import { mockWallet } from '../handlers';
import { mockWithdrawals } from '../payments';
import { appendTransaction, creatorWalletBalance, currentBalance, entitlements, ledger } from '../db';
import { mockSettings } from '../support';

describe('wallet ledger invariants', () => {
  beforeEach(() => {
    mockSettings.pendingDepositRate = 0;
  });

  it('derives balance from the ledger rather than storing it', async () => {
    const wallet = await mockWallet.get();
    expect(wallet.balance.minor).toBe(currentBalance().minor);
  });

  it('credits a deposit', async () => {
    const before = currentBalance().minor;
    await mockWallet.deposit(money(500, 'CP'), 'card');
    expect(currentBalance().minor).toBe(before + 500);
  });

  it('debits buyer and credits 100% of user payment to creator movie wallet', async () => {
    const buyerBefore = currentBalance().minor;
    const cwBefore = creatorWalletBalance().grossBalance.minor;
    const result = await mockWallet.purchase('rift', 'test-key-1');
    expect(result.status).toBe('completed');
    expect(result.entitlement).not.toBeNull();
    expect(currentBalance().minor).toBe(buyerBefore - 300);

    const cwAfter = creatorWalletBalance().grossBalance.minor;
    expect(cwAfter).toBe(cwBefore + 300);
  });

  it('calculates 70% user / 30% platform split on withdrawal', () => {
    const split = calculateWithdrawalSplit(money(1000, 'CP')); // 1,000 CP ($5.00)
    expect(split.platformCut.minor).toBe(300); // 300 CP (30%)
    expect(split.creatorShare.minor).toBe(700); // 700 CP (70%)
  });

  it('processes withdrawal with 70% user payout and 30% platform cut', async () => {
    // Seed cleared sales so available balance is sufficient
    appendTransaction({
      type: 'sale',
      direction: 'credit',
      amount: money(5000, 'CP'),
      status: 'completed',
      description: 'Test sale for withdrawal',
      account: 'creator_movie',
      clearsAt: new Date(Date.now() - 86400000).toISOString(),
    });

    const withdrawal = await mockWithdrawals.request(money(2000, 'CP'), 'pa_1', '654321');
    expect(withdrawal.amount.minor).toBe(1400); // 70% of 2000 = 1400
    expect(withdrawal.netAmount.minor).toBe(1380); // 1400 - 20 fee = 1380
  });

  it('does not charge twice when the same idempotency key is replayed', async () => {
    const before = currentBalance().minor;
    await mockWallet.purchase('rift', 'test-key-1');
    expect(currentBalance().minor).toBe(before);
    expect(entitlements.filter((e) => e.titleId === 'rift')).toHaveLength(1);
  });

  it('rejects a purchase the balance cannot cover, without moving money', async () => {
    // Empty spendable balance
    const current = currentBalance().minor;
    if (current > 0) {
      appendTransaction({
        type: 'purchase',
        direction: 'debit',
        amount: money(current, 'CP'),
        status: 'completed',
        description: 'Spend all balance for test',
      });
    }
    const before = currentBalance().minor;
    await expect(mockWallet.purchase('parakram', 'test-key-2')).rejects.toThrow();
    expect(currentBalance().minor).toBe(before);
  });

  it('never writes a ledger entry for a failed purchase', async () => {
    const count = ledger.length;
    await expect(mockWallet.purchase('parakram', 'test-key-3')).rejects.toThrow();
    expect(ledger).toHaveLength(count);
  });

  it('gives every transaction a support-friendly reference', () => {
    expect(ledger.every((t) => /^CN-\d{4}-\d{6}$/.test(t.reference))).toBe(true);
  });
});


