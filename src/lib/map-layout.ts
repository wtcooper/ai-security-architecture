/**
 * Hand-authored SVG geometry for the CoSAI Risk Map.
 *
 * ONE diagram, showing all 23 CoSAI components. This is a drawing, not graph output —
 * coordinates are chosen so it reads like an architecture elevation, in the stacked style
 * of the original SAIF map.
 *
 * Two rules keep it honest, and `scripts/build-data.ts` enforces both:
 *
 *  1. BANDS FOLLOW COSAI. A box's visual band is derived from that component's own
 *     `category` in components.yaml — Application, Model, and Infrastructure split into its
 *     two subcategories (Model Deployment, Data) to preserve the four-band stack.
 *     This is where CoSAI diverges from SAIF: SAIF drew Evaluation / Training & Tuning /
 *     Frameworks in Infrastructure and Data Storage in Infrastructure, but CoSAI classes the
 *     first three as Model components and Data Storage as a Data component.
 *
 *  2. EVERY ARROW IS A COSAI EDGE, AND EVERY COSAI EDGE IS AN ARROW. The `EDGES` list below
 *     carries an explicit `from`/`to` pair alongside its routing. The build compares that set
 *     against the edge graph in components.yaml and fails on any addition or omission.
 */
import type { BandId } from "./bands";

export type { BandId };

export interface Band {
  id: BandId;
  label: string;
  /** CoSAI grouping this band renders, shown under the label. */
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
}

/** A dashed grouping outline — Agent, Orchestration. Not a component. */
export interface Group {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Where the rotated label sits: inside the left edge, or centred on the top edge. */
  labelPlacement: "left" | "top";
  band: BandId;
}

export interface Edge {
  from: string;
  to: string;
  d: string;
  /** Dashed: a long-haul flow routed through a side channel rather than the main pipeline. */
  soft?: boolean;
}

export interface Caption {
  text: string;
  x: number;
  y: number;
}

export const WIDTH = 1520;
export const HEIGHT = 1200;

export const BANDS: Band[] = [
  { id: "application", label: "Application", sublabel: "Application core · Agent", y: 24, height: 380 },
  { id: "model", label: "Model", sublabel: "Orchestration · Core · Training", y: 416, height: 400 },
  { id: "infrastructure", label: "Infrastructure", sublabel: "Model deployment", y: 828, height: 92 },
  { id: "data", label: "Data", sublabel: "Data components", y: 932, height: 230 },
];

export const RAILS = [
  { label: "Model usage", y: 24, height: 706 },
  { label: "Model creation", y: 742, height: 420 },
];

export const GROUPS: Group[] = [
  { id: "agent", label: "Agent", x: 240, y: 166, w: 1040, h: 224, labelPlacement: "left", band: "application" },
  { id: "orchestration", label: "Orchestration", x: 240, y: 432, w: 1040, h: 200, labelPlacement: "top", band: "model" },
];

