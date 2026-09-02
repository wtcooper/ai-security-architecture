"use client";

/**
 * Design C — Story. The page reads top to bottom like a document while the drawing stays
 * pinned beside it. Each section changes what the drawing shows: the walkthrough section
 * traces its steps, a scenario card traces its own, the capability and risk sections keep
 * only the selected pins lit. Nothing is a collapsible; the order of the sections is the
 * argument, and a short contents list at the top jumps to any of them.
 */
import { useEffect, useRef } from "react";

import { Prose } from "@/components/Prose";
import { guidanceByArchetype } from "@/lib/data";
import type { Scenario } from "@/lib/types";
import { FlowDiagram } from "../FlowDiagram";
import { FlowLegend } from "../FlowLegend";
import { FlowSequence } from "../FlowSequence";
import { GuidancePanel } from "../GuidancePanel";
import { CapabilityList, RiskList } from "../rail-lists";
import type { DesignProps } from "./types";

const SECTIONS = [
  { id: "what", label: "What it is" },
  { id: "walk", label: "How a request moves" },
  { id: "wrong", label: "Where it goes wrong" },
  { id: "controls", label: "What must be in place" },
  { id: "risks", label: "Where risk surfaces" },
  { id: "govern", label: "Governing it" },
  { id: "wild", label: "In the wild" },
];

