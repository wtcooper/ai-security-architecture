"use client";

/**
 * One architecture on the page: the drawing at full width and everything else in one tab
 * strip beneath it — overview, sequence flows, capabilities, risks, guidance. One panel is
 * visible at a time and nothing is expanded by default, so the page never shows two lists
 * and a sequence diagram at once. Leaving the flows tab clears the numbering; leaving the
 * capability or risk tab clears the highlight, so the drawing always matches the panel.
 * Chosen over an inspector rail and a scroll-linked story after all three ran side by side.
 */
import { useState } from "react";

import { guidanceByArchetype } from "@/lib/data";
import type { Archetype, Scenario } from "@/lib/types";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { FlowDiagram, type Highlight } from "./FlowDiagram";
import { FlowLegend } from "./FlowLegend";
import { FlowSequence } from "./FlowSequence";
import { GuidancePanel } from "./GuidancePanel";
import { CapabilityList, RiskList, WalkList } from "./rail-lists";

type Tab = "overview" | "flows" | "capabilities" | "risks" | "guidance";

interface ArchetypeViewProps {
  archetype: Archetype;
  /** Every walk on the drawing, walkthrough first. They behave identically. */
  walks: Scenario[];
  /** Index into `walks`, or null when the drawing carries no step numbers. */
  walkIndex: number | null;
  onWalk: (index: number | null) => void;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
}

export function ArchetypeView({ archetype, walks, walkIndex, onWalk, highlight, onHighlight }: ArchetypeViewProps) {
  // Opens on the flows tab with the walkthrough traced: a reader's first sight of a drawing is
  // the numbered complete walk and its sequence, not an empty canvas waiting for a click.
  const [tab, setTab] = useState<Tab>("flows");
  const activeWalk = walkIndex === null ? null : walks[walkIndex] ?? null;
  const guidance = guidanceByArchetype.get(archetype.id);

  const go = (next: Tab) => {
    setTab(next);
    if (next !== "flows") onWalk(null);
    else if (walkIndex === null) onWalk(0);
    if (next !== "capabilities" && next !== "risks") onHighlight(null);
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "flows", label: "Sequence flows", count: walks.length },
    { id: "capabilities", label: "Capabilities", count: archetype.capabilities.length },
    { id: "risks", label: "Risks", count: archetype.risks.length },
    { id: "guidance", label: "Controls guidance", count: guidance?.items.length },
  ];

  return (
    <div className="mt-3">
      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <FlowDiagram
          archetype={archetype}
          walk={activeWalk}
          highlight={highlight}
          onHighlight={onHighlight}
          className="w-full"
        />
      </div>
      <FlowLegend className="mt-3 px-1" />

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => go(t.id)}
            className={`-mb-px shrink-0 whitespace-nowrap rounded-t-md border-b-2 px-3.5 py-2 text-[13px] transition-colors ${
              tab === t.id
                ? "border-ink font-semibold text-ink"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 opacity-60">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "overview" && <ArchetypeDetail archetype={archetype} />}

        {tab === "flows" && (
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="text-[12px] leading-snug text-ink-3">
                Select a flow to number its steps onto the drawing. The first is the complete walk;
                the rest are variations on it.
              </p>
              <div className="mt-3">
                <WalkList walks={walks} walk={walkIndex} onWalk={onWalk} />
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-line bg-paper">
              {activeWalk ? (
                <>
                  <div className="flex items-baseline gap-2 border-b border-line px-4 py-2.5 text-[12.5px]">
                    <span className="ident text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                      Sequence
                    </span>
                    <span className="font-semibold text-ink">{activeWalk.title}</span>
                    <span className="ml-auto text-[11px] text-ink-3">{activeWalk.steps.length} steps</span>
                  </div>
                  <FlowSequence archetype={archetype} walk={activeWalk} className="px-4 pb-4 pt-2" />
                </>
              ) : (
                <p className="px-5 py-10 text-center text-[13px] text-ink-3">
                  Pick a flow on the left to see its sequence diagram here and its numbers on the drawing.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "capabilities" && (
          <div>
            <p className="text-[12px] leading-snug text-ink-3">
              The numbered chips on the drawing. Select one to see where it must sit and why.
            </p>
            <div className="mt-3">
              <CapabilityList archetype={archetype} highlight={highlight} onHighlight={onHighlight} columns={2} />
            </div>
          </div>
        )}

        {tab === "risks" && (
          <div>
            <p className="text-[12px] leading-snug text-ink-3">
              CoSAI risks tagged where they surface. Codes are stable across every architecture.
            </p>
            <div className="mt-3">
              <RiskList archetype={archetype} highlight={highlight} onHighlight={onHighlight} columns={2} />
            </div>
          </div>
        )}

        {tab === "guidance" &&
          (guidance ? (
            <GuidancePanel archetype={archetype} />
          ) : (
            <p className="text-[13px] text-ink-3">No controls guidance has reached this architecture yet.</p>
          ))}
      </div>
    </div>
  );
}
