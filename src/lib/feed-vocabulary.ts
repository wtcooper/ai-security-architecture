/**
 * The fixed words a feed item and a deep dive are tagged with: how well an item is established,
 * which side of the attack the AI system was on, and whether it fits its incident pattern well.
 * The incident patterns themselves are data (data/incident-patterns/); these lists are not, so
 * the build can check against them before any dataset exists.
 */

/**
 * How well a feed item is established, in the words the feed shows. The feed sorts on date
 * alone; this is a tag on each item and one of its filters, never a ranking.
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
