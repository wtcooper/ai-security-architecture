import { capabilitySupportStatus } from "./org-capabilities";
import raw from "@/data/generated/dataset.json";
import { bandFor, type BandId } from "./bands";
import { ACTORS, actorById } from "./map-layout";
import { DISPLAY_NAME } from "./naming";
import type {
  Archetype,
  Mitigation,
  Component,
  Control,
  Dataset,
  Persona,
  Risk,
  RiskOverlay,
  Tool,
  OrgCapabilityStatus,
  DisplayStatus,
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
  technologyCategories,
  mitigations,
  mitigationAliases,
  mitigationGaps,
  archetypes,
  guidance,
  vendors,
  tools,
  toolingAttribution,
  orgToolPosture,
  orgCapabilities,
  meta,
} = dataset;

const index = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]));

export const componentById = index(components);
export const riskById = index(risks);
export const controlById = index(controls);
export const categoryById = index(technologyCategories);

/**
 * A capability is a MITRE mitigation or an authored specialisation of one. Categories map to
 * the MITRE parent, so a specialisation inherits its parent's technology dimension.
 */
export const specializationsOf = (id: string) => mitigations.filter((m) => m.parent === id);
export const categoriesForMitigations = (ids: string[]) => {
  const roots = new Set(ids.map((id) => mitigations.find((m) => m.id === id)?.parent ?? id));
  return technologyCategories.filter((c) => c.mitigationMappings.some((m) => roots.has(m.mitigation)));
};
export const mitigationsForCategory = (id: string) => {
  const roots = new Set(technologyCategories.find((c) => c.id === id)?.mitigationMappings.map((m) => m.mitigation) ?? []);
  return mitigations.filter((m) => roots.has(m.id) || (m.parent && roots.has(m.parent)));
};
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

/** Every incident whose case study names this risk. */
export const incidentsForRisk = (riskId: string) =>
  incidents.filter((inc) => inc.risks.includes(riskId));

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

export const mitigationById = index(mitigations);
export const surfaceById = index(surfaces);

export const controlsForMitigation = (mitigationId: string): Control[] =>
  (mitigationById.get(mitigationId)?.controls ?? [])
    .map((id) => controlById.get(id))
    .filter((c): c is Control => Boolean(c));

export const mitigationsForControl = (controlId: string): Mitigation[] =>
  mitigations.filter((m) => m.controls.includes(controlId));

export const risksForMitigation = (mitigationId: string): Risk[] =>
  (mitigationById.get(mitigationId)?.risks ?? [])
    .map((id) => riskById.get(id))
    .filter((r): r is Risk => Boolean(r));

export const componentsForMitigation = (mitigationId: string): Component[] =>
  (mitigationById.get(mitigationId)?.components ?? [])
    .map((id) => componentById.get(id))
    .filter((c): c is Component => Boolean(c));

/** Which stack layers this mitigation touches, via its anchored components. */
export const bandsForMitigation = (mitigationId: string): Set<BandId> =>
  new Set(
    componentsForMitigation(mitigationId).map((c) => bandFor(c.id, c.category, c.subcategory)),
  );

/** Mitigations in display order: grouped by control category, then as authored. */
export const mitigationsInOrder: Mitigation[] = controlCategories.flatMap((cat) =>
  mitigations.filter((c) => c.category === cat.id),
);

// --- Reference architectures -----------------------------------------------------

export const archetypeById = index(archetypes);

/**
 * Stable short codes for the risk tags on the diagrams, F5's LLM01 treatment applied to CoSAI:
 * the same risk carries the same code on every architecture, in the catalogue's display order.
 */
const riskCodes = new Map(risksInOrder.map((r, i) => [r.id, `R${String(i + 1).padStart(2, "0")}`]));
export const riskCode = (id: string) => riskCodes.get(id) ?? id;

