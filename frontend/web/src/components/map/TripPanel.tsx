"use client";

/**
 * On-map trip UI: the Start/Stop record button plus, while recording, the
 * central speed HUD, a top-speed banner, and a live stats strip — mirroring the
 * mobile mockup. Presentational only; all state comes from the trip recorder.
 */
import type { UnitPref } from "@/core/db-types";
import {
  distanceUnit,
  formatDistance,
  formatDuration,
  speedUnit,
  speedValue,
} from "@/core/units";
import type { UseTripRecorder } from "@/hooks/useTripRecorder";

interface TripPanelProps {
  recorder: UseTripRecorder;
  pref: UnitPref;
  activeVehicleLabel: string | null;
  onStart: () => void;
  onStop: () => void;
  saving: boolean;
}

export function TripPanel({
  recorder,
  pref,
  activeVehicleLabel,
  onStart,
  onStop,
  saving,
}: TripPanelProps) {
  const { recording } = recorder;

  return (
    <>
      {recording && (
        <>
          {/* Central speed HUD */}
          <div className="pointer-events-none absolute left-1/2 top-[46%] z-10 -translate-x-1/2 -translate-y-1/2 text-center md:top-1/2">
            <div className="text-[52px] font-medium leading-none tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] md:text-[64px]">
              {speedValue(recorder.currentSpeedKmh, pref)}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">
              {speedUnit(pref)}
            </div>
          </div>

          {/* Top-speed banner */}
          <div className="pointer-events-none absolute right-3 top-[122px] z-20 rounded-xl border border-amber-500/40 bg-surface-2/90 px-3 py-2 backdrop-blur md:right-4 md:top-20">
            <div className="text-[10px] uppercase tracking-wide text-amber-500">
              Top speed
            </div>
            <div className="text-base font-medium leading-tight text-amber-400">
              {speedValue(recorder.topSpeedKmh, pref)}{" "}
              <span className="text-[10px] text-amber-400/60">
                {speedUnit(pref)}
              </span>
            </div>
          </div>

          {/* Live stats strip */}
          <div className="pointer-events-none absolute bottom-40 left-3 right-3 z-20 flex rounded-2xl border border-edge bg-surface-2/90 px-1 py-2.5 backdrop-blur md:bottom-24 md:left-4 md:right-4">
            <Stat
              value={formatDistance(recorder.distanceKm, pref).split(" ")[0]}
              label={distanceUnit(pref)}
            />
            <Stat
              value={String(speedValue(recorder.topSpeedKmh, pref))}
              label={`top ${speedUnit(pref)}`}
              accent
            />
            <Stat
              value={String(speedValue(recorder.avgSpeedKmh, pref))}
              label={`avg ${speedUnit(pref)}`}
            />
            <Stat
              value={formatDuration(recorder.elapsedSec)}
              label="duration"
              last
            />
          </div>
        </>
      )}

      {/* Record button */}
      <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 md:bottom-6">
        <button
          type="button"
          onClick={recording ? onStop : onStart}
          disabled={saving || (!recording && !recorder.supported)}
          className={
            recording
              ? "inline-flex items-center gap-2 rounded-full border border-white/15 bg-red-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-red-500 disabled:opacity-60"
              : "inline-flex items-center gap-2 rounded-full border border-white/15 bg-brand px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          }
        >
          {recording ? (
            <>
              <span className="flyby-pulse-soft h-2 w-2 rounded-full bg-white" />
              {saving ? "Saving…" : "Stop & save"}
            </>
          ) : (
            <>
              <span aria-hidden>▶</span> Start trip
            </>
          )}
        </button>
        {!recording && (
          <p className="mt-1.5 text-center text-[11px] text-ink-mute">
            {recorder.supported
              ? activeVehicleLabel
                ? `Recording as ${activeVehicleLabel}`
                : "No active vehicle — logs without a car"
              : "Location not available"}
          </p>
        )}
      </div>
    </>
  );
}

function Stat({
  value,
  label,
  accent,
  last,
}: {
  value: string;
  label: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={
        "flex-1 text-center " +
        (last ? "" : "border-r border-edge/70")
      }
    >
      <div
        className={
          "text-base font-medium leading-tight " +
          (accent ? "text-brand-soft" : "text-ink")
        }
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] tracking-wide text-ink-mute">
        {label}
      </div>
    </div>
  );
}
