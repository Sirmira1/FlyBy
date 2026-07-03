"use client";

/**
 * Marker filtering hook.
 *
 * Owns the search + category filter state and derives the visible set using the
 * shared `queryMarkers` logic. Filtering happens client-side for instant
 * feedback; the very same function also powers the `/api/markers` route, so the
 * behaviour is guaranteed to match.
 */
import { useCallback, useMemo, useState } from "react";
import { countByCategory, queryMarkers } from "@/core/markers";
import type { AnyMarker, MarkerCategory, MarkerQuery } from "@/core/types";

export interface UseMarkersResult {
  /** Markers passing the current search + category filters. */
  visible: AnyMarker[];
  /** Marker count per category (zero-filled), for the filter chips. */
  counts: Record<MarkerCategory, number>;
  search: string;
  setSearch: (value: string) => void;
  categories: MarkerCategory[];
  toggleCategory: (category: MarkerCategory) => void;
  clearFilters: () => void;
  /** The active query, handy for refetching from the API. */
  query: MarkerQuery;
  /** True when any filter is active. */
  isFiltered: boolean;
}

export function useMarkers(source: AnyMarker[]): UseMarkersResult {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<MarkerCategory[]>([]);

  const query = useMemo<MarkerQuery>(
    () => ({ search, categories }),
    [search, categories],
  );

  const visible = useMemo(
    () => queryMarkers(source, query),
    [source, query],
  );

  const counts = useMemo(() => countByCategory(source), [source]);

  const toggleCategory = useCallback((category: MarkerCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategories([]);
  }, []);

  return {
    visible,
    counts,
    search,
    setSearch,
    categories,
    toggleCategory,
    clearFilters,
    query,
    isFiltered: search.trim().length > 0 || categories.length > 0,
  };
}
