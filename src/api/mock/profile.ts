import type { AppNotification, MyProfile } from '../schemas/profile';
import type { TitleSummary } from '../schemas/catalog';
import { entitlements, mockUser, titles } from './db';
import { reels } from './verticals';
import { delay, fail, id, nowIso } from './support';

/** titleId set. Watchlist is intent to watch, separate from what you own. */
const watchlist = new Set<string>(['power', 'quietrooms']);

const notifications: AppNotification[] = [
  {
    id: id('nt'),
    type: 'upload',
    title: 'Lagos Studio posted a new vertical',
    body: 'Quiet Rooms trailer is up. Watch it before the full release.',
    read: false,
    href: '/(tabs)/verticals',
    createdAt: '2026-08-05T08:20:00.000Z',
  },
  {
    id: id('nt'),
    type: 'wallet',
    title: 'Welcome bonus added',
    body: 'We credited your wallet so you can try your first title.',
    read: false,
    href: '/wallet',
    createdAt: '2026-08-04T18:02:00.000Z',
  },
  {
    id: id('nt'),
    type: 'follow',
    title: 'Agatha Herop posted Power: The Beginning',
    body: 'A creator you follow released something new.',
    read: true,
    href: '/title/power',
    createdAt: '2026-08-03T12:44:00.000Z',
  },
  {
    id: id('nt'),
    type: 'system',
    title: 'Keep your account secure',
    body: 'Turn on two-factor authentication for withdrawals.',
    read: true,
    href: '/settings',
    createdAt: '2026-08-01T09:00:00.000Z',
  },
];

function toSummary(t: (typeof titles)[number]): TitleSummary {
  const { description: _d, category: _c, releasedAt: _r, viewCount: _v, ...rest } = t;
  return { ...rest, entitled: entitlements.some((e) => e.titleId === t.id) };
}

export const mockProfile = {
  async me(): Promise<MyProfile> {
    await delay();
    const following = reels.filter((r) => r.creator.following).length;

    return {
      user: {
        ...mockUser,
        bio: 'Watching everything, backing the people who make it.',
        joinedAt: mockUser.createdAt,
      },
      stats: {
        purchases: entitlements.length,
        watchlist: watchlist.size,
        following,
        followers: 128,
        // Derived from what the user owns, so the number moves with real activity
        // rather than being a decorative constant.
        hoursWatched:
          Math.round(
            (entitlements.reduce((total, e) => {
              const title = titles.find((t) => t.id === e.titleId);
              return total + (title?.durationSeconds ?? 0);
            }, 0) /
              3600) *
              10,
          ) / 10,
      },
    };
  },

  async updateProfile(displayName: string, bio: string, avatarUrl?: string | null) {
    await delay();
    if (displayName.trim().length < 2) throw fail('VALIDATION_FAILED');
    mockUser.displayName = displayName.trim();
    if (avatarUrl !== undefined) {
      mockUser.avatarUrl = avatarUrl;
    }
    return { ...mockUser, bio: bio.trim(), joinedAt: mockUser.createdAt };
  },

  async watchlist() {
    await delay();
    const items = titles.filter((t) => watchlist.has(t.id)).map(toSummary);
    return { items, nextCursor: null };
  },

  async toggleWatchlist(titleId: string) {
    await delay();
    if (!titles.some((t) => t.id === titleId)) throw fail('NOT_FOUND');
    const saved = watchlist.has(titleId);
    if (saved) watchlist.delete(titleId);
    else watchlist.add(titleId);
    return { saved: !saved };
  },

  async isWatchlisted(titleId: string) {
    return { saved: watchlist.has(titleId) };
  },

  async notifications() {
    await delay();
    return { items: [...notifications], nextCursor: null };
  },

  async markRead(notificationId: string) {
    await delay();
    const found = notifications.find((n) => n.id === notificationId);
    if (!found) throw fail('NOT_FOUND');
    found.read = true;
    return { read: true };
  },

  async markAllRead() {
    await delay();
    notifications.forEach((n) => {
      n.read = true;
    });
    return { read: true };
  },

  async pushNotification(title: string, body: string) {
    notifications.unshift({
      id: id('nt'),
      type: 'system',
      title,
      body,
      read: false,
      href: null,
      createdAt: nowIso(),
    });
  },
};

export function pushNotification(params: {
  type: AppNotification['type'];
  title: string;
  body: string;
  href?: string | null;
}) {
  notifications.unshift({
    id: id('nt'),
    type: params.type,
    title: params.title,
    body: params.body,
    read: false,
    href: params.href ?? null,
    createdAt: nowIso(),
  });
}

// ---- title comments and ratings ----

interface TitleComment {
  id: string;
  author: string;
  body: string;
  rating: number | null;
  likeCount: number;
  createdAt: string;
}

const titleComments = new Map<string, TitleComment[]>();
const myRatings = new Map<string, number>();

function seedTitleComments(titleId: string): TitleComment[] {
  const seeded: TitleComment[] = [
    { id: id('tc'), author: 'Tolu A.', body: 'Worth every naira. The last twenty minutes are something else.', rating: 5, likeCount: 42, createdAt: '2026-07-30T19:00:00.000Z' },
    { id: id('tc'), author: 'Ngozi', body: 'Slow start but it earns it.', rating: 4, likeCount: 18, createdAt: '2026-08-01T08:30:00.000Z' },
  ];
  titleComments.set(titleId, seeded);
  return seeded;
}

export const mockTitleSocial = {
  async comments(titleId: string) {
    await delay();
    const items = titleComments.get(titleId) ?? seedTitleComments(titleId);

    const rated = items.filter((c) => c.rating !== null);
    const average =
      rated.length > 0
        ? Math.round((rated.reduce((sum, c) => sum + (c.rating ?? 0), 0) / rated.length) * 10) / 10
        : null;

    return { items, average, ratingCount: rated.length, myRating: myRatings.get(titleId) ?? null };
  },

  async addComment(titleId: string, body: string, rating: number | null) {
    await delay();
    if (body.trim().length === 0) throw fail('VALIDATION_FAILED');
    if (rating !== null && (rating < 1 || rating > 5)) throw fail('VALIDATION_FAILED');

    const list = titleComments.get(titleId) ?? seedTitleComments(titleId);
    const comment: TitleComment = {
      id: id('tc'),
      author: 'Fems',
      body: body.trim(),
      rating,
      likeCount: 0,
      createdAt: nowIso(),
    };
    list.unshift(comment);
    if (rating !== null) myRatings.set(titleId, rating);
    return comment;
  },

  async rate(titleId: string, rating: number) {
    await delay();
    if (rating < 1 || rating > 5) throw fail('VALIDATION_FAILED');
    // Rating again replaces the old score rather than stacking a second vote.
    myRatings.set(titleId, rating);
    return { titleId, rating };
  },
};
