/**
 * The fixed words a feed item and a deep dive are tagged with: what kind of item it is, how well
 * an incident is established, which side of the attack the AI system was on, whether it fits its
 * incident pattern well, the change to the site an item implies, the owner's decision on it, and
 * the words a security tool is described with. The incident patterns themselves are data
 * (data/incident-patterns/); these lists are not, so the build can check against them before
 * any dataset exists.
 */

/**
 * The five kinds of item the feed carries, in the order its chips show them. An item written
 * before kinds existed is an incident. `label` is the tag on the item, `chip` the filter's name.
 */
export const FEED_KINDS = [
  { id: "incident", label: "Incident", chip: "Incidents", blurb: "A real attack on an AI system, or by one, filed under an incident pattern." },
  { id: "productUpdate", label: "Product update", chip: "Product updates", blurb: "A vendor shipped or changed a security control in an AI product." },
  { id: "tool", label: "Tool", chip: "Tools", blurb: "A new open-source or commercial tool that protects AI systems." },
  { id: "launch", label: "Launch", chip: "Launches", blurb: "A new AI product or feature that changes where data goes or what an organisation can control." },
  { id: "research", label: "Research", chip: "Research", blurb: "How leading teams secure AI, new standards and agency guidance." },
] as const;

export type FeedKind = (typeof FEED_KINDS)[number]["id"];

export const kindById = new Map<string, (typeof FEED_KINDS)[number]>(FEED_KINDS.map((k) => [k.id, k]));

/**
 * How well a feed item is established, in the words the feed shows. The feed sorts on date
 * alone; this is a tag on each item and one of its filters, never a ranking. Incidents only.
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

/**
 * The change to the site an item implies, by what it changes. The daily run applies a product's
 * settings row and a security tool by itself; the rest wait for the owner (data/feed/decisions.yaml).
 */
export const FEED_UPDATE_ACTIONS = [
  { id: "settings", label: "Product settings", blurb: "A new or changed setting in a product already on the site." },
  { id: "toolOption", label: "Security tool", blurb: "A security tool listed under a control it delivers (data/security-tools/)." },
  { id: "onboard", label: "Onboard a product", blurb: "A new AI product that fits an existing pattern." },
  { id: "newControl", label: "New control", blurb: "A control the catalogue lacks." },
  { id: "newPattern", label: "New pattern", blurb: "A new kind of AI system." },
  { id: "controlGuidance", label: "Control guidance", blurb: "A change to a control's recommended practice." },
] as const;
export type FeedUpdateAction = (typeof FEED_UPDATE_ACTIONS)[number]["id"];
export const updateActionById = new Map<string, (typeof FEED_UPDATE_ACTIONS)[number]>(FEED_UPDATE_ACTIONS.map((a) => [a.id, a]));

/** Where an implied change stands: made, waiting for the owner, or turned down. */
export const FEED_UPDATE_STATUSES = [
  { id: "applied", label: "applied" },
  { id: "proposed", label: "proposed" },
  { id: "declined", label: "declined" },
] as const;
export type FeedUpdateStatus = (typeof FEED_UPDATE_STATUSES)[number]["id"];

/** The owner's answer to a proposed change, in data/feed/decisions.yaml. */
export const FEED_DECISIONS = ["approve", "decline"] as const;
export type FeedDecisionValue = (typeof FEED_DECISIONS)[number];

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
