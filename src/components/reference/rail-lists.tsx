"use client";

/** The sequence data flows as a pick list: the architecture view's flows tab. */
import type { Scenario } from "@/lib/types";

export function WalkList({
  walks,
  walk,
  onWalk,
  dense = false,
}: {
  walks: Scenario[];
  walk: number | null;
  onWalk: (index: number | null) => void;
  /** One-line rows for tight columns. */
  dense?: boolean;
}) {
  return (
    <div className={dense ? "space-y-1" : "space-y-1.5"}>
      {walks.map((w, i) => {
        const active = walk === i;
        return (
          <button
            key={w.title}
            type="button"
            onClick={() => onWalk(active ? null : i)}
            aria-pressed={active}
            className={`block w-full rounded-lg border text-left leading-snug transition-colors ${
              dense ? "px-2.5 py-1.5 text-[12px]" : "px-3 py-2 text-[12.5px]"
            } ${
              active
                ? "border-mitigated bg-mitigated-soft font-semibold text-ink"
                : "border-line bg-paper text-ink-2 hover:border-line-strong"
            }`}
          >
            {i === 0 && (
              <span className="ident mr-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                Walkthrough
              </span>
            )}
            {w.title}
            <span className="ml-1.5 opacity-60">{w.steps.length} steps</span>
          </button>
        );
      })}
    </div>
  );
}
