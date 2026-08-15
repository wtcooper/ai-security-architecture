/**
 * Types for the compiled CoSAI-RM dataset.
 *
 * Derived from the upstream JSON Schemas at risk-map/schemas/ in
 * cosai-oasis/secure-ai-tooling. Prose fields arrive from YAML as string arrays
 * (one entry per paragraph); the build step normalises them to Paragraph[].
 */


export type Phase = "introduced" | "exposed" | "mitigated";
export const PHASES: Phase[] = ["introduced", "exposed", "mitigated"];

/**
 * Frameworks whose full published list is shown, not only the part that has something mapped
 * to it. An entry with nothing mapped is a finding worth surfacing, not an omission to hide.
 * The others are open-ended — ATLAS alone has 130 techniques — so only cited entries appear.
 *
 * Lives here because both the build check and the render need it, and disagreeing copies
 * silently drop the unmapped entries this list exists to show.
 */
export const FULL_LIST_FRAMEWORKS = [
  "owasp-top10-llm",
  "owasp-llm-2026",
  "stride",
  "owasp-agentic",
];

/** A paragraph of CoSAI prose, already split from the YAML block scalars. */
export type Paragraph = string | string[];

export interface ExternalReference {
  type: string;
  id: string;
  title: string;
  url: string;
}

/** Framework id -> list of mapped identifiers, e.g. { "owasp-top10-llm": ["LLM01:2025"] }. */
export type Mappings = Record<string, string[]>;

export interface Framework {
  id: string;
  name: string;
  fullName?: string;
  description?: string;
  baseUri?: string;
  version?: string | null;
  techniqueUriPattern?: string;
  documentUri?: string;
  applicableTo?: string[];
  /** True for a framework CoSAI does not carry, whose mappings are authored here. */
  authored?: boolean;
  /** One line, shown inline. The long form goes behind a disclosure. */
  summary?: string;
  /** Why it is here and whose judgement the mappings are. Required when authored. */
  attribution?: string;
  /** How the authored mappings were decided, and what was deliberately left unmapped. */
  mappingRationale?: string;
  /** The framework id this one replaces. That framework is hidden from the UI. */
  supersedes?: string;
  /**
   * Set by the build on the framework named by someone else's `supersedes`. Its data stays —
   * it is what CoSAI actually publishes, and the crosswalk is built from it — but it is not
   * offered as a lens, because an obsolete edition of a list is noise next to the current one.
   */
  superseded?: boolean;
}

/** Entity id -> framework entry ids, per entity kind. Personas carry no authored mappings. */
export type AuthoredMappings = {
  risks?: Record<string, string[]>;
  controls?: Record<string, string[]>;
};

/** An editorial note on a framework CoSAI does carry, where upstream has moved on. */
export interface FrameworkNote {
  headline: string;
  body: string;
  /** Where the newer edition's facts came from, when the edition itself is not open. */
  sourceNote?: string;
  link?: { label: string; url: string };
  /** Identifier translation, where a newer edition renumbered the list. */
  crosswalk?: FrameworkCrosswalkRow[];
}

export interface FrameworkCrosswalkRow {
  from: string;
  to: string;
  title: string;
  change: string;
}

/**
 * What one external-framework identifier means, in that framework's own words. CoSAI
 * publishes bare ids; this is the reference text for them. See data/frameworks/entries.yaml.
 */
export interface FrameworkEntryInfo {
  label: string;
  description: string;
  /** Set where the framework's own data disagrees with the version CoSAI declares. */
  note?: string;
}

export interface ComponentCategory {
  id: string;
  title: string;
  description?: Paragraph[];
  subcategory?: ComponentSubcategory[];
}

export interface ComponentSubcategory {
  id: string;
  title: string;
  description?: Paragraph[];
}

export interface Component {
  id: string;
  title: string;
  description?: Paragraph[];
  category: string;
  subcategory?: string;
  edges: { to?: string[]; from?: string[] };
  mappings?: Mappings;
  externalReferences?: ExternalReference[];
}

export interface Risk {
  id: string;
  title: string;
  shortDescription: Paragraph[];
  longDescription: Paragraph[];
  category: string;
  personas: string[];
  controls: string[];
  examples?: Paragraph[];
  tourContent?: Record<Phase, Paragraph[]>;
  mappings?: Mappings;
  lifecycleStage?: string[] | "all" | "none";
  impactType?: string[] | "all" | "none";
  actorAccess?: string[] | "all" | "none";
  externalReferences?: ExternalReference[];
}

export interface Control {
  id: string;
  title: string;
  description: Paragraph[];
  category: string;
  personas: string[];
  components: string[] | "all" | "none";
  risks: string[] | "all";
  mappings?: Mappings;
  lifecycleStage?: string[] | "all" | "none";
  impactType?: string[] | "all" | "none";
  actorAccess?: string[] | "all" | "none";
  externalReferences?: ExternalReference[];
}

