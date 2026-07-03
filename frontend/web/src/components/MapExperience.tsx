"use client";

/**
 * MapExperience — the single client orchestrator.
 *
 * It wires the hooks (realtime crew, filters, geolocation, favorites,
 * clustering) to the presentational components (MapView, MarkerLayer, Sidebar).
 * Deliberately holds *all* interaction state so the components below it stay
 * dumb and reusable. No business logic lives here — only composition.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMarkers } from "@/core/api";
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAX_ZOOM } from "@/core/config";
import { sortByDistance } from "@/core/markers";
import { isCrewMarker, type AnyMarker, type LngLat } from "@/core/types";
import { useBroadcastLocation } from "@/hooks/useBroadcastLocation";
import { useFavorites } from "@/hooks/useFavorites";
import { useMapClusters } from "@/hooks/useMapClusters";
import { useMarkers } from "@/hooks/useMarkers";
import { useExploration } from "@/hooks/useExploration";
import { useTripRecorder } from "@/hooks/useTripRecorder";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSession } from "@/store/SessionProvider";
import { ExploreBar } from "./map/ExploreBar";
import { FogLayer } from "./map/FogLayer";
import { MapControls } from "./map/MapControls";
import { MapLegend } from "./map/MapLegend";
import { MapView, type MapViewHandle, type Viewport } from "./map/MapView";
import { MarkerLayer } from "./map/MarkerLayer";
import { TripPanel } from "./map/TripPanel";
import { UserLocationDot } from "./map/UserLocationDot";
import { Sidebar } from "./sidebar/Sidebar";

interface MapExperienceProps {
  /** Markers fetched on the server for an instant first paint (SSR). */
  initialMarkers: AnyMarker[];
}

/** How often to pull fresh live positions from the API while "Live" is on. */
const LIVE_POLL_MS = 5000;

// Module-scoped so it survives client-side navigation (the module stays loaded
// while the tab is open). Lets us restore the exact camera when the user leaves
// the map and comes back, instead of snapping to Montréal / their location.
let savedCenter: LngLat = DEFAULT_CENTER;
let savedZoom = DEFAULT_ZOOM;
let hasCenteredOnUser = false;