/** Architectures in display order: grouped by surface, most common first within each. */
export const archetypesInOrder: Archetype[] = surfaces.flatMap((s) =>
  archetypes.filter((a) => a.surface === s.id).sort((a, b) => a.rank - b.rank),
);

export const archetypesForSurface = (surfaceId: string): Archetype[] =>
  archetypes.filter((a) => a.surface === surfaceId);

/** Every architecture that pins this risk to a block or a flow. */
export const archetypesForRisk = (riskId: string): Archetype[] =>
  archetypes.filter((a) => a.risks.includes(riskId));

export const archetypesForMitigation = (mitigationId: string): Archetype[] =>
  archetypes.filter((a) => a.mitigations.includes(mitigationId));

/** Every architecture drawing a block or block internal anchored to this risk-map component. */
export const archetypesForComponent = (componentId: string): Archetype[] =>
  archetypes.filter((a) =>
    a.blocks.some(
      (b) =>
        b.cosaiComponent === componentId ||
        (b.items ?? []).some((i) => i.cosaiComponent === componentId),
    ),
  );

/** Every architecture whose mitigation set reaches this control, via mitigations.yaml. */
export const archetypesForControl = (controlId: string): Archetype[] =>
  archetypes.filter((a) =>
    a.mitigations.some((id) => mitigationById.get(id)?.controls.includes(controlId)),
  );

export const mitigationsForArchetype = (archetypeId: string): Mitigation[] =>
  (archetypeById.get(archetypeId)?.mitigations ?? [])
    .map((id) => mitigationById.get(id))
    .filter((c): c is Mitigation => Boolean(c));

export const risksForArchetype = (archetypeId: string): Risk[] =>
  (archetypeById.get(archetypeId)?.risks ?? [])
    .map((id) => riskById.get(id))
    .filter((r): r is Risk => Boolean(r));

/**
 * The controls an archetype reaches, grouped by CoSAI control category. Derived through the
 * mitigation layer rather than authored, so the archetype cannot claim a control its own tooling
 * does not implement.
 */
export function controlsForArchetype(archetypeId: string): Control[] {
  const ids = new Set(mitigationsForArchetype(archetypeId).flatMap((c) => c.controls));
  return controls.filter((c) => ids.has(c.id));
}

// --- Controls guidance -----------------------------------------------------------

/** The controls-guidance document for an architecture, where one has been authored. */
export const guidanceByArchetype = new Map(guidance.map((g) => [g.archetype, g]));

// --- AI tooling registry ----------------------------------------------------------

export const vendorById = index(vendors);
export const toolById = index(tools);

/** Tools in display order: vendors as listed in vendors.yaml, then family, then name. */
export const toolsInOrder: Tool[] = vendors.flatMap((v) =>
  tools
    .filter((t) => t.vendor === v.id)
    .sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name)),
);

export const toolsForVendor = (vendorId: string): Tool[] =>
  toolsInOrder.filter((t) => t.vendor === vendorId);

/** Every product that instantiates this architecture — the variants of one category of tool. */
export const toolsForArchetype = (archetypeId: string): Tool[] =>
  toolsInOrder.filter((t) => t.architecture === archetypeId);

/** The architectures a vendor's products instantiate, in catalogue order. */
export const archetypesForVendor = (vendorId: string) =>
  archetypesInOrder.filter((a) => toolsInOrder.some((t) => t.vendor === vendorId && t.architecture === a.id));

/**
 * A tool's reference control set is its architecture's pinned mitigations, in pin order; the
 * tool's own record for each is joined on, absent where the vendor has not been assessed.
 */
export const controlsForTool = (toolId: string) => {
  const tool = toolById.get(toolId);
  if (!tool) return [];
  const own = new Map(tool.controls.map((c) => [c.mitigation, c]));
  return mitigationsForArchetype(tool.architecture).map((mitigation) => ({
    mitigation,
    control: own.get(mitigation.id),
  }));
};

// --- Organisation layer -----------------------------------------------------------

