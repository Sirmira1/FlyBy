import { NextResponse, type NextRequest } from "next/server";
import type { UnitPref } from "@/core/db-types";
import { ensureProfile } from "@/lib/profile";
import { apiError, requireUser } from "@/lib/supabase/route";

/** GET /api/me — the authenticated user's profile + settings. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  try {
    const profile = await ensureProfile(admin, user);
    return NextResponse.json({ profile, email: user.email });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : "Failed to load profile",
      500,
    );
  }
}

/** Fields a user is allowed to change on their own profile. */
interface ProfilePatch {
  display_name?: string | null;
  avatar_url?: string | null;
  unit_pref?: UnitPref;
  ghost_mode?: boolean;
  notif_friend_requests?: boolean;
  notif_convoy_invites?: boolean;
  notif_new_record?: boolean;
}

/** PATCH /api/me — update profile + settings. */
export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body");
  }

  const patch: ProfilePatch = {};

  if ("display_name" in body) {
    const v = body.display_name;
    if (v !== null && typeof v !== "string")
      return apiError("display_name must be a string");
    patch.display_name = typeof v === "string" ? v.trim().slice(0, 60) || null : null;
  }
  if ("avatar_url" in body) {
    const v = body.avatar_url;
    if (v !== null && typeof v !== "string")
      return apiError("avatar_url must be a string");
    patch.avatar_url = (v as string | null) ?? null;
  }
  if ("unit_pref" in body) {
    if (body.unit_pref !== "km/h" && body.unit_pref !== "mph")
      return apiError("unit_pref must be 'km/h' or 'mph'");
    patch.unit_pref = body.unit_pref;
  }
  for (const key of [
    "ghost_mode",
    "notif_friend_requests",
    "notif_convoy_invites",
    "notif_new_record",
  ] as const) {
    if (key in body) {
      if (typeof body[key] !== "boolean")
        return apiError(`${key} must be a boolean`);
      patch[key] = body[key] as boolean;
    }
  }

  if (Object.keys(patch).length === 0) {
    return apiError("No valid fields to update");
  }

  // Make sure the row exists before updating.
  await ensureProfile(admin, user);

  const { data, error } = await admin
    .from("users")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ profile: data });
}
