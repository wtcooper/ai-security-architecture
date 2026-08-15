/**
 * Compile the vendored CoSAI-RM YAML, the risk-component overlay and the incident case
 * studies into a single typed JSON dataset the app imports at build time.
 *
 * Every cross-reference is checked; a dangling id fails the build rather than rendering
 * an empty box in the UI.
 *
 *   npm run data
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import type {
  Archetype,
  ArchitectureVocabulary,
  AuthoredMappings,
  Capability,
  Component,
  ComponentCategory,
  Control,
  Dataset,
  Framework,
  FrameworkEntryInfo,
  FrameworkNote,
  Incident,
  Persona,
  Risk,
  RiskOverlay,
  Surface,
  Vocabulary,
} from "../src/lib/types";
import { CAPABILITY_STATUSES, FULL_LIST_FRAMEWORKS, PHASES } from "../src/lib/types";
import { BAND_DEVIATIONS, bandFor, cosaiBandFor, type BandId } from "../src/lib/bands";
import { layoutArchetype } from "../src/lib/architecture-layout";
import {
  ACTOR_IDS,
  BANDS,
  BOXES,
  CONTAINMENT_EDGES,
  EDGE_DEVIATIONS,
  EDGES,
  UNDRAWN_EDGES,
} from "../src/lib/map-layout";

const ROOT = process.cwd();
const COSAI_DIR = join(ROOT, "data", "cosai");
const OUT_DIR = join(ROOT, "src", "data", "generated");
const COSAI_REF = "afa43cd605674bcbaa5b1420f7b018ee23b4e8d6";

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

async function loadYaml<T>(path: string): Promise<T> {
  return parse(await readFile(path, "utf8")) as T;
}

const cosai = <T>(name: string) => loadYaml<T>(join(COSAI_DIR, `${name}.yaml`));

async function loadIncidents(): Promise<Incident[]> {
  const dir = join(ROOT, "data", "incidents");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".yaml")).sort();
  return Promise.all(files.map((f) => loadYaml<Incident>(join(dir, f))));
}

/** One file per archetype, so 28 of them stay reviewable one at a time. */
async function loadArchetypes(): Promise<AuthoredArchetype[]> {
  const dir = join(ROOT, "data", "reference", "archetypes");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".yaml")).sort();
  return Promise.all(files.map((f) => loadYaml<AuthoredArchetype>(join(dir, f))));
}

/** An archetype as authored: everything except the geometry, which the build computes. */
type AuthoredArchetype = Omit<Archetype, "layout">;

