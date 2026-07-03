"use client";

/**
 * Fog-of-war overlay. Renders a dark fill covering the whole map with the
 * user's explored H3 cells punched out as holes, so unexplored areas stay
 * shrouded and driving progressively reveals the map.
 */
import { useEffect } from "react";
import type { GeoJSONSource } from "mapbox-gl";
import { buildFogGeoJSON } from "@/core/exploration";
import { useMapContext } from "./map-context";

const SOURCE_ID = "flyby-fog";
const LAYER_ID = "flyby-fog-layer";

export function FogLayer({
  cells,
  enabled = true,
}: {
  cells: string[];
  enabled?: boolean;
}) {
  const { map } = useMapContext();

  // Add the fog source + layer once, and tear it down when the map goes away.
  useEffect(() => {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: buildFogGeoJSON([]) as GeoJSON.Feature,
      });
      map.addLayer({
        id: LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": "#05050b",
          "fill-opacity": 0.72,
        },
      });
    }

    return () => {
      // During navigation the map may already be partly torn down (style gone),
      // so guard every call — removing a layer on a dead map throws.
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {
        /* map already disposed — nothing to clean up */
      }
    };
  }, [map]);

  // Update the fog holes whenever the explored set changes.
  useEffect(() => {
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) source.setData(buildFogGeoJSON(cells) as GeoJSON.Feature);
  }, [map, cells]);

  // Show/hide the whole fog layer when the user toggles it.
  useEffect(() => {
    if (map.getLayer(LAYER_ID)) {
      map.setLayoutProperty(
        LAYER_ID,
        "visibility",
        enabled ? "visible" : "none",
      );
    }
  }, [map, enabled]);

  return null;
}
