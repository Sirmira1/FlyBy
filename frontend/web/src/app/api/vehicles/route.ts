import { NextResponse, type NextRequest } from "next/server";
import type { ModRow, VehicleRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";

export interface VehicleWithMods extends VehicleRow {
  mods: ModRow[];
}

/** GET /api/vehicles — the user's garage, each vehicle with its mods. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  const { data: vehicles, error } = await admin
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);

  const { data: mods } = await admin
    .from("mods")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const modsByVehicle = new Map<string, ModRow[]>();
  for (const mod of (mods ?? []) as ModRow[]) {
    const list = modsByVehicle.get(mod.vehicle_id) ?? [];
    list.push(mod);
    modsByVehicle.set(mod.vehicle_id, list);
  }

  const result: VehicleWithMods[] = ((vehicles ?? []) as VehicleRow[]).map((v) => ({
    ...v,
    mods: modsByVehicle.get(v.id) ?? [],
  }));

  return NextResponse.json({ vehicles: result });
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseStr(v: unknown, max = 60): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** POST /api/vehicles — add a car to the garage. */
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

  const make = parseStr(body.make);
  const model = parseStr(body.model);
  if (!make && !model && !parseStr(body.nickname)) {
    return apiError("A make, model, or nickname is required");
  }

  // How many cars does the user already have? First car becomes active.
  const { count } = await admin
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const makeActive = body.is_active === true || (count ?? 0) === 0;

  if (makeActive) {
    // Only one active car at a time.
    await admin
      .from("vehicles")
      .update({ is_active: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await admin
    .from("vehicles")
    .insert({
      user_id: user.id,
      nickname: parseStr(body.nickname),
      make,
      model,
      year: parseNum(body.year),
      horsepower: parseNum(body.horsepower),
      zero_to_sixty: parseNum(body.zero_to_sixty),
      top_speed: parseNum(body.top_speed),
      fuel_type: parseStr(body.fuel_type, 20),
      is_active: makeActive,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ vehicle: { ...data, mods: [] } }, { status: 201 });
}
