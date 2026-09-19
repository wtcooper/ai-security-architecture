/**
 * The enterprise landscape's shared model: the MITRE parent capabilities as tiles, each with the
 * organisation's rolled-up status when the overlay is on, and the placement grammar that puts a
 * tile into a view. Specialisations never appear as tiles; their records roll up into the parent
 * (the same rollup the Capabilities matrix uses).
 */
import type { DisplayStatus } from "@/components/StatusPill";
import { landscape, mitigations, orgCapabilityPostureFor, specializationsOf, type OrgCapabilitySupport } from "@/lib/data";
import type { LandscapeView, Mitigation } from "@/lib/types";

export interface Tile {
  id: string;
  title: string;
  mitigation: Mitigation;
  /** What the tile adds beyond a domain's own architecture; see AiKind. */
  ai: AiKind;
  /** Present only with the org overlay on. */
  posture?: OrgCapabilitySupport;
}

export const parents: Mitigation[] = mitigations.filter((m) => !m.parent);

/**
 * What a capability adds to a domain's own reference architecture. `native` is defined for AI
 * (MITRE ATLAS); `extended` is a foundational D3FEND capability that needed an authored AI
 * specialisation to be actionable here (an agent kill switch, shadow-AI discovery); `foundational`
 * is one the domain architecture already owns and only has to reach AI systems. A technology
 * category such as AI-SPM is a product lens, not this — it realises foundational capabilities.
 */
export type AiKind = "native" | "extended" | "foundational";
export const aiKindOf = (m: Mitigation): AiKind =>
  m.origin.framework === "MITRE ATLAS" ? "native" : specializationsOf(m.id).length ? "extended" : "foundational";
export const isAiSpecific = (m: Mitigation) => aiKindOf(m) !== "foundational";
export const landscapeViewById = new Map(landscape.views.map((v) => [v.id, v]));

/**
 * Every parent that applies on the surface (all of them when no surface is chosen), with the
 * status the organisation would report for it: on one surface when chosen, otherwise across
 * every surface and available product.
 */
export function tilesFor(surface: string | null, overlay: boolean, aiOnly = false): Tile[] {
  return parents
    .filter((m) => !surface || m.surfaces[surface]?.applies)
    .filter((m) => !aiOnly || isAiSpecific(m))
    .map((m) => ({
      id: m.id,
      title: m.abbrev ?? m.title,
      mitigation: m,
      ai: aiKindOf(m),
      posture: overlay ? orgCapabilityPostureFor(m.id, surface ?? undefined) : undefined,
    }));
}

/** `group`, `group/lane` or `row/column` — validated by the build, so splitting is enough here. */
export function placementOf(view: LandscapeView, id: string): { a: string; b?: string } {
  const [a, b] = (landscape.placements[id]?.[view.id] ?? "").split("/");
  return { a, b };
}

export const tilesInGroup = (view: LandscapeView, tiles: Tile[], group: string, lane?: string) =>
  tiles.filter((t) => {
    const p = placementOf(view, t.id);
    return p.a === group && (lane === undefined || p.b === lane);
  });

export const tilesInCell = (view: LandscapeView, tiles: Tile[], row: string, column: string) =>
  tiles.filter((t) => {
    const p = placementOf(view, t.id);
    return p.a === row && p.b === column;
  });

export type Coverage = Record<Exclude<DisplayStatus, "unmapped">, number> & { total: number };

/** How a set of tiles reads with the overlay on; every tile has a status, absent records are not assessed. */
export function coverageOf(tiles: Tile[]): Coverage {
  const c: Coverage = { enabled: 0, inProgress: 0, gap: 0, notAssessed: 0, total: tiles.length };
  for (const t of tiles) {
    const s = t.posture?.status ?? "notAssessed";
    c[s === "unmapped" ? "notAssessed" : s]++;
  }
  return c;
}
