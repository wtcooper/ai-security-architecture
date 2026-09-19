import { mitigationById, surfaces } from "@/lib/data";
import type { Mitigation, TechnologyCapability } from "@/lib/types";
import type { MatrixItem } from "./DefenseMatrix";

export function mitigationMatrixItem(mitigation: Mitigation): MatrixItem {
  return {
    id: mitigation.id,
    title: mitigation.title,
    placements: surfaces.filter((s) => mitigation.surfaces[s.id]?.applies)
      .map((s) => ({ category: mitigation.category, surface: s.id })),
  };
}

/**
 * Row comes from the mapped mitigations' control groups; column from the capability's own authored
 * surface decision, further limited to surfaces where that mitigation applies. Not a deployment claim.
 */
export function capabilityMatrixItem(capability: TechnologyCapability): MatrixItem {
  return {
    id: capability.id,
    title: capability.title,
    placements: capability.mitigationMappings.flatMap(({ mitigation }) =>
      mitigationMatrixItem(mitigationById.get(mitigation)!).placements
        .filter((p) => capability.surfaces[p.surface]?.applies)),
  };
}

/** The mitigations a set of capabilities implements inside one matrix cell. */
export function mitigationsInCell(items: TechnologyCapability[], category: string, surface: string): Mitigation[] {
  const ids = new Set(items.flatMap((c) => c.mitigationMappings.map((m) => m.mitigation)));
  return [...ids].map((id) => mitigationById.get(id)!)
    .filter((m) => m.category === category && m.surfaces[surface]?.applies)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function matchesMatrixFilters(item: MatrixItem, { category, surface }: { category: string; surface: string }) {
  return item.placements.some((p) => (!category || p.category === category) && (!surface || p.surface === surface));
}
