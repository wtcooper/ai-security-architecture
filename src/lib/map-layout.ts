/**
 * Hand-authored SVG geometry for the CoSAI Risk Map.
 *
 * ONE diagram, all 23 CoSAI components, laid out in the stacked style of the original SAIF
 * map — four bands, model creation flowing bottom-up into the model, model usage above it,
 * and the agent expanded into the perception / orchestration / rendering frame SAIF used
 * for its agent view.
 *
 * What the build enforces (see checkMapFidelity in scripts/build-data.ts):
 *
 *  1. COVERAGE      — every CoSAI component is drawn exactly once, and nothing else is.
 *  2. BANDS         — each box sits in the band `bandFor()` gives it, so any divergence from
 *                     CoSAI's own classification has to be declared in BAND_DEVIATIONS.
 *  3. EDGE HONESTY  — every arrow drawn is a real CoSAI edge, and every CoSAI edge is either
 *                     drawn or listed in UNDRAWN_EDGES with a reason. Nothing invented,
 *                     nothing silently dropped.
 *
 * On (3): SAIF's diagram is readable because it draws the primary flow and leaves secondary
 * paths implied. Drawing all 32 CoSAI edges turns the picture into a wiring diagram, so two
 * long-haul edges are deliberately omitted here. Both remain visible on the Components tab,
 * which lists every component's full "receives from / sends to" set.
 */
import type { BandId } from "./bands";

export type { BandId };

export interface Band {
  id: BandId;
  label: string;
  /** The CoSAI grouping this band renders, shown small beneath the label. */
  sublabel: string;
  y: number;
  height: number;
}

export interface Box {
  /** CoSAI component id. Every box on this map is a real component. */
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Larger type for the anchor nodes. */
  emphasis?: boolean;
  /** Smaller type for the thin orchestration bars. */
  compact?: boolean;
}

/** A dashed grouping outline. Not a component. */
export interface Group {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  band: BandId;
}

export interface Edge {
  from: string;
  to: string;
  d: string;
  /** Dashed: context flow rather than the primary pipeline. */
  soft?: boolean;
}

export interface Caption {
  text: string;
  x: number;
  y: number;
  /** Small grey column headings inside the agent group. */
  small?: boolean;
}

export const WIDTH = 1060;
/** Right edge of the coloured bands. Boundary actors sit outside this, to read as external. */
export const BAND_RIGHT = 980;
export const HEIGHT = 1070;
/** Headroom above the diagram for the User actor, which sits outside the system. */
export const TOP_MARGIN = 48;

export const BANDS: Band[] = [
  {
    id: "application",
    label: "Application",
    sublabel: "Application core · Agent",
    y: 26,
    height: 444,
  },
  { id: "model", label: "Model", sublabel: "Model core", y: 482, height: 98 },
  {
    id: "modelInfrastructure",
    label: "Model Infrastructure",
    sublabel: "Deployment · Training",
    y: 592,
    height: 208,
  },
  {
    id: "dataInfrastructure",
    label: "Data Infrastructure",
    sublabel: "Data components",
    y: 812,
    height: 228,
  },
];

export const RAILS = [
  { label: "Model usage", y: 26, height: 554 },
  { label: "Model creation", y: 592, height: 448 },
];

export const GROUPS: Group[] = [
  { id: "agent", label: "Agent", x: 220, y: 112, w: 720, h: 292, band: "application" },
];

