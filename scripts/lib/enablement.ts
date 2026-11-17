import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { STATUSES, type Archetype, type CapabilityCustomisation, type Enablement, type EnablementGroup, type Mitigation, type Surface } from "../../src/lib/types";

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

/** The organisation's status file. Every key must be a catalogue capability. */
export async function loadStatus(root: string, catalogue: Mitigation[]): Promise<Record<string, CapabilityCustomisation>> {
  const doc = parse(await readFile(join(root, "data/status.yaml"), "utf8")) as { capabilities?: Record<string, CapabilityCustomisation> | null };
  const out: Record<string, CapabilityCustomisation> = {};
  const ids = new Set(catalogue.map((m) => m.id));
  for (const [id, entry] of Object.entries(doc?.capabilities ?? {})) {
    if (!ids.has(id)) throw new Error(`status.yaml: unknown capability ${id}`);
    if (!entry || typeof entry !== "object") throw new Error(`status.yaml: ${id} needs status, displayName or note`);
    const extra = Object.keys(entry).filter((k) => !["status", "displayName", "note"].includes(k));
    if (extra.length) throw new Error(`status.yaml: ${id} has unknown field ${extra.join(", ")}`);
    if (entry.status !== undefined && !STATUSES.includes(entry.status)) throw new Error(`status.yaml: ${id} status must be one of ${STATUSES.join(", ")}`);
    if (entry.displayName !== undefined && !String(entry.displayName).trim()) throw new Error(`status.yaml: ${id} displayName is empty`);
    out[id] = entry;
  }
  return out;
}
