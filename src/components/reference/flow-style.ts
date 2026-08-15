/**
 * Visual language for the flow-style architecture diagrams, translated from the F5 reference
 * architecture grammar into this app's tokens: white blocks with a dark title tab, typed data
 * paths with a small legend, light-blue numbered capability chips, and grey risk tags.
 */
import type { BlockKind, PathClass } from "@/lib/types";

/** Stroke and dash per connector class. Colors reuse the app's phase and band tokens. */
export const PATH_STYLE: Record<PathClass, { stroke: string; dash?: string; label: string }> = {
  primary: { stroke: "var(--mitigated)", label: "Primary data path" },
  secondary: { stroke: "var(--introduced)", label: "Secondary data path" },
  external: { stroke: "var(--band-data-rail)", label: "External content & actions" },
  governance: { stroke: "var(--ink-3)", dash: "3 4", label: "Governance relationship" },
};

/** Block chrome per kind. The tab is the black F5 title bar; provider and external recolor it. */
export const BLOCK_STYLE: Record<
  Exclude<BlockKind, "actor">,
  { stroke: string; tab: string; dash?: string }
> = {
  service: { stroke: "var(--ink)", tab: "var(--ink)" },
  provider: { stroke: "var(--ink-3)", tab: "var(--ink-2)", dash: "6 4" },
  external: { stroke: "var(--band-data-rail)", tab: "var(--band-data-rail)" },
  governance: { stroke: "var(--band-infra-rail)", tab: "var(--band-infra-rail)" },
};

/** The capability chips — F5's light-blue numbered design-requirement circles. */
export const CHIP = {
  r: 9,
  fill: "var(--introduced-soft)",
  stroke: "var(--introduced)",
  text: "var(--introduced)",
};

/** The risk tags — F5's grey OWASP pills, carrying the catalogue-stable risk code. */
export const TAG = {
  h: 17,
  fill: "var(--mist)",
  stroke: "var(--line-strong)",
  text: "var(--ink-2)",
};

export const tagWidth = (code: string) => code.length * 6.6 + 12;
