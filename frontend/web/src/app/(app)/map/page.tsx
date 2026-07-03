import type { Metadata } from "next";
import MapExperience from "@/components/MapExperience";
import { getMarkersForCurrentUser } from "@/lib/markers-data";

export const metadata: Metadata = {
  title: "FlyBy — Live Map",
};

// Auth + live data depend on the request (cookies), so never prerender.
export const dynamic = "force-dynamic";

/**
 * Server Component. Produces the initial marker set on the server from live
 * Supabase data (friends + convoy crew + convoy destinations), then hands off
 * to the client orchestrator for all interactivity + live polling.
 */
export default async function MapPage() {
  const initialMarkers = await getMarkersForCurrentUser();
  return <MapExperience initialMarkers={initialMarkers} />;
}
