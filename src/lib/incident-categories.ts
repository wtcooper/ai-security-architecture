/**
 * The fixed attack types an incident is filed under, one per incident. The list is short on
 * purpose: it is the one filter on the Incidents page, so it has to stay readable at a glance
 * however many incidents are added. A new incident that fits none of these is a reason to
 * revisit the list, not to add a seventh label quietly.
 */
export const INCIDENT_CATEGORIES = [
  { id: "promptInjection", label: "Prompt injection", blurb: "Untrusted content steers the agent." },
  { id: "supplyChain", label: "Supply chain", blurb: "Poisoned tools, packages, models, releases or instruction files." },
  { id: "identity", label: "Identity & credentials", blurb: "Stolen tokens and keys, over-broad integrations, unapproved AI." },
  { id: "exposed", label: "Exposed by default", blurb: "Agents, gateways and apps left open to anyone who finds them." },
  { id: "breakout", label: "Agent breaks out", blurb: "An agent escapes its sandbox or evaluation, or acts beyond its brief." },
  { id: "aiAttacker", label: "AI as the attacker", blurb: "An agent runs the intrusion itself." },
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number]["id"];

export const categoryById = new Map<string, (typeof INCIDENT_CATEGORIES)[number]>(INCIDENT_CATEGORIES.map((c) => [c.id, c]));

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