export const BOXES: Box[] = [
  // --- Application / Application core -------------------------------------------------
  { id: "componentApplication", label: "Application", x: 560, y: 38, w: 400, h: 42, emphasis: true },
  { id: "componentApplicationOutputHandling", label: "Output Handling", x: 300, y: 100, w: 220, h: 40 },
  { id: "componentApplicationInputHandling", label: "Input Handling", x: 1000, y: 100, w: 220, h: 40 },

  // --- Application / Agent -------------------------------------------------------------
  { id: "componentAgentSystemInstruction", label: "Agent System Instructions", x: 300, y: 202, w: 200, h: 40 },
  { id: "componentAgentUserQuery", label: "Agent User Query", x: 520, y: 202, w: 200, h: 40 },
  { id: "componentAgentInputHandling", label: "Agent Input Handling", x: 360, y: 262, w: 240, h: 40 },
  { id: "componentAgentOutputHandling", label: "Agent Output Handling", x: 1020, y: 262, w: 220, h: 40 },
  { id: "componentReasoningCore", label: "Agent Reasoning Core", x: 420, y: 326, w: 280, h: 48, emphasis: true },

  // --- Model / Orchestration -----------------------------------------------------------
  { id: "componentOrchestrationInputHandling", label: "Input Handling", x: 300, y: 512, w: 200, h: 42 },
  { id: "componentTools", label: "External Tools and Services", x: 620, y: 468, w: 240, h: 38 },
  { id: "componentRAGContent", label: "Retrieval and Content", x: 620, y: 516, w: 240, h: 38 },
  { id: "componentMemory", label: "Model Memory", x: 620, y: 564, w: 240, h: 38 },
  { id: "componentOrchestrationOutputHandling", label: "Output Handling", x: 980, y: 512, w: 200, h: 42 },

  // --- Model / Model core --------------------------------------------------------------
  { id: "componentTheModel", label: "The Model", x: 560, y: 672, w: 400, h: 52, emphasis: true },

  // --- Model / Model training ----------------------------------------------------------
  { id: "componentModelEvaluation", label: "Model Evaluation", x: 300, y: 760, w: 220, h: 46 },
  { id: "componentModelTrainingTuning", label: "Training and Tuning", x: 650, y: 760, w: 220, h: 46 },
  { id: "componentModelFrameworksAndCode", label: "Model Frameworks and Code", x: 1000, y: 760, w: 240, h: 46 },

  // --- Infrastructure / Model deployment -----------------------------------------------
  { id: "componentModelStorage", label: "Model Storage", x: 460, y: 848, w: 260, h: 44 },
  { id: "componentModelServing", label: "Model Serving Infrastructure", x: 800, y: 848, w: 280, h: 44 },

  // --- Infrastructure / Data -----------------------------------------------------------
  { id: "componentDataStorage", label: "Data Storage Infrastructure", x: 560, y: 948, w: 400, h: 42 },
  { id: "componentTrainingData", label: "Training Data", x: 560, y: 1002, w: 400, h: 42 },
  { id: "componentDataFilteringAndProcessing", label: "Data Filtering and Processing", x: 520, y: 1056, w: 480, h: 42 },
  { id: "componentDataSources", label: "Data Sources", x: 460, y: 1110, w: 600, h: 42, emphasis: true },
];

/**
 * All 32 edges from components.yaml, each with hand-routed geometry.
 * Verified against the CoSAI edge graph at build time — see checkMapFidelity().
 */
