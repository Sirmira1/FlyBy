/**
 * Geospatial math utilities. Pure functions, no dependencies — trivially
 * unit-testable and reusable on any platform.
 */
import type { LngLat } from "./types";

const EARTH_RADIUS_KM = 6371;
const KM_PER_MILE = 1.60934;

/** Bounding box in GeoJSON order: [west, south, east, north]. */
export type BBox = [number, number, number, number];

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Great-circle distance between two coordinates, in kilometres. */
export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Great-circle distance between two coordinates, in miles. */
export function haversineMiles(a: LngLat, b: LngLat): number {
  return haversineKm(a, b) / KM_PER_MILE;
}

/** Human-friendly distance label, e.g. "320 ft", "0.4 mi", "12 mi". */
export function formatDistanceMiles(miles: number): string {
  if (!Number.isFinite(miles)) return "—";
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/**
 * Project a point a given distance (km) along a compass heading.
 * Used to simulate live crew movement for the realtime demo.
 */
export function movePoint(
  origin: LngLat,
  headingDegrees: number,
  distanceKm: number,
): LngLat {
  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const heading = toRadians(headingDegrees);
  const lat1 = toRadians(origin.lat);
  const lng1 = toRadians(origin.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(heading),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(heading) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: toDegrees(lat2),
    // Normalise longitude back into the [-180, 180] range.
    lng: ((toDegrees(lng2) + 540) % 360) - 180,
  };
}

/** Convert miles per hour to kilometres per hour. */
export function mphToKmh(mph: number): number {
  return mph * KM_PER_MILE;
}

/** Validate that a value is a usable coordinate. */
export function isValidLngLat(
  point: Partial<LngLat> | null | undefined,
): point is LngLat {
  return (
    !!point &&
    Number.isFinite(point.lng) &&
    Number.isFinite(point.lat) &&
    (point.lat as number) >= -90 &&
    (point.lat as number) <= 90 &&
    (point.lng as number) >= -180 &&
    (point.lng as number) <= 180
  );
}
