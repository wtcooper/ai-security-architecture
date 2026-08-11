/**
 * Framework mappings, indexed the useful way round.
 *
 * Each risk, control and persona carries the framework identifiers it maps to, which answers
 * "what does this risk correspond to elsewhere". The more common question is the reverse:
 * "I have to work in OWASP / ATLAS / NIST — what does that mean here". This builds that index,
 * and records honestly how much of CoSAI each framework actually reaches.
 */
import {
  activePersonas,
  authoredMappings,
  controls,
  frameworkEntries,
  frameworkNotes,
  frameworks,
  risks,
} from "./data";
import { FULL_LIST_FRAMEWORKS } from "./types";
import type { Control, Framework, FrameworkNote, Persona, Risk } from "./types";

export type EntityKind = "risks" | "controls" | "personas";

export interface FrameworkEntry {
  /** Bare identifier, with CoSAI's `@version` suffix stripped. */
  id: string;
  label: string;
  /** What the entry means, in its own framework's words. */
  description?: string;
  /** Where the framework's data disagrees with the version CoSAI declares. */
  note?: string;
  url?: string;
  risks: Risk[];
  controls: Control[];
  personas: Persona[];
  total: number;
}

export interface FrameworkView {
  framework: Framework;
  /** Set where upstream has moved on since CoSAI pinned its version of this framework. */
  note?: FrameworkNote;
  entries: FrameworkEntry[];
  /** Entity kinds that actually carry a mapping, not merely those CoSAI declares. */
  appliesTo: EntityKind[];
  coverage: { kind: EntityKind; mapped: number; total: number }[];
  unmapped: { kind: EntityKind; items: (Risk | Control | Persona)[] }[];
}

const KNOWN_ENTRIES: Record<string, string[]> = Object.fromEntries(
  FULL_LIST_FRAMEWORKS.map((id) => [id, Object.keys(frameworkEntries[id] ?? {})]),
);

/**
 * Coverage is counted against what CoSAI currently asks you to use. The file still carries
 * SAIF's two original personas, flagged deprecated and superseded by the eight below them;
 * counting them would report "6 of 10 personas" for a framework that in fact reaches six of
 * the eight live roles, and would list two retired roles as gaps.
 */
const ENTITIES: Record<EntityKind, (Risk | Control | Persona)[]> = {
  risks,
  controls,
  personas: activePersonas,
};

/** Split a human-readable label out of an identifier like "ElevationOfPrivilege". */
const humanise = (id: string) => id.replace(/([a-z])([A-Z])/g, "$1 $2");

const bare = (value: string) => value.split("@")[0];

/**
 * CoSAI publishes one `techniqueUriPattern` per framework, but ATLAS splits its knowledge
 * base in two: `AML.T*` techniques live under /techniques/ and `AML.M*` mitigations under
 * /mitigations/. Running a mitigation id through the technique pattern produces a URL that
 * resolves to nothing, and 14 of the 39 ATLAS identifiers CoSAI maps to are mitigations.
 */
function entryUrl(framework: Framework, id: string) {
  if (framework.id === "mitre-atlas" && id.startsWith("AML.M")) {
    return `${framework.baseUri}/mitigations/${id}`;
  }
  if (framework.techniqueUriPattern) return framework.techniqueUriPattern.replace("{id}", id);
  return framework.documentUri ?? framework.baseUri;
}

export function frameworkView(frameworkId: string): FrameworkView | undefined {
  const framework = frameworks.find((f) => f.id === frameworkId);
  if (!framework) return undefined;

  const reference = frameworkEntries[frameworkId] ?? {};
  const byEntry = new Map<string, FrameworkEntry>();
  const ensure = (id: string): FrameworkEntry => {
    let entry = byEntry.get(id);
    if (!entry) {
      entry = {
        id,
        label: reference[id]?.label ?? humanise(id),
        description: reference[id]?.description,
        note: reference[id]?.note,
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

  // A framework CoSAI does not carry has its mappings authored here instead. They are read
  // from a separate table rather than merged into the CoSAI entities, so nothing downstream
  // can mistake one for the other.
  const authored = authoredMappings[frameworkId];
  const mappingsFor = (kind: EntityKind, item: Risk | Control | Persona): string[] =>
    authored ? (kind === "risks" ? (authored[item.id] ?? []) : []) : (item.mappings?.[frameworkId] ?? []);

  for (const kind of ["risks", "controls", "personas"] as EntityKind[]) {
    const items = ENTITIES[kind];
    const mapped = items.filter((item) => mappingsFor(kind, item).length);
    if (!mapped.length) continue;

    appliesTo.push(kind);
    coverage.push({ kind, mapped: mapped.length, total: items.length });
    unmapped.push({ kind, items: items.filter((i) => !mappingsFor(kind, i).length) });

    for (const item of mapped) {
      for (const value of mappingsFor(kind, item)) {
        const entry = ensure(bare(value));
        (entry[kind] as (Risk | Control | Persona)[]).push(item);
      }
    }
  }

  const entries = [...byEntry.values()]
    .map((e) => ({ ...e, total: e.risks.length + e.controls.length + e.personas.length }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return { framework, note: frameworkNotes[frameworkId], entries, appliesTo, coverage, unmapped };
}

/**
 * A risk's framework mappings, CoSAI's and authored, kept labelled. Used by the badges on
 * risk cards so the agentic lens is reachable from a risk, not only from the Frameworks tab.
 */
export function mappingsForRisk(risk: Risk): { frameworkId: string; values: string[]; authored: boolean }[] {
  const out = Object.entries(risk.mappings ?? {}).map(([frameworkId, values]) => ({
    frameworkId,
    values,
    authored: false,
  }));
  for (const [frameworkId, byRisk] of Object.entries(authoredMappings)) {
    const values = byRisk[risk.id];
    if (values?.length) out.push({ frameworkId, values, authored: true });
  }
  return out;
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
