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
  capabilities,
  controls,
  frameworkEntries,
  frameworkNotes,
  frameworks,
  risks,
} from "./data";
import { FULL_LIST_FRAMEWORKS } from "./types";
import type {
  Capability,
  Control,
  Framework,
  FrameworkCrosswalkRow,
  FrameworkNote,
  Persona,
  Risk,
} from "./types";

export type EntityKind = "risks" | "controls" | "capabilities" | "personas";
type Entity = Risk | Control | Capability | Persona;

export interface FrameworkEntry {
  /** Bare identifier, with CoSAI's `@version` suffix stripped. */
  id: string;
  label: string;
  /** What the entry means, in its own framework's words. */
  description?: string;
  /** Where the framework's data disagrees with the version CoSAI declares. */
  note?: string;
  /** What CoSAI's own, older edition of the framework calls this identifier. */
  predecessor?: FrameworkCrosswalkRow;
  url?: string;
  /** A heading the entry sits under in its own catalogue (organisation standards). */
  group?: string;
  risks: Risk[];
  controls: Control[];
  capabilities: Capability[];
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
  unmapped: { kind: EntityKind; items: Entity[] }[];
}

/**
 * Frameworks whose every entry is listed even when nothing maps to it: the upstream full-list
 * frameworks, and every organisation catalogue — an org control nothing reaches is the finding.
 */
const KNOWN_ENTRIES: Record<string, string[]> = Object.fromEntries(
  [
    ...FULL_LIST_FRAMEWORKS,
    ...frameworks.filter((f) => f.entriesComplete).map((f) => f.id),
  ].map((id) => [id, Object.keys(frameworkEntries[id] ?? {})]),
);

/**
 * Coverage is counted against what CoSAI currently asks you to use. The file still carries
 * SAIF's two original personas, flagged deprecated and superseded by the eight below them;
 * counting them would report "6 of 10 personas" for a framework that in fact reaches six of
 * the eight live roles, and would list two retired roles as gaps.
 */
