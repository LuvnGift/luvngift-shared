/**
 * Accounts and orders are for adults only (Terms § 2, Privacy Policy § 9).
 * The API enforces it (and turns a failure into a 400); the sign-up forms use
 * the same rule to say so before submitting.
 */

export const MINIMUM_AGE = 18;
export const MAXIMUM_AGE = 120;

/** Whole years between `dateOfBirth` and `now`, counting a birthday as reached on the day. */
export function ageOn(dateOfBirth: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < dateOfBirth.getUTCMonth()
    || (now.getUTCMonth() === dateOfBirth.getUTCMonth() && now.getUTCDate() < dateOfBirth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export type DateOfBirthProblem = 'MISSING' | 'INVALID' | 'UNDERAGE';

/** Why a date of birth is refused, or null when it is an adult's. */
export function dateOfBirthProblem(raw: string | undefined | null, now: Date = new Date()): DateOfBirthProblem | null {
  if (!raw) return 'MISSING';
  const dob = new Date(raw);
  if (Number.isNaN(dob.getTime())) return 'INVALID';
  const age = ageOn(dob, now);
  if (age < 0 || age > MAXIMUM_AGE) return 'INVALID';
  return age < MINIMUM_AGE ? 'UNDERAGE' : null;
}

/** True when `raw` (YYYY-MM-DD) is a real date of someone 18 or over (and under 120). */
export function isAdultDateOfBirth(raw: string, now: Date = new Date()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) && dateOfBirthProblem(raw, now) === null;
}

/** Latest date of birth that is 18 today, as YYYY-MM-DD — for a date input's `max`. */
export function latestAdultDateOfBirth(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear() - MINIMUM_AGE, now.getUTCMonth(), now.getUTCDate()));
  return d.toISOString().slice(0, 10);
}
