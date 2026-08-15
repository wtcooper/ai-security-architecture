/**
 * Types for the compiled CoSAI-RM dataset.
 *
 * Derived from the upstream JSON Schemas at risk-map/schemas/ in
 * cosai-oasis/secure-ai-tooling. Prose fields arrive from YAML as string arrays
 * (one entry per paragraph); the build step normalises them to Paragraph[].
 */

import type { BandId } from "./bands";

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
 * An archetype is a class of AI application, drawn as a selection over the shared node/zone
 * vocabulary in data/reference/vocabulary.yaml. Geometry is computed by the build, never
 * authored — see ArchetypeLayout.
 */

export interface NodeGroup {
  id: string;
  title: string;
  description: string;
}

export interface ZoneType {
  id: string;
  title: string;
  description: string;
}

export interface NodeType {
  id: string;
  title: string;
  /** One of NodeGroup.id — decides the row this node type stacks into, and the legend entry. */
  group: string;
  /**
   * The risk-map band this node type belongs to, where CoSAI has a place for it. Absent for the
   * whole governance group: CoSAI's component set names no governance plane, and the diagrams
   * say so rather than inventing a band.
   */
  layer?: BandId;
  /** Default risk-map anchor, so a node can link back to the component it instantiates. */
  cosaiComponent?: string;
  description: string;
}

export interface ArchitectureVocabulary {
  groups: NodeGroup[];
  zoneTypes: ZoneType[];
  nodeTypes: NodeType[];
  controlKinds: ControlKind[];
}

export interface ArchetypeZone {
  id: string;
  /** One of ZoneType.id. */
  type: string;
  /**
   * Disambiguator, authored only where an archetype has two zones of the same type — "ingest"
   * against "query path". Absent otherwise, because the zone's name comes from its type.
   */
  qualifier?: string;
  /**
   * Computed by the build from the zone type's canonical title plus any qualifier. Never
   * authored: fourteen different names for the same network tier taught nothing and made the
   * diagrams incomparable, which is the problem canonical zones exist to fix.
   */
  label: string;
  /**
   * The CoSAI personas responsible for this zone. Ownership is expressed in the taxonomy's own
   * vocabulary rather than as "you" or "the vendor", because who "you" are depends on which
   * persona is reading — and because two personas on one zone *is* shared responsibility, stated
   * more precisely than a "shared" label would.
   *
   * Empty means the zone is outside the system: CoSAI names no persona for an attacker.
   */
  personas: string[];
  note?: string;
}

export interface ArchetypeNode {
  id: string;
  /** One of NodeType.id. */
  type: string;
  /** One of the archetype's own ArchetypeZone ids. */
  zone: string;
  label: string;
  note?: string;
  /** Overrides the node type's default CoSAI anchor. */
  cosaiComponent?: string;
  /**
   * Only meaningful inside a `vendorOpaque` zone: an explicit claim that the provider publishes
   * and documents this as a separately addressable service, rather than it being an internal the
   * diagram has inferred. Managed agent runtimes sell their memory, sandbox and gateway as
   * discrete products with their own APIs, so drawing them is reporting rather than guessing —
   * but the claim has to be made deliberately, because the default assumption is the opposite.
   */
  published?: boolean;
  /** Risks that surface at this specific node, not across the archetype. */
  risks?: string[];
  /** Capabilities that attach here. Checked against the capability's surface applicability. */
  capabilities?: string[];
}

/**
 * A canonical class of control, from data/reference/vocabulary.yaml. Each names the capability
 * that delivers it, which is the route from a boundary on a diagram to the tooling that secures
 * it.
 */
export interface ControlKind {
  id: string;
  /** Short label, drawn on the diagram. */
  title: string;
  capability: string;
  description: string;
}

/** What secures one boundary crossing in the target architecture. */
export interface EdgeControl {
  /** One of ControlKind.id. Authored. */
  kind: string;
  /** What this control means on this specific crossing. Authored. */
  note?: string;
  /** Resolved by the build from the control kind. Never authored. */
  title: string;
  /** Resolved by the build from the control kind. Never authored. */
  capability: string;
}

export interface ArchetypeEdge {
  from: string;
  to: string;
  label?: string;
  /**
   * Required by the build whenever `from` and `to` sit in different zones. These diagrams are
   * target states, so there is no way to express an unsecured crossing — an architecture that
   * needs one is not the architecture this catalogue is describing.
   */
  control?: EdgeControl;
  risks?: string[];
  /** `control` edges are governance-plane relationships, drawn apart from the data flow. */
  kind?: "flow" | "control";
}

/** A risk that does not localise to one node. Drawn as a bracket, per OWASP's ASI treatment. */
export interface ArchetypeCrossCutting {
  risk: string;
  note: string;
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

/** Geometry computed by scripts/build-data.ts from zone membership. Never authored. */
export interface ArchetypeLayout {
  width: number;
  height: number;
  zones: Record<string, Rect>;
  nodes: Record<string, Rect>;
  edges: {
    from: string;
    to: string;
    /** SVG path data. */
    d: string;
    /** Where the control marker sits, for crossings. */
    labelX: number;
    labelY: number;
    /** True when the edge crosses a zone boundary. */
    crosses: boolean;
  }[];
}

export interface Archetype {
  id: string;
  /** One of Surface.id — the deployment surface this archetype lives on. */
  surface: string;
  title: string;
  /** Short label for dense UI; falls back to title. */
  abbrev?: string;
  /** One paragraph, shown in the archetype picker. */
  summary: Paragraph[];
  description: Paragraph[];
  /** Why this is not a variant of the archetype next to it. */
  distinguishedBy?: Paragraph[];
  exemplars?: ArchetypeExemplar[];
  zones: ArchetypeZone[];
  nodes: ArchetypeNode[];
  edges: ArchetypeEdge[];
  crossCutting?: ArchetypeCrossCutting[];
  /** Archetype-level risk set, ranked most-relevant first. */
  risks: string[];
  /** The capabilities that matter most here, ranked. */
  capabilities: string[];
  deviations?: ArchetypeDeviation[];
  sources: { title: string; url: string }[];
  layout: ArchetypeLayout;
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
  architectureVocabulary: ArchitectureVocabulary;
  archetypes: Archetype[];
}
