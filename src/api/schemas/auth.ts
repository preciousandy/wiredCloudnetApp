import { z } from 'zod';

export const userPreprocess = (val: unknown) => {
  if (val && typeof val === 'object') {
    const raw = val as Record<string, unknown>;
    const displayName = raw.displayName ?? raw.name ?? raw.first_name ?? raw.username ?? 'User';
    const avatarUrl = raw.avatarUrl !== undefined ? raw.avatarUrl : raw.avatar ?? null;
    const isCreator = Boolean(raw.isCreator ?? raw.is_creator ?? false);
    const createdAt = raw.createdAt ?? raw.created_at ?? new Date().toISOString();
    const id = raw.id !== undefined ? String(raw.id) : `u_${Date.now()}`;
    const roles = Array.isArray(raw.roles) && raw.roles.length > 0 ? raw.roles : ['viewer'];
    const email = raw.email ?? undefined;
    const phoneNumber = raw.phoneNumber ?? raw.phone_number ?? undefined;
    const bio = raw.bio ?? null;
    const joinedAt = raw.joinedAt ?? raw.created_at ?? createdAt;

    return {
      ...raw,
      id,
      username: String(raw.username ?? 'user'),
      displayName: String(displayName),
      avatarUrl: avatarUrl ? String(avatarUrl) : null,
      roles,
      isCreator,
      createdAt: String(createdAt),
      email: email ? String(email) : undefined,
      phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
      bio: bio ? String(bio) : null,
      joinedAt: String(joinedAt),
    };
  }
  return val;
};

export const baseUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().nullable(),
  roles: z.array(z.enum(['viewer', 'creator', 'moderator', 'admin'])).default(['viewer']),
  isCreator: z.boolean().default(false),
  createdAt: z.string(),
});

export const userSchema = z.preprocess(
  userPreprocess,
  baseUserSchema
) as unknown as z.ZodType<User>;

export const baseSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(),
  user: baseUserSchema,
});

export const sessionPreprocess = (val: unknown) => {
  if (val && typeof val === 'object') {
    const raw = val as Record<string, unknown>;
    const token = String(raw.accessToken ?? raw.token ?? '');
    const refreshToken = String(raw.refreshToken ?? token);
    const expiresAt = String(raw.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
    const rawUser = raw.user ?? raw;

    return {
      ...raw,
      accessToken: token,
      refreshToken,
      expiresAt,
      user: userPreprocess(rawUser),
    };
  }
  return val;
};

export const sessionSchema = z.preprocess(
  sessionPreprocess,
  baseSessionSchema
) as unknown as z.ZodType<Session>;

export interface Challenge {
  challengeId: string;
  expiresAt: string;
}

export interface Verification {
  verificationToken: string;
}

export const challengeSchema = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const raw = val as Record<string, unknown>;
      return {
        ...raw,
        challengeId: String(raw.challengeId ?? raw.email ?? raw.identity ?? `ch_${Date.now()}`),
        expiresAt: String(raw.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000).toISOString()),
      };
    }
    return val;
  },
  z.object({
    challengeId: z.string(),
    expiresAt: z.string(),
  })
) as unknown as z.ZodType<Challenge>;

export const verificationSchema = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const raw = val as Record<string, unknown>;
      return {
        ...raw,
        verificationToken: String(raw.verificationToken ?? raw.token ?? `vt_${Date.now()}`),
      };
    }
    return val;
  },
  z.object({
    verificationToken: z.string(),
  })
) as unknown as z.ZodType<Verification>;


export type User = z.infer<typeof baseUserSchema>;
export type Session = z.infer<typeof baseSessionSchema>;




