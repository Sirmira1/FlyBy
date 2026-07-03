import { NextResponse, type NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/supabase/route";
import { recalcUserStats } from "@/lib/trip-stats";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/trips/:id — remove a trip and refresh user stats. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;
  const { id } = await params;

  const { error } = await admin
    .from("trips")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return apiError(error.message, 500);

  await recalcUserStats(admin, user.id);
  return NextResponse.json({ ok: true });
}
