import { money, type Money } from '@/lib/money';
import type { CreatorTitle } from '../schemas/creator';
import { submittedTitles } from './upload';
import { delay, fail, nowIso } from './support';

/** Confirmed payout policy, and it must match what CloudIt shows at upload. */
const CREATOR_SHARE = 0.7;

function revenueFor(price: Money | null, sales: number): Money {
  if (!price) return money(0, 'CP');
  return money(Math.round(price.minor * sales * CREATOR_SHARE), 'CP');
}

const owned: CreatorTitle[] = [
  {
    id: 'rift',
    title: 'Rift',
    posterUrl: 'https://picsum.photos/seed/rift/400/600',
    visibility: 'public',
    moderation: 'published',
    rejectionReason: null,
    price: money(300, 'CP'),
    views: 18_420,
    sales: 312,
    revenue: revenueFor(money(300, 'CP'), 312),
    createdAt: '2026-05-02T10:00:00.000Z',
  },
  {
    id: 'harmattan',
    title: 'Harmattan',
    posterUrl: 'https://picsum.photos/seed/harmattan/400/600',
    visibility: 'public',
    moderation: 'published',
    rejectionReason: null,
    price: money(350, 'CP'),
    views: 9_140,
    sales: 148,
    revenue: revenueFor(money(350, 'CP'), 148),
    createdAt: '2026-06-14T10:00:00.000Z',
  },
  {
    id: 'behindlens',
    title: 'Behind the Lens',
    posterUrl: 'https://picsum.photos/seed/behindlens/400/600',
    visibility: 'public',
    moderation: 'published',
    rejectionReason: null,
    price: null,
    views: 24_800,
    sales: 0,
    revenue: money(0, 'CP'),
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'draft_nightbus',
    title: 'Night Bus',
    posterUrl: 'https://picsum.photos/seed/nightbus/400/600',
    visibility: 'private',
    moderation: 'pending_review',
    rejectionReason: null,
    price: money(200, 'CP'),
    views: 0,
    sales: 0,
    revenue: money(0, 'CP'),
    createdAt: '2026-08-04T10:00:00.000Z',
  },
  {
    id: 'rejected_clip',
    title: 'Street Cut',
    posterUrl: 'https://picsum.photos/seed/streetcut/400/600',
    visibility: 'private',
    moderation: 'rejected',
    // A rejection without a reason is useless: the creator cannot fix it.
    rejectionReason: 'Background music is licensed to a third party. Replace the audio and resubmit.',
    price: money(100, 'CP'),
    views: 0,
    sales: 0,
    revenue: money(0, 'CP'),
    createdAt: '2026-07-28T10:00:00.000Z',
  },
];

import { creatorWalletBalance } from './db';

/** Paid out so far. Kept separate from earnings so "available" is honest. */
const PAID_OUT = money(2500, 'CP');

export const mockCreator = {
  async wallet() {
    await delay();
    const cw = creatorWalletBalance();
    return {
      walletId: cw.walletId,
      grossBalance: cw.grossBalance,
      availableToWithdraw: cw.availableToWithdraw,
      userShareAvailable: cw.userShareAvailable,
      platformCutTotal: cw.platformCutTotal,
      currency: 'CP' as const,
      status: 'active' as const,
      updatedAt: nowIso(),
    };
  },

  async overview() {
    await delay();

    // Anything submitted this session shows up immediately, still in review.
    const fresh: CreatorTitle[] = submittedTitles.map((t) => ({
      id: t.id,
      title: t.title,
      posterUrl: 'https://picsum.photos/seed/newupload/400/600',
      visibility: 'private' as const,
      moderation: t.moderation,
      rejectionReason: null,
      price: null,
      views: 0,
      sales: 0,
      revenue: money(0, 'CP'),
      createdAt: t.submittedAt,
    }));

    const all = [...fresh, ...owned];
    const published = all.filter((t) => t.moderation === 'published');

    const earned = money(
      published.reduce((total, t) => total + t.revenue.minor, 0),
      'CP',
    );

    const cw = creatorWalletBalance();
    const creatorWalletData = {
      walletId: cw.walletId,
      grossBalance: cw.grossBalance,
      availableToWithdraw: cw.availableToWithdraw,
      userShareAvailable: cw.userShareAvailable,
      platformCutTotal: cw.platformCutTotal,
      currency: 'CP' as const,
      status: 'active' as const,
      updatedAt: nowIso(),
    };

    return {
      stats: {
        views: published.reduce((total, t) => total + t.views, 0),
        watchHours:
          Math.round(published.reduce((total, t) => total + t.views * 0.6, 0) / 60) / 10,
        sales: published.reduce((total, t) => total + t.sales, 0),
        followers: 24_800,
        earned: cw.grossBalance,
        paidOut: PAID_OUT,
        available: cw.userShareAvailable,
      },
      creatorWallet: creatorWalletData,
      topTitles: [...published].sort((a, b) => b.revenue.minor - a.revenue.minor).slice(0, 3),
    };
  },

  async titles() {
    await delay();
    const fresh: CreatorTitle[] = submittedTitles.map((t) => ({
      id: t.id,
      title: t.title,
      posterUrl: 'https://picsum.photos/seed/newupload/400/600',
      visibility: 'private' as const,
      moderation: t.moderation,
      rejectionReason: null,
      price: null,
      views: 0,
      sales: 0,
      revenue: money(0, 'NGN'),
      createdAt: t.submittedAt,
    }));
    const all = [...fresh, ...owned];
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { items: all, nextCursor: null };
  },

  async setVisibility(titleId: string, visibility: 'public' | 'unlisted' | 'private') {
    await delay();
    const found = owned.find((t) => t.id === titleId);
    if (!found) throw fail('NOT_FOUND');

    // Publishing something that has not cleared review would defeat moderation.
    if (visibility === 'public' && found.moderation !== 'published') {
      throw fail('FORBIDDEN');
    }

    found.visibility = visibility;
    return { id: titleId, visibility };
  },

  async remove(titleId: string) {
    await delay();
    const index = owned.findIndex((t) => t.id === titleId);
    if (index === -1) throw fail('NOT_FOUND');

    // Removing something people paid for would take away what they bought.
    if (owned[index]!.sales > 0) throw fail('FORBIDDEN', { reason: 'has_sales' });

    owned.splice(index, 1);
    return { removed: true, at: nowIso() };
  },
};
