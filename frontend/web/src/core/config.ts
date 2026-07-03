/**
 * Static configuration and presentation metadata for the map.
 * Pure data — safe to import from server or client, web or native.
 */
import type { LngLat, MarkerCategory } from "./types";

/** Default camera target: Montréal, echoing the mobile mockup
 *  ("MONTRÉAL · 34% explored"). */
export const DEFAULT_CENTER: LngLat = { lng: -73.5674, lat: 45.5019 };
export const DEFAULT_ZOOM = 12;
export const MAX_ZOOM = 18;

/** Mapbox dark style — matches the mobile app's `dark-v11`. */
export const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

/** Presentation metadata for a marker category. */
export interface CategoryMeta {
  id: MarkerCategory;
  label: string;
  /** Hex accent color for the pin, chip, and legend. */
  color: string;
  /** Emoji glyph rendered inside spot pins. */
  glyph: string;
  description: string;
}

/** Single source of truth for category styling, reused across the UI. */
export const CATEGORIES: Record<MarkerCategory, CategoryMeta> = {
  crew: {
    id: "crew",
    label: "Crew",
    color: "#a89ff5",
    glyph: "🏎️",
    description: "Live drivers in your convoy",
  },
  meet: {
    id: "meet",
    label: "Meetups",
    color: "#e85d24",
    glyph: "📍",
    description: "Car meets & gatherings",
  },
  scenic: {
    id: "scenic",
    label: "Scenic",
    color: "#1d9e75",
    glyph: "🏞️",
    description: "Scenic drives & viewpoints",
  },
  fuel: {
    id: "fuel",
    label: "Fuel",
    color: "#5dcaa5",
    glyph: "⛽",
    description: "Fuel & charging stations",
  },
  hazard: {
    id: "hazard",
    label: "Hazards",
    color: "#ef9f27",
    glyph: "⚠️",
    description: "Speed traps & road hazards",
  },
  landmark: {
    id: "landmark",
    label: "Landmarks",
    color: "#7f77dd",
    glyph: "🏁",
    description: "Checkpoints & landmarks",
  },
};

/** Categories as an ordered list, handy for rendering filter chips/legends. */
export const CATEGORY_LIST: CategoryMeta[] = Object.values(CATEGORIES);
