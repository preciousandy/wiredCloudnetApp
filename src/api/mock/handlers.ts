import { covers, money, type Money } from '@/lib/money';
import { creatorShare } from '@/lib/earnings';
import type { Session } from '../schemas/auth';
import type { HomeSection, TitleDetail, TitleSummary } from '../schemas/catalog';
import type { PlaybackTicket } from '../schemas/playback';
import type {
  DepositIntent,
  Entitlement,
  PurchaseResult,
  Transaction,
  Wallet,
} from '../schemas/wallet';
import {
  CATEGORIES,
  appendTransaction,
  settleTransaction,
  currentBalance,
  entitlements,
  idempotencyLog,
  isEntitled,
  ledger,
  mockSession,
  mockUser,
  seed,
  titles,
  walletId,
  watchProgress,
} from './db';
import { delay, fail, id, mockSettings, nowIso, paginate } from './support';
import { reels } from './verticals';
import {
  allEpisodes,
  episodeAfter,
  findEpisode,
  isSeries,
  nextEpisodeFor,
  seasonsBySeries,
} from './series';

import { pushNotification } from './profile';

seed();

/** The only code the mock accepts. Documented in the README. */
export const MOCK_OTP = '4321';

function withEntitlement(t: TitleDetail): TitleDetail {
  return { ...t, entitled: isEntitled(t.id) };
}

function toSummary(t: TitleDetail): TitleSummary {
  const { description: _d, category: _c, releasedAt: _r, viewCount: _v, ...summary } = t;
  return { ...summary, entitled: isEntitled(t.id) };
}