export const org = meta.org;
const postureByTool = new Map(orgToolPosture.map((p) => [p.tool, p]));

export const orgPostureFor = (toolId: string) => postureByTool.get(toolId);
/** Whether people in the organisation may install and use this product; not listed means no. */
export const orgToolAvailableFor = (toolId: string): boolean => postureByTool.get(toolId)?.available === true;
export const orgCapabilitiesFor = (capabilityId: string) => orgCapabilities.filter((c) => c.capability === capabilityId);

export interface OrgCapabilitySupport {
  status: DisplayStatus;
  technology?: string;
  note: string;
  evidence?: string;
  contributions: { id: string; title: string; capability: string; context: string; record?: OrgCapabilityStatus }[];
}

/**
 * Status is authored only against capabilities (a MITRE id or a specialisation): per surface for
 * the enterprise layer, per product for the tool layer. Everything else is a rollup. A parent
 * rolls up its specialisations' records too. With no surface, the rollup spans every surface
 * and every available product.
 */
function capabilitySupport(ids: string[], surfaceId?: string, toolId?: string): OrgCapabilitySupport {
  if (!ids.length) return { status: "unmapped", note: "No capability delivers this.", contributions: [] };
  const capabilityIds = new Set(ids.flatMap((id) => [id, ...specializationsOf(id).map((s) => s.id)]));
  const contributions = orgCapabilities.filter((c) => capabilityIds.has(c.capability)).flatMap((c) => {
    const base = { id: c.id, title: c.title, capability: c.capability };
    if (toolId) return [{ ...base, context: toolById.get(toolId)?.name ?? toolId, record: postureByTool.get(toolId)?.capabilities[c.id] }];
    const onSurface = (id: string) => !surfaceId || id === surfaceId;
    return [
      ...Object.entries(c.surfaces).filter(([id]) => onSurface(id)).map(([id, record]) => ({ ...base, context: `Enterprise · ${surfaceById.get(id)?.title ?? id}`, record })),
      ...orgToolPosture.filter((p) => p.available && onSurface(archetypeById.get(toolById.get(p.tool)!.architecture)?.surface ?? ""))
        .map((p) => ({ ...base, context: toolById.get(p.tool)!.name, record: p.capabilities[c.id] })),
    ];
  }).filter((c) => c.record);
  const status = capabilitySupportStatus(contributions.map((c) => c.record));
  return {
    status, contributions,
    technology: [...new Set(contributions.map((c) => c.title))].join(" · ") || undefined,
    note: contributions.length
      ? "Capability rollup; not a control-compliance or mitigation-effectiveness assessment. " + contributions.map((c) => [`${c.title} (${c.context})`, c.record?.note].filter(Boolean).join(": ")).join(" · ")
      : "No organization capability assessment recorded for this context.",
    evidence: contributions.map((c) => c.record?.evidence).filter(Boolean).join(" · ") || undefined,
  };
}

/** The Capabilities matrix reads the enterprise and product records on one surface. */
export const orgSurfacePostureFor = (capabilityId: string, surfaceId: string) => capabilitySupport([capabilityId], surfaceId);
export const orgSurfaceStatusFor = (capabilityId: string, surfaceId: string): DisplayStatus => orgSurfacePostureFor(capabilityId, surfaceId).status;

/** A product's own record on one capability; nothing from the enterprise layer leaks in. */
export const orgStatusFor = (toolId: string, capabilityId: string) => capabilitySupport([capabilityId], undefined, toolId);

/** Control status is a rollup of the capabilities that deliver it, never authored. */
export const orgControlPostureFor = (controlId: string, surfaceId?: string) =>
  capabilitySupport(mitigationsForControl(controlId).filter((m) => !m.parent).map((m) => m.id), surfaceId);
export const orgControlStatusFor = (controlId: string, surfaceId?: string): DisplayStatus => orgControlPostureFor(controlId, surfaceId).status;
