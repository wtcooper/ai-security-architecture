import { controlCategories, enablement, enableGroupFor, surfaces } from "@/lib/data";
import type { Mitigation } from "@/lib/types";
import type { MatrixItem, MatrixRow } from "./DefenseMatrix";

/** How the catalogue's rows are grouped: by NIST CSF category, or by CoSAI control group. */
export type Grouping = "csf" | "cosai";

export const GROUPING_META: Record<Grouping, { label: string; rowHeader: string; rows: MatrixRow[] }> = {
  csf: {
    label: "NIST CSF category",
    rowHeader: "NIST CSF category",
    rows: enablement.groups.map((g) => ({ id: g.id, title: g.title, code: `${g.function} · ${g.id}` })),
  },
  cosai: { label: "CoSAI control group", rowHeader: "CoSAI control group", rows: controlCategories },
};

/** A control sits in one row (its CSF category, or its primary CoSAI group), on the surfaces where it applies. */
export function mitigationMatrixItem(mitigation: Mitigation, by: Grouping = "csf"): MatrixItem {
  const row = by === "csf" ? enableGroupFor(mitigation.id)?.id ?? "" : mitigation.category;
  return {
    id: mitigation.id,
    title: mitigation.abbrev ?? mitigation.title,
    placements: surfaces.filter((s) => mitigation.surfaces[s.id]?.applies)
      .map((s) => ({ category: row, surface: s.id })),
  };
}

export function matchesMatrixFilters(item: MatrixItem, { category, surface }: { category: string; surface: string }) {
  return item.placements.some((p) => (!category || p.category === category) && (!surface || p.surface === surface));
}
