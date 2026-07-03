import { NextResponse, type NextRequest } from "next/server";
import type { TripRow, VehicleRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";
import { recalcUserStats } from "@/lib/trip-stats";

export interface TripWithVehicle extends TripRow {
  vehicle_label: string | null;
}

/** GET /api/trips — the user's trip history, newest first. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  const { data: trips, error } = await admin
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);

  const { data: vehicles } = await admin
    .from("vehicles")
    .select("id, nickname, make, model, year")
    .eq("user_id", user.id);

  const labelById = new Map<string, string>();
  for (const v of (vehicles ?? []) as Partial<VehicleRow>[]) {
    const label =
      v.nickname ||
      [v.year, v.make, v.model].filter(Boolean).join(" ") ||
      "Vehicle";
    if (v.id) labelById.set(v.id, label);
  }

  const result: TripWithVehicle[] = ((trips ?? []) as TripRow[]).map((t) => ({
    ...t,
    vehicle_label: t.vehicle_id ? labelById.get(t.vehicle_id) ?? null : null,
  }));

  return NextResponse.json({ trips: result });
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** POST /api/trips — log a trip (metric units), then refresh user stats. */
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

  const distance = num(body.distance);
  const durationSec = num(body.duration_sec);
  if (distance == null || distance <= 0) {
    return apiError("A positive distance is required");
  }

  // Validate the vehicle belongs to the user, if provided.
  let vehicleId: string | null = null;
  if (typeof body.vehicle_id === "string" && body.vehicle_id) {
    const { data: owned } = await admin
      .from("vehicles")
      .select("id")
      .eq("id", body.vehicle_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!owned) return apiError("Vehicle not found", 404);
    vehicleId = body.vehicle_id;
  }

  const startedAt =
    typeof body.started_at === "string" && body.started_at
      ? new Date(body.started_at).toISOString()
      : new Date().toISOString();
  const endedAt = durationSec
    ? new Date(new Date(startedAt).getTime() + durationSec * 1000).toISOString()
    : null;

  const { data, error } = await admin
    .from("trips")
    .insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      started_at: startedAt,
      ended_at: endedAt,
      duration_sec: durationSec,
      distance,
      top_speed: num(body.top_speed),
      avg_speed: num(body.avg_speed),
      is_convoy: false,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);

  await recalcUserStats(admin, user.id);
  return NextResponse.json({ trip: data }, { status: 201 });
}
