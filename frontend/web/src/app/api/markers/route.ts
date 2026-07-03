import { NextResponse } from "next/server";
import { parseMarkerQuery, type MarkersResponse } from "@/core/api";
import { queryMarkers } from "@/core/markers";
import { buildLiveMarkers } from "@/lib/markers-data";
import { requireUser } from "@/lib/supabase/route";

/**
 * GET /api/markers
 *
 * Returns the caller's live markers (friends + convoy crew from
 * `live_locations`, plus active convoy destinations), optionally filtered via
 * `?q=` (search) and `?categories=crew,landmark`. Filtering uses the shared
 * `queryMarkers` core function, so client and server never disagree.
 */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  const all = await buildLiveMarkers(admin, user.id);
  const query = parseMarkerQuery(new URL(request.url).searchParams);
  const markers = queryMarkers(all, query);

  const body: MarkersResponse = {
    markers,
    count: markers.length,
    generatedAt: new Date().toISOString(),
  };
  return NextResponse.json(body);
}
