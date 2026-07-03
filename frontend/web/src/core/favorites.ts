/**
 * Favorites logic with a pluggable storage backend.
 *
 * The `KeyValueStore` interface is satisfied by the browser's `localStorage`
 * (see `useFavorites`) and equally by React Native's `AsyncStorage`, so this
 * module ports to mobile without changes.
 */

export const FAVORITES_STORAGE_KEY = "flyby:favorites";

/** Minimal async-or-sync key/value contract shared by web and native storage. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
}

/** Load the favorite marker ids from storage (resilient to bad data). */
export async function loadFavorites(store: KeyValueStore): Promise<Set<string>> {
  try {
    const raw = await store.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

/** Persist the favorite marker ids to storage. */
export async function saveFavorites(
  store: KeyValueStore,
  ids: Set<string>,
): Promise<void> {
  try {
    await store.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage may be unavailable (private mode, quota) — favorites are
    // non-critical, so we fail silently rather than crash the UI.
  }
}

/** Return a new set with `id` toggled (pure — never mutates the input). */
export function toggleFavorite(ids: Set<string>, id: string): Set<string> {
  const next = new Set(ids);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
