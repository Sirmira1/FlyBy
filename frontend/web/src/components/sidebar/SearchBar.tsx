"use client";

/** Controlled search input for filtering markers by text. */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute"
        aria-hidden
      >
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search spots & crew…"
        aria-label="Search markers"
        className="w-full rounded-xl border border-edge bg-card py-2.5 pl-9 pr-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-mute focus:border-brand/60"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-ink-mute transition-colors hover:bg-edge hover:text-ink"
        >
          ✕
        </button>
      )}
    </div>
  );
}
