import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { STATUSES, type Archetype, type CapabilityCustomisation, type Enablement, type Mitigation, type Surface } from "../../src/lib/types";

/**
 * The Enable tab's first step: the security domains that group an architecture's capabilities,
 * and the baseline every AI deployment needs. Every pinned capability must sit in exactly one group.
 */
export async function loadEnablement(root: string, catalogue: Mitigation[], surfaces: Surface[], archetypes: Archetype[]): Promise<Enablement> {
  const doc = parse(await readFile(join(root, "data/overlay/enablement.yaml"), "utf8")) as Enablement;
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`enablement.yaml: ${message}`); };
  const byId = new Map(catalogue.map((m) => [m.id, m]));
  const surfaceIds = new Set(surfaces.map((s) => s.id));
  const grouped = new Map<string, string>();
  const groupIds = new Set<string>();
  check(doc.groups?.length, "needs groups");
  for (const group of doc.groups) {
    check(group.id && !groupIds.has(group.id), `duplicate or missing group id ${group.id}`);
    groupIds.add(group.id);
    check(group.title?.trim() && group.blurb?.trim() && group.mitigations?.length, `group ${group.id}: needs a title, a blurb and mitigations`);
    for (const [surface, own] of Object.entries(group.surfaces ?? {})) {
      check(surfaceIds.has(surface), `group ${group.id}: unknown surface ${surface}`);
      check(own?.title?.trim() || own?.blurb?.trim(), `group ${group.id}: surfaces.${surface} needs a title or a blurb`);
    }
    for (const id of group.mitigations) {
      check(byId.has(id), `group ${group.id}: unknown capability ${id}`);
      check(!grouped.has(id), `group ${group.id}: ${id} is already in group ${grouped.get(id)}`);
      grouped.set(id, group.id);
    }
  }
  for (const arch of archetypes) {
    for (const id of arch.mitigations) check(grouped.has(id), `${id}, pinned on ${arch.id}, is in no group`);
  }
  const baseline = new Set<string>();
  for (const id of doc.baseline ?? []) {
    check(!baseline.has(id), `baseline: ${id} is listed twice`);
    baseline.add(id);
    check(grouped.has(id), `baseline: ${id} is in no group`);
    check(surfaces.every((s) => byId.get(id)!.surfaces[s.id]?.applies), `baseline: ${id} does not apply on every surface`);
  }
  const pinned = new Set(archetypes.flatMap((a) => a.mitigations));
  for (const id of baseline) {
    if (!pinned.has(id)) console.warn(`  ~ enablement: baseline capability ${id} is not pinned on any architecture`);
  }
  return { groups: doc.groups, baseline: [...baseline] };
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
