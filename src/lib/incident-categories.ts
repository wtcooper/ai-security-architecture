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
