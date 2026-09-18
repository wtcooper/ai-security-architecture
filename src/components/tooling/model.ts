/**
 * The view model both perspectives share. The organising unit is the reference architecture:
 * its pinned capabilities are the controls every product of that category needs, and a product
 * only records how its vendor implements each one. So rows always come from ONE architecture,
 * columns are the products that instantiate it, and a cell is one product × one control.
 *
 * Rows can be relabelled with the organisation's own control entries; those aggregate several
 * capabilities, so a cell there carries the worst of them — a gap anywhere is a gap.
 */
import { archetypeById, authoredMappings, capabilityById, frameworkEntries, orgStatusFor, orgToolAvailableFor, vendors } from "@/lib/data";
import { orgEntriesFor, orgFrameworks } from "@/lib/frameworks";
import type { OrgStatus, Tool, ToolControl, ToolCoverage } from "@/lib/types";
import { controlCategories } from "@/lib/data";

export type LabelMode = "cosai" | "org";

export interface Row {
  id: string;
  label: string;
  short: string;
  /** Supporting label: org mappings in the CoSAI lens, capability count in the org lens. */
  aside?: string;
  capabilities: string[];
  title?: string;
  /** Where the drawing enforces this control — the enterprise layer around the products. */
  enforcement: Enforcement[];
}

/** One place the architecture pins a control: a block (or both ends of a flow) and who operates it. */
export interface Enforcement {
  blockId: string;
  title: string;
  owner: string;
  notes: string[];
}

/**
 * Where an architecture places a capability: every block it is pinned on, and both ends of
 * every flow it is pinned on, with who operates that block. This is the enterprise side of
 * a control — the gateway, the managed endpoint, the governance plane — as distinct from what
 * the product's own admin settings offer.
 */
export function enforcementFor(archetypeId: string, capabilityIds: string[]): Enforcement[] {
  const arch = archetypeById.get(archetypeId);
  if (!arch) return [];
  const blocks = new Map(arch.blocks.map((b) => [b.id, b]));
  const zoneOwner = new Map((arch.zones ?? []).map((z) => [z.id, z.owner]));
  const out = new Map<string, Enforcement>();
  for (const pin of arch.pins.capabilities) {
    if (!capabilityIds.includes(pin.capability)) continue;
    const ids = pin.at.includes("->") ? pin.at.split("->") : [pin.at];
    for (const id of ids) {
      const b = blocks.get(id);
      if (!b) continue;
      const e = out.get(id) ?? { blockId: id, title: b.title, owner: zoneOwner.get(b.zone ?? "") ?? "cloud", notes: [] };
      if (pin.note && !e.notes.includes(pin.note)) e.notes.push(pin.note);
      out.set(id, e);
    }
  }
  return [...out.values()];
}

export const OWNER_META: Record<string, { label: string; color: string }> = {
  user: { label: "the user's own device", color: "var(--ink-3)" },
  endpoint: { label: "managed endpoint", color: "var(--band-infra-rail)" },
  cloud: { label: "enterprise cloud", color: "var(--band-app-rail)" },
  vendor: { label: "vendor platform", color: "var(--band-data-rail)" },
  external: { label: "outside the organisation", color: "var(--ink-3)" },
  governance: { label: "governance plane", color: "var(--ink-2)" },
};

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
  status?: OrgStatus;
  parts: { capability: string; control?: ToolControl; status?: OrgStatus }[];
  /** The component whose coverage the cell shows, so its link and its word refer to the same thing. */
  decisive?: ToolControl;
  /** Components with no vendor record at all: a composite that hides one is not a faithful summary. */
  missing: string[];
}

const STATUS_RANK: OrgStatus[] = ["gap", "inProgress", "enabled"];
// A not-applicable component neither helps nor hurts a composite; it only shows when every part is.
const COVERAGE_RANK: ToolCoverage[] = ["none", "unknown", "external", "partial", "native", "notApplicable"];
const worst = <T,>(rank: T[], values: (T | undefined)[]): T | undefined => {
  const present = values.filter((v): v is T => v !== undefined);
  if (!present.length) return undefined;
  return rank[Math.min(...present.map((v) => rank.indexOf(v)))];
};
const worstCoverage = (values: (ToolCoverage | undefined)[]): ToolCoverage | undefined => {
  const applicable = values.filter((v) => v !== "notApplicable");
  return worst(COVERAGE_RANK, applicable) ?? (values.some((v) => v === "notApplicable") ? "notApplicable" : undefined);
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
          short: c.title,
          aside: orgEntriesFor("capabilities", c.id).map((entry) => `${entry.label} (${entry.id})`).join(" · ") || undefined,
          capabilities: [c.id],
          enforcement: enforcementFor(archetypeId, [c.id]),
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
        label: `${ref.label} (${entryId})`,
        short: ref.label,
        aside: `${caps.length} capabilit${caps.length === 1 ? "y" : "ies"}`,
        capabilities: caps,
        title: ref.label,
        enforcement: enforcementFor(archetypeId, caps),
      });
    }
  }
  return [...groups.values()];
}

export const rowsFor = (archetypeId: string, mode: LabelMode) => (mode === "org" ? orgRows(archetypeId) : cosaiRows(archetypeId));

export function cellFor(tool: Tool, row: Row): Cell {
  const own = new Map(tool.controls.map((c) => [c.capability, c]));
  // An available product has a status on every control (unrecorded = gap); one the organisation
  // does not provide has none, and the grid greys its column instead.
  const onboarded = orgToolAvailableFor(tool.id);
  const parts = row.capabilities.map((capability) => ({
    capability,
    control: own.get(capability),
    // A control that does not apply to the product has no status to record: it is neither a gap nor enabled.
    status: onboarded && own.get(capability)?.coverage !== "notApplicable" ? orgStatusFor(tool.id, capability)?.status ?? "gap" : undefined,
  }));
  const coverage = worstCoverage(parts.map((p) => p.control?.coverage));
  return {
    coverage,
    status: worst(STATUS_RANK, parts.map((p) => p.status)),
    parts,
    decisive: parts.find((p) => p.control?.coverage === coverage)?.control,
    missing: parts.filter((p) => !p.control).map((p) => p.capability),
  };
}
