/** One row per capability the architecture pins; a capability is a MITRE mitigation or a specialisation of one. */
import { archetypeById, categoriesForMitigations, mitigationById, orgStatusFor, orgToolAvailableFor, vendors, controlCategories } from "@/lib/data";
import type { DisplayStatus, Tool, ToolControl, ToolCoverage } from "@/lib/types";

export interface Row {
  id: string;
  capabilityId: string;
  label: string;
  /** The capability ids the vendor rows are keyed by; one, unless a parent is shown with its specialisations. */
  mitigations: string[];
  /** The technology dimension of the capability. */
  categories: string[];
  title?: string;
}

/** One place the architecture pins a control: a block (or both ends of a flow) and who operates it. */
export interface Enforcement {
  blockId: string;
  title: string;
  owner: string;
  notes: string[];
}

/**
 * Where an architecture places a mitigation: every block it is pinned on, and both ends of
 * every flow it is pinned on, with who operates that block. This is the enterprise side of
 * a control — the gateway, the managed endpoint, the governance plane — as distinct from what
 * the product's own admin settings offer.
 */
export function enforcementFor(archetypeId: string, mitigationIds: string[]): Enforcement[] {
  const arch = archetypeById.get(archetypeId);
  if (!arch) return [];
  const blocks = new Map(arch.blocks.map((b) => [b.id, b]));
  const zoneOwner = new Map((arch.zones ?? []).map((z) => [z.id, z.owner]));
  const out = new Map<string, Enforcement>();
  for (const pin of arch.pins.mitigations) {
    if (!mitigationIds.includes(pin.mitigation)) continue;
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
  mixed: boolean;
  status?: DisplayStatus;
  parts: { mitigation: string; control?: ToolControl; status?: DisplayStatus }[];
  /** The component whose coverage the cell shows, so its link and its word refer to the same thing. */
  decisive?: ToolControl;
  /** Components with no vendor record at all: a composite that hides one is not a faithful summary. */
  missing: string[];
}

// A not-applicable component neither helps nor hurts a composite; it only shows when every part is.
const COVERAGE_RANK: ToolCoverage[] = ["none", "unknown", "external", "partial", "native", "notApplicable"];
const worst = <T,>(rank: T[], values: (T | undefined)[]): T | undefined => {
  const present = values.filter((v): v is T => v !== undefined);
  if (!present.length) return undefined;
  return rank[Math.min(...present.map((v) => rank.indexOf(v)))];
};
const worstCoverage = (values: (ToolCoverage | undefined)[]): ToolCoverage | undefined => {
  if (values.some((v) => v === undefined)) return "unknown";
  const applicable = values.filter((v) => v !== "notApplicable");
  return worst(COVERAGE_RANK, applicable) ?? (values.some((v) => v === "notApplicable") ? "notApplicable" : undefined);
};

export const columnGroups = (tools: Tool[]): ColumnGroup[] =>
  vendors
    .map((v) => ({ vendorId: v.id, vendorName: v.name, tools: tools.filter((t) => t.vendor === v.id) }))
    .filter((g) => g.tools.length);

/** The architecture's pinned capabilities, grouped by the CoSAI control group each primarily serves. */
export function rowsFor(archetypeId: string): RowGroup[] {
  const pinned = (archetypeById.get(archetypeId)?.mitigations ?? []).map((id) => mitigationById.get(id)!);
  return controlCategories.map((category) => ({
    id: category.id,
    title: category.title,
    rows: pinned.filter((m) => m.category === category.id).map((m) => ({
      id: m.id,
      capabilityId: m.id,
      label: m.title,
      title: m.parent ? `${m.title} · ${m.parent}` : undefined,
      mitigations: [m.id],
      categories: categoriesForMitigations([m.id]).map((c) => c.id),
    })),
  })).filter((group) => group.rows.length);
}

export function cellFor(tool: Tool, row: Row): Cell {
  const own = new Map(tool.controls.map((c) => [c.mitigation, c]));
  // An available product has a status on every control (unrecorded = not assessed); one the organisation
  // does not provide has none, and the grid greys its column instead.
  const onboarded = orgToolAvailableFor(tool.id);
  const parts: Cell["parts"] = row.mitigations.map((mitigation) => ({
    mitigation,
    control: own.get(mitigation),
    // A control that does not apply to the product has no status to record: it is neither a gap nor enabled.
    status: onboarded && own.get(mitigation)?.coverage !== "notApplicable" ? orgStatusFor(tool.id, mitigation)?.status ?? "notAssessed" : undefined,
  }));
  const coverage = worstCoverage(parts.map((p) => p.control?.coverage));
  // Status is the product's own record on the capability; coverage is what the vendor documents per method.
  const applicable = parts.some((p) => p.control?.coverage !== "notApplicable");
  return {
    coverage,
    mixed: new Set(parts.map((p) => p.control?.coverage ?? "unknown").filter((c) => c !== "notApplicable")).size > 1,
    status: onboarded && applicable ? orgStatusFor(tool.id, row.capabilityId).status : undefined,
    parts,
    decisive: parts.length === 1 ? parts[0].control : undefined,
    missing: parts.filter((p) => !p.control).map((p) => p.mitigation),
  };
}
