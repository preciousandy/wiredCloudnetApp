import { money, type Money } from '@/lib/money';
import { clearanceDate, hasCleared } from '@/lib/earnings';
import type { Session, User } from '../schemas/auth';
import type { TitleDetail } from '../schemas/catalog';
import type { Entitlement, LedgerAccount, Transaction } from '../schemas/wallet';
import { id, nowIso, reference } from './support';

/**
 * In-memory mock backend state.
 *
 * The wallet here is modelled as an append-only ledger with a derived balance,
 * deliberately mirroring how the real backend must work. Building the frontend
 * against a toy mutable-balance mock would hide exactly the bugs we care about.
 */

export const mockUser: User = {
  id: 'u_1',
  username: 'fems',
  displayName: 'Fems',
  avatarUrl: null,
  roles: ['viewer', 'creator'],
  isCreator: true,
  createdAt: '2026-01-12T09:00:00.000Z',
};

export const mockSession: Session = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  user: mockUser,
};

/**
 * Mock artwork. Seeded so each title keeps the same image between reloads,
 * which matters when you are eyeballing layout changes. Real posters arrive
 * with the catalogue.
 */
const poster = (seed: string) => `https://picsum.photos/seed/${seed}/400/600`;
const backdrop = (seed: string) => `https://picsum.photos/seed/${seed}/1280/720`;

interface Seed {
  id: string;
  title: string;
  kind: TitleDetail['kind'];
  durationSeconds: number;
  category: string;
  priceMinor: number | null;
  creator?: string;
  rating?: TitleDetail['rating'];
  badge?: string;
}

const CREATORS: Record<string, { id: string; handle: string; displayName: string }> = {
  cloudnet: { id: 'c_1', handle: 'cloudnet', displayName: 'CloudNet Originals' },
  jeremiah: { id: 'c_2', handle: 'jeremiahunom', displayName: 'Jeremiah Unom' },
  agatha: { id: 'c_3', handle: 'agathaherop', displayName: 'Agatha Herop' },
  studio: { id: 'c_4', handle: 'lagosstudio', displayName: 'Lagos Studio' },
};

function build(seed: Seed): TitleDetail {
  const creator = CREATORS[seed.creator ?? 'cloudnet'] ?? CREATORS.cloudnet!;
  return {
    id: seed.id,
    title: seed.title,
    kind: seed.kind,
    posterUrl: poster(seed.id),
    backdropUrl: backdrop(seed.id),
    durationSeconds: seed.durationSeconds,
    rating: seed.rating ?? 'all',
    access:
      seed.priceMinor === null
        ? { type: 'free', price: null }
        : { type: 'purchase', price: money(seed.priceMinor, 'CP') },
    entitled: false,
    badge: seed.badge ?? null,
    creator: { ...creator, avatarUrl: null },
    description:
      'Placeholder synopsis. Real descriptions arrive with the catalogue import.',
    category: seed.category,
    releasedAt: '2026-05-01',
    viewCount: 40_000 + seed.id.length * 9_133,
  };
}

