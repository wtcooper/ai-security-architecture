/**
 * Types for the compiled CoSAI-RM dataset.
 *
 * Derived from the upstream JSON Schemas at risk-map/schemas/ in
 * cosai-oasis/secure-ai-tooling. Prose fields arrive from YAML as string arrays
 * (one entry per paragraph); the build step normalises them to Paragraph[].
 */

export type Phase = "introduced" | "exposed" | "mitigated";
export const PHASES: Phase[] = ["introduced", "exposed", "mitigated"];

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
  lifecycleStages: Vocabulary[];
  impactTypes: Vocabulary[];
  actorAccessLevels: Vocabulary[];
  overlays: RiskOverlay[];
  incidents: Incident[];
}
