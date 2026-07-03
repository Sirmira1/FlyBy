import Link from "next/link";
import type { ReactNode } from "react";

/** Branded wrapper for the login / signup cards. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/map" className="mb-8 flex items-center justify-center gap-2">
          <span className="text-2xl">🏎️</span>
          <span className="text-xl font-semibold tracking-tight text-ink">
            FlyBy
          </span>
        </Link>

        <div className="rounded-2xl border border-edge bg-surface-2/60 p-6 shadow-xl backdrop-blur">
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-5 text-center text-sm text-ink-soft">{footer}</div>
      </div>
    </div>
  );
}
