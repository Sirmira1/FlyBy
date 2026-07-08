import type { ReactNode } from "react";
import { NavRail } from "@/components/shell/NavRail";
import { SessionProvider } from "@/store/SessionProvider";

/**
 * Protected app shell. Middleware guarantees a session before these routes
 * render; here we mount the session context and the persistent nav rail.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-surface">
        <NavRail />
        <div className="min-w-0 flex-1 overflow-hidden pb-[88px] md:pb-0">{children}</div>
      </div>
    </SessionProvider>
  );
}
