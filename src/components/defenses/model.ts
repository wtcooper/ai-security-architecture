import { controlById, surfaces } from "@/lib/data";
import type { Capability, Mitigation } from "@/lib/types";
import type { MatrixItem } from "./DefenseMatrix";

export function mitigationMatrixItem(mitigation: Mitigation): MatrixItem {
  return {
    id: mitigation.id,
    title: mitigation.title,
    placements: surfaces.filter((s) => mitigation.surfaces[s.id]?.applies)
      .map((s) => ({ category: mitigation.category, surface: s.id })),
  };
}

/** Row: the control groups of the controls it delivers. Column: its own authored surface decision. */
export function capabilityMatrixItem(capability: Capability): MatrixItem {
  const groups = [...new Set(capability.controls.map((id) => controlById.get(id)!.category))];
  return {
    id: capability.id,
    title: capability.title,
    placements: groups.flatMap((category) => surfaces.filter((s) => capability.surfaces[s.id]?.applies)
      .map((s) => ({ category, surface: s.id }))),
  };
}

export function matchesMatrixFilters(item: MatrixItem, { category, surface }: { category: string; surface: string }) {
  return item.placements.some((p) => (!category || p.category === category) && (!surface || p.surface === surface));
}