async function main() {
  const [
    componentsDoc,
    risksDoc,
    controlsDoc,
    personasDoc,
    frameworksDoc,
    lifecycleDoc,
    impactDoc,
    actorDoc,
    overlayDoc,
    incidents,
  ] = await Promise.all([
    cosai<{ categories: ComponentCategory[]; components: Component[] }>("components"),
    cosai<{ risks: Risk[] }>("risks"),
    cosai<{ categories: { id: string; title: string }[]; controls: Control[] }>("controls"),
    cosai<{ personas: Persona[] }>("personas"),
    cosai<{ frameworks: Framework[] }>("frameworks"),
    cosai<{ lifecycleStages: Vocabulary[] }>("lifecycle-stage"),
    cosai<{ impactTypes: Vocabulary[] }>("impact-type"),
    cosai<{ actorAccessLevels: Vocabulary[] }>("actor-access"),
    loadYaml<{ overlays: RawOverlay[] }>(join(ROOT, "data", "overlay", "risk-components.yaml")),
    loadIncidents(),
  ]);

  const [architectureVocabulary, authoredArchetypes] = await Promise.all([
    loadYaml<ArchitectureVocabulary>(join(ROOT, "data", "reference", "vocabulary.yaml")),
    loadArchetypes(),
  ]);

  const entriesDoc = await loadYaml<{
    frameworks: Record<string, { source: string; entries: Record<string, FrameworkEntryInfo> }>;
  }>(join(ROOT, "data", "frameworks", "entries.yaml"));

  const authoredDoc = await loadYaml<{
    frameworks: (Framework & { mappings: AuthoredMappings })[];
    notes: Record<string, FrameworkNote>;
  }>(join(ROOT, "data", "overlay", "frameworks-authored.yaml"));

  const capabilitiesDoc = await loadYaml<{
    attribution?: string;
    surfaces: Surface[];
    capabilities: Capability[];
  }>(join(ROOT, "data", "overlay", "capabilities.yaml"));

  const components = componentsDoc.components;
  const risks = risksDoc.risks;
  const controls = controlsDoc.controls;

  const componentIds = new Set(components.map((c) => c.id));
  // Risks and incidents may also point at a boundary actor (the User, external sources).
  // Actors are drawn on the map but are not CoSAI components.
  const mapTargets = new Set([...componentIds, ...ACTOR_IDS]);
  const riskIds = new Set(risks.map((r) => r.id));
  const controlIds = new Set(controls.map((c) => c.id));
  const personaIds = new Set(personasDoc.personas.map((p) => p.id));

  // --- CoSAI internal integrity ------------------------------------------------
  for (const c of components) {
    for (const edge of [...(c.edges?.to ?? []), ...(c.edges?.from ?? [])]) {
      if (!componentIds.has(edge)) fail(`component ${c.id}: unknown edge target ${edge}`);
    }
  }
  for (const r of risks) {
    for (const id of r.controls) {
      if (!controlIds.has(id)) fail(`risk ${r.id}: unknown control ${id}`);
    }
    for (const id of r.personas) {
      if (!personaIds.has(id)) fail(`risk ${r.id}: unknown persona ${id}`);
    }
  }
  for (const c of controls) {
    if (Array.isArray(c.components)) {
      for (const id of c.components) {
        if (!componentIds.has(id)) fail(`control ${c.id}: unknown component ${id}`);
      }
    }
    if (Array.isArray(c.risks)) {
      for (const id of c.risks) {
        if (!riskIds.has(id)) fail(`control ${c.id}: unknown risk ${id}`);
      }
    }
  }

  // --- Map fidelity --------------------------------------------------------------
  checkMapFidelity(components);

  // --- Authored frameworks and notes -------------------------------------------------
  // CoSAI's six, plus any framework authored here. Kept in one list so the UI treats them
  // alike, with `authored` marking which is which.
  const allFrameworks = markSuperseded([
    ...frameworksDoc.frameworks,
    ...authoredDoc.frameworks.map(stripMappings),
  ]);
  const authoredMappings = checkAuthoredFrameworks(authoredDoc, {
    riskIds,
    controlIds,
    frameworksDoc,
  });

  // --- Framework entry reference text ----------------------------------------------
  const frameworkEntries = checkFrameworkEntries(entriesDoc.frameworks, {
    frameworks: allFrameworks,
    risks,
    controls,
    personas: personasDoc.personas,
    authoredMappings,
  });

  // --- Capabilities ------------------------------------------------------------
  checkCapabilities(capabilitiesDoc, {
    controlCategories: controlsDoc.categories,
    controls,
    riskIds,
    componentIds,
  });

  // --- Reference architectures ---------------------------------------------------
  const archetypes = checkArchetypes(authoredArchetypes, architectureVocabulary, {
    surfaces: capabilitiesDoc.surfaces,
    capabilities: capabilitiesDoc.capabilities,
    riskIds,
    personaIds,
    mapTargets,
  });

  // --- Overlay -----------------------------------------------------------------
  const overlays = resolveOverlays(overlayDoc.overlays, { risks, controls, componentIds: mapTargets });
  await checkAgainstSaifSeed(overlays, risks);

  // --- Incidents ---------------------------------------------------------------
  for (const inc of incidents) {
    const where = `incident ${inc.id}`;
    for (const id of inc.risks) if (!riskIds.has(id)) fail(`${where}: unknown risk ${id}`);
    for (const id of inc.controls) if (!controlIds.has(id)) fail(`${where}: unknown control ${id}`);
    if (!inc.sources?.length) fail(`${where}: needs at least one source`);
    for (const step of inc.steps) {
      const at = `${where} step ${step.n}`;
      if (!PHASES.includes(step.phase)) fail(`${at}: bad phase ${step.phase}`);
      if (!step.components.length) fail(`${at}: no components`);
      for (const id of step.components) {
        if (!mapTargets.has(id)) fail(`${at}: unknown component or actor ${id}`);
      }
      for (const id of step.risks ?? []) {
        if (!riskIds.has(id)) fail(`${at}: unknown risk ${id}`);
        // The incident header lists the risks this case study is about; a step that names a
        // risk missing from that list makes the header an incomplete summary of its own steps.
        if (!inc.risks.includes(id)) fail(`${at}: risk ${id} is not in the incident's risk list`);
      }
    }
  }

  if (errors.length) {
    console.error(`\nData integrity check failed (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const dataset: Dataset = {
    meta: {
      cosaiRef: COSAI_REF,
      generatedAt: new Date().toISOString(),
      counts: {
        components: components.length,
        risks: risks.length,
        controls: controls.length,
        personas: personasDoc.personas.length,
        incidents: incidents.length,
        capabilities: capabilitiesDoc.capabilities.length,
        archetypes: archetypes.length,
      },
    },
    componentCategories: componentsDoc.categories,
    components,
    risks,
    riskCategories: RISK_CATEGORIES,
    controls,
    controlCategories: controlsDoc.categories,
    personas: personasDoc.personas,
    frameworks: allFrameworks,
    frameworkEntries,
    authoredMappings,
    frameworkNotes: authoredDoc.notes ?? {},
    lifecycleStages: lifecycleDoc.lifecycleStages,
    impactTypes: impactDoc.impactTypes,
    actorAccessLevels: actorDoc.actorAccessLevels,
    overlays,
    incidents,
    surfaces: capabilitiesDoc.surfaces,
    capabilities: capabilitiesDoc.capabilities,
    capabilitiesAttribution: capabilitiesDoc.attribution ?? "",
    architectureVocabulary,
    archetypes,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "dataset.json"), JSON.stringify(dataset) + "\n");

  const authored = overlays.filter((o) => o.source === "authored").length;
  console.log(
    `dataset.json: ${risks.length} risks (${overlays.length - authored} SAIF-seeded, ` +
      `${authored} authored), ${controls.length} controls, ${components.length} components, ` +
      `${incidents.length} incidents, ${capabilitiesDoc.capabilities.length} capabilities, ` +
      `${archetypes.length} archetypes`,
  );
}

/**
 * The technology-capability overlay: vendor-neutral tooling classes mapped onto CoSAI
 * controls, risks and components, with per-surface applicability. Same contract as the
 * other overlays — a dangling id fails the build, and the shipped dataset carries no
 * posture statuses (those belong to forks).
 */
function checkCapabilities(
  doc: { attribution?: string; surfaces: Surface[]; capabilities: Capability[] },
  ctx: {
    controlCategories: { id: string; title: string }[];
    controls: Control[];
    riskIds: Set<string>;
    componentIds: Set<string>;
  },
) {
  if (!doc.attribution?.trim()) fail("capabilities: attribution is required");

  const surfaceIds = doc.surfaces?.map((s) => s.id) ?? [];
  if (surfaceIds.length < 3) fail("capabilities: expected at least three surfaces");
  if (new Set(surfaceIds).size !== surfaceIds.length) fail("capabilities: duplicate surface ids");

  const categoryIds = new Set(ctx.controlCategories.map((c) => c.id));
  const controlById = new Map(ctx.controls.map((c) => [c.id, c]));
  const seen = new Set<string>();

  for (const cap of doc.capabilities ?? []) {
    const where = `capability ${cap.id}`;
    if (!/^capability[A-Z]/.test(cap.id)) fail(`${where}: id must match ^capability[A-Z]`);
    if (seen.has(cap.id)) fail(`${where}: duplicate id`);
    seen.add(cap.id);

    if (!cap.description?.length) fail(`${where}: needs a description`);
    if (!cap.examples?.length) fail(`${where}: needs example technology classes`);
    if (!cap.controls?.length) fail(`${where}: needs at least one control`);
    if (!cap.components?.length) fail(`${where}: needs at least one component`);

    if (!categoryIds.has(cap.category)) fail(`${where}: unknown category ${cap.category}`);
    for (const id of cap.controls ?? []) {
      if (!controlById.has(id)) fail(`${where}: unknown control ${id}`);
    }
    // The primary category places the capability in exactly one matrix row; requiring a
    // mapped control of that category keeps the placement honest rather than cosmetic.
    if (
      categoryIds.has(cap.category) &&
      !(cap.controls ?? []).some((id) => controlById.get(id)?.category === cap.category)
    ) {
      fail(`${where}: no mapped control belongs to its primary category ${cap.category}`);
    }
    for (const id of cap.risks ?? []) {
      if (!ctx.riskIds.has(id)) fail(`${where}: unknown risk ${id}`);
    }
    for (const id of cap.components ?? []) {
      if (!ctx.componentIds.has(id)) fail(`${where}: unknown component ${id}`);
    }

    // Every declared surface must get a conscious decision — mirrors the overlay's
    // per-phase completeness rule.
    const keys = Object.keys(cap.surfaces ?? {});
    for (const id of surfaceIds) {
      if (!keys.includes(id)) fail(`${where}: missing surface ${id}`);
    }
    for (const key of keys) {
      if (!surfaceIds.includes(key)) fail(`${where}: unknown surface ${key}`);
      const info = cap.surfaces[key];
      if (typeof info?.applies !== "boolean") fail(`${where}: surface ${key} needs applies`);
      if (info?.status && !CAPABILITY_STATUSES.includes(info.status)) {
        fail(`${where}: surface ${key} has invalid status ${info.status}`);
      }
    }
    if (!keys.some((k) => cap.surfaces[k]?.applies)) {
      fail(`${where}: must apply to at least one surface`);
    }
  }
}

/**
 * The reference architectures. Same contract as everything else here: a dangling id fails the
 * build. Three checks are specific to this dataset and worth naming, because each encodes an
 * editorial rule that would otherwise erode:
 *
 *   - Every edge crossing a zone boundary must declare `auth`. `mechanism: "none"` is a valid
 *     and deliberate answer. Nearly every agent CVE of the last year is a boundary crossing whose
 *     authentication was absent or assumed, and no published AI reference architecture labels its
 *     crossings; a diagram here that quietly omits one is worse than no diagram.
 *   - A `vendorOpaque` zone may contain only the interfaces a vendor actually publishes. You
 *     cannot see inside a vendor's service, so drawing its orchestrator or its memory store would
 *     be inventing them. The honest statement is the boundary and what crosses it.
 *   - A capability attached to a node must actually apply on that archetype's surface, per
 *     capabilities.yaml. This is what stops the two tabs from drifting into contradiction.
 */
/** The only node types that may appear inside a vendorOpaque zone: things a vendor publishes. */
const VENDOR_INTERFACE_TYPES = new Set([
  "inferenceEndpoint",
  "apiEndpoint",
  "mcpServer",
  "connector",
  "appUi",
]);

function checkArchetypes(
  authored: AuthoredArchetype[],
  vocab: ArchitectureVocabulary,
  ctx: {
    surfaces: Surface[];
    capabilities: Capability[];
    riskIds: Set<string>;
    personaIds: Set<string>;
    mapTargets: Set<string>;
  },
): Archetype[] {
  const groupIds = new Set(vocab.groups?.map((g) => g.id) ?? []);
  const controlKindById = new Map((vocab.controlKinds ?? []).map((k) => [k.id, k]));
  const capabilityIds = new Set(ctx.capabilities.map((c) => c.id));
  for (const kind of vocab.controlKinds ?? []) {
    // A control kind's capability is a vocabulary-level pointer to a class of control, not a
    // claim that any archetype deployed it — so it is checked for existence and deliberately not
    // against surface applicability. Node and archetype capability lists are deployment claims
    // and are checked that way below.
    if (!capabilityIds.has(kind.capability)) {
      fail(`vocabulary: control kind ${kind.id} names unknown capability ${kind.capability}`);
    }
    if (!kind.title?.trim()) fail(`vocabulary: control kind ${kind.id} needs a title`);
  }
  const zoneTypeById = new Map((vocab.zoneTypes ?? []).map((z) => [z.id, z]));
  const nodeTypeById = new Map((vocab.nodeTypes ?? []).map((t) => [t.id, t]));
  const surfaceIds = new Set(ctx.surfaces.map((s) => s.id));
  const capabilityById = new Map(ctx.capabilities.map((c) => [c.id, c]));

  for (const type of vocab.nodeTypes ?? []) {
    if (!groupIds.has(type.group)) fail(`vocabulary: node type ${type.id} has unknown group ${type.group}`);
    if (type.cosaiComponent && !ctx.mapTargets.has(type.cosaiComponent)) {
      fail(`vocabulary: node type ${type.id} anchors unknown component ${type.cosaiComponent}`);
    }
    // The governance plane deliberately carries no band; everything else must declare one, or a
    // node silently loses its link back to the risk map.
    if (type.group !== "governance" && type.group !== "actor" && !type.layer) {
      fail(`vocabulary: node type ${type.id} needs a layer (only the governance group may omit it)`);
    }
  }

  const seen = new Set<string>();
  const bySurface = new Map<string, number>();
  const kindUse = new Map<string, number>();
  let crossings = 0;

  const out = authored.map((arch) => {
    const where = `archetype ${arch.id}`;
    if (!/^arch[A-Z]/.test(arch.id ?? "")) fail(`${where}: id must match ^arch[A-Z]`);
    if (seen.has(arch.id)) fail(`${where}: duplicate id`);
    seen.add(arch.id);

    if (!surfaceIds.has(arch.surface)) fail(`${where}: unknown surface ${arch.surface}`);
    bySurface.set(arch.surface, (bySurface.get(arch.surface) ?? 0) + 1);

    if (!arch.summary?.length) fail(`${where}: needs a summary`);
    if (!arch.description?.length) fail(`${where}: needs a description`);
    if (!arch.sources?.length) fail(`${where}: needs at least one source`);
    if (!arch.risks?.length) fail(`${where}: needs at least one risk`);
    if (!arch.capabilities?.length) fail(`${where}: needs at least one capability`);
    if (!arch.zones?.length) fail(`${where}: needs at least one zone`);
    if (!arch.nodes?.length) fail(`${where}: needs at least one node`);

    for (const ex of arch.exemplars ?? []) {
      // Named products age fast. An undated one silently becomes a wrong claim.
      if (!ex.asOf?.trim()) fail(`${where}: exemplar "${ex.name}" needs an asOf date`);
      if (!ex.note?.trim()) fail(`${where}: exemplar "${ex.name}" needs a note`);
    }
    for (const d of arch.deviations ?? []) {
      if (!d.reason?.trim()) fail(`${where}: deviation "${d.subject}" has no reason`);
    }

    // --- Zones ---------------------------------------------------------------
    const zoneIds = new Set<string>();
    const zoneTypeOf = new Map<string, string>();
    const typeCount = new Map<string, number>();
    for (const zone of arch.zones ?? []) {
      typeCount.set(zone.type, (typeCount.get(zone.type) ?? 0) + 1);
    }
    for (const zone of arch.zones ?? []) {
      const at = `${where} zone ${zone.id}`;
      if (zoneIds.has(zone.id)) fail(`${at}: duplicate zone id`);
      zoneIds.add(zone.id);
      zoneTypeOf.set(zone.id, zone.type);
      const zoneType = zoneTypeById.get(zone.type);
      if (!zoneType) fail(`${at}: unknown zone type ${zone.type}`);

      // The label is the type's canonical title, plus a qualifier only where the archetype has
      // two zones of that type. Archetypes do not get to name their own zones — that is what
      // produced fourteen different names for one network tier and made them incomparable.
      if ((zone as { label?: string }).label) {
        fail(`${at}: zones do not carry a label; the type supplies it, add a qualifier if two share a type`);
      }
      const repeated = (typeCount.get(zone.type) ?? 0) > 1;
      if (repeated && !zone.qualifier?.trim()) {
        fail(`${at}: two zones share type ${zone.type} — one of them needs a qualifier`);
      }
      if (!repeated && zone.qualifier?.trim()) {
        fail(`${at}: qualifier is only for telling two zones of one type apart`);
      }
      zone.label = zone.qualifier
        ? `${zoneType?.title ?? zone.type} · ${zone.qualifier}`
        : zoneType?.title ?? zone.type;

      // Ownership is stated in CoSAI's persona vocabulary. An outsideWorld zone carries none —
      // CoSAI names no persona for an attacker — and every other zone must name at least one, so
      // no part of an architecture is left without a responsible party.
      if (!Array.isArray(zone.personas)) {
        fail(`${at}: needs a personas list (empty only for outsideWorld)`);
      } else {
        for (const id of zone.personas) {
          if (!ctx.personaIds.has(id)) fail(`${at}: unknown persona ${id}`);
        }
        if (zone.type === "outsideWorld" && zone.personas.length) {
          fail(`${at}: an outsideWorld zone is outside the system and owns no persona`);
        }
        if (zone.type !== "outsideWorld" && !zone.personas.length) {
          fail(`${at}: needs at least one CoSAI persona responsible for it`);
        }
      }
    }

    // --- Nodes ---------------------------------------------------------------
    const nodeIds = new Set<string>();
    const zoneOfNode = new Map<string, string>();
    const populated = new Set<string>();
    for (const node of arch.nodes ?? []) {
      const at = `${where} node ${node.id}`;
      if (nodeIds.has(node.id)) fail(`${at}: duplicate node id`);
      nodeIds.add(node.id);
      zoneOfNode.set(node.id, node.zone);
      populated.add(node.zone);

      const type = nodeTypeById.get(node.type);
      if (!type) fail(`${at}: unknown node type ${node.type}`);
      if (!zoneIds.has(node.zone)) fail(`${at}: unknown zone ${node.zone}`);
      if (!node.label?.trim()) fail(`${at}: needs a label`);

      if (node.cosaiComponent && !ctx.mapTargets.has(node.cosaiComponent)) {
        fail(`${at}: unknown component or actor ${node.cosaiComponent}`);
      }

      for (const id of node.risks ?? []) {
        if (!ctx.riskIds.has(id)) fail(`${at}: unknown risk ${id}`);
        // A risk pinned to a node but absent from the archetype's own list makes the header an
        // incomplete summary of its own diagram — the same rule the incidents already follow.
        if (!(arch.risks ?? []).includes(id)) fail(`${at}: risk ${id} is not in the archetype's risk list`);
      }
      for (const id of node.capabilities ?? []) {
        checkCapabilityOnSurface(id, at);
        if (!(arch.capabilities ?? []).includes(id)) {
          fail(`${at}: capability ${id} is not in the archetype's capability list`);
        }
      }
    }

    // A vendor-operated zone is a boundary with a published interface on it, not a container for
    // a guess at the vendor's design. Anything beyond the interface is invented.
    for (const zone of arch.zones ?? []) {
      if (!populated.has(zone.id)) {
        fail(`${where} zone ${zone.id}: has no nodes — remove it or put something in it`);
      }
      if (zone.type !== "vendorOpaque") continue;
      for (const node of arch.nodes ?? []) {
        if (node.zone !== zone.id) continue;
        // Either an interface type, or an explicit claim that the provider sells this as a
        // separately addressable service. The claim is the point: it forces the author to assert
        // that the component is documented rather than inferred.
        if (!VENDOR_INTERFACE_TYPES.has(node.type) && !node.published) {
          fail(
            `${where} node ${node.id}: type ${node.type} sits in a vendorOpaque zone — it must be ` +
              `an interface type (${[...VENDOR_INTERFACE_TYPES].join(", ")}) or set published: true`,
          );
        }
        if (node.published && !node.note?.trim()) {
          fail(`${where} node ${node.id}: published: true needs a note saying what is documented`);
        }
      }
    }
    for (const node of arch.nodes ?? []) {
      if (node.published && zoneTypeOf.get(node.zone) !== "vendorOpaque") {
        fail(`${where} node ${node.id}: published: true only means something in a vendorOpaque zone`);
      }
    }

    // --- Edges ---------------------------------------------------------------
    const edgeKeys = new Set<string>();
    for (const edge of arch.edges ?? []) {
      const key = `${edge.from} -> ${edge.to}`;
      const at = `${where} edge ${key}`;
      if (edgeKeys.has(key)) fail(`${at}: duplicate edge`);
      edgeKeys.add(key);
      if (edge.from === edge.to) fail(`${at}: edge loops back on itself`);
      if (!nodeIds.has(edge.from)) fail(`${at}: unknown source node ${edge.from}`);
      if (!nodeIds.has(edge.to)) fail(`${at}: unknown target node ${edge.to}`);

      const crosses =
        nodeIds.has(edge.from) &&
        nodeIds.has(edge.to) &&
        zoneOfNode.get(edge.from) !== zoneOfNode.get(edge.to);
      // These are target architectures, so there is no way to say a crossing is unsecured: every
      // boundary declares a control from the canonical list, and the kind is what ties the
      // boundary to a capability. Controls on same-zone edges are allowed but not required.
      if (crosses) crossings++;
      if (crosses && !edge.control?.kind) {
        fail(`${at}: crosses a zone boundary and must declare control.kind`);
      }
      if (edge.control?.kind) {
        const kind = controlKindById.get(edge.control.kind);
        if (!kind) fail(`${at}: unknown control kind ${edge.control.kind}`);
        else {
          edge.control.title = kind.title;
          edge.control.capability = kind.capability;
          kindUse.set(edge.control.kind, (kindUse.get(edge.control.kind) ?? 0) + 1);
        }
      }
      for (const id of edge.risks ?? []) {
        if (!ctx.riskIds.has(id)) fail(`${at}: unknown risk ${id}`);
        if (!(arch.risks ?? []).includes(id)) fail(`${at}: risk ${id} is not in the archetype's risk list`);
      }
      if (edge.kind && edge.kind !== "flow" && edge.kind !== "control") {
        fail(`${at}: kind must be "flow" or "control"`);
      }
    }

    // --- Archetype-level mappings -----------------------------------------------
    for (const id of arch.risks ?? []) {
      if (!ctx.riskIds.has(id)) fail(`${where}: unknown risk ${id}`);
    }
    for (const id of arch.capabilities ?? []) checkCapabilityOnSurface(id, where);
    for (const cc of arch.crossCutting ?? []) {
      if (!ctx.riskIds.has(cc.risk)) fail(`${where}: unknown cross-cutting risk ${cc.risk}`);
      if (!cc.note?.trim()) fail(`${where}: cross-cutting risk ${cc.risk} has no note`);
      if (!(arch.risks ?? []).includes(cc.risk)) {
        fail(`${where}: cross-cutting risk ${cc.risk} is not in the archetype's risk list`);
      }
    }

    return { ...arch, layout: layoutArchetype(arch, vocab) } satisfies Archetype;

    /** A capability that does not apply on this surface cannot be attached to this archetype. */
    function checkCapabilityOnSurface(id: string, at: string) {
      const capability = capabilityById.get(id);
      if (!capability) {
        fail(`${at}: unknown capability ${id}`);
        return;
      }
      if (capability.surfaces?.[arch.surface]?.applies === false) {
        fail(
          `${at}: capability ${id} does not apply on ${arch.surface} per capabilities.yaml — ` +
            "fix one of the two, they cannot both be right",
        );
      }
    }
  });

  for (const surface of ctx.surfaces) {
    if (!bySurface.get(surface.id)) fail(`archetypes: surface ${surface.id} has no archetype`);
  }

  const anchored = new Set(
    out.flatMap((a) =>
      a.nodes.map((n) => n.cosaiComponent ?? nodeTypeById.get(n.type)?.cosaiComponent).filter(Boolean),
    ),
  );
  const unanchored = (vocab.nodeTypes ?? []).filter((t) => !t.cosaiComponent).length;
  const unusedKinds = (vocab.controlKinds ?? []).filter((k) => !kindUse.has(k.id));
  console.log(
    `archetypes: ${out.length} across ${bySurface.size} surfaces, ` +
      `${crossings} crossings secured by ${kindUse.size}/${(vocab.controlKinds ?? []).length} ` +
      `control kinds${unusedKinds.length ? ` (unused: ${unusedKinds.map((k) => k.id).join(", ")})` : ""}, ` +
      `${anchored.size} risk-map components anchored, ` +
      `${unanchored}/${(vocab.nodeTypes ?? []).length} node types have no CoSAI equivalent`,
  );
  return out;
}

