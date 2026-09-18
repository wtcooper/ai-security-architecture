import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import type { AuthoredMappings, Framework, FrameworkEntryInfo, TechnologyCapability } from "../../src/lib/types";

interface Source extends Framework {
  entries: Record<string, FrameworkEntryInfo>;
  controlMappings?: { control: string; entries: string[]; rationale: string }[];
}

/** Compile supplementary lenses without changing any upstream CoSAI entity. */
export async function loadTechnologyCatalogue(root: string, mitigationIds: Set<string>, controlIds: Set<string>) {
  const sourceDoc = parse(await readFile(join(root, "data/frameworks/technology-sources.yaml"), "utf8")) as { frameworks: Source[] };
  const profile = parse(await readFile(join(root, "data/overlay/technology-capabilities.yaml"), "utf8")) as { attribution: string; capabilities: TechnologyCapability[] };
  const sources = new Map(sourceDoc.frameworks.map((f) => [f.id, f]));
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`Technology catalogue: ${message}`); };
  check(sources.size === sourceDoc.frameworks.length, "duplicate framework id");
  check(profile.attribution?.trim(), "missing attribution");
  const mappings: Record<string, AuthoredMappings> = {};
  for (const source of sources.values()) {
    mappings[source.id] = {};
    for (const [key, entry] of Object.entries(source.entries)) {
      check(entry.label?.trim() && entry.description?.trim() && entry.url?.startsWith("https://") && entry.sourceLocation?.trim(), `${source.id}/${key}: missing source metadata`);
      check(["official", "repository-key"].includes(entry.identifierKind ?? ""), `${source.id}/${key}: missing identifier kind`);
    }
    for (const mapping of source.controlMappings ?? []) {
      check(controlIds.has(mapping.control), `unknown CoSAI control ${mapping.control}`);
      check(mapping.rationale?.trim() && mapping.entries.length, `${mapping.control}: missing mapping rationale or entries`);
      check(!mappings[source.id].controls?.[mapping.control], `duplicate control mapping ${mapping.control}`);
      (mappings[source.id].controls ??= {})[mapping.control] = mapping.entries;
      for (const entry of mapping.entries) {
        check(source.entries[entry], `unknown ${source.id} entry ${entry}`);
        (source.entries[entry].mappingNotes ??= []).push({ kind: "controls", entity: mapping.control, relationship: "supports", rationale: mapping.rationale });
      }
    }
  }
  const ids = new Set<string>();
  for (const capability of profile.capabilities) {
    check(/^tech-[a-z0-9-]+$/.test(capability.id), `${capability.id}: expected an explicitly local tech-* key`);
    check(!ids.has(capability.id), `duplicate capability ${capability.id}`);
    ids.add(capability.id);
    check(capability.title?.trim() && capability.category?.trim() && capability.description?.trim(), `${capability.id}: incomplete definition`);
    check(capability.frameworkMappings?.some((m) => m.framework === capability.primarySource.framework && m.entry === capability.primarySource.entry && m.relationship === "same-category"), `${capability.id}: primary source must name the same published category`);
    const refs = new Set<string>();
    for (const m of capability.frameworkMappings) {
      const entry = sources.get(m.framework)?.entries[m.entry];
      check(entry, `${capability.id}: unknown category ${m.framework}/${m.entry}`);
      check(m.rationale?.trim() && ["same-category", "narrower", "supports"].includes(m.relationship), `${capability.id}: invalid framework mapping`);
      const key = `${m.framework}/${m.entry}`;
      check(!refs.has(key), `${capability.id}: duplicate mapping ${key}`);
      refs.add(key);
      const byId = mappings[m.framework].capabilities ??= {};
      (byId[capability.id] ??= []).push(m.entry);
      (entry!.mappingNotes ??= []).push({ kind: "capabilities", entity: capability.id, relationship: m.relationship, rationale: m.rationale });
    }
    check(capability.mitigationMappings?.length, `${capability.id}: no implementation mapping`);
    const mitigations = new Set<string>();
    for (const m of capability.mitigationMappings) {
      check(mitigationIds.has(m.mitigation), `${capability.id}: unknown mitigation ${m.mitigation}`);
      check(!mitigations.has(m.mitigation), `${capability.id}: duplicate mitigation ${m.mitigation}`);
      mitigations.add(m.mitigation);
      check(m.rationale?.trim(), `${capability.id}: missing mitigation rationale`);
      for (const source of m.sources ?? []) {
        check(source.title?.trim() && source.url?.startsWith("https://"), `${capability.id}/${m.mitigation}: invalid implementation source`);
      }
    }
  }
  return {
    capabilities: profile.capabilities,
    attribution: profile.attribution,
    frameworks: sourceDoc.frameworks.map(({ entries, controlMappings, ...framework }) => {
      void entries; void controlMappings;
      return { ...framework, applicableTo: Object.keys(mappings[framework.id]), mappings: mappings[framework.id] };
    }),
    entries: Object.fromEntries(sourceDoc.frameworks.map((f) => [f.id, { source: f.documentUri!, entries: f.entries }])),
  };
}
