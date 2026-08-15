import raw from "@/data/generated/dataset.json";
import { bandFor, type BandId } from "./bands";
import { ACTORS, actorById } from "./map-layout";
import { DISPLAY_NAME } from "./naming";
import type {
  Archetype,
  Capability,
  Component,
  Control,
  Dataset,
  Persona,
  Risk,
  RiskOverlay,
} from "./types";

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
  frameworkEntries,
  authoredMappings,
  frameworkNotes,
  lifecycleStages,
  impactTypes,
  actorAccessLevels,
  overlays,
  incidents,
  surfaces,
  capabilities,
  archetypes,
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

const actorLabel = new Map(ACTORS.map((a) => [a.id, a.label]));

/** Boundary actors are not CoSAI components but can be named by risks and incidents. */
export const isActor = (id: string) => actorLabel.has(id);
export { actorById };

/**
 * Every incident step that names this component or actor. The boundary actors carry no CoSAI
 * risks or controls of their own, so the incidents are the only thing that gives them content.
 */
export function incidentStepsFor(targetId: string) {
  return incidents.flatMap((incident) =>
    incident.steps
      .filter((step) => step.components.includes(targetId))
      .map((step) => ({ incident, step })),
  );
}

/**
 * What a component is called throughout the UI. See src/lib/naming.ts — CoSAI's titles are
 * built for a table and collide on a diagram, so a small number are renamed, consistently
 * everywhere. CoSAI's own title is always shown on the Components tab.
 */
export const componentTitle = (id: string) =>
  actorLabel.get(id) ?? DISPLAY_NAME[id] ?? componentById.get(id)?.title ?? id;
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

export const capabilityById = index(capabilities);
export const surfaceById = index(surfaces);

export const controlsForCapability = (capabilityId: string): Control[] =>
  (capabilityById.get(capabilityId)?.controls ?? [])
    .map((id) => controlById.get(id))
    .filter((c): c is Control => Boolean(c));

export const risksForCapability = (capabilityId: string): Risk[] =>
  (capabilityById.get(capabilityId)?.risks ?? [])
    .map((id) => riskById.get(id))
    .filter((r): r is Risk => Boolean(r));

export const componentsForCapability = (capabilityId: string): Component[] =>
  (capabilityById.get(capabilityId)?.components ?? [])
    .map((id) => componentById.get(id))
    .filter((c): c is Component => Boolean(c));

/** Which stack layers this capability touches, via its anchored components. */
export const bandsForCapability = (capabilityId: string): Set<BandId> =>
  new Set(
    componentsForCapability(capabilityId).map((c) => bandFor(c.id, c.category, c.subcategory)),
  );

/** Capabilities in display order: grouped by control category, then as authored. */
export const capabilitiesInOrder: Capability[] = controlCategories.flatMap((cat) =>
  capabilities.filter((c) => c.category === cat.id),
);

// --- Reference architectures -----------------------------------------------------

export const archetypeById = index(archetypes);

/**
 * Stable short codes for the risk tags on the diagrams, F5's LLM01 treatment applied to CoSAI:
 * the same risk carries the same code on every architecture, in the catalogue's display order.
 */
const riskCodes = new Map(risksInOrder.map((r, i) => [r.id, `R${String(i + 1).padStart(2, "0")}`]));
export const riskCode = (id: string) => riskCodes.get(id) ?? id;

/** Architectures in display order: grouped by surface, then as authored. */
export const archetypesInOrder: Archetype[] = surfaces.flatMap((s) =>
  archetypes.filter((a) => a.surface === s.id),
);

export const archetypesForSurface = (surfaceId: string): Archetype[] =>
  archetypes.filter((a) => a.surface === surfaceId);

/** Every architecture that pins this risk to a block or a flow. */
export const archetypesForRisk = (riskId: string): Archetype[] =>
  archetypes.filter((a) => a.risks.includes(riskId));

export const archetypesForCapability = (capabilityId: string): Archetype[] =>
  archetypes.filter((a) => a.capabilities.includes(capabilityId));

/** Every architecture drawing a block or block internal anchored to this risk-map component. */
export const archetypesForComponent = (componentId: string): Archetype[] =>
  archetypes.filter((a) =>
    a.blocks.some(
      (b) =>
        b.cosaiComponent === componentId ||
        (b.items ?? []).some((i) => i.cosaiComponent === componentId),
    ),
  );

/** Every architecture whose capability set reaches this control, via capabilities.yaml. */
export const archetypesForControl = (controlId: string): Archetype[] =>
  archetypes.filter((a) =>
    a.capabilities.some((id) => capabilityById.get(id)?.controls.includes(controlId)),
  );

export const capabilitiesForArchetype = (archetypeId: string): Capability[] =>
  (archetypeById.get(archetypeId)?.capabilities ?? [])
    .map((id) => capabilityById.get(id))
    .filter((c): c is Capability => Boolean(c));

export const risksForArchetype = (archetypeId: string): Risk[] =>
  (archetypeById.get(archetypeId)?.risks ?? [])
    .map((id) => riskById.get(id))
    .filter((r): r is Risk => Boolean(r));

/**
 * The controls an archetype reaches, grouped by CoSAI control category. Derived through the
 * capability layer rather than authored, so the archetype cannot claim a control its own tooling
 * does not implement.
 */
export function controlsForArchetype(archetypeId: string): Control[] {
  const ids = new Set(capabilitiesForArchetype(archetypeId).flatMap((c) => c.controls));
  return controls.filter((c) => ids.has(c.id));
}
