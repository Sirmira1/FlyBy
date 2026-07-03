"use client";

/**
 * Favorites hook backed by `localStorage`, built on top of the platform-agnostic
 * helpers in `@/core/favorites`. Swap the `webStore` adapter for AsyncStorage to
 * reuse this on mobile.
 */
import { useCallback, useEffect, useState } from "react";
import {
  loadFavorites,
  saveFavorites,
  toggleFavorite,
  type KeyValueStore,
} from "@/core/favorites";

const webStore: KeyValueStore = {
  getItem: (key) =>
    typeof window === "undefined" ? null : window.localStorage.getItem(key),
  setItem: (key, value) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};

export interface UseFavoritesResult {
  ids: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  /** True once favorites have been hydrated from storage. */
  ready: boolean;
}

export function useFavorites(): UseFavoritesResult {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Hydrate once on mount.
  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = await loadFavorites(webStore);
      if (active) {
        setIds(stored);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = toggleFavorite(prev, id);
      void saveFavorites(webStore, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  return { ids, isFavorite, toggle, ready };
}