export default function MapExperience({ initialMarkers }: MapExperienceProps) {
  // The canonical marker set (live crew + convoy destinations from the API).
  const [source, setSource] = useState<AnyMarker[]>(initialMarkers);
  const [live, setLive] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const { profile } = useSession();
  const pref = profile?.unit_pref ?? "km/h";

  const userLocation = useUserLocation({ immediate: true, watch: true });

  // Fog-of-war exploration: reveal tiles + track city progress as we move.
  const exploration = useExploration(userLocation.position);

  // Trip recording (Start trip button + live HUD).
  const recorder = useTripRecorder();
  const [activeVehicle, setActiveVehicle] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);

  // Share our own position with friends/convoy while "Live" is on.
  useBroadcastLocation({ enabled: live });

  // The live markers are simply the latest server snapshot — no simulation.
  const liveMarkers = source;

  // Filter state + the visible subset.
  const markersApi = useMarkers(liveMarkers);

  const favorites = useFavorites();

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapViewHandle>(null);

  // Cluster/pin items for the current viewport.
  const { items, clusterer } = useMapClusters(
    markersApi.visible,
    viewport?.bounds ?? null,
    viewport?.zoom ?? DEFAULT_ZOOM,
  );

  // Reference point for distances/sorting: the user, else the map, else default.
  const origin: LngLat =
    userLocation.position ?? viewport?.center ?? DEFAULT_CENTER;

  // Keep the selection resolvable against the live (unfiltered) set so details
  // persist even when filters would hide the marker.
  const selectedMarker = useMemo(
    () => liveMarkers.find((marker) => marker.id === selectedId) ?? null,
    [liveMarkers, selectedId],
  );

  const listItems = useMemo(
    () => sortByDistance(markersApi.visible, origin),
    [markersApi.visible, origin],
  );

  const crewOnline = useMemo(
    () => liveMarkers.filter((m) => isCrewMarker(m) && m.online).length,
    [liveMarkers],
  );

  // Fly to the user only the first time we ever get a fix this session. On
  // later visits the camera is restored from the saved viewport instead.
  useEffect(() => {
    if (!hasCenteredOnUser && userLocation.position) {
      hasCenteredOnUser = true;
      mapRef.current?.flyTo(userLocation.position, 13);
    }
  }, [userLocation.position]);

  const handleSelectMarker = useCallback(
    (marker: AnyMarker) => {
      setSelectedId(marker.id);
      mapRef.current?.flyTo(marker.position, Math.max(viewport?.zoom ?? 14, 14));
    },
    [viewport?.zoom],
  );

  const handleSelectCluster = useCallback(
    (clusterId: number, position: LngLat) => {
      const expansionZoom = clusterer.getClusterExpansionZoom(clusterId);
      mapRef.current?.flyTo(position, Math.min(expansionZoom, MAX_ZOOM));
    },
    [clusterer],
  );

  const handleRecenter = useCallback(() => {
    if (userLocation.position) {
      mapRef.current?.flyTo(userLocation.position, 14);
    } else {
      userLocation.request();
    }
  }, [userLocation]);

  const handleRefresh = useCallback(async () => {
    setSyncing(true);
    try {
      const fresh = await getMarkers();
      setSource(fresh);
    } catch {
      // Non-fatal: keep showing the current data.
    } finally {
      setSyncing(false);
    }
  }, []);

  // Poll for fresh live positions while "Live" is on.
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      getMarkers()
        .then(setSource)
        .catch(() => {
          /* keep the current snapshot */
        });
    }, LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [live]);

  // Persist the camera at module scope so returning to the map restores it.
  const handleViewportChange = useCallback((vp: Viewport) => {
    setViewport(vp);
    savedCenter = vp.center;
    savedZoom = vp.zoom;
  }, []);

  // Load the active vehicle so recorded trips are attributed to a car.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/vehicles", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.vehicles?.length) return;
        const list = data.vehicles as Array<{
          id: string;
          is_active: boolean;
          nickname: string | null;
          make: string | null;
          model: string | null;
          year: number | null;
        }>;
        const v = list.find((x) => x.is_active) ?? list[0];
        const label =
          v.nickname ||
          [v.year, v.make, v.model].filter(Boolean).join(" ") ||
          "Vehicle";
        setActiveVehicle({ id: v.id, label });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStopTrip = useCallback(async () => {
    const summary = recorder.stop();
    if (!summary || summary.distanceKm <= 0) return;
    setSavingTrip(true);
    try {
      await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distance: summary.distanceKm,
          duration_sec: summary.durationSec,
          top_speed: summary.topSpeedKmh,
          avg_speed: summary.avgSpeedKmh,
          started_at: summary.startedAt,
          vehicle_id: activeVehicle?.id ?? null,
        }),
      });
    } catch {
      /* keep going — the trip just won't be saved */
    } finally {
      setSavingTrip(false);
    }
  }, [recorder, activeVehicle]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface text-ink">
      <Sidebar
        crewOnline={crewOnline}
        totalVisible={markersApi.visible.length}
        syncing={syncing}
        onRefresh={handleRefresh}
        search={markersApi.search}
        onSearchChange={markersApi.setSearch}
        categories={markersApi.categories}
        counts={markersApi.counts}
        onToggleCategory={markersApi.toggleCategory}
        onClearFilters={markersApi.clearFilters}
        isFiltered={markersApi.isFiltered}
        listItems={listItems}
        selectedMarker={selectedMarker}
        origin={origin}
        favorites={favorites.ids}
        onSelectMarker={handleSelectMarker}
        onToggleFavorite={favorites.toggle}
        onCloseDetails={() => setSelectedId(null)}
        onCenterMarker={handleSelectMarker}
      />

      <main className="relative flex-1">
        <MapView
          ref={mapRef}
          initialCenter={savedCenter}
          initialZoom={savedZoom}
          onViewportChange={handleViewportChange}
        >
          <MarkerLayer
            items={items}
            selectedId={selectedId}
            favorites={favorites.ids}
            onSelectMarker={handleSelectMarker}
            onSelectCluster={handleSelectCluster}
          />
          <FogLayer cells={exploration.exploredCells} />
          <UserLocationDot position={userLocation.position} />
        </MapView>

        <ExploreBar city={exploration.city} />

        {/* Status pill, echoing the mobile "live" header. */}
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-edge bg-surface-2/90 px-3 py-1.5 text-xs text-ink-soft backdrop-blur">
          <span className="font-medium text-ink">{markersApi.visible.length}</span> on map
          <span className="text-ink-mute">·</span>
          <span className="flyby-pulse-soft h-1.5 w-1.5 rounded-full bg-brand-soft" />
          <span className="font-medium text-ink">{crewOnline}</span> live
        </div>

        <MapLegend />
        <MapControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onRecenter={handleRecenter}
          realtime={live}
          onToggleRealtime={() => setLive((value) => !value)}
          locating={userLocation.status === "locating"}
        />

        <TripPanel
          recorder={recorder}
          pref={pref}
          activeVehicleLabel={activeVehicle?.label ?? null}
          onStart={recorder.start}
          onStop={handleStopTrip}
          saving={savingTrip}
        />
      </main>
    </div>
  );
}
