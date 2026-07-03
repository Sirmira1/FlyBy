"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, PageShell } from "@/components/shell/PageShell";
import { Button, Notice, TextField } from "@/components/ui/controls";
import { formatSpeed } from "@/core/units";
import type { FriendEntry, FriendsResponse } from "@/app/api/friends/route";
import { useSession } from "@/store/SessionProvider";

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/80 text-xs font-semibold text-white">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const { profile } = useSession();
  const pref = profile?.unit_pref ?? "km/h";

  const [data, setData] = useState<FriendsResponse>({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/friends", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ tone: "error", text: body.error ?? "Could not send request" });
        return;
      }
      setMessage({ tone: "success", text: `Request sent to @${username.trim().toLowerCase()}` });
      setUsername("");
      await load();
    } catch {
      setMessage({ tone: "error", text: "Could not send request" });
    } finally {
      setAdding(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <PageShell title="Friends" subtitle="Your crew and pending requests">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <form onSubmit={addFriend} className="space-y-3">
            <div className="text-sm font-medium text-ink">Add a friend</div>
            {message && <Notice tone={message.tone}>{message.text}</Notice>}
            <div className="flex gap-2">
              <div className="flex-1">
                <TextField
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
              <Button type="submit" loading={adding}>
                Send request
              </Button>
            </div>
          </form>
        </Card>

        {data.incoming.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium text-ink-soft">
              Incoming requests ({data.incoming.length})
            </h2>
            <ul className="space-y-2">
              {data.incoming.map((entry) => (
                <li
                  key={entry.friendshipId}
                  className="flex items-center gap-3 rounded-xl border border-edge bg-surface-2/40 px-4 py-3"
                >
                  <Avatar name={entry.user.display_name || entry.user.username} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {entry.user.display_name || entry.user.username}
                    </div>
                    <div className="truncate text-xs text-ink-soft">
                      @{entry.user.username}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button onClick={() => respond(entry.friendshipId, "accept")}>
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => respond(entry.friendshipId, "decline")}
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.outgoing.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium text-ink-soft">
              Pending ({data.outgoing.length})
            </h2>
            <ul className="space-y-2">
              {data.outgoing.map((entry) => (
                <li
                  key={entry.friendshipId}
                  className="flex items-center gap-3 rounded-xl border border-edge bg-surface-2/40 px-4 py-3"
                >
                  <Avatar name={entry.user.display_name || entry.user.username} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {entry.user.display_name || entry.user.username}
                    </div>
                    <div className="truncate text-xs text-ink-soft">
                      @{entry.user.username} · awaiting response
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => remove(entry.friendshipId)}>
                    Cancel
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-medium text-ink-soft">
            Friends ({data.friends.length})
          </h2>
          {loading ? (
            <p className="text-sm text-ink-soft">Loading…</p>
          ) : data.friends.length === 0 ? (
            <EmptyState
              glyph="👥"
              title="No friends yet"
              hint="Add someone by their username to build your crew."
            />
          ) : (
            <ul className="space-y-2">
              {data.friends.map((entry: FriendEntry) => (
                <li
                  key={entry.friendshipId}
                  className="flex items-center gap-3 rounded-xl border border-edge bg-surface-2/40 px-4 py-3"
                >
                  <Avatar name={entry.user.display_name || entry.user.username} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {entry.user.display_name || entry.user.username}
                    </div>
                    <div className="truncate text-xs text-ink-soft">
                      @{entry.user.username} · top {formatSpeed(entry.user.top_speed, pref)}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(entry.friendshipId)}
                    className="shrink-0 text-ink-mute hover:text-coral"
                    aria-label="Remove friend"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
