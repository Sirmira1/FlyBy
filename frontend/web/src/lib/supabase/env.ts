/**
 * Supabase environment configuration.
 *
 * Centralises reading the public env vars so every client fails loudly (and
 * consistently) when the project isn't configured yet.
 */

/** The public Supabase URL + anon key, or `null` when not configured. */
export function getSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** True when the browser has everything it needs to talk to Supabase. */
export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

/** Same as {@link getSupabasePublicConfig} but throws — for code paths that
 *  cannot meaningfully continue without Supabase. */
export function requireSupabasePublicConfig(): { url: string; anonKey: string } {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/web/.env.local.",
    );
  }
  return config;
}

/** The server-only service-role key, or `null` when not configured. */
export function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}
