"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

/** Primary / secondary / ghost button. */
export function Button({
  variant = "primary",
  className = "",
  children,
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60";
  const variants: Record<string, string> = {
    primary: "bg-brand text-white hover:bg-brand/90",
    secondary: "border border-edge bg-card text-ink hover:bg-white/5",
    ghost: "text-ink-soft hover:text-ink hover:bg-white/5",
    danger: "border border-coral/40 text-coral hover:bg-coral/10",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}

/** Labeled text input. */
export function TextField({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:border-brand-soft/60 focus:outline-none focus:ring-1 focus:ring-brand-soft/40 ${className}`}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

/** Labeled select. */
export function SelectField({
  label,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:border-brand-soft/60 focus:outline-none focus:ring-1 focus:ring-brand-soft/40 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

/** Inline error / notice banner. */
export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    error: "border-coral/40 bg-coral/10 text-coral",
    success: "border-teal/40 bg-teal/10 text-teal-soft",
    info: "border-edge bg-card text-ink-soft",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

/** Accessible on/off switch. */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-brand" : "bg-white/15"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

