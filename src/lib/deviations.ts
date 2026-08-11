/**
 * Where this map's picture differs from CoSAI's data, in reader-facing words.
 *
 * The taxonomy is entirely CoSAI's. The composition is SAIF's, because that layout is what
 * makes the diagram readable. Everywhere the two disagree the choice is declared — in
 * `src/lib/bands.ts` and `src/lib/map-layout.ts` for the build to check, and here for the
 * Components tab to show.
 */
import { BAND_DEVIATIONS } from "./bands";
import { CONTAINMENT_EDGES, EDGE_DEVIATIONS, UNDRAWN_EDGES } from "./map-layout";
import { NAME_REASON } from "./naming";

export interface ComponentNote {
  kind: "band" | "direction" | "label";
  text: string;
}

const BAND_LABEL: Record<string, string> = {
  application: "Application",
  model: "Model",
  modelInfrastructure: "Model Infrastructure",
  dataInfrastructure: "Data Infrastructure",
};

/** Every note that applies to one component. */
export function notesFor(componentId: string): ComponentNote[] {
  const notes: ComponentNote[] = [];

  const band = BAND_DEVIATIONS[componentId];
  if (band) {
    notes.push({
      kind: "band",
      text: `Drawn in the ${BAND_LABEL[band.band]} band rather than the one CoSAI's category implies. ${band.reason}.`,
    });
  }

  const label = NAME_REASON[componentId];
  if (label) notes.push({ kind: "label", text: label });

  const flipped = EDGE_DEVIATIONS.filter((e) => e.from === componentId || e.to === componentId);
  if (flipped.length) {
    notes.push({ kind: "direction", text: flipped[0].reason });
  }

  for (const e of CONTAINMENT_EDGES) {
    if (e.from === componentId || e.to === componentId) {
      notes.push({ kind: "direction", text: `${e.reason} No arrow is drawn for a flow that nesting already shows.` });
    }
  }

  const undrawn = UNDRAWN_EDGES.filter((e) => e.from === componentId || e.to === componentId);
  for (const e of undrawn) {
    notes.push({
      kind: "direction",
      text: `The flow ${e.from === componentId ? "to" : "from"} the other end of this pair is not drawn on the map. ${e.reason}`,
    });
  }

  return notes;
}

/** The three loci of input and output handling, explained once. */
export const HANDLING_EXPLAINER = {
  title: "Why there are three Input and Output Handling components",
  body: [
    "CoSAI defines a component as an architectural shape, and says a second component is earned by a second locus — a distinct place where something is decided or enforced. Input and output handling appears three times because an AI system has three distinct trust boundaries, each enforced somewhere different.",
    "Application handling guards the boundary between the application and the model: what reaches the model, and what comes back. Agent handling guards the boundary between the outside world and the agent — SAIF called these perception and rendering. Orchestration handling guards the boundary between the agent and the tools, retrieval and memory it calls.",
    "CoSAI gives all three pairs the same titles and relies on the category to distinguish them. On a diagram that shows all six at once, this map names each pair after the boundary it guards instead.",
    "There is no fourth pair for the boundary between the user and the application: CoSAI folds that into the Application component itself. The User actor marks that boundary on the map rather than a component.",
  ],
};
