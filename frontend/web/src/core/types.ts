/**
 * Core domain types for FlyBy.
 *
 * This module is intentionally platform-agnostic: no React, no DOM, no Next.
 * Everything here can be lifted into a shared package and reused by the
 * React Native app later.
 */

/** A geographic coordinate. Stored as an object but easily mapped to the
 *  GeoJSON / Mapbox `[lng, lat]` tuple order when needed. */
export interface LngLat {
  lng: number;
  lat: number;
}

/** Marker categories that make sense for FlyBy's driving world. */
export type MarkerCategory =
  | "crew" // live drivers in your convoy
  | "meet" // car meetups & gatherings
  | "scenic" // scenic drives / viewpoints
  | "fuel" // fuel & charging stations
  | "hazard" // speed traps / hazards
  | "landmark"; // checkpoints / notable landmarks

/** Base marker shared by every point rendered on the map. */
export interface MapMarker {
  id: string;
  name: string;
  category: MarkerCategory;
  position: LngLat;
  description?: string;
  /** Optional human-readable locality, e.g. "Plateau, Montréal". */
  address?: string;
}

/** A live crew member — a marker enriched with realtime telemetry. */
export interface CrewMarker extends MapMarker {
  category: "crew";
  /** Current speed in miles per hour (FlyBy speaks mph). */
  speedMph: number;
  /** Compass heading in degrees, 0 = north. */
  heading: number;
  /** Short initials shown inside the avatar pin. */
  initials: string;
  online: boolean;
}

/** Any marker the app knows how to render. */
export type AnyMarker = MapMarker | CrewMarker;

/** Narrowing type-guard for crew markers. */
export function isCrewMarker(marker: AnyMarker): marker is CrewMarker {
  return marker.category === "crew";
}

/** Query used to filter markers. Mirrors the `/api/markers` query params. */
export interface MarkerQuery {
  /** Free-text search across name / description / address. */
  search?: string;
  /** Restrict to these categories. Empty or undefined means "all". */
  categories?: MarkerCategory[];
}