/**
 * CoSAI declares risk categories only in the risks JSON Schema enum, not in risks.yaml,
 * so the display titles live here.
 */
const RISK_CATEGORIES = [
  { id: "risksSupplyChainAndDevelopment", title: "Supply chain and development" },
  { id: "risksDeploymentAndInfrastructure", title: "Deployment and infrastructure" },
  { id: "risksRuntimeInputSecurity", title: "Runtime input security" },
  { id: "risksRuntimeDataSecurity", title: "Runtime data security" },
  { id: "risksRuntimeOutputSecurity", title: "Runtime output security" },
];

interface RawOverlay {
  risk: string;
  source: "saif" | "authored";
  introduced: string[];
  exposed: string[];
  mitigated: string[] | "derived";
}

function resolveOverlays(
  raw: RawOverlay[],
  ctx: { risks: Risk[]; controls: Control[]; componentIds: Set<string> },
): RiskOverlay[] {
  const byRisk = new Map(raw.map((o) => [o.risk, o]));
  const controlById = new Map(ctx.controls.map((c) => [c.id, c]));
  const allComponentIds = [...ctx.componentIds];

  for (const o of raw) {
    if (!ctx.risks.some((r) => r.id === o.risk)) fail(`overlay: unknown risk ${o.risk}`);
  }

  return ctx.risks.map((risk) => {
    const o = byRisk.get(risk.id);
    if (!o) {
      fail(`overlay: missing entry for risk ${risk.id}`);
      return blankOverlay(risk.id);
    }

    const mitigated = o.mitigated === "derived" ? deriveMitigated(risk) : o.mitigated;
    const mitigatedDerived = o.mitigated === "derived";

    const resolved: RiskOverlay = {
      risk: risk.id,
      source: o.source,
      introduced: o.introduced ?? [],
      exposed: o.exposed ?? [],
      mitigated,
      mitigatedDerived,
    };

    for (const phase of PHASES) {
      const ids = resolved[phase];
      if (!ids.length) fail(`overlay ${risk.id}: phase "${phase}" has no components`);
      for (const id of ids) {
        if (!ctx.componentIds.has(id)) {
          fail(`overlay ${risk.id}/${phase}: unknown component ${id}`);
        }
      }
    }
    return resolved;
  });

  function deriveMitigated(risk: Risk): string[] {
    const out = new Set<string>();
    for (const id of risk.controls) {
      const control = controlById.get(id);
      if (!control) continue;
      if (control.components === "all") allComponentIds.forEach((c) => out.add(c));
      else if (Array.isArray(control.components)) control.components.forEach((c) => out.add(c));
    }
    return [...out];
  }
}

