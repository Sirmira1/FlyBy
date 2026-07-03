# FlyBy — Web

The web edition of **FlyBy** (_"race to be the fastest on the road"_): a live map
with crew tracking, driving spots, and city exploration. It's a Next.js port of
the React Native app in [`../mobile`](../mobile), built so the **business logic
is shared** and the mobile app can be rebuilt on top of it later.

> Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
> Mapbox GL JS · Supercluster.

---

## Architecture

The code is split into three layers. The golden rule: **logic never imports UI,
and the core never imports a platform.**

```
┌──────────────────────────────────────────────────────────────┐
│  src/app        Platform layer (Next.js App Router)           │
│                 routing · server components · API route        │
├──────────────────────────────────────────────────────────────┤
│  src/components UI layer (React + DOM + Mapbox GL)            │
│  src/hooks      React hooks — bridge core logic to the UI      │
├──────────────────────────────────────────────────────────────┤
│  src/core       Core logic — pure TS, no React / DOM / Next   │
│                 types · geo math · clustering · data · favs     │
└──────────────────────────────────────────────────────────────┘
```

| Layer | Folder | Reusable on mobile? | Examples |
| ----- | ------ | ------------------- | -------- |
| **Core** | `src/core` | ✅ As-is (pure TS) | `geo.ts`, `markers.ts`, `clustering.ts`, `favorites.ts`, `api.ts` |
| **Hooks** | `src/hooks` | ✅ With adapter swaps | `useMarkers`, `useUserLocation`, `useRealtimeCrew`, `useMapClusters`, `useFavorites` |
| **UI** | `src/components` | ❌ Web-specific | `MapView`, `MarkerPin`, `Sidebar` |
| **Platform** | `src/app` | ❌ Next-specific | `/map` page, `/api/markers` route |

### Why this matters

- **`queryMarkers` runs on both sides of the network.** The `/api/markers` route
  (server) and the live filter (client) call the _same_ function, so results can
  never disagree.
- **Clustering logic is rendering-agnostic.** `MarkerClusterer` (core) decides
  _what_ to draw; `MarkerLayer` (UI) decides _how_. Swap Mapbox for MapLibre or
  react-native-maps without touching the math.
- **Storage and platform APIs are behind interfaces.** `favorites.ts` talks to a
  `KeyValueStore`; the web hook injects `localStorage`, mobile would inject
  `AsyncStorage`.

---

## Getting started

### 1. Add a Mapbox token

Mapbox GL JS needs a public access token. Copy the example env file and paste
your token (the same one the mobile app uses):

```bash
cp .env.example .env.local
```

```ini
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_public_token_here
```

> No token? The app still runs and shows a friendly "token missing" screen.
> Grab a free one at <https://account.mapbox.com/access-tokens/>.

### 2. Install & run

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /map
```

### 3. Build / lint

```bash
npm run build
npm run lint
```

---

## Folder structure

```
src/
  app/
    page.tsx              # redirects "/" → "/map"
    map/page.tsx          # Server Component: SSR initial markers
    api/markers/route.ts  # GET /api/markers (?q= & ?categories=)
  components/
    MapExperience.tsx     # client orchestrator — wires hooks to UI
    map/                  # MapView, MarkerLayer, MarkerPin, ClusterBubble,
                          # UserLocationDot, MapControls, MapLegend
    sidebar/              # Sidebar, SearchBar, CategoryFilter, MarkerList,
                          # LocationDetails
    ui/                   # CategoryBadge
  core/                   # types, config, geo, mock-data, markers, api,
                          # clustering, favorites   (pure, portable)
  hooks/                  # useMarkers, useUserLocation, useRealtimeCrew,
                          # useMapClusters, useFavorites
```

---

## Features

- **Live map** centered on the user's geolocation (browser API), dark theme
  matching the mobile palette.
- **Markers from data** in six driving-themed categories (crew, meetups, scenic,
  fuel, hazards, landmarks), served by a mock API route.
- **Marker interaction** — click a pin or list row to open a detail panel; the
  camera flies to it.
- **Search & category filtering** with live counts, applied through shared core
  logic.
- **Clustering** via Supercluster; click a cluster to zoom in and expand it.
- **Realtime crew** — online crew members move on a timer (simulating a
  WebSocket/poll feed). Toggle it from the map controls.
- **Favorites** persisted to `localStorage`.
- **SSR + client split** — initial markers are produced on the server; all
  interactivity is client-side.

---

## Going further

Ideas to extend this into an even stronger portfolio piece:

- Swap the mock API for the real Express/Supabase backend (only `core/api.ts`
  and the route handler change).
- Replace the simulated crew feed with Supabase Realtime / WebSockets.
- Add the mobile "fog of war" exploration layer using an H3 hex grid.
- Extract `src/core` + `src/hooks` into a `shared/` workspace package consumed
  by both web and mobile.
- Add unit tests for the pure core (`geo`, `markers`, `clustering`) — they're
  designed to be trivially testable.

