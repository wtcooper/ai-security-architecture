/**
 * The fixed words a feed item and a deep dive are tagged with: what kind of item it is, how much
 * it weighs, how well an incident is established, which side of the attack the AI system was on,
 * whether it fits its incident pattern well, and the words a security tool is described with.
 * The incident patterns themselves are data (data/incident-patterns/); these lists are not, so
 * the build can check against them before any dataset exists. The change to the site an item
 * implies is review material: its words live with the loader (scripts/lib/feed.ts) and never
 * reach the site.
 */

/**
 * The six kinds of item the feed carries, in the order its chips show them. An item written
 * before kinds existed is an incident. `label` is the tag on the item, `chip` the filter's name.
 */
export const FEED_KINDS = [
  { id: "incident", label: "Incident", chip: "Incidents", blurb: "A real attack on an AI system, or by one, filed under an incident pattern; reports of campaigns under way are incidents too." },
  { id: "productUpdate", label: "Product update", chip: "Product updates", blurb: "A vendor shipped or changed a security control in an AI product." },
  { id: "tool", label: "Tool", chip: "Tools", blurb: "A new open-source or commercial tool that protects AI systems." },
  { id: "launch", label: "Launch", chip: "Launches", blurb: "A new AI product or feature that changes where data goes or what an organisation can control." },
  { id: "guidance", label: "Guidance", chip: "Guidance", blurb: "How to secure AI in practice: practice posts from labs and vendors, standards and agency guidance." },
  { id: "research", label: "Research", chip: "Research", blurb: "Findings and results: studies, measured results and technical discoveries." },
] as const;

export type FeedKind = (typeof FEED_KINDS)[number]["id"];

export const kindById = new Map<string, (typeof FEED_KINDS)[number]>(FEED_KINDS.map((k) => [k.id, k]));

/**
 * How much an item weighs, heaviest first. A headline is what a reader would be poorly served not
 * knowing today (at most three a day); notable is worth reading this week; a brief is worth a line
 * and is folded by default.
 */
export const FEED_WEIGHTS = [
  { id: "headline", label: "Headline" },
  { id: "notable", label: "Notable" },
  { id: "brief", label: "Brief" },
] as const;

export type FeedWeight = (typeof FEED_WEIGHTS)[number]["id"];

export const weightById = new Map<string, (typeof FEED_WEIGHTS)[number]>(FEED_WEIGHTS.map((w) => [w.id, w]));

/** 0 for a headline, 1 for notable, 2 for a brief: the order a section lists them in. */
export const weightRank = (weight: string): number => {
  const i = FEED_WEIGHTS.findIndex((w) => w.id === weight);
  return i < 0 ? FEED_WEIGHTS.length : i;
};

/** At most this many headlines a day. */
export const HEADLINES_PER_DAY = 3;

/**
 * How well a feed item is established, in the words the feed shows. A tag on each item and one
 * of the Incidents page's filters, never a ranking. Incidents only.
 */
export const FEED_EVIDENCE = [
  { id: "exploited", label: "In the wild", blurb: "Exploited against real systems." },
  { id: "confirmed", label: "Confirmed", blurb: "Confirmed by the vendor, the victim or an agency." },
  { id: "demonstrated", label: "Demonstrated", blurb: "Shown against a real product, then patched or given a CVE." },
  { id: "reported", label: "Single report", blurb: "One report, not confirmed by anyone else." },
] as const;

export type FeedEvidence = (typeof FEED_EVIDENCE)[number]["id"];

export const evidenceById = new Map<string, (typeof FEED_EVIDENCE)[number]>(FEED_EVIDENCE.map((e) => [e.id, e]));

/** "target": an AI system was attacked. "weapon": an AI agent ran the attack. */
export const INCIDENT_PERSPECTIVES = ["target", "weapon"] as const;
export type IncidentPerspective = (typeof INCIDENT_PERSPECTIVES)[number];

/**
 * How well an item fits its incident pattern, when not well. Three or more loose items in 60
 * days that share a mechanism the nearest incident pattern's controls do not stop are the
 * trigger for a new incident pattern.
 */
export const FEED_FITS = ["loose"] as const;
export type FeedFit = (typeof FEED_FITS)[number];

/** A security tool (data/security-tools/): open source or commercial, and how far it has shipped. */
export const SECURITY_TOOL_KINDS = [
  { id: "open", label: "Open source" },
  { id: "commercial", label: "Commercial" },
] as const;
export type SecurityToolKind = (typeof SECURITY_TOOL_KINDS)[number]["id"];

export const SECURITY_TOOL_STATUSES = [
  { id: "ga", label: "Generally available" },
  { id: "preview", label: "Preview" },
  { id: "beta", label: "Beta" },
] as const;
export type SecurityToolStatus = (typeof SECURITY_TOOL_STATUSES)[number]["id"];
