"use client";

/**
 * One architecture on the page: the drawing at full width, then one tab strip beneath it —
 * overview, sequence flows, enable. One panel is visible at a time. The drawing shows the
 * capability chips at rest; the flows tab swaps them for the walk's numbers and the risk tags
 * where risk enters. On Enable every row is one of those chips: opening a row lights its chip,
 * and picking a chip opens its row.
 * Chosen over an inspector rail and a scroll-linked story after all three ran side by side.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EnablePanel } from "@/components/enable/EnablePanel";
import { cloudById, clouds } from "@/lib/data";
import type { Archetype, Scenario } from "@/lib/types";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { FlowDiagram, type Highlight } from "./FlowDiagram";
import type { BlockService } from "./FlowDiagramRF";
import { FlowLegend } from "./FlowLegend";
import { FlowSequence } from "./FlowSequence";
import { WalkList } from "./rail-lists";

export type Tab = "overview" | "flows" | "enable";
export const TABS: Tab[] = ["overview", "flows", "enable"];

interface ArchetypeViewProps {
  archetype: Archetype;
  tab: Tab;
  onTab: (tab: Tab) => void;
  /** Every walk on the drawing, walkthrough first. They behave identically. */
  walks: Scenario[];
  /** Index into `walks`, or null when the drawing carries no step numbers. */
  walkIndex: number | null;
  onWalk: (index: number | null) => void;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  /** The product open on the Enable tab's tools step, and the capability it is opened on. */
  tool: string | null;
  focus: string | null;
  onPickTool: (toolId: string | null, capabilityId?: string) => void;
}

export function ArchetypeView({ archetype, tab, onTab, walks, walkIndex, onWalk, highlight, onHighlight, tool, focus, onPickTool }: ArchetypeViewProps) {
  const activeWalk = walkIndex === null ? null : walks[walkIndex] ?? null;
  const drawingRef = useRef<HTMLDivElement>(null);
  const open = highlight?.kind === "mitigation" ? highlight.id : null;

  // A first-party cloud architecture can be drawn as built on one cloud: each block shows the
  // service that plays it. Picking a cloud here or its pill on Enable switches the drawing;
  // "Generic" keeps the cloud-neutral components.
  const implementedOn = clouds.filter((c) => c.implementations.some((i) => i.architecture === archetype.id));
  const [cloudView, setCloudView] = useState<string | null>(tool && cloudById.has(tool) ? tool : null);
  const viewCloud = implementedOn.find((c) => c.id === cloudView) ?? null;
  const viewId = viewCloud?.id ?? null;
  const services = useMemo(() => {
    const impl = viewId ? cloudById.get(viewId)?.implementations.find((i) => i.architecture === archetype.id) : undefined;
    return impl ? new Map<string, BlockService>(impl.bindings.map((b) => [b.block, { service: b.service, build: b.build, note: b.note }])) : null;
  }, [viewId, archetype.id]);
  const pickProduct = (id: string | null) => {
    onPickTool(id);
    if (id && cloudById.has(id)) setCloudView(id);
  };

  const go = (next: Tab) => {
    onTab(next);
    if (next !== "flows") onWalk(null);
    else if (walkIndex === null) onWalk(0);
    if (next !== "enable") onHighlight(null);
  };

  // A chip picked on the drawing opens its row on Enable, wherever the reader was.
  const pick = useRef<(id: string) => void>(() => {});
  useEffect(() => {
    pick.current = (id: string) => {
      go("enable");
      onHighlight({ kind: "mitigation", id });
      requestAnimationFrame(() =>
        document.getElementById(`capability-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    };
  });
  // Stable, so the drawing does not rebuild its nodes on every render of this view.
  const pickChip = useCallback((id: string) => pick.current(id), []);

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
  const scrollToDrawing = () => {
    setShowDrawing(true);
    requestAnimationFrame(() => drawingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "flows", label: "Sequence flows", count: walks.length },
    { id: "enable", label: "Enable", count: archetype.mitigations.length },
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
      {drawingVisible && implementedOn.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-ink-3" role="group" aria-label="Draw as built on">
          <span>Drawn as</span>
          {[{ id: null, label: "Generic" }, ...implementedOn.map((c) => ({ id: c.id, label: c.short }))].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={cloudView === o.id || (o.id === null && !viewCloud)}
              onClick={() => setCloudView(o.id)}
              className={`rounded-full border px-2.5 py-0.5 font-semibold transition-colors ${
                (o.id === null ? !viewCloud : cloudView === o.id) ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-ink-3"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {drawingVisible && (
        <>
          <div ref={drawingRef} className="-mx-6 scroll-mt-20 overflow-hidden border-y border-line bg-paper lg:mx-0 lg:rounded-xl lg:border">
            <FlowDiagram
              archetype={archetype}
              walk={activeWalk}
              highlight={highlight}
              onHighlight={onHighlight}
              // One kind of pin at a time: risk tags where a walk shows risk entering, capability chips everywhere else.
              pins={tab === "flows" ? "risks" : "capabilities"}
              onPickMitigation={pickChip}
              services={services}
              className="w-full"
            />
          </div>
          <FlowLegend className="mt-3 px-1" />
        </>
      )}

      <div id="architecture-tabs" className="mt-5 flex scroll-mt-20 gap-1 overflow-x-auto border-b border-line" role="tablist">
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

        {tab === "enable" && (
          <EnablePanel
            archetype={archetype}
            open={open}
            onOpen={(id) => onHighlight(id ? { kind: "mitigation", id } : null)}
            onShowDrawing={scrollToDrawing}
            tool={tool}
            focus={focus}
            onPickTool={pickProduct}
          />
        )}
      </div>
    </div>
  );
}
