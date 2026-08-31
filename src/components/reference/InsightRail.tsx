"use client";

/**
 * The rail beside the diagram — F5's "Insights" panel translated onto this framework's spine:
 * sequence data flows over the canvas, the numbered capabilities that must be deployed (their
 * design-requirements list), and the coded risks pinned to the drawing (their OWASP list).
 * Every row links into the taxonomy tab that owns the entity.
 */
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { capabilityById, riskById, riskCode } from "@/lib/data";
import type { Archetype, Scenario } from "@/lib/types";
import type { Highlight } from "./FlowDiagram";

interface InsightRailProps {
  archetype: Archetype;
  /** Every walk on the drawing, walkthrough first. They behave identically. */
  walks: Scenario[];
  /** Index into `walks`, or null when nothing is selected and the drawing carries no numbers. */
  walk: number | null;
  onWalk: (index: number | null) => void;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
}

export function InsightRail({
  archetype,
  walks,
  walk,
  onWalk,
  highlight,
  onHighlight,
}: InsightRailProps) {
  const capabilityNotes = new Map<string, string[]>();
  for (const pin of archetype.pins.capabilities) {
    if (pin.note) {
      capabilityNotes.set(pin.capability, [
        ...(capabilityNotes.get(pin.capability) ?? []),
        pin.note,
      ]);
    }
  }
  const riskNotes = new Map<string, string[]>();
  for (const pin of archetype.pins.risks) {
    if (pin.note) riskNotes.set(pin.risk, [...(riskNotes.get(pin.risk) ?? []), pin.note]);
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="eyebrow">Sequence data flows</p>
        <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
          Select one to number its steps onto the drawing and open its sequence diagram below.
          The first is the complete walk through the architecture; the rest are variations on it.
        </p>
        <div className="mt-2 space-y-1.5">
          {walks.map((w, i) => {
            const active = walk === i;
            return (
              <button
                key={w.title}
                type="button"
                onClick={() => onWalk(active ? null : i)}
                aria-pressed={active}
                className={`block w-full rounded-lg border px-3 py-2 text-left text-[12.5px] leading-snug transition-colors ${
                  active
                    ? "border-mitigated bg-mitigated-soft font-semibold text-ink"
                    : "border-line bg-paper text-ink-2 hover:border-line-strong"
                }`}
              >
                {w.title}
                <span className="ml-1.5 opacity-60">{w.steps.length} steps</span>
              </button>
            );
          })}
        </div>
      </section>

      <RailSection
        title={`Capabilities to deploy · ${archetype.capabilities.length}`}
        hint="The numbered chips on the drawing. Each number marks where the capability must sit."
      >
        <div className="mt-2 space-y-1">
          {archetype.capabilities.map((id, i) => {
            const capability = capabilityById.get(id);
            const active = highlight?.kind === "capability" && highlight.id === id;
            return (
              <div key={id}>
                <button
                  onClick={() => onHighlight(active ? null : { kind: "capability", id })}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                    active
                      ? "border-introduced bg-introduced-soft"
                      : "border-transparent hover:bg-mist"
                  }`}
                >
                  <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-introduced bg-introduced-soft text-[10.5px] font-bold text-introduced">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] leading-tight text-ink">
                    {capability?.title ?? id}
                  </span>
                </button>
                {active && (
                  <div className="mb-1 ml-8 mt-1 space-y-1">
                    {(capabilityNotes.get(id) ?? []).map((note, ni) => (
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
      </RailSection>

      <RailSection
        title={`Risks on the drawing · ${archetype.risks.length}`}
        hint="CoSAI risks, tagged where they surface. Codes are stable across every architecture."
      >
        <div className="mt-2 space-y-1">
          {archetype.risks.map((id) => {
            const risk = riskById.get(id);
            const active = highlight?.kind === "risk" && highlight.id === id;
            return (
              <div key={id}>
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
                    {(riskNotes.get(id) ?? []).map((note, ni) => (
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
      </RailSection>
    </div>
  );
}

/** A collapsible rail section, open by default — collapse to manage a long rail. */
function RailSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="eyebrow flex-1">{title}</span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          className={`shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M 2 4 L 6 8 L 10 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <>
          <p className="mt-1 text-[11.5px] leading-snug text-ink-3">{hint}</p>
          {children}
        </>
      )}
    </section>
  );
}
