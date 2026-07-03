/**
 * Unit conversion + formatting.
 *
 * Canonical storage is metric: distances in kilometers, speeds in km/h. Display
 * respects the user's `unit_pref`. Pure — safe on server or client.
 */
import type { UnitPref } from "./db-types";

const KM_PER_MI = 1.609344;

export function kmToMiles(km: number): number {
  return km / KM_PER_MI;
}

export function milesToKm(mi: number): number {
  return mi * KM_PER_MI;
}

/** Format a speed stored in km/h according to the user's preference. */
export function formatSpeed(kmh: number | null | undefined, pref: UnitPref): string {
  if (kmh == null) return "—";
  if (pref === "mph") return `${Math.round(kmToMiles(kmh))} mph`;
  return `${Math.round(kmh)} km/h`;
}

/** Bare numeric speed value in the preferred unit (no suffix). */
export function speedValue(kmh: number | null | undefined, pref: UnitPref): number {
  if (kmh == null) return 0;
  return Math.round(pref === "mph" ? kmToMiles(kmh) : kmh);
}

/** The speed unit label for the current preference. */
export function speedUnit(pref: UnitPref): string {
  return pref === "mph" ? "mph" : "km/h";
}

/** The distance unit label for the current preference. */
export function distanceUnit(pref: UnitPref): string {
  return pref === "mph" ? "mi" : "km";
}

/** Format a distance stored in kilometers according to the user's preference. */
export function formatDistance(km: number | null | undefined, pref: UnitPref): string {
  if (km == null) return "—";
  const value = pref === "mph" ? kmToMiles(km) : km;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString()} ${distanceUnit(pref)}`;
}

/** Human duration from seconds, e.g. "1h 23m" or "12m 05s". */
export function formatDuration(sec: number | null | undefined): string {
  if (!sec || sec <= 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
