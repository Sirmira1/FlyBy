"use client";

/** Toggleable category filter chips with per-category counts. */
import { CATEGORY_LIST } from "@/core/config";
import type { MarkerCategory } from "@/core/types";

interface CategoryFilterProps {
  active: MarkerCategory[];
  counts: Record<MarkerCategory, number>;
  onToggle: (category: MarkerCategory) => void;
  onClear: () => void;
  isFiltered: boolean;
}

export function CategoryFilter({
  active,
  counts,
  onToggle,
  onClear,
  isFiltered,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_LIST.map((category) => {
        const isActive = active.includes(category.id);
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onToggle(category.id)}
            aria-pressed={isActive}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={{
              borderColor: isActive ? category.color : "rgba(255,255,255,0.08)",
              background: isActive ? `${category.color}22` : "transparent",
              color: isActive ? category.color : "rgba(224,224,240,0.6)",
            }}
          >
            <span aria-hidden>{category.glyph}</span>
            {category.label}
            <span className="text-ink-mute">{counts[category.id]}</span>
          </button>
        );
      })}
      {isFiltered && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium text-ink-mute transition-colors hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
