import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import type { Capability } from "../../src/lib/types";

/**
 * The capability catalogue: durable operational outcomes, technology-agnostic, each delivering
 * CoSAI controls and realised by technology categories, process items and personas. Every control
 * must be deliverable and every technology category must realise something, so nothing in the
 * sourced layers dangles without an operational owner.
 */
export async function loadCapabilities(root: string, ids: { controls: Set<string>; categories: Set<string>; personas: Set<string>; surfaces: Set<string> }) {
  const doc = parse(await readFile(join(root, "data/overlay/capabilities.yaml"), "utf8")) as { attribution: string; capabilities: Capability[] };
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`Capability catalogue: ${message}`); };
  check(doc.attribution?.trim(), "missing attribution");
  check(Array.isArray(doc.capabilities) && doc.capabilities.length, "no capabilities");
  const seen = new Set<string>();
  const delivered = new Set<string>();
  const realised = new Set<string>();
  const unique = (values: string[], what: string) => check(new Set(values).size === values.length, `${what}: duplicate entries`);
  for (const c of doc.capabilities) {
    check(/^cap-[a-z0-9-]+$/.test(c.id), `${c.id}: expected a cap-* key`);
    check(!seen.has(c.id), `duplicate capability ${c.id}`);
    seen.add(c.id);
    check(c.title?.trim() && c.description?.trim(), `${c.id}: needs a title and description`);
    check(c.controls?.length, `${c.id}: delivers no control`);
    unique(c.controls, c.id);
    for (const id of c.controls) { check(ids.controls.has(id), `${c.id}: unknown control ${id}`); delivered.add(id); }
    for (const surface of ids.surfaces) {
      const entry = c.surfaces?.[surface];
      check(entry && typeof entry.applies === "boolean" && entry.note?.trim(), `${c.id}: needs applies and a note for ${surface}`);
    }
    for (const surface of Object.keys(c.surfaces ?? {})) check(ids.surfaces.has(surface), `${c.id}: unknown surface ${surface}`);
    check(c.realization && Array.isArray(c.realization.technology) && Array.isArray(c.realization.process) && Array.isArray(c.realization.people), `${c.id}: realization needs technology, process and people lists`);
    unique(c.realization.technology, `${c.id} technology`);
    for (const id of c.realization.technology) { check(ids.categories.has(id), `${c.id}: unknown technology category ${id}`); realised.add(id); }
    for (const item of c.realization.process) check(item.title?.trim() && item.note?.trim(), `${c.id}: process items need a title and note`);
    unique(c.realization.people, `${c.id} people`);
    check(c.realization.people.length, `${c.id}: names no persona`);
    for (const id of c.realization.people) check(ids.personas.has(id), `${c.id}: unknown persona ${id}`);
    check(c.realization.technology.length || c.realization.process.length, `${c.id}: no realization at all`);
  }
  const missingControls = [...ids.controls].filter((id) => !delivered.has(id));
  check(!missingControls.length, `no capability delivers ${missingControls.join(", ")}`);
  const idleCategories = [...ids.categories].filter((id) => !realised.has(id));
  check(!idleCategories.length, `no capability is realised by ${idleCategories.join(", ")}`);
  return { capabilities: doc.capabilities, attribution: doc.attribution };
}
