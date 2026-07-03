"use client";

/** Small category pill reused in the list and detail panels. */
import { CATEGORIES } from "@/core/config";
import type { MarkerCategory } from "@/core/types";

export function CategoryBadge({ category }: { category: MarkerCategory }) {
  const meta = CATEGORIES[category];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{
        borderColor: `${meta.color}55`,
        background: `${meta.color}1a`,
        color: meta.color,
      }}
    >
      <span aria-hidden>{meta.glyph}</span>
      {meta.label}
    </span>
  );
}