/**
 * The map must be a faithful rendering of components.yaml, not an artist's impression.
 * Three things are checked, and any failure stops the build:
 *
 *   1. Coverage      — every CoSAI component appears on the map exactly once, and the map
 *                      draws nothing that isn't a CoSAI component.
 *   2. Band accuracy — each box sits in the band its own CoSAI category/subcategory implies.
 *   3. Edge fidelity — the drawn arrows are exactly the CoSAI edge graph: none invented,
 *                      none dropped, none reversed.
 */
function checkMapFidelity(components: Component[]) {
  const declared = new Set(components.map((c) => c.id));
  const drawn = BOXES.map((b) => b.id);
  const drawnSet = new Set(drawn);

  if (drawn.length !== drawnSet.size) fail("map: a component is drawn more than once");
  for (const id of declared) {
    if (!drawnSet.has(id)) fail(`map coverage: ${id} is in components.yaml but not on the map`);
  }
  for (const id of drawnSet) {
    if (!declared.has(id)) fail(`map coverage: ${id} is drawn but is not a CoSAI component`);
  }

  // Band placement must match bandFor(), so any divergence from CoSAI's own classification
  // has to be declared in BAND_DEVIATIONS with a reason.
  const bandOfBox = new Map<string, BandId>();
  for (const band of BANDS) {
    for (const box of BOXES) {
      if (box.y >= band.y && box.y < band.y + band.height) bandOfBox.set(box.id, band.id);
    }
  }
  let deviations = 0;
  for (const component of components) {
    const expected = bandFor(component.id, component.category, component.subcategory);
    const actual = bandOfBox.get(component.id);
    if (!actual) {
      fail(`map bands: ${component.id} does not sit inside any band`);
      continue;
    }
    if (actual !== expected) {
      fail(
        `map bands: ${component.id} is drawn in "${actual}" but resolves to "${expected}" ` +
          "— add a BAND_DEVIATIONS entry or move the box",
      );
      continue;
    }
    const cosai = cosaiBandFor(component.category, component.subcategory);
    if (cosai !== actual) {
      if (!BAND_DEVIATIONS[component.id]?.reason) {
        fail(`map bands: ${component.id} diverges from CoSAI but has no documented reason`);
      }
      deviations++;
    }
  }
  for (const id of Object.keys(BAND_DEVIATIONS)) {
    if (!declared.has(id)) fail(`map bands: BAND_DEVIATIONS names unknown component ${id}`);
  }

  // Every drawn arrow must be a real CoSAI edge, and every CoSAI edge must be drawn or
  // explicitly listed as undrawn with a reason.
  const cosaiEdges = new Set<string>();
  for (const c of components) {
    for (const to of c.edges?.to ?? []) cosaiEdges.add(`${c.id} -> ${to}`);
    for (const from of c.edges?.from ?? []) cosaiEdges.add(`${from} -> ${c.id}`);
  }
  const drawnEdges = new Set(EDGES.map((e) => `${e.from} -> ${e.to}`));
  const undrawn = new Set(UNDRAWN_EDGES.map((e) => `${e.from} -> ${e.to}`));
  const contained = new Set(CONTAINMENT_EDGES.map((e) => `${e.from} -> ${e.to}`));
  const flipped = new Set(EDGE_DEVIATIONS.map((e) => `${e.from} -> ${e.to}`));
  const reverse = (edge: string) => edge.split(" -> ").reverse().join(" -> ");

  if (drawnEdges.size !== EDGES.length) fail("map edges: the same edge is drawn twice");
  for (const edge of drawnEdges) {
    if (cosaiEdges.has(edge)) continue;
    // A drawn edge CoSAI does not declare is only allowed if it is a declared direction
    // flip of an edge CoSAI does declare.
    if (flipped.has(edge) && cosaiEdges.has(reverse(edge))) continue;
    fail(`map edges: the map draws "${edge}", which CoSAI does not declare`);
  }
  for (const e of EDGE_DEVIATIONS) {
    const edge = `${e.from} -> ${e.to}`;
    if (!drawnEdges.has(edge)) fail(`map edges: EDGE_DEVIATIONS names "${edge}", which is not drawn`);
    if (!cosaiEdges.has(reverse(edge))) {
      fail(`map edges: EDGE_DEVIATIONS claims "${edge}" flips a CoSAI edge, but CoSAI has no "${reverse(edge)}"`);
    }
    if (!e.reason?.trim()) fail(`map edges: direction deviation ${edge} has no reason`);
  }
  for (const edge of undrawn) {
    if (!cosaiEdges.has(edge)) fail(`map edges: UNDRAWN_EDGES names "${edge}", which CoSAI does not declare`);
    if (drawnEdges.has(edge)) fail(`map edges: "${edge}" is both drawn and listed as undrawn`);
  }
  const flippedSources = new Set([...flipped].map(reverse));
  for (const edge of cosaiEdges) {
    if (drawnEdges.has(edge) || undrawn.has(edge) || contained.has(edge) || flippedSources.has(edge)) continue;
    fail(`map edges: CoSAI declares "${edge}" but it is neither drawn nor documented as undrawn`);
  }
  for (const e of [...UNDRAWN_EDGES, ...CONTAINMENT_EDGES]) {
    const edge = `${e.from} -> ${e.to}`;
    if (!cosaiEdges.has(edge)) fail(`map edges: "${edge}" is documented but CoSAI does not declare it`);
    if (!e.reason?.trim()) fail(`map edges: ${edge} has no reason`);
  }

  console.log(
    `map fidelity: ${drawn.length}/${declared.size} components placed ` +
      `(${deviations} documented band deviations), ` +
      `${drawnEdges.size}/${cosaiEdges.size} edges drawn ` +
      `(${flipped.size} direction deviations), ${contained.size} shown by nesting, ` +
      `${undrawn.size} documented as undrawn`,
  );
}

