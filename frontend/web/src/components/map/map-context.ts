"use client";

/**
 * Shares the live Mapbox map instance (and a `version` counter that bumps on
 * every camera move) with descendant overlay components, so they can project
 * coordinates to screen space without each owning the map.
 */
import { createContext, useContext } from "react";
import type { Map as MapboxMap } from "mapbox-gl";

export interface MapContextValue {
  map: MapboxMap;
  /** Increments on every map `move` event to trigger re-projection. */
  version: number;
}

export const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within <MapView>.");
  }
  return context;
}
