"use client";

/**
 * A clustered group of markers. Size scales with the contained count; colour
 * comes from the cluster's dominant category. Clicking expands the cluster.
 */
import { CATEGORIES } from "@/core/config";
import type { MarkerCategory } from "@/core/types";

interface ClusterBubbleProps {
  count: number;
  category: MarkerCategory;
  onClick: () => void;
}

export function ClusterBubble({ count, category, onClick }: ClusterBubbleProps) {
  const meta = CATEGORIES[category];
  const size = count < 10 ? 38 : count < 25 ? 46 : 54;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${count} markers — zoom in`}
      className="pointer-events-auto grid cursor-pointer place-items-center rounded-full font-semibold text-ink transition-transform duration-150 hover:scale-110"
      style={{
        width: size,
        height: size,
        background: `${meta.color}26`,
        border: `1.5px solid ${meta.color}`,
        boxShadow: `0 0 0 6px ${meta.color}14, 0 4px 14px rgba(0,0,0,0.45)`,
      }}
    >
      <span className="text-sm leading-none">{count}</span>
    </button>
  );
}
