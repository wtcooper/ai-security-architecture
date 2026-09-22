"use client";

/**
 * The one renderer for the flow-style architectures, on the Reference tab and on the Incidents
 * tab alike. The drawing itself is FlowDiagramRF (loaded on the client only, since React Flow
 * measures the DOM); this wrapper carries the shared types, the export button, and nothing
 * else. A second SVG engine used to live here for incident-step overlays; the two drifted, so
 * overlays moved into the one renderer and the SVG engine was retired.
 */
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { Archetype, Phase, Scenario } from "@/lib/types";
import { downloadArchetypeHtml } from "./export-html";

const FlowDiagramRFLazy = dynamic(() => import("./FlowDiagramRF").then((m) => m.FlowDiagramRF), {
  ssr: false,
  loading: () => <div style={{ height: "min(640px, 70vh)" }} />,
});

/** A mitigation or risk picked from a list: its chips or tags stay lit, the rest go faint. */
export interface Highlight {
  kind: "mitigation" | "risk";
  id: string;
}

/**
 * An incident step replayed on the drawing: the blocks it lands in and the edges it rides,
 * coloured by the step's phase, with the step number badged on each block. While one is
 * set, the mitigation chips, risk tags and scenario walks stay hidden — the diagram is a
 * canvas for someone else's story.
 */
export interface StepOverlay {
  phase: Phase;
  /** Block id -> step number. */
  marks: Record<string, number>;
  /** The edges the step rides, keyed as drawn ("from->to"); lit in the phase colour. */
  edges: string[];
}

export function FlowDiagram({
  archetype,
  walk = null,
  highlight = null,
  overlay = null,
  className,
}: {
  archetype: Archetype;
  /** The selected sequence data flow, or null for the resting view. */
  walk?: Scenario | null;
  highlight?: Highlight | null;
  onHighlight?: (h: Highlight | null) => void;
  overlay?: StepOverlay | null;
  className?: string;
}) {
  // Expanded, the same drawing is remounted in an overlay covering the app's viewport (not
  // the OS full screen), so React Flow fits it to the larger canvas; inline, a placeholder of
  // the same height holds the page still. Escape or the button collapses it.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  const buttonClass = "rounded-md border border-ink-3/40 bg-paper px-2.5 py-1 text-[11px] text-ink-2 hover:bg-mist";
  const drawing = (height?: string) => (
    <FlowDiagramRFLazy archetype={archetype} walk={walk} highlight={highlight} overlay={overlay} className={className} height={height} />
  );

  return (
    <div className="relative w-full">
      <div className="absolute right-2 top-2 z-10 flex gap-1.5">
        {!overlay && (
          <button
            type="button"
            onClick={() => void downloadArchetypeHtml(archetype)}
            className={buttonClass}
            title="Download this diagram as a standalone interactive HTML file"
          >
            Export HTML
          </button>
        )}
        <button type="button" onClick={() => setExpanded(true)} className={buttonClass} title="Expand the drawing to fill the window (Esc to collapse)">
          Expand ⤢
        </button>
      </div>
      {expanded ? <div aria-hidden style={{ height: "min(640px, 70vh)" }} /> : drawing()}

      {expanded && (
        <div role="dialog" aria-modal="true" aria-label={`${archetype.title} — expanded drawing`} className="fixed inset-0 z-50 flex flex-col bg-paper">
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2">
            <span className="display text-[14px] font-bold text-ink">{archetype.title}</span>
            <span className="hidden text-[11.5px] text-ink-3 sm:inline">Scroll to zoom · drag to pan · Esc to collapse</span>
            <div className="ml-auto flex gap-1.5">
              {!overlay && (
                <button type="button" onClick={() => void downloadArchetypeHtml(archetype)} className={buttonClass}>
                  Export HTML
                </button>
              )}
              <button type="button" autoFocus onClick={() => setExpanded(false)} className={buttonClass} title="Collapse back into the page (Esc)">
                Collapse ⤡
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">{drawing("100%")}</div>
        </div>
      )}
    </div>
  );
}