export interface Persona {
  id: string;
  title: string;
  description: Paragraph[];
  responsibilities?: string[];
  identificationQuestions?: string[];
  /** CoSAI retains the two legacy SAIF personas, flagged as superseded. */
  deprecated?: boolean | string;
  mappings?: Mappings;
}

/** Shared shape for lifecycle-stage / impact-type / actor-access vocabularies. */
export interface Vocabulary {
  id: string;
  title: string;
  description?: Paragraph[];
}

/**
 * Assessment states a fork can record per capability per surface. Shipped unset — the
 * repository maps the taxonomy, a deployment maps its own posture onto it.
 */
export type CapabilityStatus = "needsAssessment" | "inPlace" | "partial" | "gap";
/** Cycle and legend order. `needsAssessment` leads: it is the shipped state of everything. */
export const CAPABILITY_STATUSES: CapabilityStatus[] = [
  "needsAssessment",
  "inPlace",
  "partial",
  "gap",
];

/** A deployment surface where AI is consumed: endpoint, cloud you operate, vendor SaaS. */
export interface Surface {
  id: string;
  title: string;
  description?: Paragraph[];
}

export interface CapabilitySurfaceInfo {
  /** Whether the capability is structurally available on this surface at all. */
  applies: boolean;
  /** How it shows up (or why it cannot) on this surface. */
  note?: string;
  /** Optional posture assessment. Never set in the shipped dataset; forks may commit it. */
  status?: CapabilityStatus;
}

/**
 * A technology capability: a vendor-neutral class of security tooling that implements
 * CoSAI controls on one or more surfaces. Authored in this repository (data/overlay/
 * capabilities.yaml), not CoSAI's.
 */
export interface Capability {
  id: string;
  title: string;
  /** Short label for dense UI (matrix chips); falls back to title. */
  abbrev?: string;
  /** Primary CoSAI control category — the matrix row this capability lives in. */
  category: string;
  description: Paragraph[];
  /** Vendor-neutral example technology classes. */
  examples: string[];
  controls: string[];
  risks: string[];
  components: string[];
  /** Keyed by surface id; the build requires every declared surface to be present. */
  surfaces: Record<string, CapabilitySurfaceInfo>;
  sources?: { title: string; url: string }[];
}

/**
 * ------------------------------------------------------------------ Reference architectures
 *
 * An architecture is a class of AI application drawn in the F5 reference-architecture grammar:
 * capability blocks connected by typed data paths, with risks and capabilities pinned onto
 * specific blocks and flows and keyed to a side rail. Geometry is computed by the build from an
 * authored coarse grid — see ArchLayout.
 */

/**
 * How a block is drawn and read. `service` is a capability block the operator runs; `provider`
 * is vendor-operated, with only the published interface drawn; `external` is data or services
 * outside the system that the agent reads or acts on; `governance` is the management plane;
 * `actor` is a person or peer system, drawn unboxed.
 */
export type BlockKind = "actor" | "service" | "provider" | "external" | "governance";

/** An icon-plus-label sub-component inside a block, as in F5's block internals. */
export interface ArchBlockItem {
  id: string;
  label: string;
  /** One of ICON_NAMES in flow-layout.ts. */
  icon: string;
  note?: string;
  /** Risk-map anchor for this specific internal. */
  cosaiComponent?: string;
}

export interface ArchBlock {
  id: string;
  kind: BlockKind;
  /** Drawn as the tab on the block's top edge, uppercased. */
  title: string;
  /** For actor blocks and blocks without items. */
  icon?: string;
  /** Authored coarse grid position; the build turns it into pixels. */
  col: number;
  row: number;
  /** Vertical span, for tall side columns like a governance plane. */
  rowSpan?: number;
  note?: string;
  /** Risk-map anchor, so the block links back to the component it instantiates. */
  cosaiComponent?: string;
  items?: ArchBlockItem[];
}

/**
 * The connector classes, straight from the F5 legend. `primary` is the request path; `secondary`
 * carries data that is not the user's request — state, triggers, telemetry; `external` crosses
 * into content or services nobody in the diagram operates; `governance` is a management-plane
 * relationship, drawn dotted.
 */
export type PathClass = "primary" | "secondary" | "external" | "governance";

export interface ArchEdge {
  from: string;
  to: string;
  path: PathClass;
  /** Drawn with arrowheads at both ends. */
  bidir?: boolean;
  /**
   * For diagonal connections only: leave the source horizontally then turn (`hv`, the default),
   * or vertically then turn (`vh`). Authored when the default leg would cross another block —
   * the router is simple on purpose, and the fix for a collision is this hint or a better grid.
   */
  route?: "hv" | "vh";
  label?: string;
  note?: string;
}

/** A risk tag pinned to a block or a flow, leader-lined like F5's OWASP tags. */
export interface RiskPin {
  risk: string;
  /** A block id, or an edge as "from->to". */
  at: string;
  note?: string;
}

/**
 * A capability pinned where it must be deployed — the numbered chips, F5's design-requirements
 * treatment. Numbering is the authored order, per architecture.
 */
