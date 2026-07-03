import "server-only";

/** Shared validation for auth + profile fields. Pure, framework-free. */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const USERNAME_RE = /^[a-z0-9_]+$/;

/** Normalise + validate a username. Returns the cleaned value or an error. */
export function normalizeUsername(
  raw: unknown,
): { value: string } | { error: string } {
  if (typeof raw !== "string") return { error: "Username is required" };
  const value = raw.trim().toLowerCase();
  if (value.length < USERNAME_MIN)
    return { error: `Username must be at least ${USERNAME_MIN} characters` };
  if (value.length > USERNAME_MAX)
    return { error: `Username must be at most ${USERNAME_MAX} characters` };
  if (!USERNAME_RE.test(value))
    return { error: "Username may only contain lowercase letters, numbers, and _" };
  return { value };
}

export function validateEmail(raw: unknown): { value: string } | { error: string } {
  if (typeof raw !== "string" || !raw.trim()) return { error: "Email is required" };
  const value = raw.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: "Enter a valid email" };
  return { value };
}

export function validatePassword(raw: unknown): { value: string } | { error: string } {
  if (typeof raw !== "string" || raw.length < 8)
    return { error: "Password must be at least 8 characters" };
  return { value: raw };
}
