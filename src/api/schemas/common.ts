import { z } from 'zod';

export interface Money {
  minor: number;
  currency: 'CP' | 'USD' | 'NGN';
}

/** Money crosses the wire as integer minor units. Enforced at the boundary. */
export const moneySchema: z.ZodType<Money> = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const raw = val as Record<string, unknown>;
      const rawCurr = String(raw.currency ?? 'CP').toUpperCase();
      const validCurr = rawCurr === 'USD' ? 'USD' : rawCurr === 'NGN' ? 'NGN' : 'CP';
      return {
        ...raw,
        minor: Number(raw.minor ?? raw.amountCents ?? 0),
        currency: validCurr,
      };
    }

    return val;
  },
  z.object({
    minor: z.number().int(),
    currency: z.enum(['CP', 'USD', 'NGN']),
  })
) as unknown as z.ZodType<Money>;


export const isoDateSchema = z.string().datetime({ offset: true });

export function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export type Page<T> = { items: T[]; nextCursor: string | null };

export const emptySchema = z.undefined();
