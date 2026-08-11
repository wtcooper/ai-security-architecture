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
 * paths implied. Drawing all 32 CoSAI edges turns the picture into a wiring diagram, so a few
 * that duplicate a route already on the map are deliberately omitted. Every one of them stays
 * visible on the Components tab, which lists each component's full "receives from / sends to".
 *
 * ROUTING CONVENTION. The application's round trip through the model handlers is drawn as two
 * short arrows meeting the Agent group's edge, following SAIF — the group stands in for
 * whatever inside it is the real endpoint. Routing them to their exact component means
 * dragging a line around the whole agent, which is what made an earlier version unreadable.
 * The declared endpoints in the data are unchanged and still checked; only the drawn geometry
 * is abbreviated.
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
  /** Second line, for the group boxes that carry SAIF's transformation wording. */
  sublabel?: string;
  /** This component visually contains others, as SAIF drew Perception. */
  group?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Larger type for the anchor nodes. */
  emphasis?: boolean;
  /** Smaller type for the thin orchestration bars. */
  compact?: boolean;
}

/**
 * A grouping box. Not a CoSAI component — CoSAI has no single "Agent" element, only the
 * ten components that make one up — but it is the shape practitioners point at, so it is
 * drawn as a parent box and can be selected for an explanation of what it contains.
 */
export interface Group {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  band: BandId;
  hint: string;
  /** The CoSAI components this group is made of. */
  members: string[];
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
  {
    id: "agent",
    label: "Agent",
    x: 216,
    y: 112,
    w: 730,
    h: 274,
    band: "application",
    hint: "CoSAI has no single Agent component. An agent is this set of components working together — perception, a reasoning core, orchestration over tools and memory, and rendering.",
    members: [
      "componentAgentInputHandling",
      "componentAgentSystemInstruction",
      "componentAgentUserQuery",
      "componentReasoningCore",
      "componentOrchestrationInputHandling",
      "componentTools",
      "componentRAGContent",
      "componentMemory",
      "componentOrchestrationOutputHandling",
      "componentAgentOutputHandling",
    ],
  },
];

export const GROUP_IDS = GROUPS.map((g) => g.id);