export const mockAuth = {
  async login(identity: string, password: string): Promise<Session> {
    await delay();
    if (!identity || !password) throw fail('VALIDATION_FAILED');
    const cleanIdentity = identity.trim();
    const email = cleanIdentity.includes('@') ? cleanIdentity : undefined;
    const username = cleanIdentity.includes('@') ? cleanIdentity.split('@')[0] : cleanIdentity;
    mockUser.email = email;
    mockUser.username = username;
    mockUser.displayName = username.charAt(0).toUpperCase() + username.slice(1);

    const user = { ...mockUser };
    return {
      ...mockSession,
      user,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
  },

  async startRegistration(identity: string) {
    await delay();
    if (!identity) throw fail('VALIDATION_FAILED');
    return { challengeId: id('ch'), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() };
  },

  /**
   * The OTP verdict is produced here, on the "server" side of the boundary.
   * The client is never told the expected code. (The old prototype inverted
   * this and accepted every code except '1111', the exact opposite of correct.)
   */
  async verifyOtp(_challengeId: string, code: string) {
    await delay();
    if (!/^\d{4}$/.test(code)) throw fail('OTP_INVALID');
    if (code !== MOCK_OTP) throw fail('OTP_INVALID');
    return { verificationToken: id('vt') };
  },

  async resendOtp(_challengeId: string) {
    await delay();
    return { challengeId: id('ch'), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() };
  },

  async completeRegistration(username: string): Promise<Session> {
    await delay();
    if (!username) throw fail('VALIDATION_FAILED');
    return {
      ...mockSession,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      user: { ...mockUser, username, displayName: username },
    };
  },

  /** A few names are taken so the screen's error path is exercisable. */
  async checkUsername(username: string) {
    await delay();
    const taken = ['admin', 'cloudnet', 'support', 'fems'];
    return { available: !taken.includes(username.toLowerCase()) };
  },

  async startPasswordReset(identity: string) {
    await delay();
    if (!identity) throw fail('VALIDATION_FAILED');
    return { challengeId: id('ch'), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() };
  },

  async resetPassword(password: string) {
    await delay();
    if (password.length < 8) throw fail('VALIDATION_FAILED');
  },

  async refresh(): Promise<Session> {
    await delay();
    return { ...mockSession, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() };
  },

  async logout(): Promise<void> {
    await delay();
  },
};

export const mockCatalog = {
  async home() {
    await delay();
    const all = titles.map(toSummary);

    const pick = (ids: string[]) =>
      ids.map((id) => all.find((t) => t.id === id)).filter((t): t is TitleSummary => Boolean(t));

    const continueWatching = [...watchProgress.entries()]
      .map(([id, seconds]) => {
        const found = all.find((t) => t.id === id);
        if (found) return { ...found, progressSeconds: seconds };

        // Episodes resume as themselves, carrying the series name for context.
        const episode = findEpisode(id);
        if (!episode) return null;
        const series = titles.find((t) => t.id === episode.seriesId);

        return {
          id: episode.id,
          title: `${series?.title ?? 'Series'}: ${episode.title}`,
          kind: 'series' as const,
          posterUrl: episode.stillUrl,
          backdropUrl: episode.stillUrl,
          durationSeconds: episode.durationSeconds,
          rating: episode.rating,
          access:
            episode.price === null
              ? { type: 'free' as const, price: null }
              : { type: 'purchase' as const, price: episode.price },
          entitled: isEntitled(episode.id),
          badge: `S${episode.seasonNumber} E${episode.episodeNumber}`,
          creator: series?.creator ?? {
            id: 'c_1',
            handle: 'cloudnet',
            displayName: 'CloudNet Originals',
            avatarUrl: null,
          },
          progressSeconds: seconds,
        };
      })
      // NonNullable rather than TitleSummary: these rows carry progressSeconds
      // on top of a summary, and narrowing to the base type would drop it.
      .filter((t): t is NonNullable<typeof t> => t !== null);

    return {
      greetingName: mockUser.displayName,
      categories: CATEGORIES,
      sections: [
        {
          id: 'hero',
          type: 'hero' as const,
          title: null,
          // Several featured titles: the home hero rotates through them.
          items: pick(['parakram', 'power', 'sunsetlagos', 'thelastbus', 'owambe']),
        },
        {
          id: 'continue',
          type: 'continue' as const,
          title: 'Continue watching',
          seeAllQuery: null,
          items: continueWatching,
        },
        {
          id: 'hot',
          type: 'carousel' as const,
          title: 'Hot right now',
          seeAllQuery: 'hot',
          items: pick(['rift', 'power', 'thelastbus', 'owambe', 'harmattan']),
        },
        {
          id: 'spotlight',
          type: 'spotlight' as const,
          title: 'Creator spotlight',
          seeAllQuery: 'creators',
          items: pick(['behindlens', 'marketday', 'streetsound']),
        },
        {
          id: 'latest',
          type: 'grid' as const,
          title: 'Latest on CloudNet',
          seeAllQuery: 'latest',
          items: pick(['sunsetlagos', 'quietrooms', 'lagosnights', 'harmattan', 'marketday', 'behindlens']),
        },
      ],
    };
  },

  async detail(titleId: string): Promise<TitleDetail> {
    await delay();

    const found = titles.find((t) => t.id === titleId);
    if (found) return withEntitlement(found);

    // An episode is a playable, purchasable record in its own right, so it is
    // returned in the same shape rather than through a parallel code path.
    const episode = findEpisode(titleId);
    if (!episode) throw fail('NOT_FOUND');

    const series = titles.find((t) => t.id === episode.seriesId);

    return {
      id: episode.id,
      title: episode.title,
      kind: 'series',
      posterUrl: episode.stillUrl,
      backdropUrl: episode.stillUrl,
      durationSeconds: episode.durationSeconds,
      rating: episode.rating,
      access:
        episode.price === null
          ? { type: 'free', price: null }
          : { type: 'purchase', price: episode.price },
      entitled: isEntitled(episode.id),
      badge: null,
      creator: series?.creator ?? {
        id: 'c_1',
        handle: 'cloudnet',
        displayName: 'CloudNet Originals',
        avatarUrl: null,
      },
      description: episode.synopsis,
      category: series?.category ?? 'Series',
      releasedAt: episode.releasesAt,
      viewCount: 1200 + episode.episodeNumber * 733,
      seriesId: episode.seriesId,
      seriesTitle: series?.title ?? null,
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
    };
  },

  /** The episode after this one, or null at the end of a run. */
  async nextEpisode(episodeId: string) {
    await delay();
    const next = episodeAfter(episodeId);
    if (!next) return { next: null };

    const series = titles.find((t) => t.id === next.seriesId);
    return {
      next: {
        id: next.id,
        title: `${next.episodeNumber}. ${next.title}`,
        kind: 'series' as const,
        posterUrl: next.stillUrl,
        backdropUrl: next.stillUrl,
        durationSeconds: next.durationSeconds,
        rating: next.rating,
        access:
          next.price === null
            ? { type: 'free' as const, price: null }
            : { type: 'purchase' as const, price: next.price },
        entitled: isEntitled(next.id),
        badge: null,
        creator: series?.creator ?? {
          id: 'c_1',
          handle: 'cloudnet',
          displayName: 'CloudNet Originals',
          avatarUrl: null,
        },
      },
    };
  },

  async seasons(seriesId: string) {
    await delay();
    const seasons = seasonsBySeries[seriesId];
    if (!seasons) throw fail('NOT_FOUND');

    return {
      seriesId,
      // Entitlement and progress are resolved per episode, server side.
      seasons: seasons.map((season) => ({
        ...season,
        episodes: season.episodes.map((episode) => ({
          ...episode,
          entitled: isEntitled(episode.id),
          progressSeconds: watchProgress.get(episode.id) ?? null,
        })),
      })),
      nextEpisodeId: nextEpisodeFor(seriesId),
    };
  },

  async search(query: string, cursor?: string) {
    await delay();
    const q = query.trim().toLowerCase();
    const matches = titles
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.creator.displayName.toLowerCase().includes(q),
      )
      .map(toSummary);
    return paginate(matches, cursor);
  },

  async creator(handle: string) {
    await delay();
    const cleanHandle = String(handle || 'cloudnet').toLowerCase();
    const reel = reels.find((r) => r.creator.handle.toLowerCase() === cleanHandle);
    const owned = titles.filter((t) => t.creator.handle.toLowerCase() === cleanHandle).map(toSummary);

    const defaultDisplayName = cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1);
    const creator = reel?.creator ?? (owned.length > 0 ? {
      ...owned[0]!.creator,
      followerCount: owned[0]!.creator.followerCount ?? 0,
      following: false,
    } : {
      id: `cr_${cleanHandle}`,
      handle: cleanHandle,
      displayName: defaultDisplayName,
      avatarUrl: null,
      followerCount: 0,
      following: false,
    });

    return { creator, titles: owned, verticals: reel?.items ?? [] };
  },

  async byCategory(categoryId: string, cursor?: string) {
    await delay();
    const matches =
      categoryId === 'all'
        ? titles.map(toSummary)
        : titles
            .filter(
              (t) =>
                t.category.toLowerCase() === categoryId.toLowerCase() || t.kind === categoryId,
            )
            .map(toSummary);
    return paginate(matches, cursor);
  },
};