export const BOXES: Box[] = [
  // --- Application core ---------------------------------------------------------------
  { id: "componentApplication", label: "Application", x: 240, y: 40, w: 640, h: 42, emphasis: true },

  // --- Agent · perception --------------------------------------------------------------
  { id: "componentAgentSystemInstruction", label: "System Instructions", x: 252, y: 148, w: 160, h: 36 },
  { id: "componentAgentUserQuery", label: "User Query", x: 252, y: 196, w: 160, h: 36 },
  { id: "componentAgentInputHandling", label: "Agent Input Handling", x: 252, y: 258, w: 160, h: 36 },

  // --- Agent · orchestration -----------------------------------------------------------
  { id: "componentOrchestrationInputHandling", label: "Orchestration Input", x: 470, y: 144, w: 240, h: 26, compact: true },
  { id: "componentTools", label: "Tools (Autonomous Actions)", x: 470, y: 178, w: 240, h: 32 },
  { id: "componentRAGContent", label: "Content / RAG", x: 470, y: 216, w: 240, h: 32 },
  { id: "componentMemory", label: "Memory", x: 470, y: 254, w: 240, h: 32 },
  { id: "componentOrchestrationOutputHandling", label: "Orchestration Output", x: 470, y: 294, w: 240, h: 26, compact: true },

  // --- Agent · rendering and core ------------------------------------------------------
  { id: "componentAgentOutputHandling", label: "Agent Output Handling", x: 760, y: 148, w: 160, h: 146 },
  { id: "componentReasoningCore", label: "Reasoning Core", x: 430, y: 340, w: 320, h: 44, emphasis: true },

  // --- Application core, model-facing --------------------------------------------------
  // CoSAI files these under the application, and their only edges are to and from the model:
  // they are application-owned guards on the model boundary, which is what the labels say.
  // Input Handling guards what reaches the model; Output Handling guards what comes back.
  { id: "componentApplicationInputHandling", label: "Model Input Handling", x: 240, y: 420, w: 260, h: 34 },
  { id: "componentApplicationOutputHandling", label: "Model Output Handling", x: 620, y: 420, w: 260, h: 34 },

  // --- Model core -----------------------------------------------------------------------
  { id: "componentTheModel", label: "MODEL", x: 240, y: 504, w: 640, h: 54, emphasis: true },

  // --- Model infrastructure --------------------------------------------------------------
  { id: "componentModelStorage", label: "Model Storage Infrastructure", x: 200, y: 614, w: 280, h: 40 },
  { id: "componentModelServing", label: "Model Serving Infrastructure", x: 640, y: 614, w: 280, h: 40 },
  { id: "componentModelEvaluation", label: "Evaluation", x: 176, y: 690, w: 200, h: 46 },
  { id: "componentModelTrainingTuning", label: "Training & Tuning", x: 440, y: 690, w: 220, h: 46 },
  { id: "componentModelFrameworksAndCode", label: "Model Frameworks & Code", x: 720, y: 690, w: 220, h: 46 },

  // --- Data infrastructure ----------------------------------------------------------------
  { id: "componentDataStorage", label: "Data Storage Infrastructure", x: 300, y: 830, w: 520, h: 38 },
  { id: "componentTrainingData", label: "Training Data", x: 300, y: 880, w: 520, h: 38 },
  { id: "componentDataFilteringAndProcessing", label: "Data Filtering & Processing", x: 270, y: 930, w: 580, h: 38 },
  { id: "componentDataSources", label: "Data Sources", x: 200, y: 980, w: 720, h: 38, emphasis: true },
];

/**
 * 30 of CoSAI's 32 edges. Routed short and local, in SAIF's idiom.
 */
