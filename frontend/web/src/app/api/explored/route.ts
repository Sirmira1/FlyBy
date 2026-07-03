import { NextResponse, type NextRequest } from "next/server";
import type { CityProgressRow, ExploredTileRow } from "@/core/db-types";
import { apiError, requireUser } from "@/lib/supabase/route";

export interface CitySummary {
  name: string | null;
  percentage: number;
}

export interface ExploredResponse {
  cells: string[];
  city: CitySummary | null;
}

/** GET /api/explored — the caller's revealed tiles + current city progress. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  const { data: tiles } = await admin
    .from("explored_tiles")
    .select("h3_index")
    .eq("user_id", user.id);

  const { data: cities } = await admin
    .from("city_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const city = (cities ?? [])[0] as CityProgressRow | undefined;
  const body: ExploredResponse = {
    cells: ((tiles ?? []) as Pick<ExploredTileRow, "h3_index">[]).map(
      (t) => t.h3_index,
    ),
    city: city
      ? { name: city.city_name, percentage: city.percentage ?? 0 }
      : null,
  };
  return NextResponse.json(body);
}

interface PostBody {
  cells?: unknown;
  res?: unknown;
  city?: {
    id?: unknown;
    name?: unknown;
    country?: unknown;
    total?: unknown;
  };
}

/**
 * POST /api/explored — record newly revealed tiles and (optionally) advance
 * the current city's exploration progress.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth.ctx;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return apiError("Invalid JSON body");
  }

  const cells = Array.isArray(body.cells)
    ? body.cells.filter((c): c is string => typeof c === "string").slice(0, 500)
    : [];
  if (cells.length === 0) return apiError("No cells provided");
  const res = typeof body.res === "number" ? body.res : 9;

  // Only insert cells the user hasn't already revealed.
  const { data: existing } = await admin
    .from("explored_tiles")
    .select("h3_index")
    .eq("user_id", user.id)
    .in("h3_index", cells);
  const have = new Set(
    ((existing ?? []) as Pick<ExploredTileRow, "h3_index">[]).map(
      (t) => t.h3_index,
    ),
  );
  const toInsert = cells.filter((c) => !have.has(c));

  if (toInsert.length > 0) {
    await admin.from("explored_tiles").upsert(
      toInsert.map((h3_index) => ({
        user_id: user.id,
        h3_index,
        h3_res: res,
      })),
      { onConflict: "user_id,h3_index", ignoreDuplicates: true },
    );
  }

  // Advance city progress by the number of freshly revealed tiles.
  let citySummary: CitySummary | null = null;
  const city = body.city;
  if (
    city &&
    typeof city.id === "string" &&
    city.id &&
    typeof city.name === "string"
  ) {
    const total =
      typeof city.total === "number" && city.total > 0 ? city.total : 1;
    const country =
      typeof city.country === "string" ? city.country : null;

    const { data: rows } = await admin
      .from("city_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("city_id", city.id)
      .limit(1);
    const current = (rows ?? [])[0] as CityProgressRow | undefined;

    const exploredCount = Math.min(
      total,
      (current?.explored_count ?? 0) + toInsert.length,
    );
    const totalCount = current?.total_count || total;
    const percentage =
      Math.round((exploredCount / totalCount) * 1000) / 10;

    if (current) {
      await admin
        .from("city_progress")
        .update({
          explored_count: exploredCount,
          total_count: totalCount,
          percentage,
          city_name: city.name,
          country_code: country,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id);
    } else {
      await admin.from("city_progress").insert({
        user_id: user.id,
        city_id: city.id,
        city_name: city.name,
        country_code: country,
        explored_count: exploredCount,
        total_count: totalCount,
        percentage,
      });
    }
    citySummary = { name: city.name, percentage };
  }

  return NextResponse.json({ inserted: toInsert.length, city: citySummary });
}
