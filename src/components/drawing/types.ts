/** The few types every view of a pattern's drawing shares. */
import type { Phase } from "@/lib/types";

/** A control or risk picked from a list: its chips or tags stay lit, the rest go faint. */
export interface Highlight {
  kind: "mitigation" | "risk";
  id: string;
  /** Further ids lit alongside `id`: an incident's breaks light several chips at once. */
  with?: string[];
}

/** Whether a highlight keeps this chip (mitigation) or tag (risk) lit. */
export const isLit = (h: Highlight, kind: Highlight["kind"], id: string) =>
  h.kind === kind && (h.id === id || Boolean(h.with?.includes(id)));

/**
 * An incident step replayed on the drawing: the blocks it lands in and the arrows it rides,
 * coloured by the step's phase, with the step number on each block. While one is set the
 * control chips, risk tags and walks stay hidden: the drawing is a canvas for the incident.
 */
export interface StepOverlay {
  phase: Phase;
  /** Block id -> step number. */
  marks: Record<string, number>;
  /** The arrows the step rides, keyed as drawn ("from->to"); lit in the phase colour. */
  edges: string[];
}

/** The cloud service that plays a block, or what the organisation builds where no service fills it. */
export type BlockService = {
  service: string;
  build?: boolean;
  note?: string;
  /** True when this is the organisation's own recorded choice, drawn in place of the reference service. */
  ours?: boolean;
};