export interface CapabilityPin {
  capability: string;
  /** A block id, or an edge as "from->to". */
  at: string;
  note?: string;
}

/** One step of a scenario walk: an edge followed in a stated direction. */
export interface ScenarioStep {
  /** "from->to"; the reverse direction of a bidirectional edge is legal. */
  follow: string;
  note?: string;
}

/** A numbered use-case walk over the same canvas — one architecture, many scenario walks. */
export interface Scenario {
  title: string;
  steps: ScenarioStep[];
}

/**
 * A named real-world instance. The architecture itself stays vendor-neutral like the capability
 * taxonomy; product names are confined here, dated, and rendered as illustration. See
 * data/PROVENANCE.md.
 */
export interface ArchetypeExemplar {
  name: string;
  note: string;
  url?: string;
  /** When this was true, e.g. "2026-08". This field ages; the taxonomy should not. */
  asOf?: string;
}

export interface ArchetypeDeviation {
  subject: string;
  reason: string;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Geometry computed by scripts/build-data.ts from the authored grid. Never authored. */
export interface ArchLayout {
  width: number;
  height: number;
  blocks: Record<string, Rect>;
  edges: {
    from: string;
    to: string;
    /** SVG path data, drawn from `from` towards `to`. */
    d: string;
    /** Midpoint of the path, where pins and scenario step numbers attach. */
    midX: number;
    midY: number;
    /** True when the segment at the midpoint runs horizontally. */
    horizontal: boolean;
  }[];
}

export interface Archetype {
  id: string;
  /** One of Surface.id — the deployment surface this architecture lives on. */
  surface: string;
  title: string;
  /** Short label for dense UI; falls back to title. */
  abbrev?: string;
  /** One paragraph, shown in the picker. */
  summary: Paragraph[];
  description: Paragraph[];
  /** Why this is not a variant of the architecture next to it. */
  distinguishedBy?: Paragraph[];
  exemplars?: ArchetypeExemplar[];
  blocks: ArchBlock[];
  edges: ArchEdge[];
  pins: { risks: RiskPin[]; capabilities: CapabilityPin[] };
  scenarios?: Scenario[];
  /**
   * Derived by the build from the risk pins, in pin order, deduplicated. The rail and the
   * cross-tab back-links read these, so they cannot drift from the drawing.
   */
  risks: string[];
  /** Derived from the capability pins the same way. */
  capabilities: string[];
  deviations?: ArchetypeDeviation[];
  sources: { title: string; url: string }[];
  layout: ArchLayout;
}

/** Resolved highlight sets for one risk, per phase. */
export interface RiskOverlay {
  risk: string;
  source: "saif" | "authored";
  introduced: string[];
  exposed: string[];
  mitigated: string[];
  /** True when `mitigated` came from risk.controls -> control.components. */
  mitigatedDerived: boolean;
}

export interface IncidentSource {
  title: string;
  url: string;
  publisher?: string;
  date?: string;
}

export interface IncidentStep {
  n: number;
  title: string;
  phase: Phase;
  narrative: string;
  components: string[];
  risks?: string[];
  cves?: string[];
  sources?: IncidentSource[];
}

export interface IncidentRelated {
  title: string;
  date?: string;
  note: string;
  sources?: IncidentSource[];
}

export interface Incident {
  id: string;
  title: string;
  subtitle: string;
  dateRange: string;
  /** "target" = the AI system was attacked. "weapon" = an AI agent ran the attack. */
  perspective: "target" | "weapon";
  summary: string[];
  patterns: string[];
  risks: string[];
  controls: string[];
  cves?: string[];
  steps: IncidentStep[];
  alsoSeen?: IncidentRelated[];
  sources: IncidentSource[];
}

/** Everything the app renders, emitted by scripts/build-data.ts. */
export interface Dataset {
  meta: {
    cosaiRef: string;
    generatedAt: string;
    counts: Record<string, number>;
  };
  componentCategories: ComponentCategory[];
  components: Component[];
  risks: Risk[];
  riskCategories: { id: string; title: string }[];
  controls: Control[];
  controlCategories: { id: string; title: string }[];
  personas: Persona[];
  frameworks: Framework[];
  /** framework id -> entry id -> reference text. */
  frameworkEntries: Record<string, Record<string, FrameworkEntryInfo>>;
  /**
   * Mappings authored in this repository rather than published by CoSAI, kept apart from
   * `risk.mappings` so the two are never silently merged.
   * framework -> "risks" | "controls" -> entity id -> entry ids.
   */
  authoredMappings: Record<string, AuthoredMappings>;
  /** framework id -> editorial note. */
  frameworkNotes: Record<string, FrameworkNote>;
  lifecycleStages: Vocabulary[];
  impactTypes: Vocabulary[];
  actorAccessLevels: Vocabulary[];
  overlays: RiskOverlay[];
  incidents: Incident[];
  surfaces: Surface[];
  capabilities: Capability[];
  /** Provenance statement for the capabilities overlay, carried for YAML round-tripping. */
  capabilitiesAttribution: string;
  archetypes: Archetype[];
}
