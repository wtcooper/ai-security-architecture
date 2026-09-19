import { surfaces } from "@/lib/data";
import type { Mitigation } from "@/lib/types";
import type { MatrixItem } from "./DefenseMatrix";

/** A capability sits in its primary control group, on the surfaces where it applies. */
export function mitigationMatrixItem(mitigation: Mitigation): MatrixItem {
  return {
    id: mitigation.id,
    title: mitigation.abbrev ?? mitigation.title,
    placements: surfaces.filter((s) => mitigation.surfaces[s.id]?.applies)
      .map((s) => ({ category: mitigation.category, surface: s.id })),
  };
}

export function matchesMatrixFilters(item: MatrixItem, { category, surface }: { category: string; surface: string }) {
  return item.placements.some((p) => (!category || p.category === category) && (!surface || p.surface === surface));
}
