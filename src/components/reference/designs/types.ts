import type { Archetype, Scenario } from "@/lib/types";
import type { Highlight } from "../FlowDiagram";

/**
 * What every page design receives: the architecture, its walks, and the two pieces of
 * selection state the drawing reflects. The browser owns the state; a design only lays it out.
 */
export interface DesignProps {
  archetype: Archetype;
  walks: Scenario[];
  walkIndex: number | null;
  onWalk: (index: number | null) => void;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
}

export const DESIGNS = [
  { id: "current", label: "Current" },
  { id: "focus", label: "A · Focus — one panel at a time" },
  { id: "studio", label: "B · Studio — inspector beside the drawing" },
  { id: "story", label: "C · Story — the drawing follows the reading" },
] as const;

export type DesignId = (typeof DESIGNS)[number]["id"];