/**
 * Every framework identifier CoSAI maps onto has to have reference text, or the Frameworks
 * tab shows a bare `AML.M0003` with nothing to read. Checked both ways: a mapped id with no
 * entry fails the build, and an entry nobody maps to is reported so the file does not
 * accumulate text for identifiers CoSAI has dropped.
 *
 * The exception is entries deliberately carried for frameworks whose full list we show —
 * OWASP's ten and STRIDE's six — where an unmapped entry is the point: it is a visible gap
 * in CoSAI's cross-reference.
 */
const FULL_LIST = new Set(FULL_LIST_FRAMEWORKS);

/**
 * Flag every framework that another one declares it supersedes. The superseded framework
 * keeps all its data — CoSAI's mappings still point at it and the crosswalk is derived from
 * it — but the UI stops offering it, so nobody reads an obsolete edition by accident.
 */
function markSuperseded(frameworks: Framework[]): Framework[] {
  const replaced = new Set(frameworks.map((f) => f.supersedes).filter(Boolean) as string[]);
  const ids = new Set(frameworks.map((f) => f.id));
  for (const id of replaced) {
    if (!ids.has(id)) fail(`framework supersedes unknown framework "${id}"`);
  }
  return frameworks.map((f) => (replaced.has(f.id) ? { ...f, superseded: true } : f));
}

