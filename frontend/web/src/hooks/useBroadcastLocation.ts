"use client";

/**
 * Broadcasts the browser's live position to `/api/location` on an interval, so
 * the user's friends and convoy see them move. Captures speed/heading from the
 * Geolocation API (converting m/s → km/h to match the stored unit). When
 * disabled it stops sharing and clears the server-side row.
 */
import { useEffect, useRef } from "react";

interface Fix {
  latitude: number;
  longitude: number;
  speed: number | null; // km/h
  heading: number | null;
}

export interface UseBroadcastLocationOptions {
  enabled: boolean;
  /** Publish interval in ms. */
  intervalMs?: number;
}

export function useBroadcastLocation({
  enabled,
  intervalMs = 5000,
}: UseBroadcastLocationOptions): void {
  const latest = useRef<Fix | null>(null);

  // Watch the device position (only while enabled).
  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        latest.current = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed:
            pos.coords.speed != null && pos.coords.speed >= 0
              ? pos.coords.speed * 3.6
              : null,
          heading:
            pos.coords.heading != null && !Number.isNaN(pos.coords.heading)
              ? pos.coords.heading
              : null,
        };
      },
      () => {
        /* ignore — sharing is best-effort */
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  // Publish on an interval; stop sharing when disabled.
  useEffect(() => {
    if (!enabled) {
      void fetch("/api/location", { method: "DELETE" }).catch(() => {});
      return;
    }

    const publish = () => {
      const fix = latest.current;
      if (!fix) return;
      void fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fix),
        keepalive: true,
      }).catch(() => {});
    };

    publish();
    const timer = setInterval(publish, intervalMs);
    return () => clearInterval(timer);
  }, [enabled, intervalMs]);
}
