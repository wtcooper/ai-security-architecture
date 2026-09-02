"use client";

/**
 * The one renderer for the flow-style architectures, on the Reference tab and on the Incidents
 * tab alike. The drawing itself is FlowDiagramRF (loaded on the client only, since React Flow
 * measures the DOM); this wrapper carries the shared types, the export button, and nothing
 * else. A second SVG engine used to live here for incident-step overlays; the two drifted, so
 * overlays moved into the one renderer and the SVG engine was retired.
 */
import dynamic from "next/dynamic";

import type { Archetype, Phase, Scenario } from "@/lib/types";
import { downloadArchetypeHtml } from "./export-html";

const FlowDiagramRFLazy = dynamic(() => import("./FlowDiagramRF").then((m) => m.FlowDiagramRF), {
  ssr: false,
  loading: () => <div style={{ height: "min(640px, 70vh)" }} />,
});

/** A capability or risk picked from a list: its chips or tags stay lit, the rest go faint. */
export interface Highlight {
  kind: "capability" | "risk";
  id: string;
}

/**
 * An incident step replayed on the drawing: the blocks it lands in and the edges it rides,
 * coloured by the step's phase, with the step number badged on each block. While one is
 * set, the capability chips, risk tags and scenario walks stay hidden — the diagram is a
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
  return (
    <div className="relative w-full">
      {!overlay && (
        <button
          type="button"
          onClick={() => void downloadArchetypeHtml(archetype)}
          className="absolute right-2 top-2 z-10 rounded-md border border-ink-3/40 bg-paper px-2.5 py-1 text-[11px] text-ink-2 hover:bg-paper-2"
          title="Download this diagram as a standalone interactive HTML file"
        >
          Export HTML
        </button>
      )}
      <FlowDiagramRFLazy
        archetype={archetype}
        walk={walk}
        highlight={highlight}
        overlay={overlay}
        className={className}
      />
    </div>
  );
}
