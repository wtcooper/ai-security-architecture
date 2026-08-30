/**
 * Visual language for the flow-style architecture diagrams, translated from the F5 reference
 * architecture grammar into this app's tokens: white blocks with a title tab, typed data paths
 * with a small legend, light-blue numbered capability chips, and grey risk tags.
 */
import { bandFor, type BandId } from "@/lib/bands";
import { componentById } from "@/lib/data";
import type { ArchBlock, BlockKind, PathClass } from "@/lib/types";

/** Stroke and dash per connector class. One green for everything inside the system. */
export const PATH_STYLE: Record<PathClass, { stroke: string; dash?: string; label: string }> = {
  primary: { stroke: "var(--mitigated)", label: "Data path" },
  external: { stroke: "var(--band-data-rail)", label: "External content & actions" },
  governance: { stroke: "var(--ink-3)", dash: "3 4", label: "Governance relationship" },
};

/**
 * Block chrome per kind. The border says what kind of party runs the block — solid for
 * services, dashed grey for a provider you cannot see into, amber for the outside, dotted
 * slate for the management plane. Tab colours here are only the fallback when a block has no
 * CoSAI anchor: a quiet dark grey, reserved for the security and governance machinery CoSAI
 * does not model (gateways, identity edges, sandboxes, the governance plane itself).
 */
export const BLOCK_STYLE: Record<
  Exclude<BlockKind, "actor">,
  { stroke: string; tab: string; dash?: string }
> = {
  service: { stroke: "var(--ink)", tab: "var(--ink-2)" },
  provider: { stroke: "var(--ink-3)", tab: "var(--ink-2)", dash: "6 4" },
  external: { stroke: "var(--band-data-rail)", tab: "var(--ink-2)", dash: "8 4" },
  governance: { stroke: "var(--ink-2)", tab: "var(--ink-2)", dash: "2 4" },
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

/** The capability chips — F5's light-blue numbered design-requirement circles. */
export const CHIP = {
  r: 9,
  fill: "var(--introduced-soft)",
  stroke: "var(--introduced)",
  text: "var(--introduced)",
};

/** The risk tags — F5's grey OWASP pills, carrying the catalogue-stable risk code. */
export const TAG = {
  fill: "var(--mist)",
  stroke: "var(--line-strong)",
  text: "var(--ink-2)",
};

export const tagWidth = (code: string) => code.length * 6.6 + 12;
