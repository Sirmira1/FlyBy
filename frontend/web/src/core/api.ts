/**
 * Transport layer for marker data.
 *
 * `getMarkers` is the client-side entry point and talks to the Next.js route
 * handler at `/api/markers`. The route handler and SSR both reuse the same pure
 * `queryMarkers` logic from `./markers`, so filtering behaves identically on
 * either side of the network boundary.
 *
 * To point at the real FlyBy backend later, change only the URL/parse helpers
 * here — nothing in the UI or hooks needs to know.
 */
import type { AnyMarker, MarkerCategory, MarkerQuery } from "./types";

/** Serialise a marker query into a URL query string (e.g. "?q=meet&categories=meet,fuel"). */
export function buildMarkersQueryString(query: MarkerQuery): string {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("q", query.search.trim());
  if (query.categories && query.categories.length > 0) {
    params.set("categories", query.categories.join(","));
  }
  const serialised = params.toString();
  return serialised ? `?${serialised}` : "";
}

/** Parse a marker query out of URLSearchParams (used by the API route). */
export function parseMarkerQuery(params: URLSearchParams): MarkerQuery {
  const search = params.get("q")?.trim() || undefined;
  const rawCategories = params.get("categories");
  const categories = rawCategories
    ? (rawCategories.split(",").filter(Boolean) as MarkerCategory[])
    : undefined;
  return { search, categories };
}

/** Shape returned by `GET /api/markers`. */
export interface MarkersResponse {
  markers: AnyMarker[];
  count: number;
  generatedAt: string;
}

/** Fetch markers from the API. Runs on the client (relative URL). */
export async function getMarkers(
  query: MarkerQuery = {},
  init?: RequestInit,
): Promise<AnyMarker[]> {
  const response = await fetch(`/api/markers${buildMarkersQueryString(query)}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`Failed to load markers (HTTP ${response.status})`);
  }
  const data = (await response.json()) as MarkersResponse;
  return data.markers;
}
