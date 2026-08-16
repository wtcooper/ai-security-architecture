/**
 * Visual language for the flow-style architecture diagrams, translated from the F5 reference
 * architecture grammar into this app's tokens: white blocks with a title tab, typed data paths
 * with a small legend, light-blue numbered capability chips, and grey risk tags.
 */
import { bandFor } from "@/lib/bands";
import { componentById } from "@/lib/data";
import { BAND_TOKENS } from "@/lib/map-layout";
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
};

/**
 * The tab colour carries the risk-map layer: a block anchored to a CoSAI component takes its
 * band's rail colour, so a box here and a box on the risk map read as the same thing. Nearly
 * every block is anchored; the grey fallback is reserved for security and governance machinery
 * CoSAI does not model.
 */
export function blockTab(block: ArchBlock): string {
  const fallback = BLOCK_STYLE[block.kind as Exclude<BlockKind, "actor">]?.tab ?? "var(--ink-2)";
  if (block.kind === "governance") return fallback;
  const id =
    block.cosaiComponent ?? block.items?.find((i) => i.cosaiComponent)?.cosaiComponent;
  const component = id ? componentById.get(id) : undefined;
  if (!component) return fallback;
  return BAND_TOKENS[bandFor(component.id, component.category, component.subcategory)].rail;
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
