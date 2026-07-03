"use client";

/**
 * Fog-of-war exploration state. Hydrates the user's revealed H3 cells, then as
 * their position moves it reveals new cells, persists them, and advances the
 * current city's "% explored". Reverse-geocoding (Mapbox) resolves the city and
 * a bbox-based denominator so progress is meaningful.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { BBox } from "@/core/geo";
import { haversineKm } from "@/core/geo";
import {
  EXPLORE_RES,
  cellsForPosition,
  cityIdFromName,
  totalCellsForBbox,
} from "@/core/exploration";
import type { LngLat } from "@/core/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
/** Re-resolve the city if the user drifts this far from the last geocode. */
const REGEOCODE_KM = 8;

export interface CityProgress {
  name: string | null;
  percentage: number;
}

interface CityMeta {
  id: string;
  name: string;
  country: string | null;
  total: number;
}

export interface UseExploration {
  exploredCells: string[];
  city: CityProgress | null;
}

export function useExploration(position: LngLat | null): UseExploration {
  const [exploredCells, setExploredCells] = useState<string[]>([]);
  const [city, setCity] = useState<CityProgress | null>(null);

  const cellSetRef = useRef<Set<string>>(new Set());
  const cityMetaRef = useRef<CityMeta | null>(null);
  const lastGeocodeRef = useRef<LngLat | null>(null);
  const geocodingRef = useRef(false);

  // Hydrate revealed tiles + current city on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/explored", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        cellSetRef.current = new Set<string>(data.cells ?? []);
        setExploredCells(Array.from(cellSetRef.current));
        if (data.city) setCity(data.city);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveCity = useCallback(async (pos: LngLat) => {
    if (!MAPBOX_TOKEN || geocodingRef.current) return;
    geocodingRef.current = true;
    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.lng},${pos.lat}.json` +
        `?types=place&limit=1&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) return;
      const name: string = feature.text ?? "Unknown";
      const country: string | null =
        feature.context?.find((c: { id: string }) =>
          c.id?.startsWith("country"),
        )?.short_code ?? null;
      const bbox: BBox | null = Array.isArray(feature.bbox)
        ? (feature.bbox as BBox)
        : null;
      const total = bbox ? totalCellsForBbox(bbox) : 5000;
      cityMetaRef.current = {
        id: cityIdFromName(name, country),
        name,
        country,
        total,
      };
      lastGeocodeRef.current = pos;
    } catch {
      /* ignore geocode failures */
    } finally {
      geocodingRef.current = false;
    }
  }, []);

  // Reveal new cells as the user moves.
  useEffect(() => {
    if (!position) return;

    // Resolve/refresh the city when unknown or after drifting far.
    const last = lastGeocodeRef.current;
    if (!cityMetaRef.current || (last && haversineKm(last, position) > REGEOCODE_KM)) {
      void resolveCity(position);
    }

    const nearby = cellsForPosition(position.lat, position.lng);
    const fresh = nearby.filter((c) => !cellSetRef.current.has(c));
    if (fresh.length === 0) return;

    for (const c of fresh) cellSetRef.current.add(c);
    setExploredCells(Array.from(cellSetRef.current));

    const meta = cityMetaRef.current;
    fetch("/api/explored", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cells: fresh,
        res: EXPLORE_RES,
        city: meta
          ? {
              id: meta.id,
              name: meta.name,
              country: meta.country,
              total: meta.total,
            }
          : undefined,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.city) setCity(data.city);
      })
      .catch(() => {});
  }, [position, resolveCity]);

  return { exploredCells, city };
}
