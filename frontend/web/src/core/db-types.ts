/**
 * Database row types — a hand-written mirror of the FlyBy Supabase schema.
 *
 * Pure TypeScript, no dependencies, so it can be lifted into a shared package
 * and reused by the mobile app. Keep these in sync with the Postgres tables.
 */

export type UnitPref = "km/h" | "mph";
export type FriendStatus = "pending" | "accepted" | "declined" | "blocked";

/** `users` — the public profile row (id matches the Supabase auth user id). */
export interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  unit_pref: UnitPref;
  ghost_mode: boolean;
  total_kilometers: number;
  top_speed: number;
  avg_speed: number;
  trip_count: number;
  created_at: string;
  push_token: string | null;
  notif_friend_requests: boolean;
  notif_convoy_invites: boolean;
  notif_new_record: boolean;
}

/** `vehicles` — a car in a user's garage. */
export interface VehicleRow {
  id: string;
  user_id: string;
  nickname: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  horsepower: number | null;
  zero_to_sixty: number | null;
  top_speed: number | null;
  fuel_type: string | null;
  is_active: boolean;
  created_at: string;
}

/** `mods` — a modification applied to a vehicle. */
export interface ModRow {
  id: string;
  vehicle_id: string;
  user_id: string;
  name: string;
  detail: string | null;
  power_gain: number | null;
  created_at: string;
}

/** `trips` — a logged drive. */
export interface TripRow {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_sec: number | null;
  distance: number | null;
  top_speed: number | null;
  avg_speed: number | null;
  is_convoy: boolean;
  convoy_id: string | null;
  created_at: string;
}

/** `friends` — a friendship / request edge. */
export interface FriendRow {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: FriendStatus;
  created_at: string;
}

/** `convoys` — a group drive session. */
export interface ConvoyRow {
  id: string;
  created_by: string;
  name: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_name: string | null;
  is_active: boolean;
  member_ids: string[];
  created_at: string;
  ended_at: string | null;
}

/** `live_locations` — the latest known position for a user. */
export interface LiveLocationRow {
  user_id: string;
  username: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  convoy_id: string | null;
  updated_at: string;
}

/** `city_progress` — fog-of-war exploration per city. */
export interface CityProgressRow {
  id: string;
  user_id: string;
  city_id: string;
  city_name: string | null;
  country_code: string | null;
  explored_count: number;
  total_count: number;
  percentage: number;
  updated_at: string;
}

/** `explored_tiles` — H3 tiles a user has visited. */
export interface ExploredTileRow {
  id: string;
  user_id: string;
  h3_index: string;
  h3_res: number;
  explored_at: string;
}
