import { NextResponse, type NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/vehicles/:id — update a vehicle (e.g. set it active). */
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

  // Confirm ownership before any write.
  const { data: owned } = await admin
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return apiError("Vehicle not found", 404);

  const patch: Record<string, unknown> = {};
  const strFields = ["nickname", "make", "model", "fuel_type"] as const;
  for (const f of strFields) {
    if (f in body) {
      const v = body[f];
      patch[f] = typeof v === "string" && v.trim() ? v.trim() : null;
    }
  }
  const numFields = ["year", "horsepower", "zero_to_sixty", "top_speed"] as const;
  for (const f of numFields) {
    if (f in body) {
      const n = Number(body[f]);
      patch[f] = Number.isFinite(n) ? n : null;
    }
  }

  if (body.is_active === true) {
    await admin.from("vehicles").update({ is_active: false }).eq("user_id", user.id);
    patch.is_active = true;
  } else if (body.is_active === false) {
    patch.is_active = false;
  }

  if (Object.keys(patch).length === 0) return apiError("No fields to update");

  const { data, error } = await admin
    .from("vehicles")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ vehicle: data });
}

/** DELETE /api/vehicles/:id — remove a vehicle and its mods. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;
  const { id } = await params;

  const { data: owned } = await admin
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return apiError("Vehicle not found", 404);

  await admin.from("mods").delete().eq("vehicle_id", id).eq("user_id", user.id);
  const { error } = await admin
    .from("vehicles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ ok: true });
}