/** Drop the mappings block, which the dataset carries separately from the framework record. */
function stripMappings(framework: Framework & { mappings?: unknown }): Framework {
  const { mappings, ...rest } = framework;
  void mappings;
  return rest;
}

/**
 * A framework authored here rather than published by CoSAI has to say so and say why, and
 * its mappings have to point at risks that exist. The separation is the whole point: the
 * Frameworks tab shows CoSAI's cross-reference, and anything that is not CoSAI's must be
 * distinguishable from it in the data, not only in the UI.
 */
function checkAuthoredFrameworks(
  doc: {
    frameworks: (Framework & { mappings: AuthoredMappings })[];
    notes?: Record<string, FrameworkNote>;
  },
  ctx: {
    riskIds: Set<string>;
    controlIds: Set<string>;
    frameworksDoc: { frameworks: Framework[] };
  },
): Record<string, AuthoredMappings> {
  const cosaiIds = new Set(ctx.frameworksDoc.frameworks.map((f) => f.id));
  const out: Record<string, AuthoredMappings> = {};

  for (const framework of doc.frameworks) {
    const where = `authored framework ${framework.id}`;
    if (cosaiIds.has(framework.id)) {
      fail(`${where}: CoSAI already declares this framework — it must not be authored here`);
    }
    if (!framework.authored) fail(`${where}: must set authored: true`);
    if (!framework.summary?.trim()) fail(`${where}: needs a one-line summary`);
    if (framework.summary && framework.summary.length > 110) {
      fail(`${where}: summary is ${framework.summary.length} chars — it has to fit on one line`);
    }
    if (!framework.attribution?.trim()) fail(`${where}: needs an attribution`);
    if (!framework.mappingRationale?.trim()) fail(`${where}: needs a mappingRationale`);

    const known: Record<keyof AuthoredMappings, Set<string>> = {
      risks: ctx.riskIds,
      controls: ctx.controlIds,
    };
    const mapped: AuthoredMappings = {};
    for (const kind of ["risks", "controls"] as (keyof AuthoredMappings)[]) {
      const byId = framework.mappings?.[kind];
      if (!byId) continue;
      for (const [id, entries] of Object.entries(byId)) {
        if (!known[kind].has(id)) fail(`${where}: unknown ${kind.slice(0, -1)} ${id}`);
        if (!entries?.length) fail(`${where}: ${id} maps to nothing`);
      }
      mapped[kind] = byId;
    }
    if (!mapped.risks && !mapped.controls) fail(`${where}: declares no mappings at all`);
    out[framework.id] = mapped;
  }

  const authoredIds = new Set(doc.frameworks.map((f) => f.id));
  for (const id of Object.keys(doc.notes ?? {})) {
    if (!cosaiIds.has(id) && !authoredIds.has(id)) fail(`framework note "${id}" is not a framework`);
  }
  return out;
}

