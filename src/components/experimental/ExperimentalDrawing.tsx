"use client";

/**
 * The experimental section's drawing: three simplified options for one architecture, side by
 * side with today's canvas, behind one switch. Everything below the drawing (Overview,
 * Sequence flows, Enable) is the architecture's own, so each option is judged against the
 * same tabs it would have to serve.
 *
 *   A  Clean boxes        today's geometry, no icons or item grids
 *   B  Trust boundaries   nested boundaries, numbered enforcement points (Agent Baseline style)
 *   C  Crossings          the same boundaries, every crossing numbered and listed in a register
 */
import { useMemo, useState } from "react";

import { FlowDiagram, type Highlight } from "@/components/reference/FlowDiagram";
import { FlowLegend } from "@/components/reference/FlowLegend";
import { capabilityName } from "@/lib/data";
import type { Archetype, Scenario } from "@/lib/types";
import { BoxDiagram, crossingColor, crossingsOf, type CrossingKind } from "./BoxDiagram";
import { BOUNDARY_BADGES, CODING_AGENT_BADGES, CODING_AGENT_CROSSINGS, CODING_AGENT_NESTED, specFromLayout } from "./views";

export type ExperimentOption = "a" | "b" | "c" | "current";

const OPTIONS: { id: ExperimentOption; label: string; blurb: string }[] = [
  {
    id: "a",
    label: "A · Clean boxes",
    blurb:
      "Today's layout and content with the icons and item grids taken out: each component is a title and one line, each zone a labelled outline. It tests whether the icons are the noise.",
  },
  {
    id: "b",
    label: "B · Trust boundaries",
    blurb:
      "Laid out as nested trust boundaries, after Agent Baseline's figures: people outside, the machine holding the harness holding its tools, our network, the vendor and the internet around it, the control plane beneath. Numbered discs mark where each boundary is enforced.",
  },
  {
    id: "c",
    label: "C · Boundary crossings",
    blurb:
      "The same boundaries, read the way an architect reviews them: every arrow that crosses one is numbered where it crosses, and the register beneath says what crosses, what it passes through on our side, and which capabilities hold it. Red marks a crossing with nothing of ours in the path.",
  },
  { id: "current", label: "Current canvas", blurb: "Today's React Flow drawing, for comparison." },
];

const KIND_LABEL: Record<CrossingKind, string> = {
  brokered: "Through a control point we run",
  vendor: "Governed by the vendor",
  person: "Through the person",
  direct: "Nothing of ours in the path",
};

