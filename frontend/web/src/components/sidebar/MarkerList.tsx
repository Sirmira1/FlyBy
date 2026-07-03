"use client";

/** Scrollable, distance-sorted list of markers. */
import { CATEGORIES } from "@/core/config";
import { formatDistanceMiles } from "@/core/geo";
import type { MarkerWithDistance } from "@/core/markers";
import { isCrewMarker, type AnyMarker } from "@/core/types";

interface MarkerListProps {
  items: MarkerWithDistance[];
  selectedId: string | null;
  favorites: Set<string>;
  onSelect: (marker: AnyMarker) => void;
  onToggleFavorite: (id: string) => void;
}

export function MarkerList({
  items,
  selectedId,
  favorites,
  onSelect,
  onToggleFavorite,
}: MarkerListProps) {
  if (items.length === 0) {
    return (
      <div className="px-1 py-10 text-center text-sm text-ink-mute">
        No spots or crew match your filters.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ marker, distanceMiles }) => {
        const meta = CATEGORIES[marker.category];
        const crew = isCrewMarker(marker);
        const isSelected = selectedId === marker.id;
        const isFavorite = favorites.has(marker.id);

        return (
          <li key={marker.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(marker)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(marker);
                }
              }}
              aria-pressed={isSelected}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                isSelected
                  ? "border-brand/50 bg-brand/10"
                  : "border-transparent hover:border-edge hover:bg-card"
              }`}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm"
                style={{ background: `${meta.color}22`, color: meta.color }}
                aria-hidden
              >
                {crew ? marker.initials : meta.glyph}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {marker.name}
                </span>
                <span className="block truncate text-xs text-ink-mute">
                  {crew ? (
                    <>
                      <span style={{ color: meta.color }}>● </span>
                      {marker.speedMph} mph
                    </>
                  ) : (
                    meta.label
                  )}
                  {distanceMiles !== null && (
                    <> · {formatDistanceMiles(distanceMiles)}</>
                  )}
                </span>
              </span>

              <button
                type="button"
                aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                aria-pressed={isFavorite}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(marker.id);
                }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm transition-colors hover:bg-edge"
              >
                <span className={isFavorite ? "" : "opacity-30"}>
                  {isFavorite ? "⭐" : "☆"}
                </span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
