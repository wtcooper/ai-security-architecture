import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import type { Mitigation, MitigationSurfaceInfo } from "../../src/lib/types";

interface Specialization {
  id: string;
  parent: string;
  title: string;
  abbrev?: string;
  legacy: string[];
  implementation: string;
  features?: string[];
  controls?: string[];
  surfaces?: Record<string, MitigationSurfaceInfo>;
  examples?: string[];
  risks?: string[];
  components?: string[];
  process?: { title: string; note: string }[];
  sources?: { title: string; url: string }[];
}

/**
 * Authored specialisations: one actionable countermeasure each, narrowing one MITRE mitigation
 * that is too coarse to pin or report on. Compiled into full mitigation records so every view
 * treats them alike; the parent stays the citable identifier.
 */
export async function loadSpecializations(root: string, parents: Mitigation[], ids: { controls: Set<string>; risks: Set<string>; components: Set<string>; surfaces: Set<string>; legacy: Set<string> }) {
  const doc = parse(await readFile(join(root, "data/overlay/specializations.yaml"), "utf8")) as { attribution: string; specializations: Specialization[] };
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`Specialisations: ${message}`); };
  check(doc.attribution?.trim(), "missing attribution");
  const byId = new Map(parents.map((m) => [m.id, m]));
  const seen = new Set<string>();
  const legacySeen = new Set<string>();
  const compiled: Mitigation[] = [];
  for (const s of doc.specializations ?? []) {
    check(/^cap-[a-z0-9-]+$/.test(s.id), `${s.id}: expected a cap-* key`);
    check(!seen.has(s.id) && !byId.has(s.id), `duplicate id ${s.id}`);
    seen.add(s.id);
    const parent = byId.get(s.parent);
    check(parent && !parent.parent, `${s.id}: parent ${s.parent} must be a MITRE entry`);
    check(s.title?.trim() && s.implementation?.trim(), `${s.id}: needs a title and an authored implementation`);
    check(Array.isArray(s.legacy) && s.legacy.length, `${s.id}: names no legacy capability it restores`);
    for (const id of s.legacy) {
      check(ids.legacy.has(id), `${s.id}: unknown legacy id ${id}`);
      check(!legacySeen.has(id), `${s.id}: legacy id ${id} already restored by another specialisation`);
      legacySeen.add(id);
    }
    const controls = s.controls ?? parent!.controls;
    check(controls.length && controls.every((id) => parent!.controls.includes(id)), `${s.id}: controls must be a non-empty subset of ${s.parent}`);
    const risks = s.risks ?? parent!.risks;
    check(risks.every((id) => ids.risks.has(id)), `${s.id}: unknown risk`);
    const components = s.components ?? parent!.components;
    check(components.every((id) => ids.components.has(id)), `${s.id}: unknown component`);
    const surfaces = { ...parent!.surfaces, ...(s.surfaces ?? {}) };
    for (const [key, info] of Object.entries(surfaces)) {
      check(ids.surfaces.has(key), `${s.id}: unknown surface ${key}`);
      check(typeof info.applies === "boolean" && info.responsibility, `${s.id}: surface ${key} needs applies and responsibility`);
      check(info.applies === ["customer-operated", "customer-configurable"].includes(info.responsibility), `${s.id}: surface ${key} applicability contradicts responsibility`);
    }
    check(Object.values(surfaces).some((v) => v.applies), `${s.id}: must apply to at least one surface`);
    for (const item of s.process ?? []) check(item.title?.trim() && item.note?.trim(), `${s.id}: process items need a title and note`);
    compiled.push({
      ...parent!,
      id: s.id,
      title: s.title,
      abbrev: s.abbrev,
      parent: s.parent,
      legacy: s.legacy,
      origin: { ...parent!.origin, entityType: "specialisation" },
      implementation: s.implementation,
      features: s.features,
      controls,
      controlMappings: parent!.controlMappings.filter((m) => controls.includes(m.control)),
      risks,
      components,
      surfaces,
      examples: s.examples ?? parent!.examples,
      process: s.process,
      sources: s.sources ?? parent!.sources,
    });
  }
  return { specializations: compiled, attribution: doc.attribution };
}
