"use client";

/**
 * One architecture on the page: the drawing at full width and everything else in one tab
 * strip beneath it — overview, sequence flows, tools, controls (with the guidance folded in), risks. One panel is
 * visible at a time and nothing is expanded by default, so the page never shows two lists
 * and a sequence diagram at once. Leaving the flows tab clears the numbering; leaving the
 * capability or risk tab clears the highlight, so the drawing always matches the panel.
 * Chosen over an inspector rail and a scroll-linked story after all three ran side by side.
 */
import { useEffect, useState } from "react";

import { guidanceByArchetype, toolsForArchetype } from "@/lib/data";
import { ToolsForArchitecture } from "@/components/tooling/ToolsForArchitecture";
import type { Archetype, Scenario } from "@/lib/types";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { FlowDiagram, type Highlight } from "./FlowDiagram";
import { FlowLegend } from "./FlowLegend";
import { FlowSequence } from "./FlowSequence";
import { Section } from "./ArchetypeDetail";
import { Prose } from "@/components/Prose";
import { CapabilityList, RiskList, WalkList } from "./rail-lists";

type Tab = "overview" | "flows" | "capabilities" | "risks" | "tools";

interface ArchetypeViewProps {
  archetype: Archetype;
  /** Every walk on the drawing, walkthrough first. They behave identically. */
  walks: Scenario[];
  /** Index into `walks`, or null when the drawing carries no step numbers. */
  walkIndex: number | null;
  onWalk: (index: number | null) => void;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  /** A product record open on the Tools tab (deep link `?tool=`), or null. */
  toolId: string | null;
  onTool: (id: string | null) => void;
}

const MODE_LABEL = { build: "your teams build this", use: "your teams use a vendor's", hybrid: "built and consumed" } as const;

export function ArchetypeView({ archetype, walks, walkIndex, onWalk, highlight, onHighlight, toolId, onTool }: ArchetypeViewProps) {
  // Opens on the overview with the full drawing: a reader's first sight is the whole
  // architecture, nothing faded. Choosing the flows tab traces the walkthrough.
  const [tab, setTab] = useState<Tab>(toolId ? "tools" : "overview");
  // Opening a product (from search, a capability page or a rail) lands on the Tools tab.
  // Adjusted during render, the Panel.tsx idiom, so there is no flash of the previous tab.
  const [prevTool, setPrevTool] = useState(toolId);
  if (prevTool !== toolId) {
    setPrevTool(toolId);
    if (toolId) setTab("tools");
  }
  const activeWalk = walkIndex === null ? null : walks[walkIndex] ?? null;
  const guidance = guidanceByArchetype.get(archetype.id);
  const tools = toolsForArchetype(archetype.id);

  const go = (next: Tab) => {
    setTab(next);
    if (next !== "flows") onWalk(null);
    else if (walkIndex === null) onWalk(0);
    if (next !== "capabilities" && next !== "risks") onHighlight(null);
    if (next !== "tools") onTool(null);
  };

  // On a phone the drawing is unreadable at page width, so it folds behind a toggle and the
  // tabs lead; a reader who wants the drawing gets it full-bleed and pinch-zoomable.
  const [narrow, setNarrow] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const drawingVisible = !narrow || showDrawing;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "flows", label: "Sequence flows", count: walks.length },
    { id: "tools", label: "Tools", count: tools.length },
    { id: "capabilities", label: "Controls", count: archetype.capabilities.length },
    { id: "risks", label: "Risks", count: archetype.risks.length },
  ];

  return (
    <div className="mt-3">
      {narrow && (
        <button
          type="button"
          onClick={() => setShowDrawing((v) => !v)}
          aria-expanded={showDrawing}
          className="mb-3 w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-left text-[13px] font-semibold text-ink"
        >
          {showDrawing ? "Hide the drawing" : "Show the drawing"}
          <span className="ml-2 font-normal text-ink-3">
            {archetype.blocks.length} blocks · pinch to zoom
          </span>
        </button>
      )}
      {drawingVisible && (
        <>
          <div className="-mx-6 overflow-hidden border-y border-line bg-paper lg:mx-0 lg:rounded-xl lg:border">
            <FlowDiagram
              archetype={archetype}
              walk={activeWalk}
              highlight={highlight}
              onHighlight={onHighlight}
              className="w-full"
            />
          </div>
          <FlowLegend className="mt-3 px-1" />
        </>
      )}

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
              The numbered chips on the drawing: the control technologies every product of this kind needs, each implementing one or
              more CoSAI controls. Select one to see where it must sit, why, what the guidance says about it, and which products can
              switch it on.
            </p>
            {guidance && (
              <div className="mt-3 rounded-xl border border-line bg-paper">
                <Section title={`How to govern this · ${MODE_LABEL[guidance.mode]}${guidance.status === "draft" ? " · draft" : ""}`} count={null} last>
                  <Prose blocks={guidance.overview} size="sm" />
                  <p className="mt-2 text-[11.5px] text-ink-3">{guidance.attribution}</p>
                  <ul className="mt-2 space-y-1">
                    {guidance.sources.map((src) => (
                      <li key={src.url} className="text-[12px] leading-snug">
                        <a href={src.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline">
                          {src.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>
            )}
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

        {tab === "tools" && <ToolsForArchitecture key={archetype.id} archetype={archetype} tools={tools} toolId={toolId} onTool={onTool} />}
      </div>
    </div>
  );
}
