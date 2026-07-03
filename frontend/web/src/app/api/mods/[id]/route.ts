import { NextResponse, type NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/mods/:id — remove a modification. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;
  const { id } = await params;

  const { error } = await admin
    .from("mods")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ ok: true });
}
