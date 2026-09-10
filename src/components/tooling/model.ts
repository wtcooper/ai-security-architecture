/**
 * The view model the three visual lenses share: columns are tools grouped by vendor; rows are
 * either CoSAI capabilities (grouped by control category) or the organisation's own control
 * entries (grouped by their catalogue group); a cell is one tool × one row, resolved to the
 * vendor's coverage and the organisation's status. Rows in the organisation lens aggregate
 * several capabilities, so a cell there carries the worst of them — a gap anywhere is a gap.
 */
import {
  archetypeById,
  capabilitiesInOrder,
  controlCategories,
  orgStatusFor,
  vendors,
} from "@/lib/data";
import { authoredMappings, frameworkEntries } from "@/lib/data";
import { orgFrameworks } from "@/lib/frameworks";
import type { Capability, CapabilityStatus, Tool, ToolControl, ToolCoverage } from "@/lib/types";

export type LabelMode = "cosai" | "org";

export interface Row {
  id: string;
  label: string;
  /** Short label for dense layouts. */
  short: string;
  group: string;
  /** Extra identifiers to show beside the label (org ids in the CoSAI lens, capability count in the org lens). */
  aside?: string;
  capabilities: string[];
  /** Second line under the label, for hover text. */
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
  /** False when none of the row's capabilities is pinned on the tool's architecture. */
  applies: boolean;
  coverage?: ToolCoverage;
  status?: CapabilityStatus;
  /** The per-capability records behind the cell, for the detail panel. */
  parts: { capability: string; control?: ToolControl; status?: CapabilityStatus; pinned: boolean }[];
}

/** Worst first, so a fold over `min` finds the weakest link. */
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

/** capability id -> the organisation's entry ids that reach it, across every org catalogue. */
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

const pinnedOn = (tool: Tool) => new Set(archetypeById.get(tool.architecture)?.capabilities ?? []);

/**
 * Rows for the CoSAI lens: every capability pinned on at least one shown tool's architecture,
 * in taxonomy order, grouped by control category. `keyOnly` keeps those the organisation's
 * standard maps — its definition of "the controls that matter".
 */
export function cosaiRows(tools: Tool[], keyOnly: boolean): RowGroup[] {
  const pinnedAnywhere = new Set(tools.flatMap((t) => [...pinnedOn(t)]));
  const rowOf = (c: Capability): Row => ({
    id: c.id,
    label: c.title,
    short: c.abbrev ?? c.title,
    group: c.category,
    aside: orgIdsFor(c.id).join(" · ") || undefined,
    capabilities: [c.id],
  });
  return controlCategories
    .map((cat) => ({
      id: cat.id,
      title: cat.title,
      rows: capabilitiesInOrder
        .filter((c) => c.category === cat.id && pinnedAnywhere.has(c.id))
        .filter((c) => !keyOnly || orgIdsFor(c.id).length > 0)
        .map(rowOf),
    }))
    .filter((g) => g.rows.length);
}

/**
 * Rows for the organisation lens: one per entry of the organisation's catalogues that maps to
 * at least one capability, grouped by the entry's own group (or the catalogue name).
 */
export function orgRows(tools: Tool[]): RowGroup[] {
  const pinnedAnywhere = new Set(tools.flatMap((t) => [...pinnedOn(t)]));
  const groups = new Map<string, RowGroup>();
  for (const fw of orgFrameworks) {
    const byEntry = new Map<string, string[]>();
    for (const [capabilityId, entryIds] of Object.entries(authoredMappings[fw.id]?.capabilities ?? {})) {
      for (const e of entryIds) byEntry.set(e, [...(byEntry.get(e) ?? []), capabilityId]);
    }
    const reference = frameworkEntries[fw.id] ?? {};
    for (const entryId of Object.keys(reference)) {
      const caps = (byEntry.get(entryId) ?? []).filter((c) => pinnedAnywhere.has(c));
      if (!caps.length) continue;
      const ref = reference[entryId];
      const groupTitle = ref.group ? `${fw.name} · ${ref.group}` : fw.name;
      const groupId = `${fw.id}:${ref.group ?? ""}`;
      if (!groups.has(groupId)) groups.set(groupId, { id: groupId, title: groupTitle, rows: [] });
      groups.get(groupId)!.rows.push({
        id: `${fw.id}:${entryId}`,
        label: `${entryId} ${ref.label}`,
        short: entryId,
        group: groupId,
        aside: `${caps.length} capabilit${caps.length === 1 ? "y" : "ies"}`,
        capabilities: caps,
        title: ref.label,
      });
    }
  }
  return [...groups.values()];
}

export function cellFor(tool: Tool, row: Row): Cell {
  const pinned = pinnedOn(tool);
  const own = new Map(tool.controls.map((c) => [c.capability, c]));
  const parts = row.capabilities.map((capability) => ({
    capability,
    control: own.get(capability),
    status: orgStatusFor(tool.id, capability)?.status,
    pinned: pinned.has(capability),
  }));
  const applicable = parts.filter((p) => p.pinned);
  return {
    applies: applicable.length > 0,
    coverage: worst(COVERAGE_RANK, applicable.map((p) => p.control?.coverage)),
    status: worst(STATUS_RANK, applicable.map((p) => p.status)),
    parts,
  };
}

/** Counts for the scorecard bars. */
export function summarise(tool: Tool) {
  const pinned = [...pinnedOn(tool)];
  const own = new Map(tool.controls.map((c) => [c.capability, c]));
  const coverage: Record<ToolCoverage | "unassessed", number> = { native: 0, partial: 0, external: 0, none: 0, unknown: 0, unassessed: 0 };
  const status: Record<CapabilityStatus | "unset", number> = { inPlace: 0, partial: 0, gap: 0, needsAssessment: 0, unset: 0 };
  for (const id of pinned) {
    const c = own.get(id);
    coverage[c ? c.coverage : "unassessed"]++;
    const s = orgStatusFor(tool.id, id)?.status;
    status[s ?? "unset"]++;
  }
  return { pinned: pinned.length, coverage, status };
}
