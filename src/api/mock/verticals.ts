import { money } from '@/lib/money';
import type { CreatorReel, Vertical, VerticalComment } from '../schemas/verticals';
import { delay, fail, id, nowIso } from './support';

/**
 * Mock verticals feed, grouped by creator.
 *
 * Video sources are Google's public sample files. They are landscape rather than
 * 9:16, so framing will look wrong until real content lands, but they stream
 * reliably which is what matters for building the player.
 */
const V = (n: string) =>
  `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${n}.mp4`;

const poster = (seed: string) => `https://picsum.photos/seed/${seed}/720/1280`;

interface Seed {
  id: string;
  caption: string;
  video: string;
  duration: number;
  priceMinor?: number;
  linkedTitleId?: string;
  linkedTitleName?: string;
}

function vertical(creatorId: string, seed: Seed): Vertical {
  return {
    id: seed.id,
    creatorId,
    videoUrl: V(seed.video),
    posterUrl: poster(seed.id),
    caption: seed.caption,
    durationSeconds: seed.duration,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    liked: false,
    saved: false,
    price: seed.priceMinor ? money(seed.priceMinor, 'CP') : null,
    unlocked: !seed.priceMinor,
    linkedTitleId: seed.linkedTitleId ?? null,
    linkedTitleName: seed.linkedTitleName ?? null,
    createdAt: '2026-07-20T10:00:00.000Z',
  };
}

export const reels: CreatorReel[] = [];

export function addVerticalToFeed(item: {
  id: string;
  caption: string;
  videoUrl?: string;
  posterUrl?: string;
  durationSeconds?: number;
  price?: Money | null;
  linkedTitleId?: string | null;
  linkedTitleName?: string | null;
}) {
  const defaultVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const defaultPoster = `https://picsum.photos/seed/${item.id}/720/1280`;

  const newVertical: Vertical = {
    id: item.id,
    creatorId: 'c_me',
    videoUrl: item.videoUrl && (item.videoUrl.startsWith('http') || item.videoUrl.startsWith('file')) ? item.videoUrl : defaultVideo,
    posterUrl: item.posterUrl ?? defaultPoster,
    caption: item.caption,
    durationSeconds: item.durationSeconds ?? 15,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    liked: false,
    saved: false,
    price: item.price ?? null,
    unlocked: !item.price,
    linkedTitleId: item.linkedTitleId ?? null,
    linkedTitleName: item.linkedTitleName ?? null,
    createdAt: new Date().toISOString(),
  };

  let myReel = reels.find((r) => r.creator.id === 'c_me');
  if (!myReel) {
    myReel = {
      creator: {
        id: 'c_me',
        handle: 'me',
        displayName: 'You',
        avatarUrl: null,
        followerCount: 0,
        following: false,
      },
      items: [],
    };
    reels.unshift(myReel);
  }
  myReel.items.unshift(newVertical);
  return newVertical;
}

const comments = new Map<string, VerticalComment[]>();

function seedComments(verticalId: string): VerticalComment[] {
  const existing = comments.get(verticalId);
  if (existing) return existing;

  const seeded: VerticalComment[] = [];
  comments.set(verticalId, seeded);
  return seeded;
}

function findVertical(verticalId: string): Vertical | undefined {
  for (const reel of reels) {
    const found = reel.items.find((v) => v.id === verticalId);
    if (found) return found;
  }
  return undefined;
}

export const mockVerticals = {
  async feed() {
    await delay();
    /**
     * Deep copy on the way out.
     *
     * The store is mutable, so returning it directly handed React the same
     * object references after every change. Follow flipped in the data and the
     * button never moved, because React was right: nothing it could see had
     * changed. A real API serialises fresh JSON on every request, so the mock
     * does the same and stops hiding this class of bug.
     */
    return {
      reels: reels.map((reel) => ({
        creator: { ...reel.creator },
        items: reel.items.map((item) => ({
          ...item,
          commentCount: comments.get(item.id)?.length ?? item.commentCount ?? 0,
        })),
      })),
      nextCursor: null,
    };
  },

  async toggleLike(verticalId: string) {
    await delay();
    const item = findVertical(verticalId);
    if (!item) {
      return { liked: true, likeCount: 1 };
    }
    item.liked = !item.liked;
    item.likeCount = Math.max(0, item.likeCount + (item.liked ? 1 : -1));
    return { liked: item.liked, likeCount: item.likeCount };
  },

  async toggleSave(verticalId: string) {
    await delay();
    const item = findVertical(verticalId);
    if (!item) {
      return { saved: true };
    }
    item.saved = !item.saved;
    return { saved: item.saved };
  },

  async toggleFollow(creatorId: string) {
    await delay();
    const cleanId = String(creatorId || '').toLowerCase();
    const reel = reels.find((r) => r.creator.id.toLowerCase() === cleanId || r.creator.handle.toLowerCase() === cleanId);
    if (!reel) {
      return { following: true, followerCount: 1 };
    }
    reel.creator.following = !reel.creator.following;
    reel.creator.followerCount += reel.creator.following ? 1 : -1;
    return { following: reel.creator.following, followerCount: reel.creator.followerCount };
  },

  async comments(verticalId: string) {
    await delay();
    return { items: comments.get(verticalId) ?? seedComments(verticalId), nextCursor: null };
  },

  async addComment(verticalId: string, body: string, parentId: string | null = null) {
    await delay();
    const item = findVertical(verticalId);
    if (body.trim().length === 0) throw fail('VALIDATION_FAILED');

    const list = comments.get(verticalId) ?? seedComments(verticalId);

    // Replying to a reply attaches to its parent instead, so threads stay one
    // level deep however people use them.
    let attachTo: string | null = null;
    if (parentId) {
      const target = list.find((c) => c.id === parentId);
      if (target) {
        attachTo = target.parentId ?? target.id;
      }
    }

    const comment: VerticalComment = {
      id: id('cm'),
      author: { handle: 'fems', displayName: 'Fems', avatarUrl: null },
      body: body.trim(),
      likeCount: 0,
      liked: false,
      parentId: attachTo,
      replyCount: 0,
      createdAt: nowIso(),
    };

    if (attachTo) {
      const parent = list.find((c) => c.id === attachTo);
      if (parent) parent.replyCount += 1;
      // Replies sit directly under the last reply to that parent.
      const lastIndex = list.map((c) => c.parentId).lastIndexOf(attachTo);
      const parentIndex = list.findIndex((c) => c.id === attachTo);
      list.splice(Math.max(lastIndex, parentIndex) + 1, 0, comment);
    } else {
      list.unshift(comment);
    }

    if (item) {
      item.commentCount += 1;
    }
    return comment;
  },

  async toggleCommentLike(verticalId: string, commentId: string) {
    await delay();
    const list = comments.get(verticalId) ?? seedComments(verticalId);
    const comment = list.find((c) => c.id === commentId);
    if (!comment) return { liked: true, likeCount: 1 };

    comment.liked = !comment.liked;
    comment.likeCount = Math.max(0, comment.likeCount + (comment.liked ? 1 : -1));
    return { liked: comment.liked, likeCount: comment.likeCount };
  },

  /** Unlocking a premium vertical goes through the wallet, same as a title. */
  async unlock(verticalId: string) {
    await delay();
    const item = findVertical(verticalId);
    if (item) {
      item.unlocked = true;
    }
    return { unlocked: true };
  },
};