export const mockPlayback = {
  async ticket(titleId: string): Promise<PlaybackTicket> {
    await delay();

    const episode = findEpisode(titleId);
    if (episode) {
      // An unreleased episode is not playable at any price.
      if (!episode.released) throw fail('NOT_FOUND');
      if (episode.price !== null && !isEntitled(titleId)) throw fail('FORBIDDEN');

      return {
        manifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        protocol: 'hls',
        expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        startPositionSeconds: watchProgress.get(titleId) ?? 0,
        subtitles: [],
      };
    }

    const found = titles.find((t) => t.id === titleId);
    if (!found) throw fail('NOT_FOUND');

    // Access control lives on the server. The client obeys this verdict.
    if (found.access.type !== 'free' && !isEntitled(titleId)) {
      throw fail('FORBIDDEN');
    }

    return {
      manifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      protocol: 'hls',
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      startPositionSeconds: 0,
      subtitles: [],
    };
  },
};

const PAYMENT_METHODS = [
  { id: 'card', label: 'Debit card / Credit card', description: 'Visa, Mastercard via Stripe / Paystack', kind: 'redirect' as const, available: true, minAmount: money(200, 'CP') },
  { id: 'transfer', label: 'Bank transfer', description: 'Direct bank transfer / wire', kind: 'redirect' as const, available: true, minAmount: money(200, 'CP') },
  { id: 'crypto', label: 'Crypto', description: 'USDT on BNB Chain / Tron', kind: 'crypto' as const, available: true, minAmount: money(1000, 'CP') },
];

/** depositId -> the pending ledger entry, so we can settle it later. */
const pendingDeposits = new Map<string, string>();

