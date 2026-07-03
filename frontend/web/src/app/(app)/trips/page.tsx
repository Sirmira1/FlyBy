"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, PageShell } from "@/components/shell/PageShell";
import { Button, Notice, SelectField, TextField } from "@/components/ui/controls";
import { Modal } from "@/components/ui/Modal";
import type { VehicleRow } from "@/core/db-types";
import {
  distanceUnit,
  formatDistance,
  formatDuration,
  formatSpeed,
  milesToKm,
  speedUnit,
} from "@/core/units";
import type { TripWithVehicle } from "@/app/api/trips/route";
import { useSession } from "@/store/SessionProvider";

export default function TripsPage() {
  const { profile } = useSession();
  const pref = profile?.unit_pref ?? "km/h";

  const [trips, setTrips] = useState<TripWithVehicle[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    distance: "",
    minutes: "",
    top_speed: "",
    avg_speed: "",
    vehicle_id: "",
  });

  const load = useCallback(async () => {
    try {
      const [tRes, vRes] = await Promise.all([
        fetch("/api/trips", { cache: "no-store" }),
        fetch("/api/vehicles", { cache: "no-store" }),
      ]);
      if (!tRes.ok) throw new Error("Failed to load trips");
      const tData = await tRes.json();
      setTrips(tData.trips);
      if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(vData.vehicles);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trips");
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const toKm = (v: string) =>
        pref === "mph" ? milesToKm(Number(v)) : Number(v);
      const payload = {
        distance: form.distance ? toKm(form.distance) : null,
        duration_sec: form.minutes ? Math.round(Number(form.minutes) * 60) : null,
        top_speed: form.top_speed ? toKm(form.top_speed) : null,
        avg_speed: form.avg_speed ? toKm(form.avg_speed) : null,
        vehicle_id: form.vehicle_id || null,
      };
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Could not log trip");
        return;
      }
      setForm({ distance: "", minutes: "", top_speed: "", avg_speed: "", vehicle_id: "" });
      setOpen(false);
      await load();
    } catch {
      setFormError("Could not log trip");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
  }

  const totalDistance = trips.reduce((sum, t) => sum + (t.distance ?? 0), 0);
  const bestSpeed = trips.reduce((max, t) => Math.max(max, t.top_speed ?? 0), 0);

  return (
    <PageShell
      title="Trips"
      subtitle="Every run, logged"
      actions={<Button onClick={() => setOpen(true)}>+ Log trip</Button>}
    >
      <div className="mx-auto max-w-3xl">
        {error && (
          <div className="mb-4">
            <Notice>{error}</Notice>
          </div>
        )}

        {!loading && trips.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Card>
              <div className="text-lg font-semibold text-ink">{trips.length}</div>
              <div className="text-xs text-ink-soft">Trips</div>
            </Card>
            <Card>
              <div className="text-lg font-semibold text-ink">
                {formatDistance(totalDistance, pref)}
              </div>
              <div className="text-xs text-ink-soft">Total distance</div>
            </Card>
            <Card>
              <div className="text-lg font-semibold text-ink">
                {formatSpeed(bestSpeed, pref)}
              </div>
              <div className="text-xs text-ink-soft">Best top speed</div>
            </Card>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink-soft">Loading trips…</p>
        ) : trips.length === 0 ? (
          <EmptyState
            glyph="🛣️"
            title="No trips yet"
            hint="Log your first drive to start building your history and stats."
            action={<Button onClick={() => setOpen(true)}>+ Log trip</Button>}
          />
        ) : (
          <ul className="space-y-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Card className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {formatDistance(trip.distance, pref)}
                      <span className="text-ink-mute"> · </span>
                      <span className="text-ink-soft">
                        {formatDuration(trip.duration_sec)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-ink-soft">
                      {trip.started_at
                        ? new Date(trip.started_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                      {trip.vehicle_label ? ` · ${trip.vehicle_label}` : ""}
                      {trip.is_convoy ? " · 🚗 convoy" : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-teal-soft">
                        {formatSpeed(trip.top_speed, pref)}
                      </div>
                      <div className="text-[11px] text-ink-mute">top speed</div>
                    </div>
                    <button
                      onClick={() => remove(trip.id)}
                      className="text-ink-mute hover:text-coral"
                      aria-label="Delete trip"
                    >
                      🗑️
                    </button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log a trip">
        <form onSubmit={submit} className="space-y-3">
          {formError && <Notice>{formError}</Notice>}
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={`Distance (${distanceUnit(pref)})`}
              type="number"
              step="0.1"
              required
              value={form.distance}
              onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))}
              placeholder="12.4"
            />
            <TextField
              label="Duration (min)"
              type="number"
              value={form.minutes}
              onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))}
              placeholder="18"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={`Top speed (${speedUnit(pref)})`}
              type="number"
              value={form.top_speed}
              onChange={(e) => setForm((f) => ({ ...f, top_speed: e.target.value }))}
              placeholder="140"
            />
            <TextField
              label={`Avg speed (${speedUnit(pref)})`}
              type="number"
              value={form.avg_speed}
              onChange={(e) => setForm((f) => ({ ...f, avg_speed: e.target.value }))}
              placeholder="65"
            />
          </div>
          {vehicles.length > 0 && (
            <SelectField
              label="Vehicle"
              value={form.vehicle_id}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
            >
              <option value="">No vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname ||
                    [v.year, v.make, v.model].filter(Boolean).join(" ") ||
                    "Vehicle"}
                </option>
              ))}
            </SelectField>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Log trip
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