const ENTITIES: Record<EntityKind, Entity[]> = {
  risks,
  controls,
  capabilities,
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
  // Organisation catalogues carry per-entry links; nothing else does.
  const own = frameworkEntries[framework.id]?.[id]?.url;
  if (own) return own;
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
  // This edition renumbered the list CoSAI maps to, so each entry carries its own row of the
  // translation: the identifier CoSAI actually publishes for it. Saves anyone cross-checking
  // against CoSAI's YAML from having to find the crosswalk and look their entry up in it.
  const predecessors = new Map(
    (frameworkNotes[frameworkId]?.crosswalk ?? []).map((row) => [row.to, row]),
  );
  const byEntry = new Map<string, FrameworkEntry>();
  const ensure = (id: string): FrameworkEntry => {
    let entry = byEntry.get(id);
    if (!entry) {
      entry = {
        id,
        label: reference[id]?.label ?? humanise(id),
        description: reference[id]?.description,
        note: reference[id]?.note,
        predecessor: predecessors.get(id),
        url: entryUrl(framework, id),
        group: reference[id]?.group,
        risks: [],
        controls: [],
        capabilities: [],
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
  const mappingsFor = (kind: EntityKind, item: Entity): string[] => {
    // Capabilities carry no upstream mappings; only authored (org) catalogues reach them.
    if (!authored) return "mappings" in item ? (item.mappings?.[frameworkId] ?? []) : [];
    if (kind === "personas") return [];
    return authored[kind]?.[item.id] ?? [];
  };

  for (const kind of ["risks", "controls", "capabilities", "personas"] as EntityKind[]) {
    const items = ENTITIES[kind];
    const mapped = items.filter((item) => mappingsFor(kind, item).length);
    if (!mapped.length) continue;

    appliesTo.push(kind);
    coverage.push({ kind, mapped: mapped.length, total: items.length });
    unmapped.push({ kind, items: items.filter((i) => !mappingsFor(kind, i).length) });

    for (const item of mapped) {
      for (const value of mappingsFor(kind, item)) {
        const entry = ensure(bare(value));
        (entry[kind] as Entity[]).push(item);
      }
    }
  }

  const entries = [...byEntry.values()]
    .map((e) => ({
      ...e,
      total: e.risks.length + e.controls.length + e.capabilities.length + e.personas.length,
    }))
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
  for (const [frameworkId, mapped] of Object.entries(authoredMappings)) {
    const values = mapped.risks?.[risk.id];
    if (values?.length) out.push({ frameworkId, values, authored: true });
  }
  return out;
}

/** The same, for a control. */
export function mappingsForControl(
  control: Control,
): { frameworkId: string; values: string[]; authored: boolean }[] {
  const out = Object.entries(control.mappings ?? {}).map(([frameworkId, values]) => ({
    frameworkId,
    values,
    authored: false,
  }));
  for (const [frameworkId, mapped] of Object.entries(authoredMappings)) {
    const values = mapped.controls?.[control.id];
    if (values?.length) out.push({ frameworkId, values, authored: true });
  }
  return out;
}

/** The same, for a capability — only organisation catalogues map onto capabilities. */
export function mappingsForCapability(
  capability: Capability,
): { frameworkId: string; values: string[]; authored: boolean }[] {
  const out: { frameworkId: string; values: string[]; authored: boolean }[] = [];
  for (const [frameworkId, mapped] of Object.entries(authoredMappings)) {
    const values = mapped.capabilities?.[capability.id];
    if (values?.length) out.push({ frameworkId, values, authored: true });
  }
  return out;
}

/**
 * The organisation's own entries that reach one CoSAI entity — what the badges on cards, rails
 * and hover cards show next to the CoSAI id. Empty when no org catalogue maps here.
 */
export interface OrgEntryRef {
  frameworkId: string;
  frameworkName: string;
  id: string;
  label: string;
  url?: string;
}
export function orgEntriesFor(kind: EntityKind, entityId: string): OrgEntryRef[] {
  const out: OrgEntryRef[] = [];
  for (const framework of orgFrameworks) {
    const byKind = authoredMappings[framework.id];
    const ids = kind === "personas" ? undefined : byKind?.[kind]?.[entityId];
    for (const id of ids ?? []) {
      const ref = frameworkEntries[framework.id]?.[id];
      out.push({
        frameworkId: framework.id,
        frameworkName: framework.name,
        id,
        label: ref?.label ?? id,
        url: ref?.url,
      });
    }
  }
  return out;
}

/** Does anything at all map to this framework, from CoSAI or from the authored overlay? */
function hasAnyMapping(frameworkId: string): boolean {
  const authored = authoredMappings[frameworkId];
  if (authored && Object.values(authored).some((byId) => Object.keys(byId).length)) return true;
  return [...risks, ...controls, ...activePersonas].some(
    (item) => item.mappings?.[frameworkId]?.length,
  );
}

/**
 * Display order, wherever frameworks are listed together. The data's own order is CoSAI's
 * six followed by whatever is authored here, which buries the OWASP lists most people arrive
 * looking for. Anything not named falls to the end, so a new framework appears rather than
 * vanishing.
 */
export const FRAMEWORK_ORDER = [
  "owasp-llm-2026",
  "owasp-agentic",
  "owasp-mcp",
  "mitre-atlas",
  "stride",
  "nist-ai-rmf",
  "iso-22989",
];
const orderOf = (id: string) => {
  const i = FRAMEWORK_ORDER.indexOf(id);
  return i === -1 ? FRAMEWORK_ORDER.length : i;
};

/** The adopter's own catalogues, in file order. */
export const orgFrameworks: Framework[] = frameworks.filter((f) => f.org);

/**
 * The frameworks offered as a lens. Two kinds are withheld:
 *
 *   - a superseded edition, which keeps its data because CoSAI's mappings still name it, but
 *     is not something anyone should be reading now;
 *   - a framework nothing maps to. CoSAI declares the EU AI Act applicable to personas and
 *     controls but has published no mappings for it, so the pill leads to an empty page.
 *
 * Both are data-driven, so a framework returns to the tab the moment mappings appear for it —
 * there is no list of exclusions to remember to update.
 */
export const visibleFrameworks = frameworks
  .filter((f) => !f.superseded && hasAnyMapping(f.id))
  .sort((a, b) => Number(Boolean(a.org)) - Number(Boolean(b.org)) || orderOf(a.id) - orderOf(b.id));
/** The external lenses only — what the landing page and the header count as "frameworks". */
export const visibleExternalFrameworks = visibleFrameworks.filter((f) => !f.org);
const visibleIds = new Set(visibleFrameworks.map((f) => f.id));
export const isVisibleFramework = (id: string) => visibleIds.has(id);

/** The framework that replaced a superseded one, for resolving links that predate the swap. */
export const successorOf = (frameworkId: string): Framework | undefined =>
  frameworks.find((f) => f.supersedes === frameworkId);

/**
 * Resolve a `?fw=` / `?entry=` pair that may name a superseded edition, carrying the entry
 * across with it so an old link lands on the same risk rather than on a default page.
 */
export function resolveFrameworkLink(frameworkId: string, entryId?: string) {
  const successor = successorOf(frameworkId);
  if (!successor) return { frameworkId, entryId };
  const row = (frameworkNotes[successor.id]?.crosswalk ?? []).find((r) => r.from === entryId);
  return { frameworkId: successor.id, entryId: row?.to ?? undefined };
}

export const KIND_LABEL: Record<EntityKind, string> = {
  risks: "risks",
  controls: "controls",
  capabilities: "capabilities",
  personas: "personas",
};

/** Deep link from a mapping badge anywhere in the app into this view. */
export const frameworkHref = (frameworkId: string, entryId?: string) =>
  `/frameworks?fw=${encodeURIComponent(frameworkId)}` +
  (entryId ? `&entry=${encodeURIComponent(bare(entryId))}` : "");
