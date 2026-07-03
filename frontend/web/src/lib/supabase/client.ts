"use client";

/**
 * Browser-side Supabase client (singleton).
 *
 * Uses the anon/publishable key and the cookie-based auth flow from
 * `@supabase/ssr`, so the session set here is readable by server components and
 * route handlers too.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublicConfig } from "./env";

let cached: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (cached) return cached;
  const { url, anonKey } = requireSupabasePublicConfig();
  cached = createBrowserClient(url, anonKey);
  return cached;
}
