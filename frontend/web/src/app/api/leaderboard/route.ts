import { NextResponse, type NextRequest } from "next/server";
import type { FriendRow, UserRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";

const METRICS = ["top_speed", "avg_speed", "total_kilometers", "trip_count"] as const;
type Metric = (typeof METRICS)[number];

export interface LeaderboardRow {
  rank: number;
  id: string;
  username: string;
  display_name: string | null;
  top_speed: number;
  avg_speed: number;
  total_kilometers: number;
  trip_count: number;
  is_me: boolean;
}

/**
 * GET /api/leaderboard?scope=global|friends&metric=top_speed
 *
 * Ranks users by the chosen metric using the aggregate columns on `users`.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  const params = request.nextUrl.searchParams;
  const scope = params.get("scope") === "friends" ? "friends" : "global";
  const metricParam = params.get("metric");
  const metric: Metric = METRICS.includes(metricParam as Metric)
    ? (metricParam as Metric)
    : "top_speed";

  let query = admin
    .from("users")
    .select(
      "id, username, display_name, top_speed, avg_speed, total_kilometers, trip_count",
    )
    .order(metric, { ascending: false })
    .limit(100);

  if (scope === "friends") {
    // Gather accepted friend ids (either direction) + self.
    const { data: friends } = await admin
      .from("friends")
      .select("requester_id, receiver_id, status")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const ids = new Set<string>([user.id]);
    for (const f of (friends ?? []) as FriendRow[]) {
      ids.add(f.requester_id === user.id ? f.receiver_id : f.requester_id);
    }
    query = query.in("id", Array.from(ids));
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  const rows: LeaderboardRow[] = ((data ?? []) as Partial<UserRow>[]).map(
    (u, i) => ({
      rank: i + 1,
      id: u.id!,
      username: u.username ?? "driver",
      display_name: u.display_name ?? null,
      top_speed: u.top_speed ?? 0,
      avg_speed: u.avg_speed ?? 0,
      total_kilometers: u.total_kilometers ?? 0,
      trip_count: u.trip_count ?? 0,
      is_me: u.id === user.id,
    }),
  );

  return NextResponse.json({ scope, metric, rows });
}
