"use client";

/**
 * Clustering hook — turns the visible markers + current viewport into the list
 * of cluster bubbles and pins to render. All clustering math lives in the core
 * `MarkerClusterer`; this hook only wires it to React's memoisation.
 */
import { useMemo } from "react";
import { MarkerClusterer, type RenderItem } from "@/core/clustering";
import type { BBox } from "@/core/geo";
import type { AnyMarker } from "@/core/types";

export interface UseMapClustersResult {
  items: RenderItem[];
  clusterer: MarkerClusterer;
}

export function useMapClusters(
  markers: AnyMarker[],
  bounds: BBox | null,
  zoom: number,
): UseMapClustersResult {
  // Rebuild the spatial index only when the marker set changes.
  const clusterer = useMemo(() => new MarkerClusterer(markers), [markers]);

  // Recompute the visible cluster/pin items when the viewport changes.
  const items = useMemo(
    () => (bounds ? clusterer.getRenderItems(bounds, zoom) : []),
    [clusterer, bounds, zoom],
  );

  return { items, clusterer };
}
