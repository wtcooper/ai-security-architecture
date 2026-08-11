/**
 * Framework mappings, indexed the useful way round.
 *
 * Each risk, control and persona carries the framework identifiers it maps to, which answers
 * "what does this risk correspond to elsewhere". The more common question is the reverse:
 * "I have to work in OWASP / ATLAS / NIST — what does that mean here". This builds that index,
 * and records honestly how much of CoSAI each framework actually reaches.
 */
import { controls, frameworks, personas, risks } from "./data";
import type { Control, Framework, Persona, Risk } from "./types";

export type EntityKind = "risks" | "controls" | "personas";

export interface FrameworkEntry {
  /** Bare identifier, with CoSAI's `@version` suffix stripped. */
  id: string;
  label: string;
  url?: string;
  risks: Risk[];
  controls: Control[];
  personas: Persona[];
  total: number;
}

export interface FrameworkView {
  framework: Framework;
  entries: FrameworkEntry[];
  /** Entity kinds that actually carry a mapping, not merely those CoSAI declares. */
  appliesTo: EntityKind[];
  coverage: { kind: EntityKind; mapped: number; total: number }[];
  unmapped: { kind: EntityKind; items: (Risk | Control | Persona)[] }[];
}

/**
 * Friendly names for identifiers that are otherwise opaque. OWASP's list is published as
 * numbered ids only, and "LLM06:2025" tells a reader nothing on its own.
 * Source: OWASP Top 10 for LLM Applications 2025.
 */
const ENTRY_LABELS: Record<string, Record<string, string>> = {
  "owasp-top10-llm": {
    "LLM01:2025": "Prompt Injection",
    "LLM02:2025": "Sensitive Information Disclosure",
    "LLM03:2025": "Supply Chain",
    "LLM04:2025": "Data and Model Poisoning",
    "LLM05:2025": "Improper Output Handling",
    "LLM06:2025": "Excessive Agency",
    "LLM07:2025": "System Prompt Leakage",
    "LLM08:2025": "Vector and Embedding Weaknesses",
    "LLM09:2025": "Misinformation",
    "LLM10:2025": "Unbounded Consumption",
  },
};

/**
 * Entries a framework defines that CoSAI may not reference. Listing them makes the gaps
 * visible — an item with nothing mapped to it is a finding, not an omission to hide.
 */
const KNOWN_ENTRIES: Record<string, string[]> = {
  "owasp-top10-llm": Object.keys(ENTRY_LABELS["owasp-top10-llm"]),
  stride: [
    "Spoofing",
    "Tampering",
    "Repudiation",
    "InformationDisclosure",
    "DenialOfService",
    "ElevationOfPrivilege",
  ],
};

const ENTITIES: Record<EntityKind, (Risk | Control | Persona)[]> = {
  risks,
  controls,
  personas,
};

/** Split a human-readable label out of an identifier like "ElevationOfPrivilege". */
const humanise = (id: string) => id.replace(/([a-z])([A-Z])/g, "$1 $2");

const bare = (value: string) => value.split("@")[0];

function entryUrl(framework: Framework, id: string) {
  if (framework.techniqueUriPattern) return framework.techniqueUriPattern.replace("{id}", id);
  return framework.documentUri ?? framework.baseUri;
}

export function frameworkView(frameworkId: string): FrameworkView | undefined {
  const framework = frameworks.find((f) => f.id === frameworkId);
  if (!framework) return undefined;

  const byEntry = new Map<string, FrameworkEntry>();
  const ensure = (id: string): FrameworkEntry => {
    let entry = byEntry.get(id);
    if (!entry) {
      entry = {
        id,
        label: ENTRY_LABELS[frameworkId]?.[id] ?? humanise(id),
        url: entryUrl(framework, id),
        risks: [],
        controls: [],
        personas: [],
        total: 0,
      };
      byEntry.set(id, entry);
    }
    return entry;
  };

  for (const id of KNOWN_ENTRIES[frameworkId] ?? []) ensure(id);

  const appliesTo: EntityKind[] = [];
  const coverage: FrameworkView["coverage"] = [];
  const unmapped: FrameworkView["unmapped"] = [];

  for (const kind of ["risks", "controls", "personas"] as EntityKind[]) {
    const items = ENTITIES[kind];
    const mapped = items.filter((item) => item.mappings?.[frameworkId]?.length);
    if (!mapped.length) continue;

    appliesTo.push(kind);
    coverage.push({ kind, mapped: mapped.length, total: items.length });
    unmapped.push({ kind, items: items.filter((i) => !i.mappings?.[frameworkId]?.length) });

    for (const item of mapped) {
      for (const value of item.mappings![frameworkId]) {
        const entry = ensure(bare(value));
        (entry[kind] as (Risk | Control | Persona)[]).push(item);
      }
    }
  }

  const entries = [...byEntry.values()]
    .map((e) => ({ ...e, total: e.risks.length + e.controls.length + e.personas.length }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return { framework, entries, appliesTo, coverage, unmapped };
}

export const KIND_LABEL: Record<EntityKind, string> = {
  risks: "risks",
  controls: "controls",
  personas: "personas",
};

/** Deep link from a mapping badge anywhere in the app into this view. */
export const frameworkHref = (frameworkId: string, entryId?: string) =>
  `/frameworks?fw=${encodeURIComponent(frameworkId)}` +
  (entryId ? `&entry=${encodeURIComponent(bare(entryId))}` : "");
