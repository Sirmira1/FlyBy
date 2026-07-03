"use client";

/**
 * Browser geolocation hook.
 *
 * Only the `navigator.geolocation` calls are web-specific; the surrounding
 * state machine is generic, so porting to React Native means swapping those
 * three calls for `expo-location` and keeping everything else.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { isValidLngLat } from "@/core/geo";
import type { LngLat } from "@/core/types";

export type LocationStatus =
  | "idle"
  | "locating"
  | "granted"
  | "denied"
  | "unavailable";

export interface UserLocationState {
  position: LngLat | null;
  accuracy: number | null;
  status: LocationStatus;
  error: string | null;
}

export interface UseUserLocationOptions {
  /** Request location automatically on mount. Defaults to true. */
  immediate?: boolean;
  /** Continuously watch position instead of a one-shot read. */
  watch?: boolean;
}

export interface UseUserLocationResult extends UserLocationState {
  /** Imperatively (re)request the user's location. */
  request: () => void;
}

export function useUserLocation(
  options: UseUserLocationOptions = {},
): UseUserLocationResult {
  const { immediate = true, watch = false } = options;
  // Deterministic initial state — identical on server and client to avoid a
  // hydration mismatch. The mount effect starts the lookup; the async geolocation
  // callbacks move the status to "granted"/"denied" from there.
  const [state, setState] = useState<UserLocationState>({
    position: null,
    accuracy: null,
    status: "idle",
    error: null,
  });
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const next: LngLat = {
      lng: pos.coords.longitude,
      lat: pos.coords.latitude,
    };
    setState({
      position: isValidLngLat(next) ? next : null,
      accuracy: pos.coords.accuracy ?? null,
      status: "granted",
      error: null,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      status: err.code === err.PERMISSION_DENIED ? "denied" : prev.status,
      error: err.message,
    }));
  }, []);

  // Starts the geolocation lookup. Only updates state via the async success/
  // error callbacks, so it is safe to call from an effect (no sync setState).
  const startLookup = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return;
    }
    const geo = navigator.geolocation;
    const opts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 15_000,
    };

    if (watch) {
      if (watchIdRef.current !== null) geo.clearWatch(watchIdRef.current);
      watchIdRef.current = geo.watchPosition(handleSuccess, handleError, opts);
    } else {
      geo.getCurrentPosition(handleSuccess, handleError, opts);
    }
  }, [watch, handleSuccess, handleError]);

  // Public trigger (e.g. a "recenter" button). Runs in an event handler, so the
  // synchronous status update here is fine.
  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        status: "unavailable",
        error: "Geolocation is not supported in this browser.",
      }));
      return;
    }
    setState((prev) => ({ ...prev, status: "locating", error: null }));
    startLookup();
  }, [startLookup]);

  useEffect(() => {
    // Status is pre-seeded to "locating" by the initializer when `immediate`,
    // so kicking off the lookup here introduces no synchronous state update.
    if (immediate) startLookup();
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [immediate, startLookup]);

  return { ...state, request };
}
