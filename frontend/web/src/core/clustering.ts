/**
 * Marker clustering — wraps Supercluster (the same engine Mapbox uses
 * internally) behind a small, rendering-agnostic API.
 *
 * The clustering *logic* lives here in the core layer; the *rendering* (cluster
 * bubbles vs. individual pins) lives in the UI layer. That separation is the
 * whole point: a future native app can reuse this class unchanged.
 */
import Supercluster from "supercluster";
import type { BBox } from "./geo";
import type { AnyMarker, LngLat, MarkerCategory } from "./types";

/** A group of markers collapsed into a single bubble. */
export interface ClusterRenderItem {
  type: "cluster";
  id: number;
  position: LngLat;
  count: number;
  /** Dominant category, used to colour the bubble. */
  category: MarkerCategory;
  /** Per-category tally inside the cluster. */
  categoryCounts: Partial<Record<MarkerCategory, number>>;
}

/** A single, un-clustered marker. */
export interface MarkerRenderItem {
  type: "marker";
  marker: AnyMarker;
  position: LngLat;
}

export type RenderItem = ClusterRenderItem | MarkerRenderItem;

/** Properties stored on each Supercluster point. */
interface PointProps {
  markerId: string;
  category: MarkerCategory;
}

/** Accumulated properties Supercluster rolls up onto a cluster. */
interface ClusterAccum {
  categoryCounts: Partial<Record<MarkerCategory, number>>;
}

export interface ClusterOptions {
  /** Cluster radius in pixels. */
  radius?: number;
  /** Max zoom at which points still cluster. */
  maxZoom?: number;
}

function dominantCategory(
  counts: Partial<Record<MarkerCategory, number>>,
): MarkerCategory {
  let best: MarkerCategory = "meet";
  let bestCount = -1;
  for (const key of Object.keys(counts) as MarkerCategory[]) {
    const count = counts[key] ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  }
  return best;
}

function isClusterProps(
  props: PointProps | (Supercluster.ClusterProperties & ClusterAccum),
): props is Supercluster.ClusterProperties & ClusterAccum {
  return (props as Supercluster.ClusterProperties).cluster === true;
}

/**
 * Builds a spatial index over the given markers and exposes the cluster/point
 * items that should be drawn for a viewport (bounding box + zoom).
 */
export class MarkerClusterer {
  private readonly index: Supercluster<PointProps, ClusterAccum>;
  private readonly byId = new Map<string, AnyMarker>();

  constructor(markers: AnyMarker[], options: ClusterOptions = {}) {
    this.index = new Supercluster<PointProps, ClusterAccum>({
      radius: options.radius ?? 60,
      maxZoom: options.maxZoom ?? 16,
      // Seed each point's contribution to the cluster tally...
      map: (props) => ({ categoryCounts: { [props.category]: 1 } }),
      // ...then merge tallies as points roll up into clusters.
      reduce: (accumulated, props) => {
        const counts = props.categoryCounts;
        for (const key of Object.keys(counts) as MarkerCategory[]) {
          accumulated.categoryCounts[key] =
            (accumulated.categoryCounts[key] ?? 0) + (counts[key] ?? 0);
        }
      },
    });

    const features = markers.map((marker) => {
      this.byId.set(marker.id, marker);
      return {
        type: "Feature" as const,
        properties: { markerId: marker.id, category: marker.category },
        geometry: {
          type: "Point" as const,
          coordinates: [marker.position.lng, marker.position.lat],
        },
      };
    });

    this.index.load(features);
  }

  /** Cluster/point items to render for the given viewport. */
  getRenderItems(bbox: BBox, zoom: number): RenderItem[] {
    const clusters = this.index.getClusters(bbox, Math.round(zoom));
    return clusters.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const position: LngLat = { lng, lat };

      if (isClusterProps(feature.properties)) {
        const categoryCounts = feature.properties.categoryCounts ?? {};
        return {
          type: "cluster",
          id: feature.properties.cluster_id,
          position,
          count: feature.properties.point_count,
          category: dominantCategory(categoryCounts),
          categoryCounts,
        } satisfies ClusterRenderItem;
      }

      const marker = this.byId.get(feature.properties.markerId);
      return {
        type: "marker",
        marker: marker as AnyMarker,
        position,
      } satisfies MarkerRenderItem;
    });
  }

  /** The zoom level at which a cluster breaks apart (for click-to-expand). */
  getClusterExpansionZoom(clusterId: number): number {
    return this.index.getClusterExpansionZoom(clusterId);
  }

  /** The individual markers contained in a cluster. */
  getLeaves(clusterId: number, limit = 25): AnyMarker[] {
    return this.index
      .getLeaves(clusterId, limit)
      .map((feature) => this.byId.get(feature.properties.markerId))
      .filter((marker): marker is AnyMarker => Boolean(marker));
  }
}
