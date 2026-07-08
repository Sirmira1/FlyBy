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
    <>
      <nav className="hidden h-full w-[76px] shrink-0 flex-col items-center border-r border-edge bg-surface-2/80 py-3 md:flex">
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

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-surface-2/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-screen-sm grid-cols-6 gap-1">
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors ${
                isActive(item.href)
                  ? "bg-brand/20 text-ink"
                  : "text-ink-soft hover:bg-white/5 hover:text-ink"
              }`}
            >
              <span className="text-base leading-none">{item.glyph}</span>
              <span className="font-medium tracking-wide">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-1.5 flex max-w-screen-sm items-center justify-between px-1">
          <Link
            href="/profile"
            title="Profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white"
          >
            {initials}
          </Link>

          <Link
            href="/settings"
            title="Settings"
            className={`rounded-lg px-2 py-1.5 text-xs transition-colors ${
              isActive("/settings")
                ? "bg-brand/20 text-ink"
                : "text-ink-soft hover:bg-white/5 hover:text-ink"
            }`}
          >
            ⚙️ Settings
          </Link>

          <button
            onClick={() => void signOut()}
            title="Sign out"
            className="rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-white/5 hover:text-coral"
          >
            Sign out
          </button>
        </div>
      </nav>
    </>
  );
}