export const BOXES: Box[] = [
  // --- Application core ---------------------------------------------------------------
  { id: "componentApplication", x: 240, y: 40, w: 640, h: 42, emphasis: true },

  // --- Agent · perception --------------------------------------------------------------
  // Perception is a parent box: CoSAI routes System Instructions, User Query, the
  // Application and the Model all into it, and SAIF drew it containing the first two.
  { id: "componentAgentInputHandling", sublabel: "Input Transformation", group: true, x: 246, y: 144, w: 180, h: 156 },
  { id: "componentAgentSystemInstruction", x: 258, y: 198, w: 156, h: 40 },
  { id: "componentAgentUserQuery", x: 258, y: 246, w: 156, h: 40 },

  // --- Agent · orchestration -----------------------------------------------------------
  { id: "componentOrchestrationInputHandling", x: 470, y: 144, w: 220, h: 24, compact: true },
  { id: "componentTools", x: 470, y: 176, w: 220, h: 32 },
  { id: "componentRAGContent", x: 470, y: 214, w: 220, h: 32 },
  { id: "componentMemory", x: 470, y: 252, w: 220, h: 32 },
  { id: "componentOrchestrationOutputHandling", x: 470, y: 292, w: 220, h: 24, compact: true },

  // --- Agent · rendering and core ------------------------------------------------------
  { id: "componentAgentOutputHandling", sublabel: "Output Transformation", group: true, x: 750, y: 144, w: 180, h: 156 },
  { id: "componentReasoningCore", x: 420, y: 330, w: 320, h: 46, emphasis: true },

  // --- Application core, model-facing --------------------------------------------------
  // CoSAI files these under the application, and their only edges are to and from the model:
  // they are application-owned guards on the model boundary, which is what the labels say.
  { id: "componentApplicationInputHandling", x: 240, y: 430, w: 260, h: 34 },
  { id: "componentApplicationOutputHandling", x: 620, y: 430, w: 260, h: 34 },

  // --- Model core -----------------------------------------------------------------------
  { id: "componentTheModel", x: 240, y: 504, w: 640, h: 54, emphasis: true },

  // --- Model infrastructure --------------------------------------------------------------
  { id: "componentModelStorage", x: 200, y: 614, w: 280, h: 40 },
  { id: "componentModelServing", x: 640, y: 614, w: 280, h: 40 },
  { id: "componentModelEvaluation", x: 176, y: 690, w: 200, h: 46 },
  { id: "componentModelTrainingTuning", x: 440, y: 690, w: 220, h: 46 },
  { id: "componentModelFrameworksAndCode", x: 720, y: 690, w: 220, h: 46 },

  // --- Data infrastructure ----------------------------------------------------------------
  { id: "componentDataStorage", x: 300, y: 830, w: 520, h: 38 },
  { id: "componentTrainingData", x: 300, y: 880, w: 520, h: 38 },
  { id: "componentDataFilteringAndProcessing", x: 270, y: 930, w: 580, h: 38 },
  { id: "componentDataSources", x: 200, y: 980, w: 720, h: 38, emphasis: true },
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
  { from: "componentApplication", to: "componentApplicationInputHandling", d: "M 370 388 L 370 428" },
  { from: "componentApplicationInputHandling", to: "componentTheModel", d: "M 370 464 L 370 502" },
  { from: "componentTheModel", to: "componentApplicationOutputHandling", d: "M 750 504 L 750 466" },
  { from: "componentApplicationOutputHandling", to: "componentApplication", d: "M 750 428 L 750 388" },

  // --- The application drives the agent, and the agent answers back ----------------------
  // Straight into Perception and straight out of Rendering, as SAIF drew it.
  { from: "componentApplication", to: "componentAgentInputHandling", d: "M 336 84 L 336 142" },
  { from: "componentAgentOutputHandling", to: "componentApplication", d: "M 840 142 L 840 84" },

  // --- Inside the agent -------------------------------------------------------------------
  { from: "componentAgentInputHandling", to: "componentReasoningCore", d: "M 336 302 L 336 353 L 418 353" },
  { from: "componentReasoningCore", to: "componentAgentOutputHandling", d: "M 742 353 L 840 353 L 840 302" },

  // --- The reasoning core drives orchestration and reads the result -----------------------
  { from: "componentReasoningCore", to: "componentOrchestrationInputHandling", d: "M 700 334 L 720 334 L 720 156 L 692 156" },
  { from: "componentOrchestrationOutputHandling", to: "componentReasoningCore", d: "M 470 304 L 444 304 L 444 344 L 418 344" },

  // --- Orchestration bus: in to each resource, each resource back out ----------------------
  { from: "componentOrchestrationInputHandling", to: "componentTools", d: "M 470 158 L 452 158 L 452 192 L 468 192" },
  { from: "componentOrchestrationInputHandling", to: "componentRAGContent", d: "M 470 158 L 452 158 L 452 230 L 468 230" },
  { from: "componentOrchestrationInputHandling", to: "componentMemory", d: "M 470 158 L 452 158 L 452 268 L 468 268" },
  { from: "componentTools", to: "componentOrchestrationOutputHandling", d: "M 690 192 L 708 192 L 708 304 L 692 304" },
  { from: "componentRAGContent", to: "componentOrchestrationOutputHandling", d: "M 690 230 L 708 230 L 708 304 L 692 304" },
  { from: "componentMemory", to: "componentOrchestrationOutputHandling", d: "M 690 268 L 708 268 L 708 304 L 692 304" },
];

/**
 * Edges shown by nesting rather than an arrow. Drawing an arrow from a box to the box it
 * already sits inside adds clutter and says nothing; SAIF drew these by containment too.
 */
export const CONTAINMENT_EDGES: { from: string; to: string; reason: string }[] = [
  {
    from: "componentAgentSystemInstruction",
    to: "componentAgentInputHandling",
    reason: "System Instructions is drawn inside Perception, which is the handler that consumes it.",
  },
  {
    from: "componentAgentUserQuery",
    to: "componentAgentInputHandling",
    reason: "User Query is drawn inside Perception, which is the handler that consumes it.",
  },
];

/**
 * CoSAI edges deliberately not drawn. Each still appears on the Components tab under the
 * component's "receives from / sends to". The build requires every undrawn edge to be here.
 */
export const UNDRAWN_EDGES: { from: string; to: string; reason: string }[] = [
  {
    from: "componentTheModel",
    to: "componentAgentInputHandling",
    reason:
      "The agent's traffic to and from the model is already drawn, through the model handlers. " +
      "A second line bypassing them says nothing new and crowds the boundary.",
  },
  {
    from: "componentAgentOutputHandling",
    to: "componentTheModel",
    reason:
      "Return leg of the same duplicate path; the drawn route out through Model Output Handling " +
      "already carries it.",
  },
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
    d: "M 948 258 L 1004 258",
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
  { text: "Orchestration", x: 580, y: 132, small: true },
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
