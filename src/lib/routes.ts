/**
 * Every internal address in one place. Patterns are the front door (`/patterns/<slug>/`), the
 * control catalogue sits beside them (a tool is reached on its pattern), and the risk and framework material
 * lives under `/reference/`. Old addresses are forwarded by `LegacyRedirect`, which uses the
 * same helpers, so a link and its redirect can never disagree.
 */
import { archetypeById, toolById } from "@/lib/data";

/**
 * The tabs of a pattern page, in their order. A page opens on How it works ("overview"), which is
 * left out of the address; the threat model follows it, then Enable, where the pattern is put in
 * place. Risks are a section of How it works.
 */
export type PatternTab = "overview" | "threats" | "enable" | "flows" | "incidents";
export const PATTERN_TABS: PatternTab[] = ["overview", "threats", "enable", "flows", "incidents"];

export const ROUTES = {
  home: "/",
  patterns: "/patterns",
  controls: "/controls",
  incidents: "/incidents",
  incidentFeed: "/incidents/feed",
  reference: "/reference",
  riskMap: "/reference/risk-map",
  risks: "/reference/risks",
  cosaiControls: "/reference/cosai-controls",
  components: "/reference/components",
  personas: "/reference/personas",
  frameworks: "/reference/frameworks",
  clouds: "/reference/clouds",
} as const;

/** "cloudAws" -> "aws": how a cloud is named in an address. */
export const cloudSlug = (cloudId: string) => cloudId.replace(/^cloud/, "").toLowerCase();

/** A pattern's page, optionally on a tab, as built on a cloud, with a product open, at one control's row, or with one threat open. */
export function patternHref(archetypeId: string, opts: { tab?: PatternTab; tool?: string; control?: string; cloud?: string; threat?: string } = {}): string {
  const arch = archetypeById.get(archetypeId);
  if (!arch) return ROUTES.patterns;
  const query = new URLSearchParams();
  // How it works is the default; a product or a control opens Enable by itself, so neither needs the tab named.
  // A threat is a row of the Threat model tab, so naming one names the tab.
  const tab = opts.threat ? "threats" : opts.tab;
  if (tab && tab !== "overview" && !(tab === "enable" && (opts.tool || opts.control))) query.set("tab", tab);
  if (opts.threat) query.set("threat", opts.threat);
  if (opts.cloud) query.set("cloud", cloudSlug(opts.cloud));
  if (opts.tool) query.set("tool", opts.tool);
  return `${ROUTES.patterns}/${arch.slug}${query.size ? `?${query}` : ""}${opts.control ? `#control-${opts.control}` : ""}`;
}

/** A tool's settings, on the pattern it belongs to. */
export const toolHref = (toolId: string): string => {
  const tool = toolById.get(toolId);
  return tool ? patternHref(tool.architecture, { tool: toolId }) : ROUTES.patterns;
};

/** A control in the catalogue: a MITRE mitigation or a `cap-*` specialisation. */
export const controlHref = (id: string) => `${ROUTES.controls}?control=${encodeURIComponent(id)}`;
export const cosaiControlHref = (id: string) => `${ROUTES.cosaiControls}?control=${id}`;
export const riskHref = (id: string) => `${ROUTES.risks}?risk=${id}`;
export const componentHref = (id: string) => `${ROUTES.components}?component=${id}`;
export const personaHref = (id: string) => `${ROUTES.personas}?persona=${id}`;
export const riskMapHref = (riskId: string, phase: string) => `${ROUTES.riskMap}?risk=${riskId}&phase=${phase}`;
export const incidentHref = (id: string) => `${ROUTES.incidents}/${id}`;

/** The feed's filters, as its address carries them. `incident` narrows it to the reports one catalogue incident tells. */
export interface FeedFilters {
  category?: string | null;
  pattern?: string | null;
  evidence?: string | null;
  incident?: string | null;
}
export const FEED_FILTERS = ["category", "pattern", "evidence", "incident"] as const;

/** The feed's query string for these filters, in a fixed order; empty when none is set. */
export function feedQuery(filters: FeedFilters = {}): string {
  const query = new URLSearchParams();
  for (const key of FEED_FILTERS) {
    const value = filters[key];
    if (value) query.set(key, value);
  }
  return query.toString();
}

/** The feed, optionally filtered, optionally with one item in view. */
export function feedHref(filters: FeedFilters = {}, itemId?: string): string {
  const query = feedQuery(filters);
  return `${ROUTES.incidentFeed}${query ? `?${query}` : ""}${itemId ? `#${itemId}` : ""}`;
}
/** A cloud's page: the patterns built on it and its own control options. */
export const cloudHref = (cloudId: string) => `${ROUTES.clouds}?cloud=${cloudSlug(cloudId)}`;

/** A CoSAI control id, as opposed to a catalogue control (D3-…, AML.…, cap-…). */
export const isCosaiControlId = (id: string) => /^control[A-Z]/.test(id);
