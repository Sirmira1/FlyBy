import { NextResponse } from "next/server";
import type {
  CityProgressRow,
  FriendRow,
  TripRow,
  VehicleRow,
} from "@/core/db-types";
import { requireUser } from "@/lib/supabase/route";

export interface ProfileCity {
  id: string;
  name: string | null;
  country_code: string | null;
  explored_count: number;
  total_count: number;
  percentage: number;
}

export interface ProfileTrip {
  id: string;
  distance: number | null;
  top_speed: number | null;
  avg_speed: number | null;
  duration_sec: number | null;
  started_at: string | null;
  is_convoy: boolean;
}

export interface ProfileFriendChip {
  username: string;
  initials: string;
}

export interface ProfileSummary {
  rank: number | null;
  activeVehicle: { label: string; fuel_type: string | null } | null;
  cities: ProfileCity[];
  recentTrips: ProfileTrip[];
  friends: { count: number; preview: ProfileFriendChip[] };
}

/** GET /api/profile/summary — dashboard extras for the profile page. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  // Explored cities, best progress first.
  const { data: cityRows } = await admin
    .from("city_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("percentage", { ascending: false });
  const cities: ProfileCity[] = ((cityRows ?? []) as CityProgressRow[]).map(
    (c) => ({
      id: c.city_id,
      name: c.city_name,
      country_code: c.country_code,
      explored_count: c.explored_count ?? 0,
      total_count: c.total_count ?? 0,
      percentage: c.percentage ?? 0,
    }),
  );

  // Global rank by top speed (1 + number of users strictly faster).
  const { data: me } = await admin
    .from("users")
    .select("top_speed")
    .eq("id", user.id)
    .single();
  const myTop = (me as { top_speed: number } | null)?.top_speed ?? 0;
  let rank: number | null = null;
  if (myTop > 0) {
    const { count } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .gt("top_speed", myTop);
    rank = (count ?? 0) + 1;
  }

  // Active vehicle (or most recent), for the "driving" line.
  const { data: vehicles } = await admin
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  const v = (vehicles ?? [])[0] as VehicleRow | undefined;
  const activeVehicle = v
    ? {
        label:
          v.nickname ||
          [v.year, v.make, v.model].filter(Boolean).join(" ") ||
          "Vehicle",
        fuel_type: v.fuel_type,
      }
    : null;

  // Last few trips.
  const { data: tripRows } = await admin
    .from("trips")
    .select(
      "id, distance, top_speed, avg_speed, duration_sec, started_at, is_convoy, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);
  const recentTrips: ProfileTrip[] = ((tripRows ?? []) as TripRow[]).map(
    (t) => ({
      id: t.id,
      distance: t.distance,
      top_speed: t.top_speed,
      avg_speed: t.avg_speed,
      duration_sec: t.duration_sec,
      started_at: t.started_at,
      is_convoy: t.is_convoy,
    }),
  );

  // Friend chips + total accepted count.
  const { data: friendRows } = await admin
    .from("friends")
    .select("requester_id, receiver_id, status")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
  const friendIds = ((friendRows ?? []) as FriendRow[]).map((f) =>
    f.requester_id === user.id ? f.receiver_id : f.requester_id,
  );
  let preview: ProfileFriendChip[] = [];
  if (friendIds.length > 0) {
    const { data: friendUsers } = await admin
      .from("users")
      .select("username, display_name")
      .in("id", friendIds.slice(0, 6));
    preview = ((friendUsers ?? []) as { username: string; display_name: string | null }[]).map(
      (u) => ({
        username: u.username,
        initials: (u.display_name || u.username).slice(0, 2).toUpperCase(),
      }),
    );
  }

  const summary: ProfileSummary = {
    rank,
    activeVehicle,
    cities,
    recentTrips,
    friends: { count: friendIds.length, preview },
  };
  return NextResponse.json(summary);
}
