import "server-only";

/**
 * Service-role Supabase client (server only, singleton).
 *
 * Bypasses Row Level Security, so it must NEVER be imported into client code.
 * Route handlers use this to read/write data after they have verified the
 * caller's identity with {@link getServerSupabase} and enforced ownership in
 * application code.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, requireSupabasePublicConfig } from "./env";

let cached: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (cached) return cached;
  const { url } = requireSupabasePublicConfig();
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to frontend/web/.env.local " +
        "(server-only, do NOT prefix with NEXT_PUBLIC_).",
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
