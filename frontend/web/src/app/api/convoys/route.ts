import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConvoyRow, LiveLocationRow, UserRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";

export interface ConvoyMember {
  id: string;
  username: string;
  display_name: string | null;
  isCreator: boolean;
  isMe: boolean;
  live: {
    latitude: number | null;
    longitude: number | null;
    speed: number | null;
    heading: number | null;
    updated_at: string;
  } | null;
}

export interface ConvoyDetails extends ConvoyRow {
  members: ConvoyMember[];
}

/** Build the enriched member list for a convoy. */
async function enrich(
  admin: SupabaseClient,
  convoy: ConvoyRow,
  meId: string,
): Promise<ConvoyDetails> {
  const memberIds = convoy.member_ids ?? [];
  const ids = Array.from(new Set([convoy.created_by, ...memberIds]));

  const [{ data: users }, { data: locations }] = await Promise.all([
    admin.from("users").select("id, username, display_name").in("id", ids),
    admin.from("live_locations").select("*").in("user_id", ids),
  ]);

  const locByUser = new Map<string, LiveLocationRow>();
  for (const l of (locations ?? []) as LiveLocationRow[]) {
    locByUser.set(l.user_id, l);
  }

  const members: ConvoyMember[] = ((users ?? []) as Partial<UserRow>[]).map((u) => {
    const live = locByUser.get(u.id!);
    return {
      id: u.id!,
      username: u.username ?? "driver",
      display_name: u.display_name ?? null,
      isCreator: u.id === convoy.created_by,
      isMe: u.id === meId,
      live: live
        ? {
            latitude: live.latitude,
            longitude: live.longitude,
            speed: live.speed,
            heading: live.heading,
            updated_at: live.updated_at,
          }
        : null,
    };
  });

  return { ...convoy, members };
}

/** GET /api/convoys — the user's active convoy (if any). */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  const { data, error } = await admin
    .from("convoys")
    .select("*")
    .eq("is_active", true)
    .or(`created_by.eq.${user.id},member_ids.cs.{${user.id}}`)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);

  const convoys = (data ?? []) as ConvoyRow[];
  const active = convoys[0] ?? null;
  const details = active ? await enrich(admin, active, user.id) : null;

  return NextResponse.json({ convoy: details });
}

/** POST /api/convoys — start a convoy with a destination + optional members. */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body");
  }

  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 60)
      : "New convoy";

  // Members must be accepted friends of the creator.
  const requested = Array.isArray(body.member_ids)
    ? (body.member_ids as unknown[]).filter((v): v is string => typeof v === "string")
    : [];

  let memberIds = [user.id];
  if (requested.length > 0) {
    const { data: friends } = await admin
      .from("friends")
      .select("requester_id, receiver_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const friendIds = new Set<string>();
    for (const f of friends ?? []) {
      friendIds.add(
        f.requester_id === user.id ? f.receiver_id : f.requester_id,
      );
    }
    memberIds = Array.from(
      new Set([user.id, ...requested.filter((id) => friendIds.has(id))]),
    );
  }

  const lat = Number(body.destination_lat);
  const lng = Number(body.destination_lng);

  const { data, error } = await admin
    .from("convoys")
    .insert({
      created_by: user.id,
      name,
      destination_lat: Number.isFinite(lat) ? lat : null,
      destination_lng: Number.isFinite(lng) ? lng : null,
      destination_name:
        typeof body.destination_name === "string"
          ? body.destination_name.trim().slice(0, 120) || null
          : null,
      is_active: true,
      member_ids: memberIds,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);
  const details = await enrich(admin, data as ConvoyRow, user.id);
  return NextResponse.json({ convoy: details }, { status: 201 });
}
