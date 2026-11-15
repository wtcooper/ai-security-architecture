/**
 * Boundary crossings: every flow whose two ends sit in different trust zones, and what it
 * passes through on our side. A pattern's file may say so per edge (`crossing:`); where it does
 * not, the answer is derived from the ends of the edge. Pure data, no geometry.
 */
import type { Archetype, ArchBlock, ArchEdge, CrossingKind } from "@/lib/types";

export interface Crossing {
  /** "from->to" exactly as the pattern keys the edge. */
  key: string;
  edge: ArchEdge;
  from: ArchBlock;
  to: ArchBlock;
  fromZone: string;
  toZone: string;
  kind: CrossingKind;
  via: string;
  /** True when the pattern file states the crossing; false when it is derived. */
  authored: boolean;
  /** Controls held at the crossing: pinned on the flow, or on either end of it, in pin order. */
  controls: string[];
}

export const CROSSING_LABEL: Record<CrossingKind, string> = {
  brokered: "Through a control point we run",
  vendor: "Governed by the vendor",
  person: "Through the person",
  direct: "Nothing of ours in the path",
};

/**
 * Components that exist to stand in a path: what a flow passes through, not what it is for.
 * Titles are the catalogue's closed vocabulary (data/reference/vocabulary.yaml), so a new
 * broker is added here when it is added there.
 */
const CONTROL_POINTS = new Set([
  "AI gateway",
  "Identity provider",
  "Authorization server",
  "Tunnel connector",
  "Messaging relay",
  "Private pkg registry",
  "Model registry",
]);

const keyOf = (e: { from: string; to: string }) => `${e.from}->${e.to}`;

/** Where a person or an outside caller stands when its block names a zone we run: outside it. */
export const OUTSIDE = "@outside";
/**
 * A block's place for the purpose of crossings: its zone, except that a person or caller whose
 * block names a zone we or a vendor run stands outside it.
 */
export const standIn = (b: Pick<ArchBlock, "kind" | "zone">, ownerOfZone: Map<string, string>) =>
  (b.kind === "actor" || b.kind === "origin") && ownerOfZone.get(b.zone ?? "") !== "user" ? OUTSIDE : b.zone ?? "";

export function crossingsOf(archetype: Archetype): Crossing[] {
  const block = new Map(archetype.blocks.map((b) => [b.id, b]));
  const owner = new Map((archetype.zones ?? []).map((z) => [z.id, z.owner]));
  const ownerOf = (b: ArchBlock) => owner.get(b.zone ?? "") ?? "";
  const standOf = (b: ArchBlock) => standIn(b, owner);
  const ours = (b: ArchBlock) => standOf(b) !== OUTSIDE && (ownerOf(b) === "endpoint" || ownerOf(b) === "cloud");
  const out: Crossing[] = [];
  for (const edge of archetype.edges) {
    const from = block.get(edge.from);
    const to = block.get(edge.to);
    if (!from || !to || !from.zone || !to.zone || standOf(from) === standOf(to)) continue;
    const key = keyOf(edge);
    const at = new Set([key, keyOf({ from: edge.to, to: edge.from }), edge.from, edge.to]);
    const controls = [...new Set(archetype.pins.mitigations.filter((p) => at.has(p.at)).map((p) => p.mitigation))].sort(
      (x, y) => archetype.mitigations.indexOf(x) - archetype.mitigations.indexOf(y),
    );
    const ends = [from, to];
    const broker = ends.find((b) => ours(b) && CONTROL_POINTS.has(b.title));
    const person = ends.find((b) => ownerOf(b) === "user" || standOf(b) === OUTSIDE);
    let kind: CrossingKind;
    let via: string;
    if (broker) {
      kind = "brokered";
      via = broker.title;
    } else if (person && ends.some(ours)) {
      kind = "person";
      via = `The person at the device: ${person.title.toLowerCase()} signs in and is present`;
    } else if (ends.some((b) => ownerOf(b) === "vendor")) {
      kind = "vendor";
      via = "The vendor's own controls: assured under the agreement, not inspected";
    } else {
      kind = "direct";
      via = controls.length ? "Nothing between: only the controls pinned on the flow and its ends" : "Nothing between";
    }
    const authored = Boolean(edge.crossing);
    if (edge.crossing) ({ kind, via } = edge.crossing);
    out.push({ key, edge, from, to, fromZone: standOf(from), toZone: standOf(to), kind, via, authored, controls });
  }
  return out;
}