export function ExperimentalDrawing({
  archetype,
  walk,
  highlight,
  onHighlight,
  pins,
  onPickMitigation,
}: {
  archetype: Archetype;
  walk: Scenario | null;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  pins: "risks" | "capabilities";
  onPickMitigation: (id: string) => void;
}) {
  const [option, setOption] = useState<ExperimentOption>("b");
  const [focusLine, setFocusLine] = useState<string | null>(null);
  const specA = useMemo(() => specFromLayout(archetype), [archetype]);
  const crossings = useMemo(() => crossingsOf(archetype, CODING_AGENT_NESTED), [archetype]);
  const kindOf = (key: string) => CODING_AGENT_CROSSINGS[key]?.kind ?? "brokered";
  const lit = highlight?.kind === "mitigation" ? highlight.id : null;
  const current = OPTIONS.find((o) => o.id === option)!;

  // Capabilities held at a crossing: pinned on the arrow, or on either end of it.
  const pinsFor = (key: string) => {
    const [from, to] = key.split("->");
    const at = new Set([key, `${to}->${from}`, from, to]);
    const ids = archetype.pins.mitigations.filter((p) => at.has(p.at)).map((p) => p.mitigation);
    return [...new Set(ids)].sort((x, y) => archetype.mitigations.indexOf(x) - archetype.mitigations.indexOf(y));
  };
  const titleOf = (id: string) =>
    CODING_AGENT_NESTED.boxes.find((b) => b.id === id)?.title ?? archetype.blocks.find((b) => b.id === id)?.title ?? id;
  const zoneTitle = (id: string) => CODING_AGENT_NESTED.boundaries.find((b) => b.zone === id)?.label ?? (id === "zoneUser" ? "People" : id);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-ink-3" role="group" aria-label="Drawing option">
        <span>Option</span>
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={option === o.id}
            onClick={() => setOption(o.id)}
            className={`rounded-full border px-2.5 py-0.5 font-semibold transition-colors ${
              option === o.id ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-ink-3"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mb-3 max-w-4xl text-[12.5px] leading-snug text-ink-2">{current.blurb}</p>

      {option === "current" ? (
        <>
          <div className="-mx-6 overflow-hidden border-y border-line bg-paper lg:mx-0 lg:rounded-xl lg:border">
            <FlowDiagram
              archetype={archetype}
              walk={walk}
              highlight={highlight}
              onHighlight={onHighlight}
              pins={pins}
              onPickMitigation={onPickMitigation}
              className="w-full"
            />
          </div>
          <FlowLegend className="mt-3 px-1" />
        </>
      ) : (
        <>
          <div className="-mx-6 overflow-x-auto border-y border-line bg-paper lg:mx-0 lg:rounded-xl lg:border">
            <div className="min-w-[960px] p-3">
              {option === "a" && specA && (
                <BoxDiagram archetype={archetype} spec={specA} walk={walk} litCapability={lit} onPickMitigation={onPickMitigation} className="w-full" />
              )}
              {option === "b" && (
                <BoxDiagram
                  archetype={archetype}
                  spec={{ ...CODING_AGENT_NESTED, badges: CODING_AGENT_BADGES }}
                  walk={walk}
                  litCapability={lit}
                  onPickMitigation={onPickMitigation}
                  className="w-full"
                />
              )}
              {option === "c" && (
                <BoxDiagram
                  archetype={archetype}
                  spec={CODING_AGENT_NESTED}
                  chips={false}
                  walk={walk}
                  crossings={crossings}
                  crossingKind={kindOf}
                  focusLine={focusLine}
                  onFocusLine={setFocusLine}
                  className="w-full"
                />
              )}
            </div>
          </div>
          <BoxLegend option={option} />
          {option === "c" && !walk && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-paper">
              <table className="w-full min-w-[760px] text-left text-[12.5px]">
                <thead className="border-b border-line bg-mist/60 text-[11px] uppercase tracking-[0.06em] text-ink-3">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Crossing</th>
                    <th className="px-3 py-2 font-semibold">What crosses</th>
                    <th className="px-3 py-2 font-semibold">Passes through on our side</th>
                    <th className="px-3 py-2 font-semibold">Capabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {crossings.map((c) => {
                    const kind = kindOf(c.key);
                    return (
                      <tr
                        key={c.key}
                        onMouseEnter={() => setFocusLine(c.key)}
                        onMouseLeave={() => setFocusLine(null)}
                        className={focusLine === c.key ? "bg-mist" : undefined}
                      >
                        <td className="px-3 py-2 align-top">
                          <span
                            className="inline-flex h-5 w-5 items-center justify-center rounded border-[1.5px] bg-paper text-[10.5px] font-bold"
                            style={{ borderColor: crossingColor(kind), color: crossingColor(kind) }}
                          >
                            {c.n}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <p className="font-semibold text-ink">
                            {titleOf(c.edge.from)} → {titleOf(c.edge.to)}
                          </p>
                          <p className="text-[11px] text-ink-3">
                            {zoneTitle(c.fromZone)} → {zoneTitle(c.toZone)}
                          </p>
                        </td>
                        <td className="px-3 py-2 align-top text-ink-2">{c.edge.label}</td>
                        <td className="px-3 py-2 align-top">
                          <p style={{ color: kind === "direct" ? crossingColor("direct") : undefined }} className="text-ink-2">
                            {CODING_AGENT_CROSSINGS[c.key]?.via ?? "—"}
                          </p>
                          <p className="text-[11px] text-ink-3">{KIND_LABEL[kind]}</p>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            {pinsFor(c.key).map((id) => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => onPickMitigation(id)}
                                title={`${capabilityName(id)} — open it on Enable`}
                                className="flex h-[21px] w-[21px] items-center justify-center rounded-full border border-chip bg-chip-soft text-[10.5px] font-bold text-chip hover:bg-chip hover:text-white"
                              >
                                {archetype.mitigations.indexOf(id) + 1}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BoxLegend({ option }: { option: ExperimentOption }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-[11.5px] text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <svg width="26" height="8" aria-hidden><line x1="0" y1="4" x2="26" y2="4" stroke="#4B5563" strokeWidth="1.3" /></svg>
        Data path
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="26" height="8" aria-hidden><line x1="0" y1="4" x2="26" y2="4" stroke="#4B5563" strokeWidth="1.3" strokeDasharray="5 4" /></svg>
        Outside content & actions
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="26" height="14" aria-hidden><rect x="1" y="1" width="24" height="12" rx="3" fill="none" stroke="#8A94A3" strokeDasharray="4 3" /></svg>
        Trust boundary
      </span>
      {option !== "c" && (
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full border border-chip bg-chip-soft text-[9.5px] font-bold text-chip">1</span>
          Capability — click to open on Enable
        </span>
      )}
      {option === "b" &&
        BOUNDARY_BADGES.map((b) => (
          <span key={b.n} className="inline-flex items-center gap-1.5">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1F2937] text-[10px] font-bold text-white">{b.n}</span>
            {b.label} <span className="text-ink-3">· {b.blurb}</span>
          </span>
        ))}
      {option === "c" &&
        (["brokered", "vendor", "person", "direct"] as CrossingKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-[3px] border-[1.5px] bg-paper" style={{ borderColor: crossingColor(k) }} />
            {KIND_LABEL[k]}
          </span>
        ))}
      <span className="text-ink-3">Hover anything for detail</span>
    </div>
  );
}
