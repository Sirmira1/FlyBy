"use client";

import { useCallback, useEffect, useState } from "react";
import type { ModRow, VehicleRow } from "@/core/db-types";

export interface VehicleWithMods extends VehicleRow {
  mods: ModRow[];
}

export interface NewVehicleInput {
  nickname?: string;
  make?: string;
  model?: string;
  year?: string;
  horsepower?: string;
  zero_to_sixty?: string;
  top_speed?: string;
  fuel_type?: string;
}

/** Client-side garage state + CRUD, backed by the /api/vehicles routes. */
export function useGarage() {
  const [vehicles, setVehicles] = useState<VehicleWithMods[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicles", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load garage");
      const data = await res.json();
      setVehicles(data.vehicles);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load garage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const addVehicle = useCallback(async (input: NewVehicleInput) => {
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not add vehicle");
    // Adding a car may flip the active flag; reload for a consistent view.
    await load();
  }, [load]);

  const deleteVehicle = useCallback(async (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (!res.ok) await load();
  }, [load]);

  const setActive = useCallback(async (id: string) => {
    setVehicles((prev) =>
      prev.map((v) => ({ ...v, is_active: v.id === id })),
    );
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });
    if (!res.ok) await load();
  }, [load]);

  const addMod = useCallback(
    async (vehicleId: string, name: string, detail: string, powerGain: string) => {
      const res = await fetch(`/api/vehicles/${vehicleId}/mods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, detail, power_gain: powerGain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add mod");
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId ? { ...v, mods: [data.mod, ...v.mods] } : v,
        ),
      );
    },
    [],
  );

  const deleteMod = useCallback(async (vehicleId: string, modId: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, mods: v.mods.filter((m) => m.id !== modId) }
          : v,
      ),
    );
    await fetch(`/api/mods/${modId}`, { method: "DELETE" });
  }, []);

  return {
    vehicles,
    loading,
    error,
    addVehicle,
    deleteVehicle,
    setActive,
    addMod,
    deleteMod,
    reload: load,
  };
}