function checkFrameworkEntries(
  declared: Record<string, { source: string; entries: Record<string, FrameworkEntryInfo> }>,
  ctx: {
    frameworks: Framework[];
    risks: Risk[];
    controls: Control[];
    personas: Persona[];
    authoredMappings: Record<string, AuthoredMappings>;
  },
): Record<string, Record<string, FrameworkEntryInfo>> {
  const out: Record<string, Record<string, FrameworkEntryInfo>> = {};
  const frameworkIds = new Set(ctx.frameworks.map((f) => f.id));

  for (const id of Object.keys(declared)) {
    if (!frameworkIds.has(id)) fail(`framework entries: "${id}" is not a CoSAI framework`);
  }

  let total = 0;
  for (const framework of ctx.frameworks) {
    const entries = declared[framework.id]?.entries ?? {};
    out[framework.id] = entries;

    const mapped = new Set<string>();
    for (const item of [...ctx.risks, ...ctx.controls, ...ctx.personas]) {
      for (const value of item.mappings?.[framework.id] ?? []) mapped.add(value.split("@")[0]);
    }
    for (const byId of Object.values(ctx.authoredMappings[framework.id] ?? {})) {
      for (const ids of Object.values(byId)) {
        for (const value of ids) mapped.add(value.split("@")[0]);
      }
    }

    for (const id of mapped) {
      const entry = entries[id];
      if (!entry) {
        fail(`framework entries: ${framework.id} "${id}" is mapped by CoSAI but has no entry`);
        continue;
      }
      if (!entry.label?.trim()) fail(`framework entries: ${framework.id} "${id}" has no label`);
      if (!entry.description?.trim())
        fail(`framework entries: ${framework.id} "${id}" has no description`);
    }
    for (const id of Object.keys(entries)) {
      if (!mapped.has(id) && !FULL_LIST.has(framework.id)) {
        fail(`framework entries: ${framework.id} "${id}" has an entry but CoSAI maps nothing to it`);
      }
    }
    total += Object.keys(entries).length;
  }

  console.log(`framework entries: ${total} identifiers carry reference text`);
  return out;
}