export const mockWallet = {
  async get(): Promise<Wallet> {
    await delay();
    return {
      walletId,
      balance: currentBalance(),
      currency: 'CP' as const,
      status: 'active',
      updatedAt: nowIso(),
    };
  },

  async transactions(cursor?: string): Promise<{ items: Transaction[]; nextCursor: string | null }> {
    await delay();
    return paginate([...ledger], cursor, 12);
  },

  async methods() {
    await delay();
    return { items: PAYMENT_METHODS, nextCursor: null };
  },

  async deposit(amount: Money, methodId: string): Promise<DepositIntent> {
    await delay();
    if (amount.minor <= 0) throw fail('VALIDATION_FAILED');

    const method = PAYMENT_METHODS.find((m) => m.id === methodId);
    if (!method || !method.available) throw fail('VALIDATION_FAILED');
    if (amount.minor < method.minAmount.minor) throw fail('VALIDATION_FAILED');

    // Real PSPs confirm asynchronously. Modelling that here means the UI is
    // built against pending states from day one rather than bolting them on.
    const isPending = Math.random() < mockSettings.pendingDepositRate;
    const txn = appendTransaction({
      type: 'deposit',
      direction: 'credit',
      amount,
      status: isPending ? 'pending' : 'completed',
      description: `Wallet top up via ${method.label}`,
    });

    const depositId = id('dep');
    if (isPending) pendingDeposits.set(depositId, txn.id);

    return {
      depositId,
      status: isPending ? 'pending' : 'completed',
      amount,
      checkoutUrl: null,
      reference: txn.reference,
    };
  },

  /**
   * Stands in for the PSP webhook. The real backend flips the ledger entry when
   * the provider confirms; here the client polls this until it settles.
   */
  async depositStatus(depositId: string): Promise<DepositIntent> {
    await delay();
    const txnId = pendingDeposits.get(depositId);
    const txn = ledger.find((t) => t.id === txnId);
    if (!txn) throw fail('NOT_FOUND');

    // Settle a few seconds after creation so the pending UI is actually visible.
    const age = Date.now() - new Date(txn.createdAt).getTime();
    if (txn.status === 'pending' && age > 4000) {
      settleTransaction(txn.id);
      pendingDeposits.delete(depositId);
    }

    const settled = ledger.find((t) => t.id === txnId)!;
    return {
      depositId,
      status: settled.status === 'completed' ? 'completed' : 'pending',
      amount: settled.amount,
      checkoutUrl: null,
      reference: settled.reference,
    };
  },

  async purchase(titleId: string, idempotencyKey: string): Promise<PurchaseResult> {
    await delay();

    // Idempotency: a retry with the same key must never charge twice.
    const existing = idempotencyLog.get(idempotencyKey);
    if (existing) {
      const priorTxn = ledger.find((t) => t.id === existing);
      const priorEnt = entitlements.find((e) => e.titleId === titleId);
      if (priorTxn) {
        return {
          purchaseId: existing,
          status: 'completed',
          entitlement: priorEnt ?? null,
          transaction: priorTxn,
        };
      }
    }

    const episode = findEpisode(titleId);
    const found = titles.find((t) => t.id === titleId);
    if (!episode && !found) throw fail('NOT_FOUND');

    // Selling an episode that has not been uploaded is the exact thing the
    // per-episode model exists to prevent.
    if (episode && !episode.released) throw fail('VALIDATION_FAILED');

    if (isEntitled(titleId)) throw fail('ALREADY_ENTITLED');

    const price = episode ? (episode.price ?? money(0, 'CP')) : (found!.access.price ?? money(0, 'CP'));
    const balance = currentBalance();

    if (!covers(balance, price)) {
      throw fail('INSUFFICIENT_FUNDS', { required: price, available: balance });
    }

    // Debit and entitlement grant are atomic here, as they must be in the
    // real backend. A partial state, money taken, no access, is the worst
    // outcome available to us.
    const txn = appendTransaction({
      type: 'purchase',
      direction: 'debit',
      amount: price,
      status: 'completed',
      description: `Purchase, ${episode ? episode.title : found!.title}`,
      relatedTitleId: titleId,
    });

    const entitlement: Entitlement = {
      titleId,
      type: 'purchase',
      expiresAt: null,
      grantedAt: nowIso(),
    };
    entitlements.push(entitlement);
    idempotencyLog.set(idempotencyKey, txn.id);

    /**
     * The other half of the sale.
     *
     * Every purchase is two movements, not one: the buyer's credit goes down
     * and the seller's earnings go up. Recording only the debit is how a
     * platform ends up unable to say what it owes its creators.
     *
     * Credited as pending. It becomes withdrawable after the clearance window,
     * because a refund inside that window has to come back out of the same
     * money. In the mock the seller is always the demo creator; the real
     * backend reads the title's owner.
     */
    const sellerId = episode ? episode.seriesId : found!.creator.id;
    const titleName = episode ? episode.title : found!.title;
    if (price.minor > 0) {
      appendTransaction({
        type: 'sale',
        direction: 'credit',
        amount: price,
        status: 'completed',
        description: `Sale, ${titleName}`,
        relatedTitleId: titleId,
        account: 'creator_movie',
      });

      const priceFormatted = `₦${(price.minor / 100).toLocaleString()}`;
      pushNotification({
        type: 'purchase',
        title: `Movie Rented: ${titleName}`,
        body: `Your movie "${titleName}" was rented/purchased for ${priceFormatted}. 100% (${priceFormatted}) has been credited to your Creator Movie Wallet.`,
        href: '/creator/dashboard',
      });

      console.log(`[EMAIL NOTIFICATION SENT] To: creator@cloudnet.ng - Subject: Movie Rented: ${titleName} (${priceFormatted} credited to your Creator Movie Wallet)`);
    }

    return { purchaseId: txn.id, status: 'completed', entitlement, transaction: txn };
  },

  async entitlements(): Promise<{ items: Entitlement[]; nextCursor: string | null }> {
    await delay();
    return { items: [...entitlements], nextCursor: null };
  },
};
