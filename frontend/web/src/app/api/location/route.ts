import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@/lib/profile";
import { apiError, requireUser } from "@/lib/supabase/route";

/**
 * POST /api/location
 *
 * Publish the caller's current position to `live_locations` so friends and
 * convoy members can see them move. Honors ghost mode: while ghosting, the
 * row is removed instead of updated so the user disappears from the map.
 *
 * Body: { latitude, longitude, speed?, heading?, convoy_id? }
 */
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

  const profile = await ensureProfile(admin, user);

  if (profile.ghost_mode) {
    await admin.from("live_locations").delete().eq("user_id", user.id);
    return NextResponse.json({ ok: true, ghosted: true });
  }

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return apiError("latitude and longitude are required");
  }

  const speed = Number(body.speed);
  const heading = Number(body.heading);

  const { error } = await admin.from("live_locations").upsert(
    {
      user_id: user.id,
      username: profile.username,
      latitude,
      longitude,
      speed: Number.isFinite(speed) ? speed : null,
      heading: Number.isFinite(heading) ? heading : null,
      convoy_id:
        typeof body.convoy_id === "string" && body.convoy_id
          ? body.convoy_id
          : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/location — stop sharing (remove the live row). */
export async function DELETE() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  await admin.from("live_locations").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
