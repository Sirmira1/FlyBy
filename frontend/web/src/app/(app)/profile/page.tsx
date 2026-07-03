"use client";

import { useEffect, useState } from "react";
import type { ProfileSummary } from "@/app/api/profile/summary/route";
import { Card, EmptyState, PageShell } from "@/components/shell/PageShell";
import { Button, Notice, TextField } from "@/components/ui/controls";
import { formatDistance, formatDuration, formatSpeed } from "@/core/units";
import { useSession } from "@/store/SessionProvider";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "gold" | "brand";
}) {
  const valueColor =
    accent === "gold"
      ? "text-[#ef9f27]"
      : accent === "brand"
        ? "text-brand-soft"
        : "text-ink";
  return (
    <div className="rounded-xl border border-edge bg-surface-2/40 px-4 py-3">
      <div className={`text-lg font-semibold ${valueColor}`}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  );
}

/** ISO 3166-1 alpha-2 → flag emoji (e.g. "ca" → 🇨🇦). Falls back to 🏙️. */
function flagEmoji(code: string | null): string {
  if (!code || code.length !== 2) return "🏙️";
  const base = 0x1f1e6;
  const chars = code
    .toUpperCase()
    .split("")
    .map((c) => base + (c.charCodeAt(0) - 65));
  if (chars.some((n) => n < base || n > base + 25)) return "🏙️";
  return String.fromCodePoint(...chars);
}

const CITY_COLORS = ["#1d9e75", "#a89ff5"];

export default function ProfilePage() {
  const { profile, email, loading, patchProfile } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile/summary", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSummary(data as ProfileSummary);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !profile) {
    return (
      <PageShell title="Profile">
        <p className="text-sm text-ink-soft">Loading…</p>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell title="Profile">
        <EmptyState glyph="🙈" title="Couldn't load your profile" />
      </PageShell>
    );
  }

  const pref = profile.unit_pref;
  const initials = (profile.display_name || profile.username)
    .slice(0, 2)
    .toUpperCase();
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  const activeVehicle = summary?.activeVehicle ?? null;
  const cities = summary?.cities ?? [];
  const recentTrips = summary?.recentTrips ?? [];
  const friends = summary?.friends ?? { count: 0, preview: [] };

  function startEdit() {
    setDisplayName(profile?.display_name ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      patchProfile({ display_name: data.profile.display_name });
      setEditing(false);
    } catch {
      setError("Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Profile"
      subtitle={`@${profile.username}`}
      actions={
        !editing ? (
          <Button variant="secondary" onClick={startEdit}>
            Edit
          </Button>
        ) : undefined
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              {!editing ? (
                <>
                  <div className="text-lg font-semibold text-ink">
                    {profile.display_name || profile.username}
                  </div>
                  <div className="text-sm text-ink-soft">
                    @{profile.username} · {email}
                  </div>
                  <div className="mt-1 text-xs text-ink-mute">
                    Member since {memberSince}
                  </div>
                  {activeVehicle && (
                    <div className="mt-1.5 text-xs text-ink-soft">
                      🏎️ {activeVehicle.label}
                      {activeVehicle.fuel_type
                        ? ` · ${activeVehicle.fuel_type}`
                        : ""}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {error && <Notice>{error}</Notice>}
                  <TextField
                    label="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={profile.username}
                    maxLength={60}
                  />
                  <div className="flex gap-2">
                    <Button onClick={save} loading={saving}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {friends.preview.length > 0 && (
            <div className="mt-4 flex items-center gap-2 border-t border-edge pt-4">
              <div className="flex -space-x-2">
                {friends.preview.map((f) => (
                  <div
                    key={f.username}
                    title={`@${f.username}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-2 text-[10px] font-semibold text-brand-soft"
                  >
                    {f.initials}
                  </div>
                ))}
              </div>
              {friends.count > friends.preview.length && (
                <span className="text-xs text-ink-mute">
                  +{friends.count - friends.preview.length} more
                </span>
              )}
            </div>
          )}
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Lifetime stats</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Top speed" value={formatSpeed(profile.top_speed, pref)} accent="gold" />
            <Stat label="Total distance" value={formatDistance(profile.total_kilometers, pref)} />
            <Stat
              label="Global rank"
              value={summary?.rank ? `#${summary.rank}` : "—"}
              accent="brand"
            />
            <Stat label="Avg speed" value={formatSpeed(profile.avg_speed, pref)} />
            <Stat label="Trips" value={String(profile.trip_count)} />
            <Stat
              label="Cities explored"
              value={String(cities.length)}
              accent="gold"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-soft">City exploration</h2>
          {cities.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-soft">
                No cities explored yet — hit the road and the map will fill in.
              </p>
            </Card>
          ) : (
            <Card>
              <div className="space-y-4">
                {cities.map((c, i) => {
                  const pct = Math.max(0, Math.min(100, c.percentage));
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-xl">{flagEmoji(c.country_code)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="truncate text-sm font-medium text-ink">
                            {c.name ?? "Unknown city"}
                          </span>
                          <span className="ml-2 shrink-0 text-xs font-semibold text-ink-soft">
                            {pct < 10 ? pct.toFixed(1) : Math.round(pct)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: CITY_COLORS[i % CITY_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {recentTrips.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-ink-soft">Recent trips</h2>
            <Card>
              <div className="divide-y divide-edge">
                {recentTrips.map((t) => {
                  const when = t.started_at
                    ? new Date(t.started_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "—";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink">
                          {t.is_convoy ? "👥 Convoy run" : "🛣️ Drive"}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-mute">
                          {when} · {formatDuration(t.duration_sec)} ·{" "}
                          {formatSpeed(t.avg_speed, pref)} avg
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#ef9f27]">
                          {formatSpeed(t.top_speed, pref)}
                        </div>
                        <div className="text-xs text-ink-mute">
                          {formatDistance(t.distance, pref)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
