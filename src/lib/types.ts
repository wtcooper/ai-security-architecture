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
  "owasp-mcp",
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
export type BlockKind =
  | "actor"
  | "service"
  | "provider"
  | "external"
  | "governance"
  /** Pure containment — a sandbox, a shipped application, a tenant. Dashed, no items of its own. */
  | "boundary"
  /** An anonymous edge source: occupies a cell, draws nothing, so a line starts in empty space. */
  | "origin";

/** An icon-plus-label sub-component inside a block, as in F5's block internals. */
export interface ArchBlockItem {
  id: string;
  label: string;
  /** One of ICON_NAMES in flow-layout.ts. */
  icon: string;
  note?: string;
  /** Risk-map anchor for this specific internal. */
  cosaiComponent?: string;
  /**
   * Capabilities this item implements, each of which must also be pinned on the architecture.
   * Their chip numbers render beside the item, so a reader can map a numbered control to the
   * technology that delivers it without hovering — most useful on the governance band, where
   * the items ARE the control technologies.
   */
  capabilities?: string[];
}

/**
 * An ownership zone (data/ONTOLOGY.md §4a). Zones are drawn as labelled
 * background bands and carry the crossing rule — nothing in an `endpoint` zone may reach an
 * band without terminating at a component the vocabulary marks as a crossing.
 */
export interface ArchZone {
  id: string;
  /** Fixed per owner (data/reference/vocabulary.yaml); the build fills it in or fails. */
  title?: string;
  /**
   * Bands measure ONE axis: who operates the environment. They are surfaces — locations and
   * trust domains — never functions, and their titles are fixed catalogue-wide. "Crossing" is
   * deliberately not a band: a gateway is a thing that lives somewhere, so crossing-ness is a
   * property of the component. See data/ONTOLOGY.md §4a.
   *
   * `user`       the person's own devices and channels
   * `endpoint`   devices the organisation manages           (surfaceEndpoint)
   * `cloud`      infrastructure the organisation operates   (surfaceCloud)
   * `vendor`     vendor-operated environments under agreement (surfaceSaas)
   * `external`   outside the company, no agreement: public hubs, the open web, senders
   * `governance` the oversight band, drawn full-width beneath the others because it applies
   *              to all of them, including what may be reached externally
   */
  owner: "user" | "endpoint" | "cloud" | "vendor" | "external" | "governance";
  note?: string;
}

/**
 * Spike grammar: a numbered data flow with its own identity. Flows are first-class here —
 * they carry what moves, the threats that ride them, and the controls that must apply — so a
 * reviewer designs the flow rather than inferring it from the connectors left between blocks.
 */
export interface ArchBlock {
  id: string;
  kind: BlockKind;
  /** Drawn as the tab on the block's top edge, uppercased. */
  title: string;
  /** Spike grammar: the ownership zone this block sits in. */
  zone?: string;
  /** For actor blocks and blocks without items. */
  icon?: string;
  /**
   * Containment. A block naming a `parent` is drawn inside it, on a grid local to that parent,
   * and nests to any depth — a sandbox holding a harness that itself holds a supervisor and its
   * subagents is three levels through one mechanism. Nested blocks stay ordinary blocks: they
   * keep their edges, pins, items and capability chips, which is what makes containment
   * expressible without breaking the flows.
   */
  parent?: string;
  /** Authored coarse grid position, within the parent when there is one. */
  col: number;
  row: number;
  /** Vertical span, for tall side columns like a governance plane. */
  rowSpan?: number;
  note?: string;
  /** Risk-map anchor, so the block links back to the component it instantiates. */
  cosaiComponent?: string;
  items?: ArchBlockItem[];
  /**
   * Capabilities this block delivers, each of which must also be pinned somewhere on the
   * architecture. Their chip numbers render on the block. Used by the governance band, whose
   * services are call-outs naming where a numbered control is implemented — they are
   * deliberately unconnected, because governance is a set of services and processes that
   * apply across every band, not another hop in the data path.
   */
  capabilities?: string[];
}

/**
 * The connector classes. `primary` is any data flow inside the system — one green keeps the
 * drawings simple; `external` crosses into content or services nobody in the diagram operates.
 * There is no governance connector: the control plane is call-outs, not hops, and the dotted
 * "governance relationship" line was retired as noise nothing drew.
 */
export type PathClass = "primary" | "external";

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

