"use client";

/**
 * MapView — owns the Mapbox GL map lifecycle and exposes:
 *  - an imperative handle (flyTo / zoom) for camera control, and
 *  - a React context so overlay children (pins, user dot) can project coords.
 *
 * Markers are rendered as an HTML overlay (see MarkerLayer) rather than native
 * layers, which keeps all marker visuals as composable React components.
 */
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE,
  MAX_ZOOM,
} from "@/core/config";
import type { BBox } from "@/core/geo";
import type { LngLat } from "@/core/types";
import { MapContext } from "./map-context";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Mapbox GL JS requires a *public* token (pk.*). Detect the common mistakes
 *  (missing, or a secret sk.* token) so we can show a helpful message instead
 *  of crashing inside Mapbox. */
type TokenError = "missing" | "secret" | "invalid";
const TOKEN_ERROR: TokenError | null = !MAPBOX_TOKEN
  ? "missing"
  : MAPBOX_TOKEN.startsWith("sk.")
    ? "secret"
    : !MAPBOX_TOKEN.startsWith("pk.")
      ? "invalid"
      : null;

export interface Viewport {
  bounds: BBox;
  zoom: number;
  center: LngLat;
}

export interface MapViewHandle {
  flyTo: (center: LngLat, zoom?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getMap: () => mapboxgl.Map | null;
}

interface MapViewProps {
  children?: ReactNode;
  initialCenter?: LngLat;
  initialZoom?: number;
  onViewportChange?: (viewport: Viewport) => void;
  onReady?: () => void;
}

function readViewport(map: mapboxgl.Map): Viewport {
  const bounds = map.getBounds();
  const center = map.getCenter();
  const bbox: BBox = bounds
    ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    : [-180, -90, 180, 90];
  return { bounds: bbox, zoom: map.getZoom(), center: { lng: center.lng, lat: center.lat } };
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { children, initialCenter = DEFAULT_CENTER, initialZoom = DEFAULT_ZOOM, onViewportChange, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [version, setVersion] = useState(0);

  // Keep the latest callbacks in refs so the init effect can stay mount-only
  // without going stale. Refs are written inside an effect (never during render).
  const onViewportChangeRef = useRef(onViewportChange);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
    onReadyRef.current = onReady;
  });

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (center, zoom) =>
        mapRef.current?.flyTo({
          center: [center.lng, center.lat],
          zoom: zoom ?? mapRef.current.getZoom(),
          essential: true,
        }),
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      getMap: () => mapRef.current,
    }),
    [],
  );

  useEffect(() => {
    if (TOKEN_ERROR || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const instance = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      maxZoom: MAX_ZOOM,
      attributionControl: true,
    });
    mapRef.current = instance;

    instance.on("load", () => {
      setMap(instance);
      onReadyRef.current?.();
      onViewportChangeRef.current?.(readViewport(instance));
    });
    // `move` fires continuously during pan/zoom — cheap re-projection of pins.
    instance.on("move", () => setVersion((value) => value + 1));
    // `moveend` is throttled to gesture end — good moment to re-cluster.
    instance.on("moveend", () => onViewportChangeRef.current?.(readViewport(instance)));

    return () => {
      instance.remove();
      mapRef.current = null;
      setMap(null);
    };
    // Mount-only: camera options are read once; callbacks come from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (TOKEN_ERROR) return <TokenNotice error={TOKEN_ERROR} />;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {map && (
        <MapContext.Provider value={{ map, version }}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
});

/** Friendly fallback shown when the Mapbox token is missing or the wrong type,
 *  instead of letting Mapbox GL throw at runtime. */
function TokenNotice({ error }: { error: TokenError }) {
  const title =
    error === "secret"
      ? "Wrong Mapbox token type"
      : error === "invalid"
        ? "Invalid Mapbox token"
        : "Mapbox token missing";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface px-8 text-center">
      <p className="text-lg font-medium text-ink">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
        {error === "secret" ? (
          <>
            You&apos;re using a <strong className="text-ink">secret</strong>{" "}
            token (<code className="text-brand-soft">sk.…</code>). Mapbox GL JS
            needs a <strong className="text-ink">public</strong> token (
            <code className="text-brand-soft">pk.…</code>).
          </>
        ) : error === "invalid" ? (
          <>
            Mapbox access tokens must start with{" "}
            <code className="text-brand-soft">pk.</code>
          </>
        ) : (
          <>
            Add{" "}
            <code className="text-brand-soft">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{" "}
            <code className="text-brand-soft">frontend/web/.env.local</code> (copy{" "}
            <code className="text-brand-soft">.env.example</code>)
          </>
        )}
        . Get a public token at{" "}
        <code className="text-brand-soft">account.mapbox.com</code>, then restart
        the dev server.
      </p>
    </div>
  );
}
