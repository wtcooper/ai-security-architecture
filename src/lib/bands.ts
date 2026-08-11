/**
 * The map's four visual bands.
 *
 * The taxonomy on this map is entirely CoSAI's — every box is a CoSAI component, every
 * arrow a CoSAI edge. The *arrangement* follows Google's SAIF map, because that layout is
 * what makes the diagram readable. Where the two disagree, this file records the choice
 * explicitly rather than letting it drift.
 *
 * Default rule, applied to every component:
 *
 *   componentsApplication                                 -> application
 *   componentsModel                                       -> model
 *   componentsInfrastructure / componentsModelDeployment  -> modelInfrastructure
 *   componentsInfrastructure / componentsData             -> dataInfrastructure
 *
 * CoSAI folding data under Infrastructure is a genuine improvement on SAIF — data and model
 * infrastructure really are two halves of the same layer — so the band names say so.
 */
export type BandId = "application" | "model" | "modelInfrastructure" | "dataInfrastructure";

/**
 * The deliberate exceptions, and why. The build fails if a component is drawn outside its
 * default band without an entry here, so this list is the complete set of divergences.
 */
export const BAND_DEVIATIONS: Record<string, { band: BandId; reason: string }> = {
  // Orchestration is the harness around the model, not the model artefact. CoSAI files it
  // under componentsModel; SAIF drew it inside the Agent box, and so do we — the agent's
  // tools, memory and retrieval are plumbing the application owns and operates.
  componentOrchestrationInputHandling: {
    band: "application",
    reason: "Agent plumbing — drawn inside the Agent group, as in SAIF",
  },
  componentOrchestrationOutputHandling: {
    band: "application",
    reason: "Agent plumbing — drawn inside the Agent group, as in SAIF",
  },
  componentTools: {
    band: "application",
    reason: "Agent plumbing — drawn inside the Agent group, as in SAIF",
  },
  componentRAGContent: {
    band: "application",
    reason: "Agent plumbing — drawn inside the Agent group, as in SAIF",
  },
  componentMemory: {
    band: "application",
    reason: "Agent plumbing — drawn inside the Agent group, as in SAIF",
  },

  // Training, evaluation and framework code are model-creation processes. CoSAI files them
  // under componentsModel; SAIF drew them in the infrastructure layer beneath the model,
  // which keeps the creation pipeline reading bottom-up in one column.
  componentModelTrainingTuning: {
    band: "modelInfrastructure",
    reason: "Model-creation process — kept in the creation half, as in SAIF",
  },
  componentModelEvaluation: {
    band: "modelInfrastructure",
    reason: "Model-creation process — kept in the creation half, as in SAIF",
  },
  componentModelFrameworksAndCode: {
    band: "modelInfrastructure",
    reason: "Model-creation process — kept in the creation half, as in SAIF",
  },
};

/** The band CoSAI's own classification implies, before any deviation. */
export function cosaiBandFor(category: string, subcategory?: string): BandId {
  if (category === "componentsApplication") return "application";
  if (category === "componentsModel") return "model";
  if (category === "componentsInfrastructure") {
    return subcategory === "componentsData" ? "dataInfrastructure" : "modelInfrastructure";
  }
  throw new Error(`unknown component category: ${category}`);
}

/** The band we actually draw the component in. */
export function bandFor(id: string, category: string, subcategory?: string): BandId {
  return BAND_DEVIATIONS[id]?.band ?? cosaiBandFor(category, subcategory);
}
