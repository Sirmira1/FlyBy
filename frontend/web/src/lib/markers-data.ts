import "server-only";

/**
 * Builds the real map marker set from live Supabase data — replacing the old
 * mock seed. Sources:
 *   • crew   → `live_locations` of the user's friends + convoy members
 *   • landmark → active convoy destinations
 *
 * Pure data assembly on top of the admin client; the map UI is unchanged.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConvoyRow, FriendRow, LiveLocationRow } from "@/core/db-types";
import { kmToMiles } from "@/core/units";
import type { AnyMarker, CrewMarker, MapMarker } from "@/core/types";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** A crew member is "online" if their location updated within this window. */
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Collect the set of user ids whose live location the caller may see. */
async function visibleCrewIds(
  admin: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const ids = new Set<string>();

  const { data: friends } = await admin
    .from("friends")
    .select("requester_id, receiver_id, status")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
  for (const f of (friends ?? []) as FriendRow[]) {
    ids.add(f.requester_id === userId ? f.receiver_id : f.requester_id);
  }

  const { data: convoys } = await admin
    .from("convoys")
    .select("member_ids, created_by")
    .eq("is_active", true)
    .or(`created_by.eq.${userId},member_ids.cs.{${userId}}`);
  for (const c of (convoys ?? []) as Pick<ConvoyRow, "member_ids" | "created_by">[]) {
    ids.add(c.created_by);
    for (const m of c.member_ids ?? []) ids.add(m);
  }

  // Never show yourself as crew — the map already renders your own dot.
  ids.delete(userId);
  return ids;
}

/** Build the live marker set for a given user. */
export async function buildLiveMarkers(
  admin: SupabaseClient,
  userId: string,
): Promise<AnyMarker[]> {
  const markers: AnyMarker[] = [];

  // --- Crew (live_locations) ---
  const crewIds = await visibleCrewIds(admin, userId);
  if (crewIds.size > 0) {
    const { data: locations } = await admin
      .from("live_locations")
      .select("*")
      .in("user_id", Array.from(crewIds));

    for (const loc of (locations ?? []) as LiveLocationRow[]) {
      if (loc.latitude == null || loc.longitude == null) continue;
      const name = loc.username ?? "Driver";
      const online =
        Date.now() - new Date(loc.updated_at).getTime() < ONLINE_WINDOW_MS;
      const crew: CrewMarker = {
        id: `crew-${loc.user_id}`,
        name,
        category: "crew",
        position: { lng: loc.longitude, lat: loc.latitude },
        // live_locations stores km/h; the map speaks mph.
        speedMph: Math.round(kmToMiles(loc.speed ?? 0)),
        heading: Math.round(loc.heading ?? 0),
        initials: initialsFor(name),
        online,
        address: online ? "Live now" : "Last seen",
      };
      markers.push(crew);
    }
  }

  // --- Convoy destinations (landmark pins) ---
  const { data: convoys } = await admin
    .from("convoys")
    .select("*")
    .eq("is_active", true)
    .or(`created_by.eq.${userId},member_ids.cs.{${userId}}`);

  for (const c of (convoys ?? []) as ConvoyRow[]) {
    if (c.destination_lat == null || c.destination_lng == null) continue;
    const spot: MapMarker = {
      id: `convoy-dest-${c.id}`,
      name: c.destination_name || c.name || "Convoy destination",
      category: "landmark",
      position: { lng: c.destination_lng, lat: c.destination_lat },
      description: `Destination for ${c.name || "your convoy"}.`,
    };
    markers.push(spot);
  }

  return markers;
}

/**
 * Resolve markers for the currently authenticated user (for Server Components).
 * Returns an empty list when there is no session.
 */
export async function getMarkersForCurrentUser(): Promise<AnyMarker[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return buildLiveMarkers(getAdminSupabase(), user.id);
}
