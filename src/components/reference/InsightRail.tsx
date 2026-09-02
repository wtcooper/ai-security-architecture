"use client";

/**
 * The rail beside the diagram — F5's "Insights" panel translated onto this framework's spine:
 * sequence data flows over the canvas, the numbered capabilities that must be deployed (their
 * design-requirements list), and the coded risks pinned to the drawing (their OWASP list).
 * Every row links into the taxonomy tab that owns the entity. The lists themselves live in
 * rail-lists.tsx so the alternative page designs can compose them differently.
 */
import { useState, type ReactNode } from "react";

import type { Archetype, Scenario } from "@/lib/types";
import type { Highlight } from "./FlowDiagram";
import { CapabilityList, RiskList, WalkList } from "./rail-lists";

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
  return (
    <div className="space-y-5">
      <section>
        <p className="eyebrow">Sequence data flows</p>
        <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
          Select one to number its steps onto the drawing and open its sequence diagram below.
          The first is the complete walk through the architecture; the rest are variations on it.
        </p>
        <div className="mt-2">
          <WalkList walks={walks} walk={walk} onWalk={onWalk} />
        </div>
      </section>

      <RailSection
        title={`Capabilities to deploy · ${archetype.capabilities.length}`}
        hint="The numbered chips on the drawing. Each number marks where the capability must sit."
      >
        <div className="mt-2">
          <CapabilityList archetype={archetype} highlight={highlight} onHighlight={onHighlight} />
        </div>
      </RailSection>

      <RailSection
        title={`Risks on the drawing · ${archetype.risks.length}`}
        hint="CoSAI risks, tagged where they surface. Codes are stable across every architecture."
      >
        <div className="mt-2">
          <RiskList archetype={archetype} highlight={highlight} onHighlight={onHighlight} />
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
