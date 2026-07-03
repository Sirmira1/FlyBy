"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/SessionProvider";

interface NavItem {
  href: string;
  label: string;
  glyph: string;
}

const PRIMARY: NavItem[] = [
  { href: "/map", label: "Map", glyph: "🗺️" },
  { href: "/garage", label: "Garage", glyph: "🏎️" },
  { href: "/leaderboard", label: "Ranks", glyph: "🏆" },
  { href: "/trips", label: "Trips", glyph: "🛣️" },
  { href: "/friends", label: "Friends", glyph: "👥" },
  { href: "/convoy", label: "Convoy", glyph: "🚗" },
];

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`group flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors ${
        active
          ? "bg-brand/20 text-ink"
          : "text-ink-soft hover:bg-white/5 hover:text-ink"
      }`}
    >
      <span className="text-lg leading-none">{item.glyph}</span>
      <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
    </Link>
  );
}

export function NavRail() {
  const pathname = usePathname();
  const { profile, signOut } = useSession();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const initials = (profile?.display_name || profile?.username || "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="flex h-full w-[76px] shrink-0 flex-col items-center border-r border-edge bg-surface-2/80 py-3">
      <Link href="/map" className="mb-3 text-xl" title="FlyBy">
        🏁
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        {PRIMARY.map((item) => (
          <RailLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>

      <div className="mt-2 flex flex-col items-center gap-1">
        <Link
          href="/settings"
          title="Settings"
          className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors ${
            isActive("/settings")
              ? "bg-brand/20 text-ink"
              : "text-ink-soft hover:bg-white/5 hover:text-ink"
          }`}
        >
          <span className="text-lg leading-none">⚙️</span>
          <span className="text-[10px] font-medium tracking-wide">Settings</span>
        </Link>

        <Link
          href="/profile"
          title="Profile"
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white ring-2 ring-transparent transition hover:ring-brand-soft/50"
        >
          {initials}
        </Link>

        <button
          onClick={() => void signOut()}
          title="Sign out"
          className="mt-1 rounded-xl px-2 py-1.5 text-ink-mute transition-colors hover:bg-white/5 hover:text-coral"
        >
          <span className="text-base leading-none">⏻</span>
        </button>
      </div>
    </nav>
  );
}