export const EDGES: Edge[] = [
  // Data pipeline, bottom to top.
  { from: "componentDataSources", to: "componentDataFilteringAndProcessing", d: "M 760 1110 L 760 1100" },
  { from: "componentDataFilteringAndProcessing", to: "componentTrainingData", d: "M 760 1056 L 760 1046" },
  { from: "componentTrainingData", to: "componentDataStorage", d: "M 760 1002 L 760 992" },
  { from: "componentDataStorage", to: "componentModelTrainingTuning", d: "M 760 948 L 760 808" },

  // Training.
  { from: "componentModelEvaluation", to: "componentModelTrainingTuning", d: "M 520 783 L 648 783" },
  { from: "componentModelFrameworksAndCode", to: "componentModelTrainingTuning", d: "M 1000 783 L 872 783" },
  { from: "componentModelTrainingTuning", to: "componentTheModel", d: "M 760 760 L 760 726" },
  { from: "componentTheModel", to: "componentModelEvaluation", d: "M 600 724 L 600 742 L 410 742 L 410 758" },

  // Deployment infrastructure supports the model artefact.
  { from: "componentModelStorage", to: "componentTheModel", d: "M 590 848 L 590 820 L 580 820 L 580 726" },
  { from: "componentModelServing", to: "componentTheModel", d: "M 940 848 L 940 820 L 920 820 L 920 726" },

  // Orchestration loop.
  { from: "componentTheModel", to: "componentOrchestrationInputHandling", d: "M 620 672 L 620 620 L 400 620 L 400 556" },
  { from: "componentOrchestrationOutputHandling", to: "componentTheModel", d: "M 1080 554 L 1080 700 L 962 700" },
  { from: "componentOrchestrationInputHandling", to: "componentTools", d: "M 500 522 L 560 522 L 560 487 L 618 487" },
  { from: "componentOrchestrationInputHandling", to: "componentRAGContent", d: "M 500 533 L 618 533" },
  { from: "componentOrchestrationInputHandling", to: "componentMemory", d: "M 500 544 L 560 544 L 560 583 L 618 583" },
  { from: "componentTools", to: "componentOrchestrationOutputHandling", d: "M 860 487 L 920 487 L 920 522 L 978 522" },
  { from: "componentRAGContent", to: "componentOrchestrationOutputHandling", d: "M 860 533 L 978 533" },
  { from: "componentMemory", to: "componentOrchestrationOutputHandling", d: "M 860 583 L 920 583 L 920 544 L 978 544" },

  // The agent reaches down into orchestration and back.
  { from: "componentReasoningCore", to: "componentOrchestrationInputHandling", d: "M 480 374 L 480 410 L 340 410 L 340 510" },
  { from: "componentOrchestrationOutputHandling", to: "componentReasoningCore", d: "M 1120 512 L 1120 410 L 660 410 L 660 376" },

  // Inside the agent.
  { from: "componentAgentSystemInstruction", to: "componentAgentInputHandling", d: "M 400 242 L 400 260" },
  { from: "componentAgentUserQuery", to: "componentAgentInputHandling", d: "M 620 242 L 620 260" },
  { from: "componentAgentInputHandling", to: "componentReasoningCore", d: "M 480 302 L 480 324" },
  { from: "componentReasoningCore", to: "componentAgentOutputHandling", d: "M 700 350 L 800 350 L 800 304" },

  // Application drives the agent; the agent answers back.
  { from: "componentApplication", to: "componentAgentInputHandling", d: "M 620 80 L 270 80 L 270 282 L 358 282", soft: true },
  { from: "componentAgentOutputHandling", to: "componentApplication", d: "M 1240 272 L 1320 272 L 1320 50 L 962 50", soft: true },

  // The model talks to the agent directly, and the agent back to the model.
  { from: "componentTheModel", to: "componentAgentInputHandling", d: "M 560 700 L 180 700 L 180 292 L 358 292", soft: true },
  { from: "componentAgentOutputHandling", to: "componentTheModel", d: "M 1240 292 L 1360 292 L 1360 712 L 962 712", soft: true },

  // Application core round trip through the model.
  { from: "componentApplication", to: "componentApplicationOutputHandling", d: "M 600 80 L 410 80 L 410 98" },
  { from: "componentApplicationOutputHandling", to: "componentTheModel", d: "M 410 140 L 410 152 L 210 152 L 210 690 L 558 690", soft: true },
  { from: "componentTheModel", to: "componentApplicationInputHandling", d: "M 960 690 L 1420 690 L 1420 120 L 1222 120", soft: true },
  { from: "componentApplicationInputHandling", to: "componentApplication", d: "M 1110 100 L 1110 66 L 962 66" },
];

export const CAPTIONS: Caption[] = [
  { text: "User", x: 760, y: 16 },
  { text: "Perception · input transformation", x: 510, y: 188 },
  { text: "Rendering · output transformation", x: 1130, y: 188 },
  { text: "External sources", x: 760, y: 1186 },
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
  infrastructure: {
    fill: "var(--band-infra-fill)",
    edge: "var(--band-infra-edge)",
    rail: "var(--band-infra-rail)",
  },
  data: {
    fill: "var(--band-data-fill)",
    edge: "var(--band-data-edge)",
    rail: "var(--band-data-rail)",
  },
};

export const boxById = new Map(BOXES.map((b) => [b.id, b]));
