/**
 * The view model both perspectives share. The organising unit is the reference architecture:
 * its pinned capabilities are the controls every product of that category needs, and a product
 * only records how its vendor implements each one. So rows always come from ONE architecture,
 * columns are the products that instantiate it, and a cell is one product × one control.
 *
 * Rows can be relabelled with the organisation's own control entries; those aggregate several
 * capabilities, so a cell there carries the worst of them — a gap anywhere is a gap.
 */
import { archetypeById, authoredMappings, capabilityById, frameworkEntries, orgStatusFor, vendors } from "@/lib/data";
import { orgFrameworks } from "@/lib/frameworks";
import type { CapabilityStatus, Tool, ToolControl, ToolCoverage } from "@/lib/types";
import { controlCategories } from "@/lib/data";

export type LabelMode = "cosai" | "org";

export interface Row {
  id: string;
  label: string;
  short: string;
  /** Identifiers shown beside the label: org ids in the CoSAI lens, capability count in the org lens. */
  aside?: string;
  capabilities: string[];
  title?: string;
}

export interface RowGroup {
  id: string;
  title: string;
  rows: Row[];
}

export interface ColumnGroup {
  vendorId: string;
  vendorName: string;
  tools: Tool[];
}

export interface Cell {
  coverage?: ToolCoverage;
  status?: CapabilityStatus;
  parts: { capability: string; control?: ToolControl; status?: CapabilityStatus }[];
}

const STATUS_RANK: CapabilityStatus[] = ["gap", "partial", "needsAssessment", "inPlace"];
const COVERAGE_RANK: ToolCoverage[] = ["none", "unknown", "external", "partial", "native"];
const worst = <T,>(rank: T[], values: (T | undefined)[]): T | undefined => {
  const present = values.filter((v): v is T => v !== undefined);
  if (!present.length) return undefined;
  return rank[Math.min(...present.map((v) => rank.indexOf(v)))];
};

export const columnGroups = (tools: Tool[]): ColumnGroup[] =>
  vendors
    .map((v) => ({ vendorId: v.id, vendorName: v.name, tools: tools.filter((t) => t.vendor === v.id) }))
    .filter((g) => g.tools.length);

const orgIdsByCapability = (() => {
  const out = new Map<string, string[]>();
  for (const fw of orgFrameworks) {
    for (const [capabilityId, entryIds] of Object.entries(authoredMappings[fw.id]?.capabilities ?? {})) {
      out.set(capabilityId, [...(out.get(capabilityId) ?? []), ...entryIds]);
    }
  }
  return out;
})();
export const orgIdsFor = (capabilityId: string) => orgIdsByCapability.get(capabilityId) ?? [];
export const hasOrgMappings = orgIdsByCapability.size > 0;

/** The architecture's pinned capabilities as rows, grouped by CoSAI control category. */
export function cosaiRows(archetypeId: string): RowGroup[] {
  const pinned = archetypeById.get(archetypeId)?.capabilities ?? [];
  return controlCategories
    .map((cat) => ({
      id: cat.id,
      title: cat.title,
      rows: pinned
        .map((id) => capabilityById.get(id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c) && c!.category === cat.id)
        .map((c) => ({
          id: c.id,
          label: c.title,
          short: c.abbrev ?? c.title,
          aside: orgIdsFor(c.id).join(" · ") || undefined,
          capabilities: [c.id],
        })),
    }))
    .filter((g) => g.rows.length);
}

/** The same set, relabelled as the organisation's entries that reach it, grouped by its catalogue. */
export function orgRows(archetypeId: string): RowGroup[] {
  const pinned = new Set(archetypeById.get(archetypeId)?.capabilities ?? []);
  const groups = new Map<string, RowGroup>();
  for (const fw of orgFrameworks) {
    const byEntry = new Map<string, string[]>();
    for (const [capabilityId, entryIds] of Object.entries(authoredMappings[fw.id]?.capabilities ?? {})) {
      if (!pinned.has(capabilityId)) continue;
      for (const e of entryIds) byEntry.set(e, [...(byEntry.get(e) ?? []), capabilityId]);
    }
    const reference = frameworkEntries[fw.id] ?? {};
    for (const entryId of Object.keys(reference)) {
      const caps = byEntry.get(entryId);
      if (!caps?.length) continue;
      const ref = reference[entryId];
      const groupId = `${fw.id}:${ref.group ?? ""}`;
      if (!groups.has(groupId)) groups.set(groupId, { id: groupId, title: ref.group ? `${fw.name} · ${ref.group}` : fw.name, rows: [] });
      groups.get(groupId)!.rows.push({
        id: `${fw.id}:${entryId}`,
        label: `${entryId} ${ref.label}`,
        short: entryId,
        aside: `${caps.length} capabilit${caps.length === 1 ? "y" : "ies"}`,
        capabilities: caps,
        title: ref.label,
      });
    }
  }
  return [...groups.values()];
}

export const rowsFor = (archetypeId: string, mode: LabelMode) => (mode === "org" ? orgRows(archetypeId) : cosaiRows(archetypeId));

export function cellFor(tool: Tool, row: Row): Cell {
  const own = new Map(tool.controls.map((c) => [c.capability, c]));
  const parts = row.capabilities.map((capability) => ({
    capability,
    control: own.get(capability),
    status: orgStatusFor(tool.id, capability)?.status,
  }));
  return {
    coverage: worst(COVERAGE_RANK, parts.map((p) => p.control?.coverage)),
    status: worst(STATUS_RANK, parts.map((p) => p.status)),
    parts,
  };
}

/** Counts across a product's reference set, for the vendor perspective's bars. */
export function summarise(tool: Tool) {
  const pinned = archetypeById.get(tool.architecture)?.capabilities ?? [];
  const own = new Map(tool.controls.map((c) => [c.capability, c]));
  const coverage: Record<ToolCoverage | "unassessed", number> = { native: 0, partial: 0, external: 0, none: 0, unknown: 0, unassessed: 0 };
  const status: Record<CapabilityStatus | "unset", number> = { inPlace: 0, partial: 0, gap: 0, needsAssessment: 0, unset: 0 };
  for (const id of pinned) {
    const c = own.get(id);
    coverage[c ? c.coverage : "unassessed"]++;
    status[orgStatusFor(tool.id, id)?.status ?? "unset"]++;
  }
  return { pinned: pinned.length, coverage, status };
}
