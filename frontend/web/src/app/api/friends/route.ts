import { NextResponse, type NextRequest } from "next/server";
import type { FriendRow, UserRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";

/** A friend/request enriched with the *other* person's public profile. */
export interface FriendEntry {
  friendshipId: string;
  status: FriendRow["status"];
  user: Pick<
    UserRow,
    "id" | "username" | "display_name" | "top_speed" | "total_kilometers"
  >;
}

export interface FriendsResponse {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
}

/** GET /api/friends — accepted friends + incoming/outgoing pending requests. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  const { data: edges, error } = await admin
    .from("friends")
    .select("*")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);

  const rows = (edges ?? []) as FriendRow[];

  // Collect the "other" user id for each edge and fetch their profiles once.
  const otherIds = new Set<string>();
  for (const e of rows) {
    otherIds.add(e.requester_id === user.id ? e.receiver_id : e.requester_id);
  }

  const profileById = new Map<string, FriendEntry["user"]>();
  if (otherIds.size > 0) {
    const { data: users } = await admin
      .from("users")
      .select("id, username, display_name, top_speed, total_kilometers")
      .in("id", Array.from(otherIds));
    for (const u of (users ?? []) as FriendEntry["user"][]) {
      profileById.set(u.id, u);
    }
  }

  const friends: FriendEntry[] = [];
  const incoming: FriendEntry[] = [];
  const outgoing: FriendEntry[] = [];

  for (const e of rows) {
    const otherId = e.requester_id === user.id ? e.receiver_id : e.requester_id;
    const profile = profileById.get(otherId);
    if (!profile) continue;
    const entry: FriendEntry = {
      friendshipId: e.id,
      status: e.status,
      user: profile,
    };
    if (e.status === "accepted") friends.push(entry);
    else if (e.status === "pending") {
      if (e.receiver_id === user.id) incoming.push(entry);
      else outgoing.push(entry);
    }
  }

  const body: FriendsResponse = { friends, incoming, outgoing };
  return NextResponse.json(body);
}

/** POST /api/friends — send a friend request by username. */
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

  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  if (!username) return apiError("A username is required");

  const { data: target } = await admin
    .from("users")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!target) return apiError("No user with that username", 404);
  if (target.id === user.id) return apiError("You can't add yourself");

  // Any existing edge between the two (either direction)?
  const { data: existing } = await admin
    .from("friends")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},receiver_id.eq.${target.id}),` +
        `and(requester_id.eq.${target.id},receiver_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted")
      return apiError("You're already friends", 409);
    return apiError("There's already a pending request", 409);
  }

  const { data, error } = await admin
    .from("friends")
    .insert({
      requester_id: user.id,
      receiver_id: target.id,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ friendship: data }, { status: 201 });
}
