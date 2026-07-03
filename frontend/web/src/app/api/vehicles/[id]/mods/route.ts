import { NextResponse, type NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/vehicles/:id/mods — add a modification to a vehicle. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;
  const { id: vehicleId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body");
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!name) return apiError("A mod name is required");

  // Confirm the vehicle belongs to the user.
  const { data: owned } = await admin
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return apiError("Vehicle not found", 404);

  const powerGain = Number(body.power_gain);

  const { data, error } = await admin
    .from("mods")
    .insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      name,
      detail:
        typeof body.detail === "string" && body.detail.trim()
          ? body.detail.trim().slice(0, 200)
          : null,
      power_gain: Number.isFinite(powerGain) ? powerGain : null,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ mod: data }, { status: 201 });
}
