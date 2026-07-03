"use client";

/** Compact category legend, shown over the bottom-left of the map. */
import { CATEGORY_LIST } from "@/core/config";

export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-4 z-20 hidden rounded-xl border border-edge bg-surface-2/90 px-3 py-2.5 backdrop-blur sm:block">
      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-mute">Legend</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {CATEGORY_LIST.map((category) => (
          <li key={category.id} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: category.color }}
              aria-hidden
            />
            {category.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