export const titles: TitleDetail[] = [
  build({ id: 'parakram', title: 'Parakram', kind: 'movie', durationSeconds: 5400, category: 'Action', priceMinor: 500, badge: 'Featured', rating: '13+' }),
  build({ id: 'rift', title: 'Rift', kind: 'movie', durationSeconds: 14400, category: 'Drama', priceMinor: 300, creator: 'jeremiah' }),
  build({ id: 'power', title: 'Power: The Beginning', kind: 'movie', durationSeconds: 12300, category: 'Drama', priceMinor: 400, creator: 'agatha', badge: 'New' }),
  build({ id: 'lagosnights', title: 'Lagos Nights', kind: 'series', durationSeconds: 2700, category: 'Series', priceMinor: 200, creator: 'studio' }),
  build({ id: 'behindlens', title: 'Behind the Lens', kind: 'short', durationSeconds: 480, category: 'Documentary', priceMinor: null }),
  build({ id: 'streetsound', title: 'Street Sound Vol. 3', kind: 'music', durationSeconds: 240, category: 'Music', priceMinor: 50 }),
  build({ id: 'harmattan', title: 'Harmattan', kind: 'movie', durationSeconds: 6600, category: 'Drama', priceMinor: 350, creator: 'jeremiah' }),
  build({ id: 'thelastbus', title: 'The Last Bus', kind: 'movie', durationSeconds: 5100, category: 'Thriller', priceMinor: 250, rating: '18+' }),
  build({ id: 'marketday', title: 'Market Day', kind: 'short', durationSeconds: 720, category: 'Comedy', priceMinor: 40 }),
  build({ id: 'owambe', title: 'Owambe', kind: 'live', durationSeconds: 9000, category: 'Live', priceMinor: 200, badge: 'Live' }),
  build({ id: 'quietrooms', title: 'Quiet Rooms', kind: 'series', durationSeconds: 3300, category: 'Series', priceMinor: 150, creator: 'studio' }),
  build({ id: 'sunsetlagos', title: 'Sunset Over Lagos', kind: 'movie', durationSeconds: 7200, category: 'Romance', priceMinor: 300, creator: 'agatha' }),
];

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'movies', label: 'Movies' },
  { id: 'series', label: 'Series' },
  { id: 'live', label: 'Live' },
  { id: 'music', label: 'Music' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'documentary', label: 'Documentary' },
];

/** titleId -> seconds watched. Drives the Continue watching row. */
export const watchProgress = new Map<string, number>([
  ['rift', 4200],
  ['harmattan', 1500],
  // An episode id, not the series. Resuming a series means resuming the exact
  // episode you stopped on.
  ['lagosnights-s1e1', 900],
]);

export const ledger: Transaction[] = [];
export const entitlements: Entitlement[] = [];
/** idempotencyKey -> purchaseId, so a retry returns the original result. */
export const idempotencyLog = new Map<string, string>();

export const walletId = 'w_88213';
export const creatorWalletId = 'cw_movie_99214';

/**
 * Which movements are allowed to land in which account.
 *
 * This table is the closed loop. It is written out in full rather than inferred
 * so that adding a transaction type forces a decision about which side of the
 * wall it belongs on, instead of quietly defaulting to the withdrawable one.
 */
const ACCOUNT_FOR: Record<Transaction['type'], LedgerAccount> = {
  deposit: 'spendable',
  purchase: 'spendable',
  refund: 'spendable',
  cashback: 'spendable',
  bonus: 'spendable',
  referral: 'spendable',
  sale: 'creator_movie',
  withdrawal: 'earnings',
};

function completedIn(account: LedgerAccount): Transaction[] {
  return ledger.filter((t) => t.status === 'completed' && t.account === account);
}

function sum(entries: Transaction[]): Money {
  return entries.reduce<Money>(
    (acc, t) => money(acc.minor + (t.direction === 'credit' ? t.amount.minor : -t.amount.minor), 'CP'),
    money(0, 'CP'),
  );
}

/**
 * Deposited credit. Spendable on CloudNet, never withdrawable.
 *
 * Balance is DERIVED from the ledger. Never stored, never mutated directly.
 */
export function currentBalance(): Money {
  return sum(completedIn('spendable'));
}

/**
 * Derived balances for the Creator's New Movie Wallet.
 * 100% of user purchases/rentals land in grossBalance.
 * On withdrawal: 70% goes to the user, 30% goes to the platform.
 */
