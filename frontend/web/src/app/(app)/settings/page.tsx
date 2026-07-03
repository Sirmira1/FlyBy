"use client";

import { useState } from "react";
import { Card, PageShell } from "@/components/shell/PageShell";
import { Button, Notice, Toggle } from "@/components/ui/controls";
import type { UnitPref, UserRow } from "@/core/db-types";
import { useSession } from "@/store/SessionProvider";

/** A single labelled settings row. */
function Row({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{title}</div>
        {description && (
          <div className="mt-0.5 text-xs text-ink-soft">{description}</div>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, email, loading, patchProfile, signOut } = useSession();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(patch: Partial<UserRow>, key: string) {
    setSaving(key);
    setError(null);
    // Optimistic update.
    patchProfile(patch);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not save");
      }
    } catch {
      setError("Could not save");
    } finally {
      setSaving(null);
    }
  }

  if (loading && !profile) {
    return (
      <PageShell title="Settings">
        <p className="text-sm text-ink-soft">Loading…</p>
      </PageShell>
    );
  }
  if (!profile) {
    return (
      <PageShell title="Settings">
        <Notice>Couldn&apos;t load your settings.</Notice>
      </PageShell>
    );
  }

  return (
    <PageShell title="Settings" subtitle="Preferences, privacy, and notifications">
      <div className="mx-auto max-w-2xl space-y-6">
        {error && <Notice>{error}</Notice>}

        <section>
          <h2 className="mb-2 text-sm font-medium text-ink-soft">Units</h2>
          <Card className="py-0">
            <Row
              title="Speed &amp; distance"
              description="Choose how speeds and distances are displayed."
              control={
                <div className="inline-flex overflow-hidden rounded-lg border border-edge">
                  {(["km/h", "mph"] as UnitPref[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => update({ unit_pref: unit }, "unit")}
                      disabled={saving === "unit"}
                      className={`px-3 py-1.5 text-sm transition-colors ${
                        profile.unit_pref === unit
                          ? "bg-brand text-white"
                          : "text-ink-soft hover:bg-white/5"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              }
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-ink-soft">Privacy</h2>
          <Card className="py-0">
            <Row
              title="Ghost mode"
              description="Hide your live location from everyone."
              control={
                <Toggle
                  checked={profile.ghost_mode}
                  disabled={saving === "ghost"}
                  onChange={(v) => update({ ghost_mode: v }, "ghost")}
                  label="Ghost mode"
                />
              }
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-ink-soft">Notifications</h2>
          <Card className="divide-y divide-edge py-0">
            <Row
              title="Friend requests"
              control={
                <Toggle
                  checked={profile.notif_friend_requests}
                  disabled={saving === "nfr"}
                  onChange={(v) => update({ notif_friend_requests: v }, "nfr")}
                  label="Friend request notifications"
                />
              }
            />
            <Row
              title="Convoy invites"
              control={
                <Toggle
                  checked={profile.notif_convoy_invites}
                  disabled={saving === "nci"}
                  onChange={(v) => update({ notif_convoy_invites: v }, "nci")}
                  label="Convoy invite notifications"
                />
              }
            />
            <Row
              title="New personal record"
              control={
                <Toggle
                  checked={profile.notif_new_record}
                  disabled={saving === "nnr"}
                  onChange={(v) => update({ notif_new_record: v }, "nnr")}
                  label="New record notifications"
                />
              }
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-ink-soft">Account</h2>
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-ink">Signed in as</div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  @{profile.username} · {email}
                </div>
              </div>
              <Button variant="danger" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