export function StoryDesign({ archetype, walks, walkIndex, onWalk, highlight, onHighlight }: DesignProps) {
  const activeWalk = walkIndex === null ? null : walks[walkIndex] ?? null;
  const guidance = guidanceByArchetype.get(archetype.id);
  const [walkthrough, ...scenarios] = walks;

  // The drawing follows the reading: when a walk section scrolls into the middle of the
  // viewport its steps trace on the drawing; when the capabilities or risks section does,
  // any lingering trace clears so the pins are what the reader sees.
  const walkRefs = useRef<(HTMLElement | null)[]>([]);
  const restRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const w = el.dataset.walk;
          if (w !== undefined) onWalk(Number(w));
          else onWalk(null);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    for (const el of [...walkRefs.current, ...restRefs.current]) if (el) io.observe(el);
    return () => io.disconnect();
  }, [archetype.id, walks.length, onWalk]);

  return (
    <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 self-start lg:sticky lg:top-20">
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <FlowDiagram
            archetype={archetype}
            walk={activeWalk}
            highlight={highlight}
            onHighlight={onHighlight}
            className="w-full"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
          <FlowLegend />
          {activeWalk && (
            <span className="ml-auto rounded-full border border-mitigated bg-mitigated-soft px-2.5 py-1 text-[11.5px] font-semibold text-ink">
              Tracing · {activeWalk.title}
            </span>
          )}
        </div>
      </div>

      <article className="min-w-0 space-y-10 pb-16">
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px]">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-ink-3 hover:text-ink hover:underline">
              {s.label}
            </a>
          ))}
        </nav>

        <section id="what" ref={(el) => { restRefs.current[0] = el; }}>
          <p className="eyebrow">What it is</p>
          <div className="mt-2">
            <Prose blocks={archetype.description} size="sm" />
          </div>
          {archetype.distinguishedBy?.length ? (
            <div className="mt-4 border-l-2 border-line pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                Why it is its own archetype
              </p>
              <div className="mt-1.5">
                <Prose blocks={archetype.distinguishedBy} size="sm" />
              </div>
            </div>
          ) : null}
        </section>

        {walkthrough && (
          <section id="walk" data-walk="0" ref={(el) => { walkRefs.current[0] = el; }}>
            <p className="eyebrow">How a request moves</p>
            <WalkCard
              archetype={archetype}
              walk={walkthrough}
              active={walkIndex === 0}
              onToggle={() => onWalk(walkIndex === 0 ? null : 0)}
            />
          </section>
        )}

        {scenarios.length > 0 && (
          <section id="wrong">
            <p className="eyebrow">Where it goes wrong</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-3">
              Variations on the walk above — the ways this architecture fails. Scroll to one, or
              trace it, to see it on the drawing.
            </p>
            <div className="mt-3 space-y-4">
              {scenarios.map((sc, i) => (
                <div key={sc.title} data-walk={i + 1} ref={(el) => { walkRefs.current[i + 1] = el; }}>
                  <WalkCard
                    archetype={archetype}
                    walk={sc}
                    active={walkIndex === i + 1}
                    onToggle={() => onWalk(walkIndex === i + 1 ? null : i + 1)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="controls" ref={(el) => { restRefs.current[1] = el; }}>
          <p className="eyebrow">What must be in place · {archetype.capabilities.length}</p>
          <p className="mt-1 text-[12px] leading-snug text-ink-3">
            The numbered chips on the drawing. Select one to keep only its chips lit.
          </p>
          <div className="mt-3">
            <CapabilityList archetype={archetype} highlight={highlight} onHighlight={onHighlight} />
          </div>
        </section>

        <section id="risks" ref={(el) => { restRefs.current[2] = el; }}>
          <p className="eyebrow">Where risk surfaces · {archetype.risks.length}</p>
          <p className="mt-1 text-[12px] leading-snug text-ink-3">
            CoSAI risks tagged where they materialise. Codes are stable across every architecture.
          </p>
          <div className="mt-3">
            <RiskList archetype={archetype} highlight={highlight} onHighlight={onHighlight} />
          </div>
        </section>

        {guidance && (
          <section id="govern" ref={(el) => { restRefs.current[3] = el; }}>
            <GuidancePanel archetype={archetype} />
          </section>
        )}

        <section id="wild" ref={(el) => { restRefs.current[4] = el; }}>
          {archetype.exemplars?.length ? (
            <>
              <p className="eyebrow">In the wild · {archetype.exemplars.length}</p>
              <p className="mt-1 text-[12px] leading-snug text-ink-3">
                Dated illustrations, not the taxonomy — the architecture itself stays vendor-neutral.
              </p>
              <div className="mt-3 space-y-3">
                {archetype.exemplars.map((ex) => (
                  <div key={ex.name}>
                    <p className="text-[13.5px] font-semibold text-ink">
                      {ex.url ? (
                        <a href={ex.url} target="_blank" rel="noreferrer" className="hover:underline">
                          {ex.name}
                        </a>
                      ) : (
                        ex.name
                      )}
                      {ex.asOf && <span className="ident ml-2 text-[10.5px] font-medium text-ink-3">as of {ex.asOf}</span>}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{ex.note}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <p className="eyebrow mt-6">Sources · {archetype.sources.length}</p>
          <ul className="mt-2 space-y-1.5">
            {archetype.sources.map((s) => (
              <li key={s.url + s.title} className="text-[13px] leading-snug">
                <a href={s.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}

/** One walk as a card: its steps in order, and a trace toggle that numbers them on the drawing. */
function WalkCard({
  archetype,
  walk,
  active,
  onToggle,
}: {
  archetype: DesignProps["archetype"];
  walk: Scenario;
  active: boolean;
  onToggle: () => void;
}) {
  const titleOf = (id: string) => archetype.blocks.find((b) => b.id === id)?.title ?? id;
  return (
    <div className={`mt-2 rounded-xl border bg-paper ${active ? "border-mitigated" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-3">
        <h3 className="text-[14px] font-semibold text-ink">{walk.title}</h3>
        <button
          onClick={onToggle}
          aria-pressed={active}
          className={`ml-auto rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
            active ? "border-mitigated bg-mitigated-soft text-ink" : "border-line text-ink-2 hover:border-line-strong"
          }`}
        >
          {active ? "Tracing" : "Trace on the drawing"}
        </button>
      </div>
      {walk.moves && <p className="px-4 pt-1 text-[12.5px] leading-snug text-ink-3">{walk.moves}</p>}
      <ol className="mt-2 space-y-1.5 px-4 pb-4">
        {walk.steps.map((st, i) => {
          const [a, b] = st.follow.split("->");
          return (
            <li key={i} className="flex gap-2.5 text-[12.5px] leading-snug">
              <span className="ident mt-px h-[17px] min-w-[17px] shrink-0 rounded-full bg-ink px-1 text-center text-[9.5px] font-bold leading-[17px] text-white">
                {i + 1}
              </span>
              <span>
                <span className="font-semibold text-ink">
                  {titleOf(a)} → {titleOf(b)}
                </span>
                {st.note && <span className="text-ink-2"> — {st.note}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {active && (
        <div className="border-t border-line px-2 pb-3">
          <FlowSequence archetype={archetype} walk={walk} className="px-2 pt-2" />
        </div>
      )}
    </div>
  );
}
