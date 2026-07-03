"use client";

/** Top-left city-exploration progress bar (city name + "% explored"). */
import type { CityProgress } from "@/hooks/useExploration";

export function ExploreBar({ city }: { city: CityProgress | null }) {
  if (!city) return null;
  const pct = Math.max(0, Math.min(100, city.percentage ?? 0));

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 w-56 rounded-2xl border border-edge bg-surface-2/90 px-4 py-3 shadow-lg backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
        {city.name ?? "Exploring"}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full bg-[#1d9e75] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-xs font-medium text-[#1d9e75]">
        {pct.toFixed(pct < 10 ? 1 : 0)}% explored
      </div>
    </div>
  );
}
