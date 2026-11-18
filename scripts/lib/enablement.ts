import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { STATUSES, type Archetype, type ControlRollup, type Enablement, type EnablementGroup, type Mitigation, type OrgControl, type Status, type Surface } from "../../src/lib/types";

/** A CSF category as the framework file declares it. */
type CsfEntry = { label?: string; group?: string };

/**
 * The control families: every control in the catalogue under the NIST CSF category that owns it,
 * and the baseline every AI deployment needs. Names and functions come from the CSF framework
 * file, so a family can only be a category that file declares.
 */
export async function loadEnablement(
  root: string,
  catalogue: Mitigation[],
  surfaces: Surface[],
  archetypes: Archetype[],
  csf: Record<string, CsfEntry>,
): Promise<Enablement> {
  type Authored = { framework?: string; groups?: (Omit<EnablementGroup, "title" | "function">)[]; baseline?: string[] };
  const doc = parse(await readFile(join(root, "data/overlay/enablement.yaml"), "utf8")) as Authored;
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`enablement.yaml: ${message}`); };
  check(doc.framework === "nist-csf", "framework must be nist-csf");
  const byId = new Map(catalogue.map((m) => [m.id, m]));
  const surfaceIds = new Set(surfaces.map((s) => s.id));
  const order = Object.keys(csf);
  const grouped = new Map<string, string>();
  const groupIds = new Set<string>();
  check(doc.groups?.length, "needs groups");
  const groups: EnablementGroup[] = [];
  let last = -1;
  for (const group of doc.groups!) {
    check(group.id && !groupIds.has(group.id), `duplicate or missing group id ${group.id}`);
    groupIds.add(group.id);
    const entry = csf[group.id];
    check(entry?.label && entry.group, `group ${group.id} is not a category in data/frameworks/nist-csf.yaml`);
    check(order.indexOf(group.id) > last, `group ${group.id} is out of CSF order`);
    last = order.indexOf(group.id);
    check(group.blurb?.trim() && group.mitigations?.length, `group ${group.id}: needs a blurb and mitigations`);
    check(group.plain?.trim() && group.plain.length <= 40, `group ${group.id}: needs a plain heading of at most 40 characters`);
    for (const [surface, own] of Object.entries(group.surfaces ?? {})) {
      check(surfaceIds.has(surface), `group ${group.id}: unknown surface ${surface}`);
      check(own?.blurb?.trim(), `group ${group.id}: surfaces.${surface} needs a blurb`);
    }
    for (const id of group.mitigations) {
      check(byId.has(id), `group ${group.id}: unknown control ${id}`);
      check(!grouped.has(id), `group ${group.id}: ${id} is already in group ${grouped.get(id)}`);
      grouped.set(id, group.id);
    }
    groups.push({ ...group, title: entry!.label!, function: entry!.group! });
  }
  for (const m of catalogue) check(grouped.has(m.id), `${m.id} (${m.title}) is in no group`);
  const baseline = new Set<string>();
  for (const id of doc.baseline ?? []) {
    check(!baseline.has(id), `baseline: ${id} is listed twice`);
    baseline.add(id);
    check(grouped.has(id), `baseline: ${id} is in no group`);
    check(surfaces.every((s) => byId.get(id)!.surfaces[s.id]?.applies), `baseline: ${id} does not apply on every surface`);
  }
  const pinned = new Set(archetypes.flatMap((a) => a.mitigations));
  for (const id of baseline) {
    if (!pinned.has(id)) console.warn(`  ~ enablement: baseline control ${id} is not pinned on any pattern`);
  }
  return { framework: "nist-csf", groups, baseline: [...baseline] };
}

/** Several statuses read as one: enabled only when every part is, a gap when nothing is under way, else in progress. */
function rollup(values: (Status | undefined)[]): Status | undefined {
  if (values.every((v) => !v)) return undefined;
  if (values.every((v) => v === "enabled")) return "enabled";
  if (values.every((v) => v === "gap" || !v)) return "gap";
  return "inProgress";
}

/**
 * The organisation's own controls (data/org/controls.yaml): each maps to one or more catalogue
 * controls. Returns them, and each catalogue control's status worked out from the ones mapped to it.
 */
export async function loadOrgControls(root: string, catalogue: Mitigation[]): Promise<{ orgControls: OrgControl[]; status: Record<string, ControlRollup> }> {
  const where = "org/controls.yaml";
  if (existsSync(join(root, "data/status.yaml"))) {
    throw new Error("data/status.yaml has moved: put its controls in data/org/controls.yaml and its products section in data/org/products.yaml (see data/org/README.md), then delete it");
  }
  const doc = parse(await readFile(join(root, "data/org/controls.yaml"), "utf8")) as { controls?: OrgControl[] | null } | null;
  return checkOrgControls(doc, catalogue, where);
}

/** The checks on the organisation's controls, apart from reading the file, so they can be run on any document. */
export function checkOrgControls(
  doc: { controls?: OrgControl[] | null } | null,
  catalogue: Mitigation[],
  where = "org/controls.yaml",
): { orgControls: OrgControl[]; status: Record<string, ControlRollup> } {
  const known = new Map(catalogue.map((m) => [m.id, m]));
  const rows = doc?.controls ?? [];
  if (!Array.isArray(rows)) throw new Error(`${where}: controls is a list of rows, each starting "- id:"`);
  const seen = new Set<string>();
  for (const [n, row] of rows.entries()) {
    const at = `${where} row ${n + 1}${row?.name ? ` (${row.name})` : ""}`;
    if (!row || typeof row !== "object") throw new Error(`${at}: needs id, name and maps`);
    const extra = Object.keys(row).filter((k) => !["id", "name", "status", "maps", "note", "link"].includes(k));
    if (extra.length) throw new Error(`${at}: unknown field ${extra.join(", ")}`);
    if (typeof row.id !== "string" && typeof row.id !== "number") throw new Error(`${at}: needs an id, your own identifier for the control`);
    row.id = String(row.id).trim();
    if (!row.id) throw new Error(`${at}: needs an id, your own identifier for the control`);
    if (seen.has(row.id)) throw new Error(`${at}: id ${row.id} is used twice`);
    seen.add(row.id);
    if (typeof row.name !== "string" || !row.name.trim()) throw new Error(`${at}: needs a name, which is what people see`);
    if (row.status !== undefined && !STATUSES.includes(row.status)) throw new Error(`${at}: status must be one of ${STATUSES.join(", ")}`);
    if (!Array.isArray(row.maps) || !row.maps.length) throw new Error(`${at}: needs maps, the catalogue controls it delivers (one or more)`);
    if (new Set(row.maps).size !== row.maps.length) throw new Error(`${at}: maps lists a control twice`);
    for (const id of row.maps) {
      if (!known.has(id)) throw new Error(`${at}: maps to "${id}", which is not a control in the catalogue; use the key from the Controls page address`);
    }
    if (row.link !== undefined && !/^https:\/\//.test(row.link)) throw new Error(`${at}: link must be an https address`);
    if (row.note !== undefined && typeof row.note !== "string") throw new Error(`${at}: note must be text`);
  }
  const status: Record<string, ControlRollup> = {};
  for (const m of catalogue) {
    const mine = rows.filter((r) => r.maps.includes(m.id));
    if (!mine.length) continue;
    const rolled = rollup(mine.map((r) => r.status));
    status[m.id] = rolled ? { status: rolled } : {};
  }
  return { orgControls: rows, status };
}
