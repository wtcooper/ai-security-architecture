"use client";

/**
 * One pattern on the page: one tab strip — enable, how it works, risks and flows, incidents —
 * then the drawing at full width and the tab's panel beneath it. The tabs sit above the drawing
 * because they govern both: which pins the drawing carries and which panel is shown. The drawing is the
 * trust-boundary view by default, with the item-level canvas one switch away. It shows the
 * control chips at rest; the flows tab swaps them for the walk's numbers and the risk tags
 * where risk enters. On Enable every row is one of those chips: opening a row lights its chip,
 * and picking a chip opens its row.
 * Chosen over an inspector rail and a scroll-linked story after all three ran side by side.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { EnablePanel } from "@/components/enable/EnablePanel";
import { DrawingLegend, PatternDrawing } from "@/components/drawing/PatternDrawing";
import { CrossingsRegister } from "@/components/drawing/CrossingsRegister";
import { cloudById, clouds, incidents } from "@/lib/data";
import { PATTERN_TABS, type PatternTab } from "@/lib/routes";
import type { Archetype, Scenario } from "@/lib/types";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { FlowDiagram, type Highlight } from "./FlowDiagram";
import type { BlockService } from "./FlowDiagramRF";
import { FlowLegend } from "./FlowLegend";
import { FlowSequence } from "./FlowSequence";
import { WalkList } from "./rail-lists";
import { PatternIncidents, PatternRisks } from "@/components/patterns/PatternPanels";

/**
 * Block id -> the cloud service drawn in it, cached per cloud and architecture so the drawing
 * receives the same Map on every render and does not rebuild its nodes.
 */
const serviceMaps = new Map<string, Map<string, BlockService> | null>();
function servicesFor(cloudId: string, archetypeId: string) {
  const key = `${cloudId}|${archetypeId}`;
  if (!serviceMaps.has(key)) {
    const impl = cloudById.get(cloudId)?.implementations.find((i) => i.architecture === archetypeId);
    serviceMaps.set(key, impl ? new Map(impl.bindings.map((b) => [b.block, { service: b.service, build: b.build, note: b.note }])) : null);
  }
  return serviceMaps.get(key)!;
}

export type Tab = PatternTab;
export const TABS: Tab[] = PATTERN_TABS;

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
  const services = viewCloud ? servicesFor(viewCloud.id, archetype.id) : null;
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
        document.getElementById(`control-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
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
  // The boundary drawing is the standard; the detailed canvas keeps every item one switch away.
  const [view, setView] = useState<"boundaries" | "detailed">("boundaries");
  const scrollToDrawing = () => {
    setShowDrawing(true);
    requestAnimationFrame(() => drawingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "enable", label: "Enable", count: archetype.mitigations.length },
    { id: "overview", label: "How it works" },
    { id: "flows", label: "Risks & flows", count: archetype.risks.length },
    { id: "incidents", label: "Incidents", count: incidents.filter((i) => i.archetype === archetype.id).length },
  ];

  return (
    <div className="mt-3">
      <div id="pattern-tabs" className="mb-4 flex scroll-mt-20 gap-1 overflow-x-auto border-b border-line" role="tablist">
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
        <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-3">
          {/* The same pattern, two drawings: boundaries to read it, the detailed canvas for every item. */}
          <div className="flex items-center gap-2" role="group" aria-label="Drawing">
            <span>Drawing</span>
            {(["boundaries", "detailed"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                title={v === "boundaries" ? "Trust boundaries and components, one line each" : "Every component's items, on the detailed canvas"}
                className={`rounded-full border px-2.5 py-0.5 font-semibold transition-colors ${
                  view === v ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-ink-3"
                }`}
              >
                {v === "boundaries" ? "Boundaries" : "Detailed"}
              </button>
            ))}
          </div>
          {implementedOn.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Draw as built on">
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
        </div>
      )}
      {drawingVisible && (
        <>
          <div ref={drawingRef} className="-mx-6 scroll-mt-20 overflow-hidden border-y border-line bg-paper lg:mx-0 lg:rounded-xl lg:border">
            {view === "boundaries" ? (
              <PatternDrawing
                archetype={archetype}
                walk={activeWalk}
                highlight={highlight}
                onHighlight={onHighlight}
                // One kind of pin at a time: risk tags where a walk shows risk entering, control chips everywhere else.
                pins={tab === "flows" ? "risks" : "capabilities"}
                onPickMitigation={pickChip}
                services={services}
                className="w-full"
              />
            ) : (
              <FlowDiagram
                archetype={archetype}
                walk={activeWalk}
                highlight={highlight}
                onHighlight={onHighlight}
                pins={tab === "flows" ? "risks" : "capabilities"}
                onPickMitigation={pickChip}
                services={services}
                className="w-full"
              />
            )}
          </div>
          {view === "boundaries" ? <DrawingLegend className="mt-3 px-1" risks={tab === "flows"} /> : <FlowLegend className="mt-3 px-1" />}
        </>
      )}

      <div className="mt-5">
        {tab === "overview" && <ArchetypeDetail archetype={archetype} />}

        {tab === "incidents" && <PatternIncidents archetype={archetype} />}

        {tab === "flows" && (
          <PatternRisks
            archetype={archetype}
            lit={highlight?.kind === "risk" ? highlight.id : null}
            onLight={(id) => onHighlight(id ? { kind: "risk", id } : null)}
            onPickControl={pickChip}
          />
        )}

        {tab === "flows" && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
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

        {tab === "flows" && (
          <section className="mt-8" aria-labelledby="crossings-title">
            <h3 id="crossings-title" className="display text-[16px] font-bold text-ink">Boundary crossings</h3>
            <div className="mt-2">
              <CrossingsRegister archetype={archetype} onPickMitigation={pickChip} />
            </div>
          </section>
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
