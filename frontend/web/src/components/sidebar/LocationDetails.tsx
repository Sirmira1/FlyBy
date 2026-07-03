"use client";

/** Detail panel for the currently-selected marker. */
import { formatDistanceMiles, haversineMiles } from "@/core/geo";
import { isCrewMarker, type AnyMarker, type LngLat } from "@/core/types";
import { CategoryBadge } from "../ui/CategoryBadge";

interface LocationDetailsProps {
  marker: AnyMarker;
  origin: LngLat | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onCenter: (marker: AnyMarker) => void;
}

export function LocationDetails({
  marker,
  origin,
  isFavorite,
  onToggleFavorite,
  onClose,
  onCenter,
}: LocationDetailsProps) {
  const crew = isCrewMarker(marker);
  const distance = origin ? haversineMiles(origin, marker.position) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← Back
        </button>
        <button
          type="button"
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(marker.id)}
          className="grid h-8 w-8 place-items-center rounded-full border border-edge transition-colors hover:bg-card"
        >
          <span className={isFavorite ? "" : "opacity-40"}>
            {isFavorite ? "⭐" : "☆"}
          </span>
        </button>
      </div>

      <CategoryBadge category={marker.category} />

      <h2 className="mt-2 text-xl font-semibold text-ink">{marker.name}</h2>
      {marker.address && (
        <p className="mt-1 text-sm text-ink-soft">{marker.address}</p>
      )}
      {marker.description && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {marker.description}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Stat label="Distance" value={distance !== null ? formatDistanceMiles(distance) : "—"} />
        {crew ? (
          <>
            <Stat label="Speed" value={`${marker.speedMph} mph`} accent />
            <Stat label="Heading" value={`${marker.heading}°`} />
            <Stat label="Status" value={marker.online ? "Live" : "Offline"} accent={marker.online} />
          </>
        ) : (
          <Stat
            label="Coordinates"
            value={`${marker.position.lat.toFixed(4)}, ${marker.position.lng.toFixed(4)}`}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => onCenter(marker)}
        className="mt-5 w-full rounded-xl border border-brand/50 bg-brand/20 py-2.5 text-sm font-medium text-brand-soft transition-colors hover:bg-brand/30"
      >
        Center on map
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-edge bg-card px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-ink-mute">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${accent ? "text-brand-soft" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