export const EDGES: Edge[] = [
  // --- Model creation, bottom up -------------------------------------------------------
  { from: "componentDataSources", to: "componentDataFilteringAndProcessing", d: "M 560 980 L 560 970" },
  { from: "componentDataFilteringAndProcessing", to: "componentTrainingData", d: "M 560 930 L 560 920" },
  { from: "componentTrainingData", to: "componentDataStorage", d: "M 560 880 L 560 870" },
  { from: "componentDataStorage", to: "componentModelTrainingTuning", d: "M 560 830 L 560 738" },
  { from: "componentModelEvaluation", to: "componentModelTrainingTuning", d: "M 376 713 L 438 713" },
  { from: "componentModelFrameworksAndCode", to: "componentModelTrainingTuning", d: "M 720 713 L 662 713" },
  { from: "componentModelTrainingTuning", to: "componentTheModel", d: "M 560 690 L 560 560" },
  { from: "componentTheModel", to: "componentModelEvaluation", d: "M 280 558 L 280 578 L 150 578 L 150 713 L 174 713" },
  { from: "componentModelStorage", to: "componentTheModel", d: "M 340 614 L 340 560" },
  { from: "componentModelServing", to: "componentTheModel", d: "M 780 614 L 780 560" },

  // --- Application core round trip through the model ------------------------------------
  // Drawn in SAIF's direction; CoSAI declares these four the other way round. See
  // EDGE_DEVIATIONS for the reasoning.
  { from: "componentApplication", to: "componentApplicationInputHandling", d: "M 400 82 L 190 82 L 190 403 L 238 403" },
  { from: "componentApplicationInputHandling", to: "componentTheModel", d: "M 370 454 L 370 502" },
  { from: "componentTheModel", to: "componentApplicationOutputHandling", d: "M 750 504 L 750 456" },
  { from: "componentApplicationOutputHandling", to: "componentApplication", d: "M 880 437 L 962 437 L 962 61 L 882 61" },

  // --- Application drives the agent, and the agent answers -------------------------------
  { from: "componentApplication", to: "componentAgentInputHandling", d: "M 480 82 L 480 100 L 210 100 L 210 268 L 250 268", soft: true },
  { from: "componentAgentOutputHandling", to: "componentApplication", d: "M 840 148 L 840 100 L 700 100 L 700 84", soft: true },

  // --- The agent talks to the model, and the model back ----------------------------------
  { from: "componentTheModel", to: "componentAgentInputHandling", d: "M 300 504 L 300 476 L 196 476 L 196 284 L 250 284", soft: true },
  { from: "componentAgentOutputHandling", to: "componentTheModel", d: "M 920 221 L 966 221 L 966 468 L 820 468 L 820 502", soft: true },

  // --- Inside the agent -------------------------------------------------------------------
  { from: "componentAgentSystemInstruction", to: "componentAgentInputHandling", d: "M 412 166 L 428 166 L 428 270 L 414 270" },
  { from: "componentAgentUserQuery", to: "componentAgentInputHandling", d: "M 332 232 L 332 256" },
  { from: "componentAgentInputHandling", to: "componentReasoningCore", d: "M 332 294 L 332 362 L 428 362" },
  { from: "componentReasoningCore", to: "componentAgentOutputHandling", d: "M 750 362 L 840 362 L 840 296" },

  // --- The reasoning core drives orchestration and reads the result -----------------------
  { from: "componentReasoningCore", to: "componentOrchestrationInputHandling", d: "M 700 340 L 744 340 L 744 157 L 712 157" },
  { from: "componentOrchestrationOutputHandling", to: "componentReasoningCore", d: "M 470 307 L 421 307 L 421 352 L 428 352" },

  // --- Orchestration bus: in to each resource, each resource back out ----------------------
  { from: "componentOrchestrationInputHandling", to: "componentTools", d: "M 470 164 L 452 164 L 452 194 L 468 194" },
  { from: "componentOrchestrationInputHandling", to: "componentRAGContent", d: "M 470 164 L 452 164 L 452 232 L 468 232" },
  { from: "componentOrchestrationInputHandling", to: "componentMemory", d: "M 470 164 L 452 164 L 452 270 L 468 270" },
  { from: "componentTools", to: "componentOrchestrationOutputHandling", d: "M 710 194 L 728 194 L 728 307 L 712 307" },
  { from: "componentRAGContent", to: "componentOrchestrationOutputHandling", d: "M 710 232 L 728 232 L 728 307 L 712 307" },
  { from: "componentMemory", to: "componentOrchestrationOutputHandling", d: "M 710 270 L 728 270 L 728 307 L 712 307" },
];

/**
 * CoSAI edges deliberately not drawn. Each still appears on the Components tab under the
 * component's "receives from / sends to". The build requires every undrawn edge to be here.
 */
export const UNDRAWN_EDGES: { from: string; to: string; reason: string }[] = [
  {
    from: "componentTheModel",
    to: "componentOrchestrationInputHandling",
    reason:
      "The model reaching orchestration directly duplicates the Reasoning Core path already " +
      "drawn, and needs a long route across three bands to show it.",
  },
  {
    from: "componentOrchestrationOutputHandling",
    to: "componentTheModel",
    reason:
      "Return leg of the same duplicate path; the drawn Orchestration → Reasoning Core → " +
      "Model route already carries it.",
  },
];

