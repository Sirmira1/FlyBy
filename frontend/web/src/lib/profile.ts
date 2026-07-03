import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { UserRow } from "@/core/db-types";

/**
 * Ensure the authenticated user has a public `users` profile row, creating a
 * sensible default if one is missing (e.g. legacy auth users). Returns the row.
 */
export async function ensureProfile(
  admin: SupabaseClient,
  user: User,
): Promise<UserRow> {
  const { data: existing } = await admin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as UserRow;

  const fallbackUsername =
    (user.user_metadata?.username as string | undefined) ??
    `driver_${user.id.slice(0, 8)}`;

  const { data: created, error } = await admin
    .from("users")
    .insert({ id: user.id, username: fallbackUsername })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create profile");
  }
  return created as UserRow;
}
