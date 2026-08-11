import raw from "@/data/generated/dataset.json";
import type { Component, Control, Dataset, Persona, Risk, RiskOverlay } from "./types";

export const dataset = raw as unknown as Dataset;

export const {
  components,
  componentCategories,
  risks,
  riskCategories,
  controls,
  controlCategories,
  personas,
  frameworks,
  lifecycleStages,
  impactTypes,
  actorAccessLevels,
  overlays,
  incidents,
  meta,
} = dataset;

const index = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]));

export const componentById = index(components);
export const riskById = index(risks);
export const controlById = index(controls);
export const personaById = index(personas);
export const frameworkById = index(frameworks);
export const overlayByRisk = new Map(overlays.map((o) => [o.risk, o]));
export const incidentById = index(incidents);

const vocab = new Map(
  [...lifecycleStages, ...impactTypes, ...actorAccessLevels].map((v) => [v.id, v.title]),
);
export const vocabTitle = (id: string) => vocab.get(id) ?? id;

/**
 * CoSAI reuses "Input Handling" and "Output Handling" across the application, orchestration
 * and agent layers. On its own that title is ambiguous, so qualify the ones that collide.
 */
const QUALIFIER: Record<string, string> = {
  componentApplicationInputHandling: "Application",
  componentApplicationOutputHandling: "Application",
  componentOrchestrationInputHandling: "Orchestration",
  componentOrchestrationOutputHandling: "Orchestration",
  componentAgentInputHandling: "Agent",
  componentAgentOutputHandling: "Agent",
};

const duplicateTitles = new Set(
  components.map((c) => c.title).filter((t, i, all) => all.indexOf(t) !== i),
);

export const componentTitle = (id: string) => {
  const component = componentById.get(id);
  if (!component) return id;
  return duplicateTitles.has(component.title) && QUALIFIER[id]
    ? `${QUALIFIER[id]} ${component.title}`
    : component.title;
};
export const riskTitle = (id: string) => riskById.get(id)?.title ?? id;
export const controlTitle = (id: string) => controlById.get(id)?.title ?? id;
export const personaTitle = (id: string) => personaById.get(id)?.title ?? id;

/** Risks in a stable display order: grouped by category, then as authored upstream. */
export const risksInOrder: Risk[] = riskCategories.flatMap((cat) =>
  risks.filter((r) => r.category === cat.id),
);

export const controlsForRisk = (riskId: string): Control[] =>
  (riskById.get(riskId)?.controls ?? [])
    .map((id) => controlById.get(id))
    .filter((c): c is Control => Boolean(c));

export const risksForControl = (controlId: string): Risk[] => {
  const control = controlById.get(controlId);
  if (!control) return [];
  if (control.risks === "all") return risks;
  return control.risks.map((id) => riskById.get(id)).filter((r): r is Risk => Boolean(r));
};

export const componentsForControl = (controlId: string): Component[] => {
  const control = controlById.get(controlId);
  if (!control) return [];
  if (control.components === "all") return components;
  if (control.components === "none") return [];
  return control.components
    .map((id) => componentById.get(id))
    .filter((c): c is Component => Boolean(c));
};

/** Every risk whose overlay touches this component, with the phases in which it does. */
export function risksForComponent(componentId: string) {
  const out: { risk: Risk; phases: string[] }[] = [];
  for (const overlay of overlays) {
    const phases = (["introduced", "exposed", "mitigated"] as const).filter((p) =>
      overlay[p].includes(componentId),
    );
    if (!phases.length) continue;
    const risk = riskById.get(overlay.risk);
    if (risk) out.push({ risk, phases });
  }
  return out;
}

export const controlsForComponent = (componentId: string): Control[] =>
  controls.filter(
    (c) => c.components === "all" || (Array.isArray(c.components) && c.components.includes(componentId)),
  );

/** CoSAI keeps the two legacy SAIF personas in the file, flagged as superseded. */
export const activePersonas: Persona[] = personas.filter((p) => !p.deprecated);
export const legacyPersonas: Persona[] = personas.filter((p) => Boolean(p.deprecated));

export const risksForPersona = (personaId: string): Risk[] =>
  risks.filter((r) => r.personas.includes(personaId));

export const controlsForPersona = (personaId: string): Control[] =>
  controls.filter((c) => c.personas.includes(personaId));

export const personasForRisk = (riskId: string): Persona[] =>
  (riskById.get(riskId)?.personas ?? [])
    .map((id) => personaById.get(id))
    .filter((p): p is Persona => Boolean(p));

export const overlayFor = (riskId: string): RiskOverlay | undefined => overlayByRisk.get(riskId);
