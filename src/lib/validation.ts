/**
 * Input validation.
 *
 * These rules mirror what the server must also enforce. Client-side validation
 * is a courtesy to the user, it is never a security control, and the server
 * revalidates everything regardless.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Digits only after stripping formatting; 7-15 digits per E.164. */
export function isPhone(value: string): boolean {
  const digits = value.replace(/[\s()+-]/g, '');
  return /^\d{7,15}$/.test(digits);
}

/** Strips everything that is not a digit. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Many people type their number the way they say it: 0803... in Nigeria,
 * 07... in the UK. That leading trunk zero is not part of the international
 * number, so we drop it rather than rejecting perfectly valid input.
 */
export function stripTrunkPrefix(nationalNumber: string): string {
  const digits = digitsOnly(nationalNumber);
  return digits.startsWith('0') ? digits.slice(1) : digits;
}

/** Validates the national part against that country's numbering plan. */
export function validateNationalNumber(
  nationalNumber: string,
  country: { nsnMin: number; nsnMax: number; name: string },
): string | null {
  const digits = stripTrunkPrefix(nationalNumber);
  if (digits.length === 0) return 'Enter your phone number.';
  if (digits.length < country.nsnMin) {
    return `Too short for ${country.name}, expected ${country.nsnMin} digits.`;
  }
  if (digits.length > country.nsnMax) {
    return `Too long for ${country.name}, expected ${country.nsnMax} digits.`;
  }
  return null;
}

/** Assembles the E.164 string the API expects, e.g. +2348012345678. */
export function toE164(dial: string, nationalNumber: string): string {
  return `${dial}${stripTrunkPrefix(nationalNumber)}`;
}

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Choose a username.';
  if (trimmed.length < USERNAME_MIN) return `At least ${USERNAME_MIN} characters.`;
  if (trimmed.length > USERNAME_MAX) return `No more than ${USERNAME_MAX} characters.`;
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Letters, numbers and underscores only.';
  if (/^\d/.test(trimmed)) return 'Cannot start with a number.';
  return null;
}

export const PASSWORD_MIN = 8;

export interface PasswordCheck {
  /** 0-4. Drives the strength meter. */
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  /** Null when the password is acceptable to submit. */
  error: string | null;
  rules: { met: boolean; text: string }[];
}

export function checkPassword(value: string): PasswordCheck {
  const rules = [
    { met: value.length >= PASSWORD_MIN, text: `At least ${PASSWORD_MIN} characters` },
    { met: /[a-z]/.test(value) && /[A-Z]/.test(value), text: 'Upper and lower case' },
    { met: /\d/.test(value), text: 'A number' },
    { met: /[^A-Za-z0-9]/.test(value), text: 'A symbol' },
  ];

  const met = rules.filter((r) => r.met).length;

  // Submission bar is deliberately lower than the "strong" bar: length plus a
  // number. We encourage better without blocking people out of their own account.
  const acceptable = rules[0]!.met && rules[2]!.met;

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const;

  return {
    score: met as PasswordCheck['score'],
    label: labels[met] ?? 'Weak',
    error: acceptable
      ? null
      : value.length < PASSWORD_MIN
        ? `Use at least ${PASSWORD_MIN} characters.`
        : 'Include at least one number.',
    rules,
  };
}

export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
}
