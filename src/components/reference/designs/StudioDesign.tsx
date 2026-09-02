"use client";

/**
 * Design B — Studio. The drawing keeps a sticky inspector beside it, but the inspector shows
 * one thing at a time: a segmented control switches between flows, capabilities, risks and
 * the prose notes, so nothing is stacked and nothing is expanded by default. The controls
 * guidance folds into a single bar under the drawing that opens on demand.
 */
import { useState } from "react";

import { Prose } from "@/components/Prose";
import { guidanceByArchetype } from "@/lib/data";
import { FlowDiagram } from "../FlowDiagram";
import { FlowLegend } from "../FlowLegend";
import { FlowSequence } from "../FlowSequence";
import { GuidancePanel } from "../GuidancePanel";
import { CapabilityList, RiskList, WalkList } from "../rail-lists";
import type { DesignProps } from "./types";

type Pane = "flows" | "capabilities" | "risks" | "notes";

export function StudioDesign({ archetype, walks, walkIndex, onWalk, highlight, onHighlight }: DesignProps) {
  const [pane, setPane] = useState<Pane>("flows");
  const activeWalk = walkIndex === null ? null : walks[walkIndex] ?? null;
  const guidance = guidanceByArchetype.get(archetype.id);

  const go = (next: Pane) => {
    setPane(next);
    if (next !== "flows") onWalk(null);
    if (next !== "capabilities" && next !== "risks") onHighlight(null);
  };

  const panes: { id: Pane; label: string; count?: number }[] = [
    { id: "flows", label: "Flows", count: walks.length },
    { id: "capabilities", label: "Capabilities", count: archetype.capabilities.length },
    { id: "risks", label: "Risks", count: archetype.risks.length },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="mt-3">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
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
          {activeWalk && (
            <div className="mt-4 rounded-xl border border-line bg-paper">
              <div className="flex items-baseline gap-2 border-b border-line px-4 py-2.5 text-[12.5px]">
                <span className="ident text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  Sequence
                </span>
                <span className="font-semibold text-ink">{activeWalk.title}</span>
                <span className="ml-auto text-[11px] text-ink-3">{activeWalk.steps.length} steps</span>
              </div>
              <FlowSequence archetype={archetype} walk={activeWalk} className="px-4 pb-4 pt-2" />
            </div>
          )}
        </div>

        <aside className="self-start rounded-xl border border-line bg-paper lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="sticky top-0 z-10 flex gap-1 border-b border-line bg-paper p-2">
            {panes.map((p) => (
              <button
                key={p.id}
                onClick={() => go(p.id)}
                aria-pressed={pane === p.id}
                className={`flex-1 rounded-md px-2 py-1.5 text-[12px] transition-colors ${
                  pane === p.id ? "bg-ink font-semibold text-white" : "text-ink-2 hover:bg-mist"
                }`}
              >
                {p.label}
                {p.count !== undefined && <span className="ml-1 opacity-60">{p.count}</span>}
              </button>
            ))}
          </div>

          <div className="p-3">
            {pane === "flows" && (
              <>
                <p className="mb-2 text-[11.5px] leading-snug text-ink-3">
                  Select a flow to number it onto the drawing; its sequence diagram opens beneath.
                </p>
                <WalkList walks={walks} walk={walkIndex} onWalk={onWalk} dense />
              </>
            )}
            {pane === "capabilities" && (
              <>
                <p className="mb-2 text-[11.5px] leading-snug text-ink-3">
                  The numbered chips on the drawing. Select one to keep only its chips lit.
                </p>
                <CapabilityList archetype={archetype} highlight={highlight} onHighlight={onHighlight} />
              </>
            )}
            {pane === "risks" && (
              <>
                <p className="mb-2 text-[11.5px] leading-snug text-ink-3">
                  CoSAI risks tagged where they surface. Select one to keep only its tags lit.
                </p>
                <RiskList archetype={archetype} highlight={highlight} onHighlight={onHighlight} />
              </>
            )}
            {pane === "notes" && <Notes archetype={archetype} />}
          </div>
        </aside>
      </div>

      {guidance && (
        <details className="mt-6 rounded-xl border border-line bg-paper">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2.5 gap-y-1 px-5 py-3.5">
            <span className="display text-[15px] font-bold text-ink">Controls guidance</span>
            <span className="text-[12px] text-ink-3">
              {guidance.items.length} items · what to enforce around this architecture
            </span>
            <span className="ml-auto text-[11.5px] font-semibold text-introduced">Open</span>
          </summary>
          <div className="px-5 pb-5">
            <GuidancePanel archetype={archetype} />
          </div>
        </details>
      )}
    </div>
  );
}

function Notes({ archetype }: { archetype: DesignProps["archetype"] }) {
  return (
    <div className="space-y-5">
      <section>
        <p className="eyebrow">How it works</p>
        <div className="mt-1.5">
          <Prose blocks={archetype.description} size="sm" />
        </div>
      </section>
      {archetype.distinguishedBy?.length ? (
        <section>
          <p className="eyebrow">Why this is its own archetype</p>
          <div className="mt-1.5">
            <Prose blocks={archetype.distinguishedBy} size="sm" />
          </div>
        </section>
      ) : null}
      {archetype.exemplars?.length ? (
        <section>
          <p className="eyebrow">Real-world instances · {archetype.exemplars.length}</p>
          <div className="mt-2 space-y-2.5">
            {archetype.exemplars.map((ex) => (
              <div key={ex.name}>
                <p className="text-[13px] font-semibold text-ink">
                  {ex.url ? (
                    <a href={ex.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {ex.name}
                    </a>
                  ) : (
                    ex.name
                  )}
                  {ex.asOf && <span className="ident ml-2 text-[10.5px] font-medium text-ink-3">as of {ex.asOf}</span>}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{ex.note}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section>
        <p className="eyebrow">Sources · {archetype.sources.length}</p>
        <ul className="mt-2 space-y-1">
          {archetype.sources.map((s) => (
            <li key={s.url + s.title} className="text-[12.5px] leading-snug">
              <a href={s.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
