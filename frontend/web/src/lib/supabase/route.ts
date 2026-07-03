import "server-only";

/**
 * Helpers for authenticated Next.js route handlers.
 *
 * The pattern: verify the caller's session with the cookie-bound server client
 * (`getServerSupabase`), then perform DB work with the service-role client
 * (`getAdminSupabase`). Ownership is always enforced in application code by
 * filtering on the authenticated `user.id`.
 */
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAdminSupabase } from "./admin";
import { getServerSupabase } from "./server";

export interface AuthedContext {
  user: User;
  admin: SupabaseClient;
}

/**
 * Resolve the authenticated user for a route handler. Returns either the
 * context (user + admin client) or a ready-to-return 401 response.
 */
export async function requireUser(): Promise<
  { ok: true; ctx: AuthedContext } | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  return { ok: true, ctx: { user, admin: getAdminSupabase() } };
}

/** Consistent JSON error helper. */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
