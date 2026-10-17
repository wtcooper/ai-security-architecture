/**
 * Visual language for the flow-style architecture diagrams, translated from the F5 reference
 * architecture grammar into this app's tokens: neutral ownership zones, white blocks with a
 * title tab coloured by layer, two path styles that differ by dash rather than hue, violet
 * numbered capability chips and grey risk tags. Each colour carries one meaning.
 */
import { bandFor, type BandId } from "@/lib/bands";
import { componentById } from "@/lib/data";
import { STATUS_STYLE } from "@/components/StatusPill";
import type { ArchBlock, BlockKind, DisplayStatus, PathClass, Phase } from "@/lib/types";

/** A caller-supplied chip colouring that replaces the reference blue and the status tints. */
export interface ChipPaint {
  bg: string;
  border: string;
  text: string;
  dashed?: boolean;
  /** Appended to the chip's hover card. */
  hint?: string;
}

/**
 * A numbered chip's colours: a caller's paint where given, else a status tint with a
 * full-strength ring so it reads at canvas size, else the reference blue.
 */
export function chipColors(status?: DisplayStatus, paint?: ChipPaint) {
  if (paint) {
    return { background: paint.bg, borderColor: paint.border, borderStyle: paint.dashed ? "dashed" : "solid", color: paint.text } as const;
  }
  const s = status && status !== "notSet" ? STATUS_STYLE[status] : undefined;
  return {
    background: s?.bg ?? "var(--paper, #fff)",
    borderColor: s?.text ?? "var(--chip, #6d4fc2)",
    borderStyle: "solid",
    color: s?.text ?? "var(--chip, #6d4fc2)",
  } as const;
}

/**
 * Stroke and dash per connector class. Both are dark grey and differ by dash alone, so no hue on
 * the drawing is spent on paths — and an incident replay's phase colours stand out against them.
 */
export const PATH_STYLE: Record<PathClass, { stroke: string; dash?: string; label: string }> = {
  primary: { stroke: "var(--ink-2)", label: "Data path" },
  external: { stroke: "var(--ink-2)", dash: "6 4", label: "External content & actions" },
};

/**
 * Ownership zones, in neutral greys so the tab colours are the only colour on a block. Zones the
 * organisation operates are solid; a vendor's platform and the outside world are a shade darker
 * with a dotted edge. The zone, not the block's border, says who runs what.
 */
export const ZONE_TINT: Record<string, { fill: string; line: string; ink: string; dotted?: boolean }> = {
  user: { fill: "#f4f5f7", line: "#cdd2d9", ink: "#4b5563" },
  endpoint: { fill: "#f4f5f7", line: "#cdd2d9", ink: "#4b5563" },
  cloud: { fill: "#f4f5f7", line: "#cdd2d9", ink: "#4b5563" },
  governance: { fill: "#f4f5f7", line: "#cdd2d9", ink: "#4b5563" },
  vendor: { fill: "#eceef1", line: "#9aa1ab", ink: "#4b5563", dotted: true },
  external: { fill: "#eceef1", line: "#9aa1ab", ink: "#4b5563", dotted: true },
};

/**
 * Block chrome per kind. Every block that is a party is drawn solid — the zone it sits in says
 * who runs it — and only a containment boundary is dashed. A governance call-out draws no box at
 * all: it is a control, not a component, so it is a title, an icon and
 * the chip numbers of what it implements. Tab colours here are only the fallback when a block
 * has no CoSAI anchor: a quiet dark grey, reserved for the security and governance machinery
 * CoSAI does not model (gateways, identity edges, sandboxes, the governance plane itself).
 */
export const BLOCK_STYLE: Record<
  Exclude<BlockKind, "actor">,
  { stroke: string; tab: string; dash?: string }
> = {
  service: { stroke: "var(--ink)", tab: "var(--ink-2)" },
  provider: { stroke: "var(--ink)", tab: "var(--ink-2)" },
  external: { stroke: "var(--ink)", tab: "var(--ink-2)" },
  governance: { stroke: "transparent", tab: "var(--ink-2)" },
  // Containment, not a party: a dashed frame around whatever runs inside it.
  boundary: { stroke: "var(--ink-3)", tab: "var(--ink)", dash: "7 5" },
  // Deliberately unnamed source. Drawn as nothing; only its anchor point matters.
  origin: { stroke: "transparent", tab: "transparent" },
};

/**
 * The reference architectures colour by what a thing is, in three layers plus grey: application
 * code, model & its infrastructure (one green — a model provider or a serving stack covers both,
 * and a two-colour tab is a puzzle, not a legend), and data. The risk map keeps its four bands;
 * this collapse exists only on these diagrams.
 */
export const REF_LAYERS = [
  { label: "Application", color: "var(--band-app-rail)" },
  { label: "Model", color: "var(--band-infra-rail)" },
  { label: "Data", color: "var(--band-data-rail)" },
] as const;

const LAYER_COLOR: Record<BandId, string> = {
  application: "var(--band-app-rail)",
  model: "var(--band-infra-rail)",
  modelInfrastructure: "var(--band-infra-rail)",
  dataInfrastructure: "var(--band-data-rail)",
};

/**
 * A block anchored to a CoSAI component takes its layer's colour; the grey fallback is reserved
 * for security and governance machinery CoSAI does not model.
 */
export function blockTab(block: ArchBlock): string {
  const fallback = BLOCK_STYLE[block.kind as Exclude<BlockKind, "actor">]?.tab ?? "var(--ink-2)";
  if (block.kind === "governance") return fallback;
  // The outside is data: everything an external block holds or returns — downstream records,
  // fetched content, stored artifacts — re-enters the system as data, so external blocks are
  // amber by rule, whatever CoSAI would call the system behind them.
  if (block.kind === "external") return LAYER_COLOR.dataInfrastructure;
  const id =
    block.cosaiComponent ?? block.items?.find((i) => i.cosaiComponent)?.cosaiComponent;
  const component = id ? componentById.get(id) : undefined;
  if (!component) return fallback;
  return LAYER_COLOR[bandFor(component.id, component.category, component.subcategory)];
}

/** The capability chips — F5's numbered design-requirement circles, in a hue nothing else uses. */
export const CHIP = {
  r: 9,
  fill: "var(--chip-soft)",
  stroke: "var(--chip)",
  text: "var(--chip)",
};

/** The risk tags — F5's grey OWASP pills, carrying the catalogue-stable risk code. */
export const TAG = {
  fill: "var(--mist)",
  stroke: "var(--line-strong)",
  text: "var(--ink-2)",
};

export const tagWidth = (code: string) => code.length * 6.6 + 12;

/** An incident step's phase, as the fill and stroke of the blocks and arrows it touches. */
export const OVERLAY_STYLE: Record<Phase, { stroke: string; fill: string }> = {
  introduced: { stroke: "var(--introduced)", fill: "var(--introduced-soft)" },
  exposed: { stroke: "var(--exposed)", fill: "var(--exposed-soft)" },
  mitigated: { stroke: "var(--mitigated)", fill: "var(--mitigated-soft)" },
};
