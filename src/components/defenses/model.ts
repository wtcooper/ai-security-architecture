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

/** Placement follows existing method mappings; it does not assert technology deployment. */
export function capabilityMatrixItem(capability: TechnologyCapability): MatrixItem {
  return {
    id: capability.id,
    title: capability.title,
    placements: capability.mitigationMappings.flatMap(({ mitigation }) =>
      mitigationMatrixItem(mitigationById.get(mitigation)!).placements),
  };
}

export function matchesMatrixFilters(item: MatrixItem, { category, surface }: { category: string; surface: string }) {
  return item.placements.some((p) => (!category || p.category === category) && (!surface || p.surface === surface));
}
