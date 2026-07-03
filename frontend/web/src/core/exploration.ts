/**
 * Fog-of-war / city-exploration helpers built on H3 hexagon tiles.
 *
 * A position "reveals" its H3 cell plus the immediate ring of neighbours, so
 * driving clears a continuous corridor. Explored cells are punched out of a
 * world-covering dark polygon to create the fog effect.
 */
import {
  cellToBoundary,
  gridDisk,
  latLngToCell,
  polygonToCells,
} from "h3-js";
import type { BBox } from "./geo";

/** Tile resolution. res 9 ≈ 0.1 km² per hex — a good driving granularity. */
export const EXPLORE_RES = 9;

/** The H3 cells revealed by standing at a position (cell + 1-ring = 7 hexes). */
export function cellsForPosition(lat: number, lng: number): string[] {
  return gridDisk(latLngToCell(lat, lng, EXPLORE_RES), 1);
}

/** GeoJSON [lng,lat] ring for an H3 cell, explicitly closed. */
function cellRing(cell: string): number[][] {
  const ring = cellToBoundary(cell, true) as number[][];
  if (ring.length && ring[0] !== ring[ring.length - 1]) {
    ring.push(ring[0]);
  }
  return ring;
}

/** World outer ring in GeoJSON [lng,lat] order (Web-Mercator safe latitudes). */
const WORLD_RING: number[][] = [
  [-180, 85],
  [180, 85],
  [180, -85],
  [-180, -85],
  [-180, 85],
];

/**
 * A single fog polygon covering the world, with each explored cell cut out as
 * a hole. Rendered as a dark fill so unexplored areas stay shrouded.
 */
export function buildFogGeoJSON(
  cells: Iterable<string>,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const holes: number[][][] = [];
  for (const cell of cells) holes.push(cellRing(cell));
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [WORLD_RING, ...holes] },
  };
}

/** Slug used as the stable `city_id` for a city name. */
export function cityIdFromName(name: string, country?: string | null): string {
  const base = `${name}-${country ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "unknown";
}

/**
 * Approximate number of H3 cells covering a city's bounding box — used as the
 * denominator for "% explored". Capped so a huge metro bbox stays reasonable.
 */
export function totalCellsForBbox(bbox: BBox): number {
  const [w, s, e, n] = bbox;
  const rect: number[][] = [
    [w, s],
    [w, n],
    [e, n],
    [e, s],
    [w, s],
  ];
  try {
    const cells = polygonToCells([rect], EXPLORE_RES, true);
    return Math.max(cells.length, 1);
  } catch {
    return 1;
  }
}
