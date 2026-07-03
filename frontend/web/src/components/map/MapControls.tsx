"use client";

/** Floating map controls (zoom, recenter on the user, toggle live crew). */

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  realtime: boolean;
  onToggleRealtime: () => void;
  locating: boolean;
  fogEnabled: boolean;
  onToggleFog: () => void;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  realtime,
  onToggleRealtime,
  locating,
  fogEnabled,
  onToggleFog,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
      <ControlButton
        label={fogEnabled ? "Hide fog of war" : "Show fog of war"}
        onClick={onToggleFog}
        active={fogEnabled}
      >
        <span>{fogEnabled ? "🌫️" : "🗺️"}</span>
      </ControlButton>

      <ControlButton label="Toggle live crew" onClick={onToggleRealtime} active={realtime}>
        <span className={realtime ? "flyby-pulse-soft" : undefined}>{realtime ? "📡" : "⏸️"}</span>
      </ControlButton>

      <div className="overflow-hidden rounded-xl border border-edge bg-surface-2/90 backdrop-blur">
        <ControlButton label="Zoom in" onClick={onZoomIn} bare>
          +
        </ControlButton>
        <div className="h-px bg-edge" />
        <ControlButton label="Zoom out" onClick={onZoomOut} bare>
          −
        </ControlButton>
      </div>

      <ControlButton label="Recenter on me" onClick={onRecenter} active={locating}>
        <span className={locating ? "animate-spin" : undefined}>◎</span>
      </ControlButton>
    </div>
  );
}

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  /** When true, render without the standalone rounded card chrome. */
  bare?: boolean;
  children: React.ReactNode;
}

function ControlButton({ label, onClick, active, bare, children }: ControlButtonProps) {
  const base =
    "grid h-10 w-10 place-items-center text-lg text-ink-soft transition-colors hover:text-ink";
  if (bare) {
    return (
      <button type="button" aria-label={label} title={label} onClick={onClick} className={base}>
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`${base} rounded-xl border backdrop-blur ${
        active
          ? "border-brand/60 bg-brand/20 text-brand-soft"
          : "border-edge bg-surface-2/90"
      }`}
    >
      {children}
    </button>
  );
}