/**
 * Edges drawn in the opposite direction to CoSAI's declaration. CoSAI's edge list and its
 * own prose disagree here, so one of them has to be picked; the build requires the choice
 * to be declared, and the Components tab surfaces it to readers.
 */
export const EDGE_DEVIATIONS: { from: string; to: string; reason: string }[] = [
  {
    from: "componentApplication",
    to: "componentApplicationInputHandling",
    reason:
      "CoSAI's edges route the application out through Output Handling and back in through " +
      "Input Handling — an application-centric reading. Its own prose is model-centric: " +
      "output handling \"protects against dangerous outputs from a model\". We draw the " +
      "prose reading, which is also SAIF's: input handling guards what reaches the model, " +
      "output handling guards what comes back.",
  },
  {
    from: "componentApplicationInputHandling",
    to: "componentTheModel",
    reason: "Same swap — input handling sits on the path into the model.",
  },
  {
    from: "componentTheModel",
    to: "componentApplicationOutputHandling",
    reason: "Same swap — output handling sits on the path out of the model.",
  },
  {
    from: "componentApplicationOutputHandling",
    to: "componentApplication",
    reason: "Same swap — the handled model output returns to the application.",
  },
];

/**
 * Boundary actors: the User and the external world. Neither is a CoSAI component — CoSAI
 * models the system, not what sits outside it — but SAIF drew them, and they carry real
 * meaning: they are where untrusted input and third-party services cross into the system.
 * Most of the 2026 incidents live on exactly these edges, so they are highlightable and
 * risks and incident steps may name them.
 */
export interface Actor {
  id: string;
  label: string;
  /** Highlight pill. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Label runs vertically, for the right-hand rail. */
  rotated?: boolean;
  /** Connector into the system boundary. */
  d: string;
  /** One-way flows get an arrowhead; boundaries that carry traffic both ways do not. */
  directed?: boolean;
  hint: string;
}

export const ACTORS: Actor[] = [
  {
    id: "actorUser",
    label: "User",
    x: 516,
    y: -40,
    w: 88,
    h: 24,
    d: "M 560 -16 L 560 38",
    hint: "The person the system acts for — and the untrusted side of the application boundary.",
  },
  {
    id: "actorExternalSources",
    label: "External Sources",
    x: 1006,
    y: 186,
    w: 26,
    h: 144,
    rotated: true,
    d: "M 942 258 L 1004 258",
    hint: "Third-party services, tool registries, package proxies and content the agent reaches out to at runtime.",
  },
  {
    id: "actorExternalData",
    label: "External Sources",
    x: 484,
    y: 1046,
    w: 152,
    h: 24,
    d: "M 560 1046 L 560 1022",
    directed: true,
    hint: "Data gathered from outside the organisation before it ever reaches the pipeline.",
  },
];

export const ACTOR_IDS = ACTORS.map((a) => a.id);

export const CAPTIONS: Caption[] = [
  { text: "Perception · input transformation", x: 332, y: 133, small: true },
  { text: "Orchestration", x: 590, y: 133, small: true },
  { text: "Rendering · output transformation", x: 840, y: 133, small: true },
];

export const BAND_TOKENS: Record<BandId, { fill: string; edge: string; rail: string }> = {
  application: {
    fill: "var(--band-app-fill)",
    edge: "var(--band-app-edge)",
    rail: "var(--band-app-rail)",
  },
  model: {
    fill: "var(--band-model-fill)",
    edge: "var(--band-model-edge)",
    rail: "var(--band-model-rail)",
  },
  modelInfrastructure: {
    fill: "var(--band-infra-fill)",
    edge: "var(--band-infra-edge)",
    rail: "var(--band-infra-rail)",
  },
  dataInfrastructure: {
    fill: "var(--band-data-fill)",
    edge: "var(--band-data-edge)",
    rail: "var(--band-data-rail)",
  },
};

export const boxById = new Map(BOXES.map((b) => [b.id, b]));
