"use client";

/**
 * Records a live driving trip from the browser Geolocation API: accumulates
 * distance (haversine), tracks current/top/average speed and elapsed time.
 * All values are kept in metric (km, km/h) to match how trips are stored; the
 * UI converts for display via the user's unit preference.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { haversineKm } from "@/core/geo";
import type { LngLat } from "@/core/types";

export interface TripSummary {
  distanceKm: number;
  durationSec: number;
  topSpeedKmh: number;
  avgSpeedKmh: number;
  startedAt: string;
}

export interface UseTripRecorder {
  recording: boolean;
  distanceKm: number;
  currentSpeedKmh: number;
  topSpeedKmh: number;
  avgSpeedKmh: number;
  elapsedSec: number;
  supported: boolean;
  start: () => void;
  stop: () => TripSummary | null;
}

/** Ignore GPS jitter: don't accumulate hops shorter than ~4 metres. */
const MIN_HOP_KM = 0.004;

export function useTripRecorder(): UseTripRecorder {
  const [recording, setRecording] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [topSpeedKmh, setTopSpeedKmh] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  // Resolve support after mount so the first client render matches the server
  // (which has no `navigator`) and we don't trip a hydration mismatch.
  const [supported, setSupported] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const lastPointRef = useRef<LngLat | null>(null);
  const distanceRef = useRef(0);
  const topRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSupported(typeof navigator !== "undefined" && "geolocation" in navigator);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const cleanup = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(() => {
    if (!supported || watchIdRef.current !== null) return;

    startedAtRef.current = Date.now();
    lastPointRef.current = null;
    distanceRef.current = 0;
    topRef.current = 0;
    setDistanceKm(0);
    setCurrentSpeedKmh(0);
    setTopSpeedKmh(0);
    setElapsedSec(0);
    setRecording(true);

    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point: LngLat = {
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        };

        // Speed straight from the GPS when available (m/s → km/h).
        const speedKmh =
          pos.coords.speed != null && pos.coords.speed >= 0
            ? pos.coords.speed * 3.6
            : 0;

        if (lastPointRef.current) {
          const hop = haversineKm(lastPointRef.current, point);
          if (hop >= MIN_HOP_KM) {
            distanceRef.current += hop;
            setDistanceKm(distanceRef.current);
          }
        }
        lastPointRef.current = point;

        if (speedKmh > topRef.current) {
          topRef.current = speedKmh;
          setTopSpeedKmh(speedKmh);
        }
        setCurrentSpeedKmh(speedKmh);
      },
      () => {
        /* transient GPS errors are non-fatal while recording */
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
  }, [supported]);

  const stop = useCallback((): TripSummary | null => {
    if (watchIdRef.current === null && !recording) return null;
    cleanup();
    setRecording(false);

    const durationSec = Math.max(
      1,
      Math.floor((Date.now() - startedAtRef.current) / 1000),
    );
    const distance = distanceRef.current;
    const avgSpeedKmh = distance > 0 ? distance / (durationSec / 3600) : 0;

    return {
      distanceKm: distance,
      durationSec,
      topSpeedKmh: topRef.current,
      avgSpeedKmh,
      startedAt: new Date(startedAtRef.current).toISOString(),
    };
  }, [cleanup, recording]);

  const avgSpeedKmh =
    elapsedSec > 0 ? distanceKm / (elapsedSec / 3600) : 0;

  return {
    recording,
    distanceKm,
    currentSpeedKmh,
    topSpeedKmh,
    avgSpeedKmh,
    elapsedSec,
    supported,
    start,
    stop,
  };
}
