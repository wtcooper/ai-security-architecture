/**
 * What each component is called in this UI.
 *
 * CoSAI's titles are written for a table, where a category column disambiguates them and
 * length is cheap. On a diagram they collide — three components are titled "Input Handling"
 * and three "Output Handling" — and some carry a prefix that is redundant once you can see
 * where the box sits. The names below are used everywhere in the product, so a chip in a
 * panel always matches the box on the map. CoSAI's own title, id and category are always
 * shown on the Components tab.
 *
 * Only components whose display name differs from CoSAI's title appear here. Everything
 * else uses CoSAI's title unchanged.
 */
export const DISPLAY_NAME: Record<string, string> = {
  componentAgentInputHandling: "Perception",
  componentAgentOutputHandling: "Rendering",
  componentAgentUserQuery: "User Query",
  componentAgentSystemInstruction: "System Instructions",
  componentApplicationInputHandling: "Model Input Handling",
  componentApplicationOutputHandling: "Model Output Handling",
  componentOrchestrationInputHandling: "Orchestration Input",
  componentOrchestrationOutputHandling: "Orchestration Output",
  componentRAGContent: "Content / RAG",
};

/** Why each name differs, shown on the Components tab. */
export const NAME_REASON: Record<string, string> = {
  componentAgentInputHandling:
    "CoSAI titles this “Input Handling”. It is the agent's input transformation — the point where user instructions and contextual data are collected and made safe — so it takes SAIF's name for that boundary, Perception. System Instructions and User Query are drawn inside it, because CoSAI's edges route both of them into it.",
  componentAgentOutputHandling:
    "CoSAI titles this “Output Handling”. It is the agent's output transformation — formatting a response for display inside a trusted application — so it takes SAIF's name for that boundary, Rendering.",
  componentAgentUserQuery:
    "CoSAI titles this “Agent User Query”. It is simply the user's query; the “Agent” prefix is redundant once the box is drawn inside the agent.",
  componentAgentSystemInstruction:
    "CoSAI titles this “Agent System Instructions”, for the same reason. Drawn as “System Instructions”.",
  componentApplicationInputHandling:
    "CoSAI titles this “Input Handling” and files it under the application, but its only edges run to and from the model — it is an application-owned guard on the model boundary, and the name says which boundary it guards.",
  componentApplicationOutputHandling:
    "CoSAI titles this “Output Handling”, for the same reason. Its description is explicit that it protects against “dangerous outputs from a model”.",
  componentOrchestrationInputHandling:
    "CoSAI titles this “Input Handling”; the layer prefix separates it from the other two handlers of that name.",
  componentOrchestrationOutputHandling:
    "CoSAI titles this “Output Handling”; the layer prefix separates it from the other two handlers of that name.",
  componentRAGContent:
    "CoSAI titles this “Retrieval Augmented Generation & Content”, which does not fit the box. Shortened to SAIF's label.",
};
