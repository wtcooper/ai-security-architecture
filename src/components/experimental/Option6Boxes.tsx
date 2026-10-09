"use client";

/**
 * Option 6 — Simplified boxes. A drop-in for the current drawing: the same build-computed
 * geometry (block rects, routed arrows, bands), drawn the way the "logical data flow" reference
 * mockup draws it — plain white cards with a title and one line of contents instead of icon
 * grids, orange C# control badges on each card's corner, black numbered circles for flow steps
 * (so a control number and a step number never look alike), and a key beneath listing the
 * steps of the selected flow and every core control. Risks sit behind a switch.
 *
 * Drawn on the same React Flow canvas as today's drawing (FlowDiagram `simple`), so zoom, pan,
 * hover cards and Expand behave identically; inline, the canvas is as tall as the drawing at
 * the column's width, so the text stays readable.
 */
import { useMemo, useState } from "react";

import { STATUS_META } from "@/components/StatusPill";
import { FlowDiagram } from "@/components/reference/FlowDiagram";
import { Badge, SIMPLE, STATUS_FILL } from "@/components/reference/flow-simple";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { mitigationById, orgSurfaceStatusFor } from "@/lib/data";
import type { Archetype, DisplayStatus, Scenario } from "@/lib/types";
import { shortName } from "./model";
import { countBy, DrawingBar, StatusLegend } from "./parts";

const { ink: INK, muted: MUTED, line: LINE, lineExternal: LINE_EXTERNAL, badge: BADGE } = SIMPLE;

export interface BoxesProps {
  archetype: Archetype;
  walk: Scenario | null;
  walks: Scenario[];
  walkIndex: number | null;
  onWalk: (i: number | null) => void;
}

export function BoxesDrawing({ archetype, walk, walks, walkIndex, onWalk }: BoxesProps) {
  const overlay = useOrgOverlay();
  const [showRisks, setShowRisks] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastArch, setLastArch] = useState(archetype.id);
  if (lastArch !== archetype.id) {
    setLastArch(archetype.id);
    setSelected(null);
  }
  const status = useMemo(
    () => (overlay ? new Map(archetype.mitigations.map((c) => [c, orgSurfaceStatusFor(c, archetype.surface)])) : null),
    [overlay, archetype],
  );
  const pick = (id: string) => setSelected((cur) => (cur === id ? null : id));

  return (
    <>
      <DrawingBar
        legend={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] text-ink-2">
            <LineKey color={LINE} label="Data flow" />
            <LineKey color={LINE_EXTERNAL} dashed label="External content & actions" />
            <span className="inline-flex items-center gap-1.5">
              <StepDot n={1} /> Flow step
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Badge label="C#" /> Control {overlay ? "· colour = our status" : "enforcement point"}
            </span>
            <span className="text-ink-3">
              Hover anything · pinch or ⌘/Ctrl + wheel to zoom · drag to pan · Expand for full screen
            </span>
            {overlay && <StatusLegend counts={status ? countBy([...status.values()]) : undefined} />}
          </div>
        }
      >
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-2">
          <input type="checkbox" checked={showRisks} onChange={(e) => setShowRisks(e.target.checked)} />
          Show risks
        </label>
        {walk && (
          <span className="text-[12px] text-ink-2">
            Numbered: <span className="font-semibold text-ink">{walk.title}</span>{" "}
            <button type="button" onClick={() => onWalk(null)} className="ml-1 font-semibold text-introduced hover:underline">
              clear
            </button>
          </span>
        )}
      </DrawingBar>

      <div className="-mx-6 overflow-hidden border-y border-line bg-[#FBFBFA] lg:mx-0 lg:rounded-xl lg:border">
        <FlowDiagram
          archetype={archetype}
          walk={walk}
          highlight={selected ? { kind: "mitigation", id: selected } : null}
          simple
          showRisks={showRisks}
          onPickMitigation={pick}
          className="w-full"
        />
      </div>

      <Key archetype={archetype} walk={walk} walks={walks} walkIndex={walkIndex} onWalk={onWalk} status={status} selected={selected} onPick={pick} />
    </>
  );
}

function StepDot({ n }: { n: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 11, background: INK, color: "#fff", font: "600 11.5px/1 var(--font-mono, monospace)" }}>
      {n}
    </span>
  );
}

function LineKey({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="28" height="8" aria-hidden>
        <path d="M 1 4 H 27" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "5 4" : undefined} />
      </svg>
      {label}
    </span>
  );
}

/** The key under the drawing: the selected flow's steps, and every core control. */
function Key({
  archetype,
  walk,
  walks,
  walkIndex,
  onWalk,
  status,
  selected,
  onPick,
}: {
  archetype: Archetype;
  walk: Scenario | null;
  walks: Scenario[];
  walkIndex: number | null;
  onWalk: (i: number | null) => void;
  status: Map<string, DisplayStatus> | null;
  selected: string | null;
  onPick: (id: string) => void;
}) {
  const edgeLabel = (follow: string) => {
    const e = archetype.edges.find((x) => `${x.from}->${x.to}` === follow || `${x.to}->${x.from}` === follow);
    return e?.label;
  };
  const title = (id: string) => archetype.blocks.find((b) => b.id === id)?.title ?? id;
  return (
    <div className="mt-4 grid gap-6 rounded-xl border border-line bg-paper px-5 py-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">Data flows</p>
        {walk ? (
          <ol className="space-y-1">
            {walk.steps.map((st, i) => {
              const [a, b] = st.follow.split("->");
              return (
                <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink-2">
                  <span className="w-5 shrink-0 text-right font-mono font-semibold text-ink">{i + 1}</span>
                  <span>
                    <span className="font-semibold text-ink">{st.label ?? edgeLabel(st.follow) ?? `${title(a)} → ${title(b)}`}</span>
                    <span className="text-ink-3"> — {title(a)} → {title(b)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            <p className="mb-1.5 text-[12px] text-ink-3">Pick a flow to number it on the drawing.</p>
            <ul className="space-y-1">
              {walks.map((w, i) => (
                <li key={i}>
                  <button type="button" onClick={() => onWalk(walkIndex === i ? null : i)} className="text-left text-[12.5px] leading-snug text-ink-2 hover:text-introduced">
                    <span className="font-semibold text-ink">{w.title}</span>
                    <span className="text-ink-3"> · {w.steps.length} steps</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">Core controls</p>
        <ul className="space-y-1">
          {archetype.mitigations.map((id, i) => {
            const m = mitigationById.get(id);
            const lead = typeof m?.description?.[0] === "string" ? m.description[0] : "";
            const s = status?.get(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onPick(id)}
                  className={`flex w-full gap-2 rounded px-1 text-left text-[12.5px] leading-snug text-ink-2 hover:bg-mist ${selected === id ? "bg-mist" : ""}`}
                >
                  <span className="w-8 shrink-0 font-mono font-semibold" style={{ color: s ? STATUS_FILL[s].border : BADGE }}>
                    C{i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">{shortName(id)}</span>
                    {s && <span className="ml-1.5 text-[11px] font-semibold" style={{ color: STATUS_FILL[s].border === "#98a2b3" ? MUTED : STATUS_FILL[s].border }}>{STATUS_META[s].label}</span>}
                    {lead && <span className="line-clamp-1 text-[11.5px] text-ink-3">{lead}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
