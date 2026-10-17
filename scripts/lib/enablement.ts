import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { STATUSES, type Archetype, type CapabilityCustomisation, type Enablement, type Mitigation, type Surface } from "../../src/lib/types";

/** The Enable layers: foundations once, then each surface's baseline. Use-case additions derive in the app. */
export async function loadEnablement(root: string, catalogue: Mitigation[], surfaces: Surface[], archetypes: Archetype[]): Promise<Enablement> {
  const doc = parse(await readFile(join(root, "data/overlay/enablement.yaml"), "utf8")) as Enablement;
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`enablement.yaml: ${message}`); };
  const byId = new Map(catalogue.map((m) => [m.id, m]));
  const foundations = new Set<string>();
  const groupIds = new Set<string>();
  for (const group of doc.foundations ?? []) {
    check(group.id && !groupIds.has(group.id), `duplicate or missing foundation group id ${group.id}`);
    groupIds.add(group.id);
    check(group.title?.trim() && group.blurb?.trim() && group.mitigations?.length, `foundation ${group.id}: needs a title, a blurb and mitigations`);
    for (const id of group.mitigations) {
      check(byId.has(id), `foundation ${group.id}: unknown capability ${id}`);
      check(!foundations.has(id), `foundation ${group.id}: ${id} is listed twice`);
      foundations.add(id);
      check(surfaces.every((s) => byId.get(id)!.surfaces[s.id]?.applies), `foundation ${group.id}: ${id} does not apply on every surface`);
    }
  }
  for (const surface of surfaces) {
    const entry = doc.surfaces?.[surface.id];
    check(entry?.blurb?.trim(), `surfaces.${surface.id}: needs a blurb`);
    const seen = new Set<string>();
    for (const id of entry!.mitigations ?? []) {
      check(!seen.has(id), `surfaces.${surface.id}: ${id} is listed twice`);
      seen.add(id);
      check(byId.has(id), `surfaces.${surface.id}: unknown capability ${id}`);
      check(!foundations.has(id), `surfaces.${surface.id}: ${id} is already a foundation`);
      check(byId.get(id)!.surfaces[surface.id]?.applies, `surfaces.${surface.id}: ${id} does not apply on this surface`);
    }
  }
  for (const key of Object.keys(doc.surfaces ?? {})) check(surfaces.some((s) => s.id === key), `unknown surface ${key}`);
  const pinned = new Set(archetypes.flatMap((a) => a.mitigations));
  for (const id of foundations) {
    if (!pinned.has(id)) console.warn(`  ~ enablement: foundation ${id} is not pinned on any architecture`);
  }
  return doc;
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
