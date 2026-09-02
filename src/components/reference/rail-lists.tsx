"use client";

/**
 * The three lists the architecture view composes into its tabs: the sequence data flows,
 * the numbered capabilities, and the coded risks. Kept apart from the layout so a list can
 * sit in a tab, a rail or a column without being re-implemented.
 */
import Link from "next/link";

import { capabilityById, riskById, riskCode } from "@/lib/data";
import type { Archetype, Scenario } from "@/lib/types";
import type { Highlight } from "./FlowDiagram";

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

function notesFor(pins: { note?: string }[]) {
  return pins.map((p) => p.note).filter((n): n is string => Boolean(n));
}

export function CapabilityList({
  archetype,
  highlight,
  onHighlight,
  columns = 1,
}: {
  archetype: Archetype;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={columns === 2 ? "space-y-1 sm:columns-2 sm:gap-x-6" : "space-y-1"}>
      {archetype.capabilities.map((id, i) => {
        const capability = capabilityById.get(id);
        const active = highlight?.kind === "capability" && highlight.id === id;
        const notes = notesFor(archetype.pins.capabilities.filter((p) => p.capability === id));
        return (
          <div key={id} className="break-inside-avoid">
            <button
              onClick={() => onHighlight(active ? null : { kind: "capability", id })}
              aria-pressed={active}
              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                active ? "border-introduced bg-introduced-soft" : "border-transparent hover:bg-mist"
              }`}
            >
              <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-introduced bg-introduced-soft text-[10.5px] font-bold text-introduced">
                {i + 1}
              </span>
              <span className="text-[12.5px] leading-tight text-ink">{capability?.title ?? id}</span>
            </button>
            {active && (
              <div className="mb-1 ml-8 mt-1 space-y-1">
                {notes.map((note, ni) => (
                  <p key={ni} className="text-[11.5px] leading-snug text-ink-2">
                    {note}
                  </p>
                ))}
                <Link
                  href={`/capabilities?capability=${id}`}
                  className="inline-block text-[11.5px] font-semibold text-introduced hover:underline"
                >
                  Open on the Capabilities tab →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RiskList({
  archetype,
  highlight,
  onHighlight,
  columns = 1,
}: {
  archetype: Archetype;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={columns === 2 ? "space-y-1 sm:columns-2 sm:gap-x-6" : "space-y-1"}>
      {archetype.risks.map((id) => {
        const risk = riskById.get(id);
        const active = highlight?.kind === "risk" && highlight.id === id;
        const notes = notesFor(archetype.pins.risks.filter((p) => p.risk === id));
        return (
          <div key={id} className="break-inside-avoid">
            <button
              onClick={() => onHighlight(active ? null : { kind: "risk", id })}
              aria-pressed={active}
              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                active ? "border-ink bg-mist" : "border-transparent hover:bg-mist"
              }`}
            >
              <span className="ident shrink-0 rounded-sm border border-line-strong bg-mist px-1 py-px text-[9.5px] font-bold text-ink-2">
                {riskCode(id)}
              </span>
              <span className="text-[12.5px] leading-tight text-ink">{risk?.title ?? id}</span>
            </button>
            {active && (
              <div className="mb-1 ml-8 mt-1 space-y-1">
                {notes.map((note, ni) => (
                  <p key={ni} className="text-[11.5px] leading-snug text-ink-2">
                    {note}
                  </p>
                ))}
                <Link
                  href={`/risks?risk=${id}`}
                  className="inline-block text-[11.5px] font-semibold text-introduced hover:underline"
                >
                  Open on the Risks tab →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
