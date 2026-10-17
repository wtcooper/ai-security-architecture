import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import type { AuthoredMappings, Framework, FrameworkEntryInfo } from "../../src/lib/types";

interface Source extends Framework {
  entries: Record<string, FrameworkEntryInfo>;
  controlMappings?: { control: string; entries: string[]; rationale: string }[];
}

/** The NIST CSF 2.0 crosswalk: CoSAI controls onto CSF categories, without changing any CoSAI entity. */
export async function loadControlCrosswalks(root: string, controlIds: Set<string>) {
  const sourceDoc = parse(await readFile(join(root, "data/frameworks/nist-csf.yaml"), "utf8")) as { frameworks: Source[] };
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`Control crosswalk: ${message}`); };
  const mappings: Record<string, AuthoredMappings> = {};
  for (const source of sourceDoc.frameworks) {
    check(!mappings[source.id], `duplicate framework id ${source.id}`);
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
  return {
    frameworks: sourceDoc.frameworks.map(({ entries, controlMappings, ...framework }) => {
      void entries; void controlMappings;
      return { ...framework, applicableTo: Object.keys(mappings[framework.id]), mappings: mappings[framework.id] };
    }),
    entries: Object.fromEntries(sourceDoc.frameworks.map((f) => [f.id, { source: f.documentUri!, entries: f.entries }])),
  };
}
