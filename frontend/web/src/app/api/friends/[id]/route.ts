import { NextResponse, type NextRequest } from "next/server";
import type { FriendRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/friends/:id — accept or decline an incoming request. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body");
  }

  const action = body.action;
  if (action !== "accept" && action !== "decline") {
    return apiError("action must be 'accept' or 'decline'");
  }

  const { data: edge } = await admin
    .from("friends")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const friendship = edge as FriendRow | null;
  if (!friendship) return apiError("Request not found", 404);

  // Only the receiver of a pending request may accept/decline it.
  if (friendship.receiver_id !== user.id || friendship.status !== "pending") {
    return apiError("You can't respond to this request", 403);
  }

  if (action === "decline") {
    await admin.from("friends").delete().eq("id", id);
    return NextResponse.json({ ok: true, status: "declined" });
  }

  const { data, error } = await admin
    .from("friends")
    .update({ status: "accepted" })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ friendship: data });
}

/** DELETE /api/friends/:id — remove a friendship or cancel a request. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;
  const { id } = await params;

  const { data: edge } = await admin
    .from("friends")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const friendship = edge as FriendRow | null;
  if (!friendship) return apiError("Not found", 404);

  // Either party can remove the edge.
  if (
    friendship.requester_id !== user.id &&
    friendship.receiver_id !== user.id
  ) {
    return apiError("Not allowed", 403);
  }

  const { error } = await admin.from("friends").delete().eq("id", id);
  if (error) return apiError(error.message, 500);
  return NextResponse.json({ ok: true });
}