/**
 * SAIF box id -> CoSAI component id(s). Containers map to nothing; SAIF's single
 * "Agents" box maps to the four CoSAI components that replaced it.
 */
const BOX_TO_COMPONENTS: Record<string, string[]> = {
  box_DataSources: ["componentDataSources"],
  box_DataFiltering: ["componentDataFilteringAndProcessing"],
  box_TrainingData: ["componentTrainingData"],
  box_DataStorage: ["componentDataStorage"],
  box_ModelFrameworks: ["componentModelFrameworksAndCode"],
  box_Evaluation: ["componentModelEvaluation"],
  box_TrainingTuning: ["componentModelTrainingTuning"],
  box_ModelStorage: ["componentModelStorage"],
  box_ModelServing: ["componentModelServing"],
  box_Model: ["componentTheModel"],
  box_InputHandling: ["componentApplicationInputHandling"],
  box_OutputHandling: ["componentApplicationOutputHandling"],
  box_Application: ["componentApplication"],
  box_AgentPlugin: [
    "componentReasoningCore",
    "componentTools",
    "componentMemory",
    "componentRAGContent",
  ],
  box_Perception: ["componentAgentInputHandling"],
  box_UserQuery: ["componentAgentUserQuery"],
  box_SystemInstructions: ["componentAgentSystemInstruction"],
  box_Rendering: ["componentAgentOutputHandling"],
  box_ReasoningCore: ["componentReasoningCore"],
  box_Tools: ["componentTools"],
  box_ContentRAG: ["componentRAGContent"],
  box_Memory: ["componentMemory"],
  box_Agent: [],
  box_Orchestration: [],
};

/**
 * The 15 risks inherited from SAIF must still highlight what SAIF highlighted. Anything
 * the overlay adds on top (CoSAI components that did not exist in SAIF) is allowed; losing
 * one of SAIF's is not.
 */
async function checkAgainstSaifSeed(overlays: RiskOverlay[], risks: Risk[]) {
  const seedPath = join(ROOT, "data", "overlay", "saif-tour-seed.json");
  const seed = JSON.parse(await readFile(seedPath, "utf8")) as {
    steps: { risk: string; phase: string; boxes: string[] }[];
  };
  const byTitle = new Map(risks.map((r) => [r.title, r.id]));
  const byRisk = new Map(overlays.map((o) => [o.risk, o]));
  let checked = 0;

  for (const step of seed.steps) {
    const riskId = byTitle.get(step.risk);
    if (!riskId) {
      fail(`saif seed: no CoSAI risk titled "${step.risk}"`);
      continue;
    }
    const overlay = byRisk.get(riskId);
    if (!overlay) continue;

    const expected = new Set(step.boxes.flatMap((b) => BOX_TO_COMPONENTS[b] ?? []));
    const actual = new Set(overlay[step.phase as keyof RiskOverlay] as string[]);
    for (const id of expected) {
      if (!actual.has(id)) {
        fail(`saif seed drift: ${riskId}/${step.phase} is missing ${id}`);
      }
    }
    checked++;
  }
  console.log(`saif cross-check: ${checked} steps verified against the original SAIF map`);
}

function blankOverlay(risk: string): RiskOverlay {
  return {
    risk,
    source: "authored",
    introduced: [],
    exposed: [],
    mitigated: [],
    mitigatedDerived: false,
  };
}

main();
