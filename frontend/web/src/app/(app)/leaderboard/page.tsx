"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Notice } from "@/components/ui/controls";
import { formatDistance, formatSpeed } from "@/core/units";
import type { LeaderboardRow } from "@/app/api/leaderboard/route";
import { useSession } from "@/store/SessionProvider";

type Scope = "global" | "friends";
type Metric = "top_speed" | "avg_speed" | "total_kilometers" | "trip_count";

const METRIC_LABELS: Record<Metric, string> = {
  top_speed: "Top speed",
  avg_speed: "Avg speed",
  total_kilometers: "Distance",
  trip_count: "Trips",
};

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-edge">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm transition-colors ${
            value === opt.value
              ? "bg-brand text-white"
              : "text-ink-soft hover:bg-white/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const { profile } = useSession();
  const pref = profile?.unit_pref ?? "km/h";

  const [scope, setScope] = useState<Scope>("global");
  const [metric, setMetric] = useState<Metric>("top_speed");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard?scope=${scope}&metric=${metric}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed to load leaderboard");
      const data = await res.json();
      setRows(data.rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [scope, metric]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  function metricValue(row: LeaderboardRow): string {
    switch (metric) {
      case "top_speed":
        return formatSpeed(row.top_speed, pref);
      case "avg_speed":
        return formatSpeed(row.avg_speed, pref);
      case "total_kilometers":
        return formatDistance(row.total_kilometers, pref);
      case "trip_count":
        return String(row.trip_count);
    }
  }

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <PageShell
      title="Leaderboard"
      subtitle="Race to the top of the board"
      actions={
        <Segmented<Scope>
          value={scope}
          onChange={setScope}
          options={[
            { value: "global", label: "Global" },
            { value: "friends", label: "Friends" },
          ]}
        />
      }
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <Segmented<Metric>
            value={metric}
            onChange={setMetric}
            options={(Object.keys(METRIC_LABELS) as Metric[]).map((m) => ({
              value: m,
              label: METRIC_LABELS[m],
            }))}
          />
        </div>

        {error && (
          <div className="mb-4">
            <Notice>{error}</Notice>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink-soft">Loading rankings…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-soft">No racers on the board yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  row.is_me
                    ? "border-brand/50 bg-brand/10"
                    : "border-edge bg-surface-2/40"
                }`}
              >
                <div className="w-8 shrink-0 text-center text-sm font-semibold text-ink-soft">
                  {medal(row.rank) ?? row.rank}
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/80 text-xs font-semibold text-white">
                  {(row.display_name || row.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {row.display_name || row.username}
                    {row.is_me && (
                      <span className="ml-2 text-xs text-brand-soft">you</span>
                    )}
                  </div>
                  <div className="truncate text-xs text-ink-soft">
                    @{row.username}
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm font-semibold text-teal-soft">
                  {metricValue(row)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
