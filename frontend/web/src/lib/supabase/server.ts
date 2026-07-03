import "server-only";

/**
 * Server-side Supabase client bound to the request's cookies.
 *
 * Used in Server Components, route handlers, and middleware to read the logged
 * in user's session. Writes cookies back so Supabase can refresh tokens.
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireSupabasePublicConfig } from "./env";

export async function getServerSupabase(): Promise<SupabaseClient> {
  const { url, anonKey } = requireSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` is called from a Server Component where cookies are
          // read-only. Safe to ignore — middleware refreshes the session.
        }
      },
    },
  });
}
