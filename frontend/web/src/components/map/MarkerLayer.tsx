"use client";

/**
 * Renders the cluster/pin overlay on top of the map canvas. Each render item is
 * projected from lng/lat to screen pixels via `map.project`, re-running on every
 * camera move (tracked by the context `version`).
 */
import { useMemo } from "react";
import type { RenderItem } from "@/core/clustering";
import type { AnyMarker, LngLat } from "@/core/types";
import { ClusterBubble } from "./ClusterBubble";
import { useMapContext } from "./map-context";
import { MarkerPin } from "./MarkerPin";

interface MarkerLayerProps {
  items: RenderItem[];
  selectedId: string | null;
  favorites: Set<string>;
  onSelectMarker: (marker: AnyMarker) => void;
  onSelectCluster: (clusterId: number, position: LngLat) => void;
}

export function MarkerLayer({
  items,
  selectedId,
  favorites,
  onSelectMarker,
  onSelectCluster,
}: MarkerLayerProps) {
  const { map, version } = useMapContext();

  const projected = useMemo(
    () =>
      items.map((item) => {
        const point = map.project([item.position.lng, item.position.lat]);
        return { item, x: point.x, y: point.y };
      }),
    // Re-project whenever the items change or the camera moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, map, version],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {projected.map(({ item, x, y }) => {
        const style = {
          left: x,
          top: y,
          transform: "translate(-50%, -50%)",
        } as const;

        if (item.type === "cluster") {
          return (
            <div key={`cluster-${item.id}`} className="absolute" style={style}>
              <ClusterBubble
                count={item.count}
                category={item.category}
                onClick={() => onSelectCluster(item.id, item.position)}
              />
            </div>
          );
        }

        const marker = item.marker;
        return (
          <div key={marker.id} className="absolute" style={style}>
            <MarkerPin
              marker={marker}
              selected={selectedId === marker.id}
              favorite={favorites.has(marker.id)}
              onClick={() => onSelectMarker(marker)}
            />
          </div>
        );
      })}
    </div>
  );
}
