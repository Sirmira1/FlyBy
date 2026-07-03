/**
 * Marker business logic — filtering, search, distance and grouping.
 *
 * These pure functions are deliberately decoupled from React and from any
 * rendering library. They run identically on the server (in the API route and
 * during SSR) and on the client (for instant, optimistic filtering), which is
 * exactly the kind of logic we want to share with a future mobile app.
 */
import { CATEGORY_LIST } from "./config";
import { haversineMiles } from "./geo";
import type { AnyMarker, LngLat, MarkerCategory, MarkerQuery } from "./types";

/** Filter a list of markers by free-text search and category selection. */
export function queryMarkers(
  all: AnyMarker[],
  query: MarkerQuery = {},
): AnyMarker[] {
  const search = query.search?.trim().toLowerCase();
  const categories =
    query.categories && query.categories.length > 0
      ? new Set(query.categories)
      : null;

  return all.filter((marker) => {
    if (categories && !categories.has(marker.category)) return false;
    if (search) {
      const haystack =
        `${marker.name} ${marker.description ?? ""} ${marker.address ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** A marker paired with its distance from a reference point. */
export interface MarkerWithDistance {
  marker: AnyMarker;
  /** Miles from the reference point, or null when no reference is known. */
  distanceMiles: number | null;
}

/** Annotate markers with their distance from `origin` (e.g. the user). */
export function withDistance(
  markers: AnyMarker[],
  origin: LngLat | null,
): MarkerWithDistance[] {
  return markers.map((marker) => ({
    marker,
    distanceMiles: origin ? haversineMiles(origin, marker.position) : null,
  }));
}

/** Markers sorted by proximity to `origin` (closest first). */
export function sortByDistance(
  markers: AnyMarker[],
  origin: LngLat | null,
): MarkerWithDistance[] {
  return withDistance(markers, origin).sort(
    (a, b) =>
      (a.distanceMiles ?? Number.POSITIVE_INFINITY) -
      (b.distanceMiles ?? Number.POSITIVE_INFINITY),
  );
}

/** Count markers per category, zero-filled for every known category so the
 *  filter chips stay stable. */
export function countByCategory(
  markers: AnyMarker[],
): Record<MarkerCategory, number> {
  const counts = Object.fromEntries(
    CATEGORY_LIST.map((category) => [category.id, 0]),
  ) as Record<MarkerCategory, number>;

  for (const marker of markers) {
    counts[marker.category] += 1;
  }
  return counts;
}