/**
 * A sequence data flow: ordered steps over the canvas, each following a real edge.
 *
 * One shape, and every instance behaves identically. The **walkthrough** happens to be the
 * complete walk through the architecture and is listed first; the **scenarios** are variations
 * on it. Nothing in the interface treats them differently — selecting any of them numbers its
 * steps onto the drawing, dims what it does not touch, and opens its sequence diagram below.
 *
 * The resting drawing carries no numbers at all. A number is only ever on a diagram because a
 * reader asked for that walk, which is what makes it mean one thing: the step you are on.
 *
 * This replaced a second, parallel mechanism. `flows:` named every route, carried its own
 * threat list and control list, and stamped its own badges — and it turned out that scenarios
 * visited no edge flows did not, and that every one of the 171 flow controls was already drawn
 * as a capability chip because the build required it. Two presentations of the same walk, one
 * of which carried almost no data of its own.
 */
export interface Scenario {
  title: string;
  /** One line on what the walk is for. Carried by the walkthrough; optional on a scenario. */
  moves?: string;
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
  /**
   * Horizontal extent of each top-level grid column. Ownership bands derive their rects from
   * these rather than from member blocks, so a band holding only a narrow actor figure spans
   * its column instead of leaving a gutter beside it. Empty columns have zero width.
   */
  columns: { x: number; w: number }[];
  /** Top of the ownership bands — encloses first-row risk-tag stacks, not just blocks. */
  bandTop: number;
  /**
   * The governance plane's band: as wide as the ownership bands together, one band gutter
   * beneath them. Absent when the architecture draws no governance zone.
   */
  govBand?: Rect;
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
  /** Display order within the surface, most common archetype first. Unique per surface. */
  rank: number;
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
  /** Spike grammar only: ownership zones drawn as background bands. */
  zones?: ArchZone[];
  pins: { risks: RiskPin[]; capabilities: CapabilityPin[] };
  /** The complete walk through the architecture; listed first among the sequence data flows. */
  walkthrough?: Scenario;
  /** Variations on it — the ways it goes wrong. Identical in behaviour to the walkthrough. */
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

/**
 * ------------------------------------------------------------------ Controls guidance
 *
 * The rung below a reference architecture, for admins, architects and security teams: what an
 * organisation enforces around this class of system, and how. Authored in this repository
 * (data/reference/guidance/), one document per architecture. Developer-facing setup guidance
 * and starter templates deliberately live elsewhere (the ai-security-sdlc project); this layer
 * is the org-controls side only.
 */

/**
 * Whether the organisation's teams build this class of system or consume a vendor's. Framing
 * only — the audience is admins either way.
 */
export type GuidanceMode = "build" | "use" | "hybrid";

/** Maturity of one guidance document, rendered as a chip like the catalogue's review state. */
export type GuidanceStatus = "draft" | "reviewed";

export interface GuidanceLink {
  title: string;
  url: string;
}

/** Product-specific detail inside a tool entry: one admin-controlled surface of that product. */
export interface GuidanceToolItem {
  title: string;
  body: Paragraph[];
  links?: GuidanceLink[];
}

/**
 * One product in the shared tool registry (data/reference/guidance/tools.yaml). Tools are the
 * one place this layer goes vendor-specific, because the option space is narrow; the exemplar
 * rule applies — every entry is dated and cites the vendor's own documentation.
 */
export interface GuidanceTool {
  id: string;
  name: string;
  vendor: string;
  /** When these facts were verified against the vendor's docs, e.g. "2026-08". */
  asOf: string;
  summary: Paragraph[];
  items: GuidanceToolItem[];
  sources: GuidanceLink[];
}

export interface GuidanceItem {
  title: string;
  /**
   * The capabilities this guidance directs the organisation to deploy. Each must be pinned on
   * the architecture — guidance cannot recommend something the drawing does not show, the same
   * discipline controlsForArchetype() applies to controls.
   */
  capabilities: string[];
  body: Paragraph[];
  /** Refs into the tool registry, where product specifics exist. */
  tools?: string[];
  links?: GuidanceLink[];
}

export interface Guidance {
  /** The architecture this document implements; also fixes the filename. */
  archetype: string;
  mode: GuidanceMode;
  status: GuidanceStatus;
  attribution: string;
  overview: Paragraph[];
  items: GuidanceItem[];
  sources: GuidanceLink[];
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
  /** CoSAI components and boundary actors this step touches — what the risk map lights. */
  components: string[];
  /**
   * The step on the incident's reference architecture: edges as "from->to" (the reverse of a
   * bidirectional edge is legal) and, for what happens inside a component, block ids. The
   * Incidents tab replays the step by lighting exactly these, so a drawing change is a
   * build failure here rather than a silently wrong replay. The CoSAI `components` list
   * serves the risk map only; the replay never guesses from component anchors.
   */
  path: string[];
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
  /**
   * The reference architecture this incident played out on — the Incidents tab replays the
   * same steps on that drawing as an alternate view of the risk map.
   */
  archetype: string;
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
  guidance: Guidance[];
  guidanceTools: GuidanceTool[];
  /** Provenance statement for the tool registry; each guidance document carries its own. */
  guidanceAttribution: string;
}
