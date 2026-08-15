/**
 * Shared visual language for both architecture renderers.
 *
 * Both the SVG renderer and the React Flow renderer read from here, so the bake-off compares the
 * renderers rather than two different palettes. Whichever wins, this file stays.
 */
import { BAND_TOKENS } from "@/lib/map-layout";
import { personaById } from "@/lib/data";
import type { NodeType } from "@/lib/types";

/**
 * Zone ownership is stated in CoSAI personas, not in "you" and "the vendor". Which party "you"
 * are depends on who is reading — an application developer and a model provider look at the same
 * diagram and mean different things by it — and CoSAI already publishes the vocabulary for saying
 * it precisely. Two personas on one zone is shared responsibility, said better than a "shared"
 * badge could say it.
 *
 * Persona titles are written for a table and are too long for a chip, so these are the short
 * forms. The full title and its description are one click away on the Personas tab.
 */
export const PERSONA_SHORT: Record<string, string> = {
  personaModelProvider: "Model Provider",
  personaDataProvider: "Data Provider",
  personaPlatformProvider: "Platform Provider",
  personaModelServing: "Model Serving",
  personaAgenticProvider: "Agentic Platform",
  personaApplicationDeveloper: "App Developer",
  personaGovernance: "Governance",
  personaEndUser: "System Users",
};

export const personaShort = (id: string) =>
  PERSONA_SHORT[id] ?? personaById.get(id)?.title ?? id;

/**
 * What the chip on a zone reads. Empty personas means the zone is outside the system.
 *
 * `maxChars` keeps the chip inside a narrow zone — the governance column is 208px, and two full
 * persona names do not fit. Overflow collapses to the first name plus a count rather than
 * truncating mid-word, so the chip still names a real persona.
 */
export function zonePersonaLabel(personas: string[], maxChars = Infinity) {
  if (!personas.length) return "outside the system";
  const full = personas.map(personaShort).join(" · ");
  if (full.length <= maxChars) return full;
  const first = personaShort(personas[0]);
  return personas.length > 1 ? `${first} +${personas.length - 1}` : first;
}

/**
 * Zone chrome. Dashed borders read as trust boundaries; fills stay near-neutral so the phase reds
 * remain the only shout on the page.
 *
 * The model band's pink is deliberately unused here. There is no "model zone" — the model lives
 * inside a compute tier or behind a vendor boundary — and a pink container next to the exposed
 * red reads as an alarm the zone is not raising. The zones you operate share the application wash
 * and are told apart by their labels and the gutters between them.
 */
export const ZONE_STYLE: Record<string, { fill: string; stroke: string; dash: string }> = {
  outsideWorld: { fill: "var(--mist)", stroke: "var(--line-strong)", dash: "6 5" },
  device: { fill: "var(--band-app-fill)", stroke: "var(--band-app-edge)", dash: "6 4" },
  network: { fill: "var(--band-app-fill)", stroke: "var(--band-app-edge)", dash: "6 4" },
  compute: { fill: "var(--band-app-fill)", stroke: "var(--band-app-edge)", dash: "6 4" },
  data: { fill: "var(--band-data-fill)", stroke: "var(--band-data-edge)", dash: "6 4" },
  management: { fill: "var(--band-infra-fill)", stroke: "var(--band-infra-edge)", dash: "3 4" },
  // Isolation is a mitigation, so it takes the infrastructure green, with a tighter dash to read
  // as a harder boundary than the zones around it.
  sandbox: { fill: "var(--band-infra-fill)", stroke: "var(--band-infra-edge)", dash: "2 4" },
  vendorOpaque: { fill: "var(--mist)", stroke: "var(--ink-3)", dash: "10 5" },
};

export const zoneStyle = (type: string) => ZONE_STYLE[type] ?? ZONE_STYLE.compute;

/**
 * A node's accent comes from its risk-map band, so a node here and a box on the risk map read as
 * the same thing. The governance plane has no band by design and gets the neutral rail — which is
 * itself the point: CoSAI names nothing there.
 */
export function nodeAccent(type: NodeType | undefined): string {
  if (!type?.layer) return "var(--ink-3)";
  return BAND_TOKENS[type.layer].rail;
}

/** Boundary actors are drawn dashed and unfilled wherever they appear. */
export const isActorGroup = (type: NodeType | undefined) => type?.group === "actor";

export const EDGE_STROKE = "var(--line-strong)";
export const CONTROL_DASH = "5 4";
