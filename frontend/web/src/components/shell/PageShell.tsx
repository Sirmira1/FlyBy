import type { ReactNode } from "react";

/**
 * Standard scrollable content page: sticky header (title + optional actions)
 * over a scroll area. Used by every non-map app page for a consistent frame.
 */
export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-surface text-ink">
      <header className="flex items-center justify-between gap-4 border-b border-edge px-6 py-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-ink-soft">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
    </div>
  );
}

/** A simple bordered card used across content pages. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-edge bg-surface-2/40 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/** Centered empty-state block. */
export function EmptyState({
  glyph,
  title,
  hint,
  action,
}: {
  glyph: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge px-6 py-14 text-center">
      <div className="mb-3 text-3xl">{glyph}</div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-soft">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
