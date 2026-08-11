"use client";

import { PHASES, type Phase } from "@/lib/types";

export const PHASE_META: Record<Phase, { label: string; blurb: string; token: string }> = {
  introduced: {
    label: "Introduced",
    blurb: "Where the risk enters the system",
    token: "var(--introduced)",
  },
  exposed: {
    label: "Exposed",
    blurb: "Where it becomes visible or does damage",
    token: "var(--exposed)",
  },
  mitigated: {
    label: "Mitigated",
    blurb: "Where controls can stop it",
    token: "var(--mitigated)",
  },
};

/**
 * The one control that does three jobs: it names the three phases (legend), shows how far
 * through the risk you are (progress), and switches phases (navigation).
 */
export function PhaseRail({
  phase,
  onChange,
  counts,
}: {
  phase: Phase;
  onChange: (phase: Phase) => void;
  counts?: Record<Phase, number>;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Risk phase">
      {PHASES.map((p) => {
        const meta = PHASE_META[p];
        const active = p === phase;
        const passed = PHASES.indexOf(p) < PHASES.indexOf(phase);
        return (
          <button
            key={p}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            className="group text-left"
          >
            <span
              className="block h-[3px] rounded-full transition-colors"
              style={{
                background: active || passed ? meta.token : "var(--line)",
              }}
            />
            <span
              className="mt-2 flex items-baseline gap-1.5 text-[12.5px] font-semibold transition-colors"
              style={{ color: active ? meta.token : "var(--ink-3)" }}
            >
              {meta.label}
              {counts && (
                <span className="ident" style={{ color: "inherit", opacity: 0.75 }}>
                  {counts[p]}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Small inline key used on pages that show the map without the tour controls. */
export function PhaseLegend({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-1.5 ${className}`}>
      {PHASES.map((p) => (
        <li key={p} className="flex items-center gap-2 text-[12.5px] text-ink-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: PHASE_META[p].token }}
            aria-hidden
          />
          <span className="font-semibold" style={{ color: PHASE_META[p].token }}>
            {PHASE_META[p].label}
          </span>
          <span className="text-ink-3">{PHASE_META[p].blurb}</span>
        </li>
      ))}
    </ul>
  );
}
