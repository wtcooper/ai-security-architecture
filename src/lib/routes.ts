/**
 * Every internal address in one place. Patterns are the front door (`/patterns/<slug>/`), the
 * control catalogue and the tool index sit beside them, and the risk and framework material
 * lives under `/reference/`. Old addresses are forwarded by `LegacyRedirect`, which uses the
 * same helpers, so a link and its redirect can never disagree.
 */
import { archetypeById, toolById } from "@/lib/data";

/** The tabs of a pattern page. Enable is the default and is left out of the address. */
export type PatternTab = "enable" | "overview" | "flows" | "incidents";
export const PATTERN_TABS: PatternTab[] = ["enable", "overview", "flows", "incidents"];

export const ROUTES = {
  home: "/",
  patterns: "/patterns",
  controls: "/controls",
  tools: "/tools",
  incidents: "/incidents",
  reference: "/reference",
  riskMap: "/reference/risk-map",
  risks: "/reference/risks",
  cosaiControls: "/reference/cosai-controls",
  components: "/reference/components",
  personas: "/reference/personas",
  frameworks: "/reference/frameworks",
} as const;

/** A pattern's page, optionally on a tab, with a product open, or at one control's row. */
export function patternHref(archetypeId: string, opts: { tab?: PatternTab; tool?: string; control?: string } = {}): string {
  const arch = archetypeById.get(archetypeId);
  if (!arch) return ROUTES.patterns;
  const query = new URLSearchParams();
  if (opts.tab && opts.tab !== "enable") query.set("tab", opts.tab);
  if (opts.tool) query.set("tool", opts.tool);
  return `${ROUTES.patterns}/${arch.slug}${query.size ? `?${query}` : ""}${opts.control ? `#control-${opts.control}` : ""}`;
}

/** A tool's settings, on the pattern it belongs to. */
export const toolHref = (toolId: string): string => {
  const tool = toolById.get(toolId);
  return tool ? patternHref(tool.architecture, { tool: toolId }) : ROUTES.tools;
};

/** A control in the catalogue: a MITRE mitigation or a `cap-*` specialisation. */
export const controlHref = (id: string) => `${ROUTES.controls}?control=${encodeURIComponent(id)}`;
export const cosaiControlHref = (id: string) => `${ROUTES.cosaiControls}?control=${id}`;
export const riskHref = (id: string) => `${ROUTES.risks}?risk=${id}`;
export const componentHref = (id: string) => `${ROUTES.components}?component=${id}`;
export const personaHref = (id: string) => `${ROUTES.personas}?persona=${id}`;
export const riskMapHref = (riskId: string, phase: string) => `${ROUTES.riskMap}?risk=${riskId}&phase=${phase}`;
export const incidentHref = (id: string) => `${ROUTES.incidents}/${id}`;

/** A CoSAI control id, as opposed to a catalogue control (D3-…, AML.…, cap-…). */
export const isCosaiControlId = (id: string) => /^control[A-Z]/.test(id);
