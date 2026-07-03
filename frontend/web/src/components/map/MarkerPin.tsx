"use client";

/**
 * A single map pin. Crew pins show initials + live speed (like the mockup);
 * spot pins show a category glyph and reveal their name on hover / when
 * selected. Purely presentational — all data comes from props.
 */
import { CATEGORIES } from "@/core/config";
import { isCrewMarker, type AnyMarker } from "@/core/types";

interface MarkerPinProps {
  marker: AnyMarker;
  selected: boolean;
  favorite: boolean;
  onClick: () => void;
}

export function MarkerPin({ marker, selected, favorite, onClick }: MarkerPinProps) {
  const meta = CATEGORIES[marker.category];
  const crew = isCrewMarker(marker);
  const showLabel = crew || selected;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={marker.name}
      aria-pressed={selected}
      className="pointer-events-auto group relative block cursor-pointer outline-none"
    >
      {/* Live pulse behind online crew members. */}
      {crew && marker.online && (
        <span
          className="flyby-ping absolute left-1/2 top-1/2 h-7 w-7 rounded-full"
          style={{ border: `1.5px solid ${meta.color}` }}
          aria-hidden
        />
      )}

      <span
        className="relative flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-1 backdrop-blur-sm transition-all duration-150 group-hover:-translate-y-0.5"
        style={{
          borderColor: selected ? meta.color : `${meta.color}66`,
          background: "rgba(10,10,20,0.85)",
          boxShadow: selected
            ? `0 0 0 3px ${meta.color}55, 0 6px 16px rgba(0,0,0,0.45)`
            : "0 2px 8px rgba(0,0,0,0.45)",
          paddingRight: showLabel ? "0.6rem" : undefined,
        }}
      >
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold leading-none text-ink"
          style={{ background: `${meta.color}26` }}
        >
          {crew ? marker.initials : meta.glyph}
        </span>

        <span
          className={`${
            showLabel ? "flex" : "hidden group-hover:flex"
          } items-baseline gap-1 whitespace-nowrap text-[11px] font-medium text-ink`}
        >
          {crew ? (
            <>
              {marker.speedMph}
              <span className="text-ink-mute">mph</span>
            </>
          ) : (
            marker.name
          )}
        </span>

        {favorite && (
          <span className="absolute -right-1 -top-1.5 text-[11px] drop-shadow" aria-hidden>
            ⭐
          </span>
        )}
      </span>
    </button>
  );
}
