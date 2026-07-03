import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripRow } from "@/core/db-types";

/**
 * Recompute a user's aggregate stats from their trips and persist them to the
 * `users` row. Keeps the profile + leaderboard honest after any trip change.
 */
export async function recalcUserStats(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data } = await admin
    .from("trips")
    .select("distance, top_speed, avg_speed")
    .eq("user_id", userId);

  const trips = (data ?? []) as Pick<
    TripRow,
    "distance" | "top_speed" | "avg_speed"
  >[];

  const tripCount = trips.length;
  const totalKm = trips.reduce((sum, t) => sum + (t.distance ?? 0), 0);
  const topSpeed = trips.reduce((max, t) => Math.max(max, t.top_speed ?? 0), 0);
  const avgSpeed =
    tripCount > 0
      ? trips.reduce((sum, t) => sum + (t.avg_speed ?? 0), 0) / tripCount
      : 0;

  await admin
    .from("users")
    .update({
      trip_count: tripCount,
      total_kilometers: Math.round(totalKm * 100) / 100,
      top_speed: Math.round(topSpeed * 100) / 100,
      avg_speed: Math.round(avgSpeed * 100) / 100,
    })
    .eq("id", userId);
}
