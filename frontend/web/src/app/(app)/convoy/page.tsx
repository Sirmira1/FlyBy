"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, PageShell } from "@/components/shell/PageShell";
import { Button, Notice, SelectField, TextField } from "@/components/ui/controls";
import { formatSpeed } from "@/core/units";
import type { ConvoyDetails, ConvoyMember } from "@/app/api/convoys/route";
import type { FriendsResponse } from "@/app/api/friends/route";
import { useSession } from "@/store/SessionProvider";

function timeAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function ConvoyPage() {
  const { profile } = useSession();
  const pref = profile?.unit_pref ?? "km/h";

  const [convoy, setConvoy] = useState<ConvoyDetails | null>(null);
  const [friends, setFriends] = useState<FriendsResponse["friends"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [invitees, setInvitees] = useState<Set<string>>(new Set());
  const [addFriendId, setAddFriendId] = useState("");

  const loadConvoy = useCallback(async () => {
    const res = await fetch("/api/convoys", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setConvoy(data.convoy);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [, fRes] = await Promise.all([
        loadConvoy(),
        fetch("/api/friends", { cache: "no-store" }),
      ]);
      if (fRes.ok) {
        const fData: FriendsResponse = await fRes.json();
        setFriends(fData.friends);
      }
    } finally {
      setLoading(false);
    }
  }, [loadConvoy]);

  useEffect(() => {
    void load();
  }, [load]);

  // While in a convoy, poll for live member positions.
  useEffect(() => {
    if (!convoy) return;
    const t = setInterval(() => void loadConvoy(), 5000);
    return () => clearInterval(t);
  }, [convoy, loadConvoy]);

  async function startConvoy(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/convoys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destination_name: destination,
          member_ids: Array.from(invitees),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start convoy");
        return;
      }
      setConvoy(data.convoy);
      setName("");
      setDestination("");
      setInvitees(new Set());
    } catch {
      setError("Could not start convoy");
    } finally {
      setBusy(false);
    }
  }

  async function patch(action: string, memberId?: string) {
    if (!convoy) return;
    setBusy(true);
    try {
      await fetch(`/api/convoys/${convoy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, memberId }),
      });
      if (action === "end" || action === "leave") {
        setConvoy(null);
      } else {
        await loadConvoy();
      }
    } finally {
      setBusy(false);
      setAddFriendId("");
    }
  }

  function toggleInvitee(id: string) {
    setInvitees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <PageShell title="Convoy">
        <p className="text-sm text-ink-soft">Loading…</p>
      </PageShell>
    );
  }

  // --- Active convoy view -------------------------------------------------
  if (convoy) {
    const isHost = convoy.created_by === profile?.id;
    const memberIdSet = new Set(convoy.members.map((m) => m.id));
    const addableFriends = friends.filter((f) => !memberIdSet.has(f.user.id));

    return (
      <PageShell
        title={convoy.name || "Convoy"}
        subtitle={
          convoy.destination_name
            ? `Heading to ${convoy.destination_name}`
            : "On the road"
        }
        actions={
          isHost ? (
            <Button variant="danger" loading={busy} onClick={() => patch("end")}>
              End convoy
            </Button>
          ) : (
            <Button variant="secondary" loading={busy} onClick={() => patch("leave")}>
              Leave
            </Button>
          )
        }
      >
        <div className="mx-auto max-w-2xl space-y-5">
          <section>
            <h2 className="mb-2 text-sm font-medium text-ink-soft">
              Crew ({convoy.members.length})
            </h2>
            <ul className="space-y-2">
              {convoy.members.map((member: ConvoyMember) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-edge bg-surface-2/40 px-4 py-3"
                >
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/80 text-xs font-semibold text-white">
                    {(member.display_name || member.username).slice(0, 2).toUpperCase()}
                    {member.live && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-teal" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {member.display_name || member.username}
                      {member.isCreator && (
                        <span className="ml-2 text-[10px] text-brand-soft">HOST</span>
                      )}
                      {member.isMe && (
                        <span className="ml-2 text-[10px] text-ink-mute">you</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-ink-soft">
                      {member.live
                        ? `${formatSpeed(member.live.speed, pref)} · ${timeAgo(member.live.updated_at)}`
                        : "no live signal"}
                    </div>
                  </div>
                  {isHost && !member.isCreator && (
                    <button
                      onClick={() => patch("remove_member", member.id)}
                      className="shrink-0 text-ink-mute hover:text-coral"
                      aria-label="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {isHost && addableFriends.length > 0 && (
            <Card>
              <div className="mb-2 text-sm font-medium text-ink">Invite a friend</div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectField
                    value={addFriendId}
                    onChange={(e) => setAddFriendId(e.target.value)}
                  >
                    <option value="">Select a friend…</option>
                    {addableFriends.map((f) => (
                      <option key={f.user.id} value={f.user.id}>
                        {f.user.display_name || f.user.username}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <Button
                  disabled={!addFriendId}
                  loading={busy}
                  onClick={() => patch("add_member", addFriendId)}
                >
                  Add
                </Button>
              </div>
            </Card>
          )}
        </div>
      </PageShell>
    );
  }

  // --- No convoy: start one ----------------------------------------------
  return (
    <PageShell title="Convoy" subtitle="Roll out with your crew">
      <div className="mx-auto max-w-2xl">
        <Card>
          <form onSubmit={startConvoy} className="space-y-4">
            <div className="text-sm font-medium text-ink">Start a convoy</div>
            {error && <Notice>{error}</Notice>}
            <TextField
              label="Convoy name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sunday canyon run"
            />
            <TextField
              label="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Mount Royal Lookout"
            />
            <div>
              <div className="mb-1.5 text-xs font-medium text-ink-soft">
                Invite friends
              </div>
              {friends.length === 0 ? (
                <p className="text-sm text-ink-mute">
                  Add friends first to invite them to a convoy.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {friends.map((f) => {
                    const selected = invitees.has(f.user.id);
                    return (
                      <button
                        key={f.user.id}
                        type="button"
                        onClick={() => toggleInvitee(f.user.id)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          selected
                            ? "border-brand bg-brand/20 text-ink"
                            : "border-edge text-ink-soft hover:bg-white/5"
                        }`}
                      >
                        {f.user.display_name || f.user.username}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button type="submit" loading={busy}>
              Start convoy
            </Button>
          </form>
        </Card>

        <div className="mt-6">
          <EmptyState
            glyph="🚗"
            title="No active convoy"
            hint="Start one above, then watch your crew move on the map in real time."
          />
        </div>
      </div>
    </PageShell>
  );
}
