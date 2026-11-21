/**
 * Types for the compiled CoSAI-RM dataset.
 *
 * Derived from the upstream JSON Schemas at risk-map/schemas/ in
 * cosai-oasis/secure-ai-tooling. Prose fields arrive from YAML as string arrays
 * (one entry per paragraph); the build step normalises them to Paragraph[].
 */

import type { IncidentCategory } from "./incident-categories";

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
  "nist-csf",
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
  mitigations?: Record<string, string[]>;
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
  /** A per-entry deep link, where the framework has one (organisation catalogues). */
  url?: string;
  /** A heading the entry sits under in its own catalogue, e.g. a control domain. */
  group?: string;
  /** Category names sometimes have no official identifier. Never present our key as one. */
  identifierKind?: "official" | "repository-key";
  sourceLocation?: string;
  mappingNotes?: { kind: "controls"; entity: string; relationship: string; rationale: string }[];
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
 * The status vocabulary an organisation sets on its own controls in data/org/controls.yaml.
 * Nothing ships with a status: a catalogue control with none of the organisation's controls
 * mapped to it reads "Not set". Every other status on the site is a rollup of those.
 */
export type Status = "enabled" | "inProgress" | "gap";
export type DisplayStatus = Status | "notSet";
export const STATUSES: Status[] = ["enabled", "inProgress", "gap"];

/** A catalogue control's status, worked out from the organisation's controls that map to it. */
export interface ControlRollup {
  status?: Status;
  note?: string;
}

/**
 * One of the organisation's own controls (data/org/controls.yaml). It maps to one or more
 * catalogue controls, and several may map to the same one. Pages show its name; its id is for
 * the organisation's records and is never shown.
 */
export interface OrgControl {
  id: string;
  name: string;
  status?: Status;
  /** Catalogue control ids it delivers: MITRE mitigations or authored specialisations. */
  maps: string[];
  note?: string;
  /** The organisation's policy, standard or evidence for it. */
  link?: string;
}

/**
 * Control families. Every control sits under exactly one NIST CSF 2.0 category; a pattern's
 * enterprise controls are the ones it pins, shown under those categories in CSF order. The
 * baseline is the subset every AI deployment needs, set up once and reused.
 */
export interface EnablementGroup {
  /** The CSF category id, e.g. "PR.AA". */
  id: string;
  /** The category's name, from data/frameworks/nist-csf.yaml. */
  title: string;
  /** The CSF function it belongs to: Govern, Identify, Protect, Detect, Respond or Recover. */
  function: string;
  blurb: string;
  /** The heading a reader sees: what the category is for, in everyday words. */
  plain: string;
  /** The blurb on one surface, keyed by surface id, where it reads differently there. */
  surfaces?: Record<string, { blurb?: string }>;
  mitigations: string[];
}

export interface Enablement {
  framework: "nist-csf";
  groups: EnablementGroup[];
  /** Controls every AI deployment needs, whatever the pattern. */
  baseline: string[];
}

/** A deployment surface where AI is consumed: endpoint, cloud you operate, vendor SaaS. */
export interface Surface {
  id: string;
  title: string;
  description?: Paragraph[];
}

export interface MitigationSurfaceInfo {
  /** Selected for customer deployment in this profile, not universal availability. */
  applies: boolean;
  responsibility: "customer-operated" | "customer-configurable" | "provider-inherited" | "not-applicable" | "unknown";
  /** How it shows up (or why it cannot) on this surface. */
  note?: string;
}

/**
 * A selected MITRE defensive technique or AI mitigation. No custom mitigation identifiers.
 * Upstream definitions are vendored; CoSAI mappings and deployment scope are authored here.
 */
