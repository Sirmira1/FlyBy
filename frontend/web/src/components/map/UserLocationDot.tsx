"use client";

/** The pulsing "you are here" dot, projected to the user's coordinate. */
import { useMemo } from "react";
import type { LngLat } from "@/core/types";
import { useMapContext } from "./map-context";

export function UserLocationDot({ position }: { position: LngLat | null }) {
  const { map, version } = useMapContext();

  const screen = useMemo(
    () => (position ? map.project([position.lng, position.lat]) : null),
    // `version` bumps on every map move so the dot tracks the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map, version, position],
  );

  if (!screen) return null;

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: screen.x, top: screen.y, transform: "translate(-50%, -50%)" }}
    >
      <span
        className="flyby-ping absolute left-1/2 top-1/2 h-9 w-9 rounded-full"
        style={{ border: "1.5px solid rgba(127,119,221,0.45)" }}
        aria-hidden
      />
      <span
        className="block h-3.5 w-3.5 rounded-full border-2 border-white"
        style={{ background: "#7f77dd", boxShadow: "0 0 10px rgba(127,119,221,0.8)" }}
      />
    </div>
  );
}
