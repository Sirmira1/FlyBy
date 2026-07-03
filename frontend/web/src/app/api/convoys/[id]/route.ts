import { NextResponse, type NextRequest } from "next/server";
import type { ConvoyRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/convoys/:id
 *
 * Body: { action: 'add_member' | 'remove_member' | 'leave' | 'end',
 *         memberId?: string }
 */
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

  const { data: row } = await admin
    .from("convoys")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const convoy = row as ConvoyRow | null;
  if (!convoy) return apiError("Convoy not found", 404);

  const isCreator = convoy.created_by === user.id;
  const isMember = (convoy.member_ids ?? []).includes(user.id) || isCreator;
  if (!isMember) return apiError("You're not in this convoy", 403);

  const action = body.action;
  const memberId = typeof body.memberId === "string" ? body.memberId : null;
  const members = new Set(convoy.member_ids ?? []);

  switch (action) {
    case "end": {
      if (!isCreator) return apiError("Only the host can end the convoy", 403);
      const { error } = await admin
        .from("convoys")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return apiError(error.message, 500);
      return NextResponse.json({ ok: true });
    }
    case "leave": {
      if (isCreator)
        return apiError("The host can't leave; end the convoy instead", 400);
      members.delete(user.id);
      break;
    }
    case "remove_member": {
      if (!isCreator) return apiError("Only the host can remove members", 403);
      if (!memberId) return apiError("memberId is required");
      members.delete(memberId);
      break;
    }
    case "add_member": {
      if (!isCreator) return apiError("Only the host can add members", 403);
      if (!memberId) return apiError("memberId is required");
      // Must be an accepted friend of the host.
      const { data: friendship } = await admin
        .from("friends")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(requester_id.eq.${user.id},receiver_id.eq.${memberId}),` +
            `and(requester_id.eq.${memberId},receiver_id.eq.${user.id})`,
        )
        .maybeSingle();
      if (!friendship) return apiError("You can only add friends", 400);
      members.add(memberId);
      break;
    }
    default:
      return apiError("Unknown action");
  }

  const { error } = await admin
    .from("convoys")
    .update({ member_ids: Array.from(members) })
    .eq("id", id);
  if (error) return apiError(error.message, 500);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/convoys/:id — host ends and removes the convoy. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;
  const { id } = await params;

  const { data: row } = await admin
    .from("convoys")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();
  if (!row) return apiError("Convoy not found", 404);
  if (row.created_by !== user.id)
    return apiError("Only the host can delete the convoy", 403);

  const { error } = await admin.from("convoys").delete().eq("id", id);
  if (error) return apiError(error.message, 500);
  return NextResponse.json({ ok: true });
}