export interface Mitigation {
  id: string;
  title: string;
  /** Short label for dense UI (matrix chips); falls back to title. */
  abbrev?: string;
  /** Primary CoSAI control category — the matrix row this mitigation lives in. */
  category: string;
  description: Paragraph[];
  kind: "function" | "support";
  origin: {
    framework: "MITRE D3FEND" | "MITRE ATLAS";
    version: string;
    entityType: "defensive-technique" | "mitigation" | "specialisation";
    url?: string;
  };
  /**
   * Set on an authored specialisation: the MITRE entry it narrows. A specialisation is one
   * actionable countermeasure where the parent is too coarse to pin or report on; it inherits
   * the parent's definition, controls and surfaces unless it overrides them.
   */
  parent?: string;
  /** The retired home-grown ids this entry restores; drives the data migration. */
  legacy?: string[];
  /** Practice items when the countermeasure is run as a process, beside any technology. */
  process?: { title: string; note: string }[];
  /** Authored implementation scope, separate from the upstream definition. */
  implementation: string;
  /** Implementation checks within the upstream function; never additional mitigation IDs. */
  features?: string[];
  controlMappings: { control: string; relationship: "supports"; rationale: string }[];
  /** Vendor-neutral example technology classes. */
  examples: string[];
  controls: string[];
  risks: string[];
  components: string[];
  /** Keyed by surface id; the build requires every declared surface to be present. */
  surfaces: Record<string, MitigationSurfaceInfo>;
  sources?: { title: string; url: string }[];
}

/**
 * ------------------------------------------------------------------ Reference architectures
 *
 * An architecture is a class of AI application drawn in the F5 reference-architecture grammar:
 * mitigation blocks connected by typed data paths, with risks and mitigations pinned onto
 * specific blocks and flows. Blocks are placed on an authored coarse grid (`col`, `row`), which
 * the boundary drawing lays out in the browser (components/drawing/layout.ts).
 */

/**
 * How a block is drawn and read. `service` is a mitigation block the operator runs; `provider`
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
  /** One of ICON_NAMES in icon-names.ts. */
  icon: string;
  note?: string;
  /** Risk-map anchor for this specific internal. */
  cosaiComponent?: string;
  /**
   * Mitigations this item implements, each of which must also be pinned on the architecture.
   * Their chip numbers render beside the item, so a reader can map a numbered control to the
   * technology that delivers it without hovering — most useful on the governance band, where
   * the items ARE the control technologies.
   */
  mitigations?: string[];
}

/**
 * An ownership zone (data/ONTOLOGY.md §4a), drawn as a labelled background band. A band says who
 * operates an environment, not a step in a pipeline; nothing in the external band connects into
 * an endpoint or cloud band (the build checks it).
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
  /**
   * A few plain words for what this zone is on this pattern, shown after the canonical title on
   * the boundary drawing ("MANAGED ENDPOINT · developer's machine"). The title stays fixed.
   */
  gloss?: string;
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
   * keep their edges, pins, items and mitigation chips, which is what makes containment
   * expressible without breaking the flows.
   */
  parent?: string;
  /**
   * One short line for the boundary drawing's box, under the title. Where it is absent the box
   * shows the block's item labels, so the drawing never says less than the data.
   */
  summary?: string;
  /** Authored coarse grid position, within the parent when there is one. */
  col: number;
  row: number;
  /** Vertical span, for tall side columns like a governance plane. */
  rowSpan?: number;
  /**
   * The block's grid cell on the drawing, where it should differ from `col` and `row`.
   * Used to fold a wide zone into fewer columns.
   */
  cell?: { col: number; row: number; rowSpan?: number };
  note?: string;
  /** Risk-map anchor, so the block links back to the component it instantiates. */
  cosaiComponent?: string;
  items?: ArchBlockItem[];
  /**
   * Mitigations this block delivers, each of which must also be pinned somewhere on the
   * architecture. Their chip numbers render on the block. Used by the governance band, whose
   * services are call-outs naming where a numbered control is implemented — they are
   * deliberately unconnected, because governance is a set of services and processes that
   * apply across every band, not another hop in the data path.
   */
  mitigations?: string[];
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
   * Only `from` opens this connection, and what comes back rides it: drawn with one arrowhead,
   * at `to`, and a walk may follow it in reverse as the reply. Every edge from our side to a
   * party outside any agreement is drawn this way — nothing external reaches back in.
   */
  outbound?: boolean;
  /**
   * For diagonal connections only: leave the source horizontally then turn (`hv`, the default),
   * or vertically then turn (`vh`). Authored when the default leg would cross another block —
   * the router is simple on purpose, and the fix for a collision is this hint or a better grid.
   * `hvh` runs along the gap beside the target's column and enters its facing side; `vhv` runs
   * along the gap above or below the target's row. Those two let blocks share a column or a row
   * with a neighbour the arrow would otherwise have to pass through. `under` leaves the bottom
   * of both blocks and runs beneath them — an escalation back to a person boxed in by the flow;
   * `over` is its mirror above them.
   */
  route?: "hv" | "vh" | "hvh" | "vhv" | "under" | "over";
  label?: string;
  note?: string;
  /**
   * For an edge whose ends sit in different zones: what the crossing passes through on our
   * side, where the derived answer (src/components/drawing/crossings.ts) is not the right one.
   */
  crossing?: { kind: CrossingKind; via: string };
}

