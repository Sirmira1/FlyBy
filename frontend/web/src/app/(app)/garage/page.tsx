"use client";

import { useState } from "react";
import { Card, EmptyState, PageShell } from "@/components/shell/PageShell";
import { Button, Notice, TextField } from "@/components/ui/controls";
import { Modal } from "@/components/ui/Modal";
import type { UnitPref } from "@/core/db-types";
import { formatSpeed, milesToKm } from "@/core/units";
import {
  useGarage,
  type NewVehicleInput,
  type VehicleWithMods,
} from "@/hooks/useGarage";
import { useSession } from "@/store/SessionProvider";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-3 py-2">
      <div className="text-sm font-medium text-ink">{value}</div>
      <div className="text-[11px] text-ink-soft">{label}</div>
    </div>
  );
}

function VehicleCard({
  vehicle,
  pref,
  onSetActive,
  onDelete,
  onAddMod,
  onDeleteMod,
}: {
  vehicle: VehicleWithMods;
  pref: UnitPref;
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
  onAddMod: (id: string, name: string, detail: string, power: string) => Promise<void>;
  onDeleteMod: (vehicleId: string, modId: string) => void;
}) {
  const [modName, setModName] = useState("");
  const [modDetail, setModDetail] = useState("");
  const [modPower, setModPower] = useState("");
  const [addingMod, setAddingMod] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

  const title =
    vehicle.nickname ||
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
    "Unnamed vehicle";
  const subtitle = vehicle.nickname
    ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
    : vehicle.fuel_type ?? "";

  async function submitMod(e: React.FormEvent) {
    e.preventDefault();
    if (!modName.trim()) return;
    setAddingMod(true);
    setModError(null);
    try {
      await onAddMod(vehicle.id, modName, modDetail, modPower);
      setModName("");
      setModDetail("");
      setModPower("");
    } catch (err) {
      setModError(err instanceof Error ? err.message : "Could not add mod");
    } finally {
      setAddingMod(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-ink">{title}</h3>
            {vehicle.is_active && (
              <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-medium text-teal-soft">
                ACTIVE
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 gap-2 self-start sm:self-auto">
          {!vehicle.is_active && (
            <Button variant="secondary" onClick={() => onSetActive(vehicle.id)}>
              Set active
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => onDelete(vehicle.id)}
            aria-label="Delete vehicle"
          >
            🗑️
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Spec label="Horsepower" value={vehicle.horsepower ? `${vehicle.horsepower} hp` : "—"} />
        <Spec label="0–60" value={vehicle.zero_to_sixty ? `${vehicle.zero_to_sixty}s` : "—"} />
        <Spec label="Top speed" value={formatSpeed(vehicle.top_speed, pref)} />
        <Spec label="Fuel" value={vehicle.fuel_type ?? "—"} />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-ink-soft">
          Mods{" "}
          {vehicle.mods.length > 0 && (
            <span className="text-ink-mute">({vehicle.mods.length})</span>
          )}
        </div>
        {vehicle.mods.length > 0 ? (
          <ul className="mb-3 space-y-1.5">
            {vehicle.mods.map((mod) => (
              <li
                key={mod.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="text-ink">{mod.name}</span>
                  {mod.detail && (
                    <span className="text-ink-soft"> · {mod.detail}</span>
                  )}
                  {mod.power_gain ? (
                    <span className="text-teal-soft"> · +{mod.power_gain} hp</span>
                  ) : null}
                </div>
                <button
                  onClick={() => onDeleteMod(vehicle.id, mod.id)}
                  className="shrink-0 text-ink-mute hover:text-coral"
                  aria-label="Remove mod"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-ink-mute">No mods yet.</p>
        )}

        <form onSubmit={submitMod} className="space-y-2">
          {modError && <Notice>{modError}</Notice>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_110px]">
            <TextField
              placeholder="Mod name (e.g. Turbo)"
              value={modName}
              onChange={(e) => setModName(e.target.value)}
            />
            <TextField
              placeholder="Detail (optional)"
              value={modDetail}
              onChange={(e) => setModDetail(e.target.value)}
            />
            <TextField
              placeholder="+hp"
              type="number"
              value={modPower}
              onChange={(e) => setModPower(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" loading={addingMod}>
            Add mod
          </Button>
        </form>
      </div>
    </Card>
  );
}

const EMPTY_FORM: NewVehicleInput = {
  nickname: "",
  make: "",
  model: "",
  year: "",
  horsepower: "",
  zero_to_sixty: "",
  top_speed: "",
  fuel_type: "",
};

export default function GaragePage() {
  const { profile } = useSession();
  const pref = profile?.unit_pref ?? "km/h";
  const garage = useGarage();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewVehicleInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function set<K extends keyof NewVehicleInput>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      // Top speed is entered in the user's preferred unit; store km/h canonical.
      const payload: NewVehicleInput = { ...form };
      if (pref === "mph" && form.top_speed) {
        const mph = Number(form.top_speed);
        if (Number.isFinite(mph)) payload.top_speed = String(milesToKm(mph));
      }
      await garage.addVehicle(payload);
      setForm(EMPTY_FORM);
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Garage"
      subtitle="The cars you flex on the road"
      actions={<Button onClick={() => setOpen(true)}>+ Add vehicle</Button>}
    >
      <div className="mx-auto max-w-3xl">
        {garage.error && (
          <div className="mb-4">
            <Notice>{garage.error}</Notice>
          </div>
        )}

        {garage.loading ? (
          <p className="text-sm text-ink-soft">Loading your garage…</p>
        ) : garage.vehicles.length === 0 ? (
          <EmptyState
            glyph="🏎️"
            title="Your garage is empty"
            hint="Add your first ride to track its specs and mods."
            action={<Button onClick={() => setOpen(true)}>+ Add vehicle</Button>}
          />
        ) : (
          <div className="space-y-4">
            {garage.vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                pref={pref}
                onSetActive={garage.setActive}
                onDelete={garage.deleteVehicle}
                onAddMod={garage.addMod}
                onDeleteMod={garage.deleteMod}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a vehicle">
        <form onSubmit={submit} className="space-y-3">
          {formError && <Notice>{formError}</Notice>}
          <TextField
            label="Nickname"
            value={form.nickname}
            onChange={(e) => set("nickname", e.target.value)}
            placeholder="Project car"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Make"
              value={form.make}
              onChange={(e) => set("make", e.target.value)}
              placeholder="Subaru"
            />
            <TextField
              label="Model"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="WRX STI"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Year"
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="2021"
            />
            <TextField
              label="Fuel type"
              value={form.fuel_type}
              onChange={(e) => set("fuel_type", e.target.value)}
              placeholder="Petrol / EV"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField
              label="Horsepower"
              type="number"
              value={form.horsepower}
              onChange={(e) => set("horsepower", e.target.value)}
              placeholder="310"
            />
            <TextField
              label="0–60 (s)"
              type="number"
              value={form.zero_to_sixty}
              onChange={(e) => set("zero_to_sixty", e.target.value)}
              placeholder="5.1"
            />
            <TextField
              label={`Top (${pref})`}
              type="number"
              value={form.top_speed}
              onChange={(e) => set("top_speed", e.target.value)}
              placeholder="250"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