export function creatorWalletBalance(now: Date = new Date()): {
  walletId: string;
  grossBalance: Money;
  availableToWithdraw: Money;
  userShareAvailable: Money;
  platformCutTotal: Money;
  pending: Money;
} {
  const entries = ledger.filter(
    (t) => t.status === 'completed' && (t.account === 'creator_movie' || t.account === 'earnings'),
  );
  let gross = 0;
  let available = 0;
  let pending = 0;

  for (const t of entries) {
    const signed = t.direction === 'credit' ? t.amount.minor : -t.amount.minor;
    gross += signed;
    if (t.direction === 'debit' || hasCleared(t.clearsAt, now)) {
      available += signed;
    } else {
      pending += signed;
    }
  }

  const grossAvailable = Math.max(available, 0);
  const platformCut = Math.round(grossAvailable * 0.3);
  const userShare = grossAvailable - platformCut;

  return {
    walletId: creatorWalletId,
    grossBalance: money(Math.max(gross, 0), 'CP'),
    availableToWithdraw: money(grossAvailable, 'CP'),
    userShareAvailable: money(userShare, 'CP'),
    platformCutTotal: money(platformCut, 'CP'),
    pending: money(Math.max(pending, 0), 'CP'),
  };
}

/**
 * Earned money, split by whether it has cleared.
 */
export function earningsBalance(now: Date = new Date()): {
  available: Money;
  pending: Money;
  total: Money;
} {
  const cw = creatorWalletBalance(now);
  return {
    available: cw.userShareAvailable,
    pending: cw.pending,
    total: cw.grossBalance,
  };
}

export function appendTransaction(params: {
  type: Transaction['type'];
  direction: Transaction['direction'];
  amount: Money;
  status: Transaction['status'];
  description: string;
  relatedTitleId?: string | null;
  account?: LedgerAccount;
  /** Only meaningful for earnings credits. Ignored everywhere else. */
  clearsAt?: string | null;
}): Transaction {
  // The account is decided by the params or type mapping.
  const account = params.account ?? ACCOUNT_FOR[params.type];

  const entry: Transaction = {
    id: id('txn'),
    reference: reference(),
    type: params.type,
    direction: params.direction,
    amount: params.amount,
    status: params.status,
    account,
    clearsAt:
      (account === 'earnings' || account === 'creator_movie') && params.direction === 'credit'
        ? (params.clearsAt ?? clearanceDate())
        : null,
    description: params.description,
    relatedTitleId: params.relatedTitleId ?? null,
    createdAt: nowIso(),
    balanceAfter: money(0, 'CP'),
  };

  ledger.unshift(entry);
  const settled =
    account === 'earnings' || account === 'creator_movie'
      ? creatorWalletBalance().grossBalance
      : currentBalance();
  const withBalance: Transaction = { ...entry, balanceAfter: settled };
  ledger[0] = withBalance;
  return withBalance;
}

export function isEntitled(titleId: string): boolean {
  return entitlements.some(
    (e) => e.titleId === titleId && (e.expiresAt === null || new Date(e.expiresAt) > new Date()),
  );
}

/** Seed a welcome bonus so the wallet screen has something to show. */
export function seed(): void {
  if (ledger.length > 0) return;
  appendTransaction({
    type: 'bonus',
    direction: 'credit',
    amount: money(2000, 'CP'),
    status: 'completed',
    description: 'Welcome bonus (2,000 CP)',
  });
}

/**
 * Flip a pending entry to completed and recompute the running balance.
 *
 * Note what this does NOT do: mutate a stored balance. The balance is derived
 * from completed entries, so settling one entry is enough. The real backend
 * must work the same way, which is why the mock refuses to take the shortcut.
 */
export function settleTransaction(transactionId: string): void {
  const index = ledger.findIndex((t) => t.id === transactionId);
  if (index === -1) return;

  const entry = ledger[index];
  if (!entry || entry.status !== 'pending') return;

  ledger[index] = { ...entry, status: 'completed' };

  // Ledger is newest-first, so recompute balanceAfter from the oldest forward,
  // and separately per account so the two running totals never contaminate
  // each other.
  const running: Record<LedgerAccount, number> = { spendable: 0, earnings: 0 };
  for (let i = ledger.length - 1; i >= 0; i -= 1) {
    const row = ledger[i]!;
    if (row.status === 'completed') {
      running[row.account] += row.direction === 'credit' ? row.amount.minor : -row.amount.minor;
    }
    ledger[i] = { ...row, balanceAfter: money(running[row.account], 'CP') };
  }
}