/**
 * What stands in the path where a flow crosses a trust boundary: a control point we run, the
 * vendor's own governance, the person at the device, or nothing of ours at all.
 */
export type CrossingKind = "brokered" | "vendor" | "person" | "direct";
export const CROSSING_KINDS: CrossingKind[] = ["brokered", "vendor", "person", "direct"];

/** A risk tag pinned to a block or a flow, leader-lined like F5's OWASP tags. */
export interface RiskPin {
  risk: string;
  /** A block id, or an edge as "from->to". */
  at: string;
  note?: string;
}

/**
 * A mitigation pinned where it must be deployed — the numbered chips, F5's design-requirements
 * treatment. Numbering is the authored order, per architecture.
 */
export interface MitigationPin {
  mitigation: string;
  /** A block id, or an edge as "from->to". */
  at: string;
  /**
   * What to do at this spot on this pattern, as one plain sentence starting with a verb. This is
   * the headline of the control's row on Enable, written for someone who has to put it in place
   * and is not a security architect.
   */
  do: string;
  /** Why, in one or two plain sentences: what goes wrong without it. */
  why: string;
  /** The precise version, for an architect: what the control does at this spot and what it does not. */
  note?: string;
}

/** One step of a scenario walk: an edge followed in a stated direction. */
export interface ScenarioStep {
  /** "from->to"; the reverse direction of a bidirectional edge is legal. */
  follow: string;
  /**
   * What this arrow carries on this walk, in a few words — shown on the sequence arrow. Falls
   * back to the edge's label, which is too generic once a walk crosses one edge for several
   * different reasons.
   */
  label?: string;
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
 * as a mitigation chip because the build required it. Two presentations of the same walk, one
 * of which carried almost no data of its own.
 */
export interface Scenario {
  title: string;
  /** One line on what the walk is for. Carried by the walkthrough; optional on a scenario. */
  moves?: string;
  steps: ScenarioStep[];
}

/**
 * A named real-world instance. The architecture itself stays vendor-neutral like the mitigation
 * taxonomy; product names are confined here, dated, and rendered as illustration. See
 * data/PROVENANCE.md.
 */
export interface ArchetypeExemplar {
  name: string;
  note: string;
  url?: string;
  /** When this was true, e.g. "2026-08". This field ages; the taxonomy should not. */
  asOf?: string;
  /**
   * The box this is an example of, on a hosted pattern: a framework fills the agent, an isolation
   * technology fills the sandbox. Absent where the example is the whole pattern (a product).
   */
  fills?: string;
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

export interface Archetype {
  id: string;
  /** The pattern's URL segment: its data file's name, e.g. "endpoint-coding-agent-third-party". */
  slug: string;
  /** One line on when the pattern applies, in the reader's words. From data/overlay/patterns.yaml. */
  useWhen: string;
  /** Search words a reader might type that the pattern's own text does not contain. */
  keywords: string[];
  /** One of Surface.id — the deployment surface this architecture lives on. */
  surface: string;
  /** Display order within the surface, most common archetype first. Unique per surface. */
  rank: number;
  title: string;
  /** Short label for dense UI; falls back to title. */
  abbrev?: string;
  /** One paragraph, shown in the picker. */
  summary: Paragraph[];
  /** What How it works opens with: what the pattern is and what sets it apart from its nearest neighbour, in a few sentences. */
  overview: string;
  description: Paragraph[];
  /** Why this is not a variant of the architecture next to it. */
  distinguishedBy?: Paragraph[];
  exemplars?: ArchetypeExemplar[];
  blocks: ArchBlock[];
  edges: ArchEdge[];
  /** Spike grammar only: ownership zones drawn as background bands. */
  zones?: ArchZone[];
  pins: { risks: RiskPin[]; mitigations: MitigationPin[] };
  /** The complete walk through the architecture; listed first among the sequence data flows. */
  walkthrough?: Scenario;
  /** Variations on it — the ways it goes wrong. Identical in behaviour to the walkthrough. */
  scenarios?: Scenario[];
  /**
   * Derived by the build from the risk pins, in pin order, deduplicated. The rail and the
   * cross-tab back-links read these, so they cannot drift from the drawing.
   */
  risks: string[];
  /** Derived from the mitigation pins the same way. */
  mitigations: string[];
  deviations?: ArchetypeDeviation[];
  sources: { title: string; url: string }[];
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
 * ------------------------------------------------------------------ AI tooling registry
 *
 * Named products, one entity per product × reference architecture (data/tooling/). This is
 * the only layer that names vendors, so every entry carries the exemplar rule: dated (asOf)
 * and sourced from the vendor's own documentation, with each operator step linking to the page
 * that documents it.
 */

/** How the product reaches the user; a tool may ship as several of these. */
export type ToolSurfaceClass =
  | "endpointCli"
  | "ideExtension"
  | "desktopApp"
  | "browserExtension"
  | "cloudAgent"
  | "managedRuntime"
  | "chatIntegration"
  | "saasChat"
  | "officeAddin"
  | "ciIntegration"
  | "sdkFramework"
  | "selfHostedServer"
  | "remoteMcpServer"
  | "saasAgentPlatform"
  | "agenticBrowser";
export const TOOL_SURFACE_CLASSES: ToolSurfaceClass[] = [
  "endpointCli",
  "ideExtension",
  "desktopApp",
  "browserExtension",
  "cloudAgent",
  "managedRuntime",
  "chatIntegration",
  "saasChat",
  "officeAddin",
  "ciIntegration",
  "sdkFramework",
  "selfHostedServer",
  "remoteMcpServer",
  "saasAgentPlatform",
  "agenticBrowser",
];

export type ToolStatus = "ga" | "beta" | "preview" | "announced";

/**
 * Whether the vendor implements a pinned mitigation on this tool: natively, partially, not at
 * all, only through a third-party product (`external`), or nobody could verify (`unknown`).
 */
export type ToolCoverage = "native" | "partial" | "none" | "external" | "notApplicable" | "unknown";
export const TOOL_COVERAGES: ToolCoverage[] = ["native", "partial", "none", "external", "notApplicable", "unknown"];

/** A named shell of the product: CLI, IDE extension, desktop app, ... */
export interface ToolVariant {
  name: string;
  class: ToolSurfaceClass;
  url?: string;
  note?: string;
}

export interface ToolStep {
  title: string;
  body: Paragraph[];
  url?: string;
}

/** The vendor's implementation of one mitigation pinned on the tool's architecture. */
export interface ToolControl {
  mitigation: string;
  coverage: ToolCoverage;
  /** Where the control is set: a managed file, an MDM key, an admin-console path. */
  mechanism?: string;
  steps?: ToolStep[];
  /** When the steps were checked against the vendor's page, e.g. "2026-09-10". */
  verified?: string;
  note?: string;
  /**
   * Where an absence or an integration claim was checked, for rows with no operator step: the
   * page that shows the vendor offers nothing, names the integration point, or explains why the
   * control does not apply. Not a configuration page — the coverage word never links here.
   */
  evidence?: { title: string; url: string }[];
  migration?: MitigationMigrationEvidence;
}

/**
 * How a setting is applied — the channel an administrator uses. A setting reachable two ways
 * (an admin-console toggle that MDM can also push) lists both.
 */
export type SettingVia = "mdm" | "adminConsole" | "configFile" | "apiCli" | "identityProvider" | "cloudPolicy" | "clusterPolicy" | "code";
export const SETTING_VIAS: SettingVia[] = ["mdm", "adminConsole", "configFile", "apiCli", "identityProvider", "cloudPolicy", "clusterPolicy", "code"];

/** The admin area a setting sits in, in the order a console is usually worked through. */
export type SettingArea = "identity" | "data" | "tools" | "network" | "audit" | "sharing";
export const SETTING_AREAS: SettingArea[] = ["identity", "data", "tools", "network", "audit", "sharing"];

/**
 * One security-relevant setting a product or cloud exposes, with the baseline value this
 * catalogue recommends for it (data/tooling/BASELINE.md). Rows are the unit of the Enable tab's
 * tools step: what to set, where, to what, and which controls on the drawing it delivers.
 */
export interface ProductSetting {
  /** Unique within its product (or cloud), camelCase; the key data/org/products.yaml uses. */
  id: string;
  /** The setting's name exactly as the vendor's page gives it. */
  name: string;
  /** Where it lives: an admin-console path, a policy or settings key, a CLI flag. */
  where: string;
  setVia: SettingVia[];
  area: SettingArea;
  /** The value out of the box, where the vendor documents one. */
  default?: string;
  /** The baseline value, with how to apply it where that takes more than a word. */
  recommended: string;
  /**
   * The recommended value in a few words ("On", "Deny", "EgressDisabled", "Required on every write"),
   * where `recommended` is a sentence. Shown as the value to set; `recommended` then explains it.
   */
  value?: string;
  /** One line: the path the recommended value closes. */
  why: string;
  /** Controls this setting delivers; each must be pinned on the drawing it is shown on. */
  mitigations: string[];
  /** The plan or licence it needs, when it is not on every plan. */
  requires?: string;
  /** The vendor page that documents it. */
  url: string;
  /** When the setting's name and url were checked, e.g. "2026-10-30". */
  verified: string;
  /** A read-only command that shows whether the setting is at its recommended value. */
  check?: SettingCheck;
  /**
   * In a platform's file: the framework or server software this row belongs to, when the row is
   * not the platform's own setting. It applies if that box is built with it.
   */
  builtWith?: string;
}

/**
 * How to look at a setting without changing it. The command only reads, is taken from the
 * vendor's command reference, and has not been run by this project: a reader runs it in their own
 * account. There is deliberately no command that creates or changes anything, because how an
 * organisation deploys is its own decision.
 */
export interface SettingCheck {
  /** One line to paste, with identifiers as <placeholders>. */
  command: string;
  /** What a passing result looks like. */
  expect: string;
  /** The reference page for the command. */
  url: string;
}

/** The first word of an operation that only reads, and of one that does not. */
export const READ_ONLY_VERB = /^(get|describe|list|show|view|lookup|search|batch-get|head|read)(-|$)/;
export const CHANGING_VERB =
  /^(create|delete|put|update|set|apply|remove|attach|detach|enable|disable|start|stop|run|add|modify|patch|replace|import|register|deregister|tag|untag|invoke|send|publish|terminate|reboot|revoke|grant|deploy|exec|edit|scale|rollout|restore|reset|rotate|associate|disassociate|rm|mv|cp)(-|$)/;

/** Why a check's command is not acceptable, or null when it only reads. */
export function checkCommandProblem(command: string): string | null {
  const line = command.trim();
  if (!line || /\n/.test(line)) return "is one line";
  // Quoted values and <placeholders> are not shell syntax; what is left must have none.
  if (/[|;&><`]|\$\(/.test(line.replace(/'[^']*'|"[^"]*"|<[A-Za-z0-9_-]+>/g, ""))) return "has no pipes, redirects or chained commands";
  // The operation is among the bare words before the first option.
  const words = line.split(/\s+/);
  const firstOption = words.findIndex((w) => w.startsWith("-"));
  const bare = (firstOption === -1 ? words : words.slice(0, firstOption)).slice(1);
  const changing = bare.find((w) => CHANGING_VERB.test(w));
  if (changing) return `only reads ("${changing}" changes something)`;
  if (!bare.some((w) => READ_ONLY_VERB.test(w))) return "names an operation that only reads (get, describe, list, show)";
  return null;
}

/** Whether the organisation has a product, a cloud or one of their settings switched on. */
export type AdoptionStatus = "enabled" | "testing" | "notEnabled";
export const ADOPTION_STATUSES: AdoptionStatus[] = ["enabled", "testing", "notEnabled"];

/** The organisation's entry for one product or cloud in data/org/products.yaml. */
export interface ProductStatusEntry {
  status?: AdoptionStatus;
  note?: string;
  /** `link` is the organisation's own module, policy or runbook that applies the setting. */
  settings?: Record<string, { status?: AdoptionStatus; value?: string; note?: string; link?: string }>;
  /**
   * Platforms only: which ways of hosting the organisation has approved, keyed by a hosting
   * option's id (`aks`, `containerApps`, `foundryAgentService`). It turns the general comparison
   * into a specific answer for the organisation's own builders.
   */
  hosting?: Record<string, { status?: AdoptionStatus; note?: string }>;
  /**
   * Clouds and on-premises only: what the organisation runs for a component in place of the
   * reference service. Keyed by a block id (every pattern on this platform that has the block)
   * or "<pattern id>/<block id>" (that pattern only, which wins).
   */
  components?: Record<string, ComponentChoice>;
}

/** The organisation's own approved service for one component, and where its module or runbook lives. */
export interface ComponentChoice {
  /** What the organisation runs there, as it should read on the drawing. */
  uses: string;
  /** The organisation's module, golden path or runbook for it. */
  link?: string;
  note?: string;
}

/** One block of a cloud architecture bound to the cloud service that plays it. */
export interface CloudBinding {
  block: string;
  /** The service, or for a block with no managed equivalent, what you run yourself. */
  service: string;
  /** The vendor's page for the service, as checked on `verified`. Absent for what is not a cloud service. */
  url?: string;
  /** The day the row was last checked against the vendor's documentation (YYYY-MM-DD). */
  verified?: string;
  note?: string;
  /** True when no managed service fills the block: the organisation builds or runs it. */
  build?: boolean;
  /**
   * The framework or server software the platform's own guides build this box with. A default,
   * not a requirement: the platform says where the box runs, and what it is built with is the
   * builder's choice.
   */
  builtWith?: string;
}

/** What a supporting service is for, in the words a builder would look for it under. */
export const CLOUD_ROLES = ["identity", "network", "keys", "secrets", "registry", "logging", "ingress", "other"] as const;
export type CloudRole = (typeof CLOUD_ROLES)[number];

/**
 * A place where a cloud does not follow the pattern's drawing: a flow the vendor routes another
 * way, one that does not exist there, or one that holds only if the builder makes it so. The
 * drawing is shared by every cloud, so a difference is stated, never hidden.
 */
export interface CloudDifference {
  /** A flow as "from->to", or a block id. */
  at: string;
  /** What happens on this cloud instead, and what the builder does about it, in plain words. */
  text: string;
  url?: string;
}

/** A service a builder must also stand up on this cloud that is not a box on the drawing. */
export interface CloudSupportingService {
  service: string;
  role: CloudRole;
  why: string;
  url?: string;
}

/** One first-party architecture as built on one cloud: its services, and the settings that secure it. */
export interface CloudImplementation {
  architecture: string;
  /** The cloud's own published reference architecture(s) this implementation follows. */
  reference: GuidanceLink[];
  summary?: Paragraph[];
  asOf: string;
  bindings: CloudBinding[];
  /** Ids into the cloud's settings, in the order they read on this architecture. */
  settings: string[];
  /** The day the component rows and flows were last checked against the vendor's documentation. */
  verified?: string;
  /** Where this cloud does not follow the drawing. */
  differences?: CloudDifference[];
  /** Services needed on this cloud that are not boxes on the drawing. */
  alsoNeeded?: CloudSupportingService[];
  /** The vendor's own pages for building this: a quickstart, tutorial or reference implementation. */
  quickstart?: GuidanceLink[];
  /**
   * The ways this platform can host the pattern, compared row for row. One is `mapped`: the
   * components and settings above describe it. Absent where only one way has been mapped.
   */
  hosting?: HostingOption[];
}

/**
 * Who runs the thing a hosted pattern is about: the agent, the MCP server, the model server, the
 * training job or the sandbox. On your own cluster and on the platform's own runtime the pattern
 * is the same and only some components and settings change; on a managed service the vendor
 * runs it, so the pattern's own components and settings no longer describe it. For an agent that
 * is a different pattern, which the option names.
 */
export const HOSTING_KINDS = ["cluster", "runtime", "managed"] as const;
export type HostingKind = (typeof HOSTING_KINDS)[number];

/**
 * The rows every hosting option is compared on, in the order they are read. No ranking. The
 * labels here are the general ones; a pattern words them for what it hosts (cloud/model.ts).
 */
export const HOSTING_COMPARE = [
  ["runs", "Who runs it"],
  ["patching", "Who patches the runtime"],
  ["data", "Where data is processed and kept"],
  ["network", "Private networking and outbound control"],
  ["identity", "The identity it runs as"],
  ["accepts", "What it accepts"],
  ["workload", "How it handles the work"],
  ["portability", "What moving off it involves"],
  ["effort", "What your team operates"],
  ["fits", "When the vendor says it fits"],
] as const;
export type HostingCompareKey = (typeof HOSTING_COMPARE)[number][0];

export interface HostingOption {
  /** camelCase, unique within the mapping; the key in the address and in data/org/products.yaml. */
  id: string;
  kind: HostingKind;
  /** The service as the vendor names it. */
  name: string;
  url?: string;
  asOf?: string;
  /** True for the one option the mapping's components and settings describe. */
  mapped?: boolean;
  /** One plain, sourced sentence per row; the same rows for every option. */
  compare: Record<HostingCompareKey, string>;
  /** The vendor pages the comparison rests on. */
  sources?: string[];
  /** Managed only, and only where another pattern draws it (an agent): that pattern, and the product catalogued on it. */
  pattern?: string;
  tool?: string;
  /** Managed only: what the service lets you do, as its documentation lists it. */
  offers?: { name: string; what: string; url?: string }[];
  /** A variant on the same pattern (not the mapped one): only what changes. */
  summary?: string;
  bindings?: CloudBinding[];
  /** Settings of the mapped option that do not apply, and library settings that take their place. */
  dropSettings?: string[];
  addSettings?: string[];
  /** Differences of the mapped option that no longer hold, by place; and this option's own. */
  dropDifferences?: string[];
  differences?: CloudDifference[];
  alsoNeeded?: CloudSupportingService[];
  quickstart?: GuidanceLink[];
}

/** A cloud platform: its security-relevant settings, and how each first-party architecture is built on it. */
export interface CloudPlatform {
  /** ^cloud[A-Z] — shares the namespace data/org/products.yaml keys products by. */
  id: string;
  name: string;
  short: string;
  /**
   * True for infrastructure the organisation owns and operates itself (its own data centre): no
   * provider runs any part, so a component is played by software the organisation deploys.
   */
  selfManaged?: boolean;
  /**
   * Hosted patterns this platform cannot be the place for, each with the reason and the pattern
   * to use there instead (a provider-run service has no equivalent in your own data centre).
   */
  notOffered?: { architecture: string; why: string; instead?: string }[];
  /** How the organisation's own boundary is titled on the drawing when this platform is chosen. */
  boundary?: string;
  settings: ProductSetting[];
  implementations: CloudImplementation[];
}

/** Retained pre-migration evidence is not a new coverage attestation. */
export interface MitigationMigrationEvidence {
  from: string[];
  reviewRequired: boolean;
  original: Record<string, unknown>[];
}

export interface ToolVendor {
  id: string;
  name: string;
  url?: string;
  /** Trust centre or security page. */
  trust?: string;
}

export interface Tool {
  id: string;
  vendor: string;
  /** Product family the entity belongs to, e.g. "Claude Code", "GitHub Copilot". */
  family: string;
  name: string;
  surfaceClasses: ToolSurfaceClass[];
  variants?: ToolVariant[];
  /**
   * The one reference architecture this product instantiates. It fixes the reference control
   * set — the drawing's pinned mitigations — so a product inherits "what controls this category
   * of tool needs" from the architecture and only records how the vendor implements each one.
   * A product with two runtimes (a local and a cloud form) is two entities.
   */
  architecture: string;
  /**
   * On a hosted pattern, the box or boxes this is used to build: a framework fills the agent, a
   * server fills the inference runtime. It is what separates "what you build it with" from "where
   * it runs" (a cloud or the organisation's own data centre): the two are chosen independently.
   */
  fills?: string[];
  /**
   * Set when the product is a service of one platform (a cloud's managed agent service): the
   * platform's id. Choosing that platform then implies this product, so it is not offered as a
   * separate choice, and its settings count towards the platform's coverage of the pattern.
   */
  platform?: string;
  status?: ToolStatus;
  /** When these facts were verified against the vendor's docs, e.g. "2026-09". */
  asOf: string;
  summary: Paragraph[];
  /** Plans, inference location, routing, what leaves the device — a definition list. */
  facts?: { label: string; value: string; url?: string }[];
  /** Admin-configuration detail, rendered on the Controls-guidance panel and the tool page. */
  items: GuidanceToolItem[];
  /** Tool-specific emphasis on risks pinned on the architecture. */
  riskNotes?: { risk: string; note: string }[];
  controls: ToolControl[];
  /** The security-relevant settings the product exposes, with the baseline value for each. */
  settings?: ProductSetting[];
  advisories?: { title: string; url: string; date?: string }[];
  sources: GuidanceLink[];
}

export interface GuidanceItem {
  title: string;
  /**
   * The mitigations this guidance directs the organisation to deploy. Each must be pinned on
   * the architecture — guidance cannot recommend something the drawing does not show, the same
   * discipline controlsForArchetype() applies to controls.
   */
  mitigations: string[];
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
  /**
   * CoSAI components and boundary actors this step touches. Optional: it feeds the Components
   * page's boundary actors only; the replay itself runs on `path`.
   */
  components?: string[];
  /**
   * The step on the incident's reference architecture: edges as "from->to" (the reverse of a
   * bidirectional edge is legal) and, for what happens inside a component, block ids. The
   * Incidents page replays the step by lighting exactly these, so a drawing change is a
   * build failure here rather than a silently wrong replay.
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

/** A control pinned on the incident's drawing that would have broken the chain. */
export interface IncidentBreak {
  control: string;
  /** One line: where in the chain it bites. */
  how: string;
}

export interface Incident {
  id: string;
  title: string;
  /** One or two sentences: what happened. The list row and the page header both lead with it. */
  subtitle: string;
  /** "YYYY-MM" when it last came to light (the latest event or disclosure); the list sorts on it, newest first. */
  date: string;
  dateRange: string;
  /** One of INCIDENT_CATEGORIES — the attack type the list files it under. */
  category: IncidentCategory;
  /** "target" = the AI system was attacked. "weapon" = an AI agent ran the attack. */
  perspective: "target" | "weapon";
  /** The reference architecture the incident is replayed on. */
  archetype: string;
  /** Set when the account rests on one report or on figures nobody has confirmed. */
  caveat?: string;
  summary: string[];
  /** The 3–5 controls, each pinned on the drawing, that would have broken the chain. */
  breaks: IncidentBreak[];
  risks: string[];
  /** CoSAI controls; kept for the older case studies, no longer shown or required. */
  controls?: string[];
  patterns?: string[];
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
  /** Authored specialisations of MITRE mitigations, also merged into `mitigations`. */
  specializations: Mitigation[];
  specializationsAttribution: string;
  mitigations: Mitigation[];
  /** Provenance statement for the mitigations overlay, carried for YAML round-tripping. */
  mitigationsAttribution: string;
  /** Retired local IDs resolve to all replacement functions, never just the first child. */
  mitigationAliases: Record<string, string[]>;
  mitigationGaps: { control: string; assessment: "unmapped" | "partial"; missing: string; related: string[] }[];
  archetypes: Archetype[];
  guidance: Guidance[];
  vendors: ToolVendor[];
  tools: Tool[];
  /** Provenance statement for the tool registry; each guidance document carries its own. */
  toolingAttribution: string;
  /** Catalogue control id -> its status, worked out from the organisation's controls mapped to it. */
  status: Record<string, ControlRollup>;
  /** The organisation's own controls, in the order it lists them (data/org/controls.yaml). */
  orgControls: OrgControl[];
  /** Tool or cloud id -> the organisation's adoption status and per-setting status, from data/org/products.yaml. */
  productStatus: Record<string, ProductStatusEntry>;
  /** The clouds and the on-premises data centre, and how each hosted pattern is built on them, from data/clouds/. */
  clouds: CloudPlatform[];
  enablement: Enablement;
}
