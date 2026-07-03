"use client";

/**
 * Sidebar shell. Shows branding + live status, then either the selected
 * location's details or the browse view (search → filters → results list).
 * All state is owned by `MapExperience`; this component is presentational.
 */
import type { MarkerWithDistance } from "@/core/markers";
import type { AnyMarker, LngLat, MarkerCategory } from "@/core/types";
import { CategoryFilter } from "./CategoryFilter";
import { LocationDetails } from "./LocationDetails";
import { MarkerList } from "./MarkerList";
import { SearchBar } from "./SearchBar";

export interface SidebarProps {
  crewOnline: number;
  totalVisible: number;
  syncing: boolean;
  onRefresh: () => void;

  search: string;
  onSearchChange: (value: string) => void;
  categories: MarkerCategory[];
  counts: Record<MarkerCategory, number>;
  onToggleCategory: (category: MarkerCategory) => void;
  onClearFilters: () => void;
  isFiltered: boolean;

  listItems: MarkerWithDistance[];
  selectedMarker: AnyMarker | null;
  origin: LngLat | null;
  favorites: Set<string>;
  onSelectMarker: (marker: AnyMarker) => void;
  onToggleFavorite: (id: string) => void;
  onCloseDetails: () => void;
  onCenterMarker: (marker: AnyMarker) => void;
}

export function Sidebar(props: SidebarProps) {
  // Read the id from the un-narrowed marker so optional chaining stays valid
  // inside the "browse" branch below (where selectedMarker is null).
  const selectedId = props.selectedMarker?.id ?? null;

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-edge bg-surface-2 sm:w-[360px]">
      <header className="flex items-center justify-between border-b border-edge px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-semibold tracking-wide text-white">flyby</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 bg-brand/20 px-2.5 py-1 text-[11px] text-brand-soft">
            <span className="flyby-pulse-soft h-1.5 w-1.5 rounded-full bg-brand-soft" />
            {props.crewOnline} live
          </span>
        </div>
        <button
          type="button"
          aria-label="Refresh markers"
          title="Refresh markers"
          onClick={props.onRefresh}
          className="grid h-8 w-8 place-items-center rounded-full border border-edge text-ink-soft transition-colors hover:bg-card hover:text-ink"
        >
          <span className={props.syncing ? "inline-block animate-spin" : undefined}>⟳</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {props.selectedMarker ? (
          <LocationDetails
            marker={props.selectedMarker}
            origin={props.origin}
            isFavorite={props.favorites.has(props.selectedMarker.id)}
            onToggleFavorite={props.onToggleFavorite}
            onClose={props.onCloseDetails}
            onCenter={props.onCenterMarker}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <SearchBar value={props.search} onChange={props.onSearchChange} />
            <CategoryFilter
              active={props.categories}
              counts={props.counts}
              onToggle={props.onToggleCategory}
              onClear={props.onClearFilters}
              isFiltered={props.isFiltered}
            />
            <p className="px-1 text-[11px] uppercase tracking-wider text-ink-mute">
              {props.totalVisible} result{props.totalVisible === 1 ? "" : "s"}
            </p>
            <MarkerList
              items={props.listItems}
              selectedId={selectedId}
              favorites={props.favorites}
              onSelect={props.onSelectMarker}
              onToggleFavorite={props.onToggleFavorite}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
