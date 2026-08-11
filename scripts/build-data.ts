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
  AuthoredMappings,
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
  Vocabulary,
} from "../src/lib/types";
import { FULL_LIST_FRAMEWORKS, PHASES } from "../src/lib/types";
import { BAND_DEVIATIONS, bandFor, cosaiBandFor, type BandId } from "../src/lib/bands";
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

  const entriesDoc = await loadYaml<{
    frameworks: Record<string, { source: string; entries: Record<string, FrameworkEntryInfo> }>;
  }>(join(ROOT, "data", "frameworks", "entries.yaml"));

  const authoredDoc = await loadYaml<{
    frameworks: (Framework & { mappings: AuthoredMappings })[];
    notes: Record<string, FrameworkNote>;
  }>(join(ROOT, "data", "overlay", "frameworks-authored.yaml"));

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
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "dataset.json"), JSON.stringify(dataset) + "\n");

  const authored = overlays.filter((o) => o.source === "authored").length;
  console.log(
    `dataset.json: ${risks.length} risks (${overlays.length - authored} SAIF-seeded, ` +
      `${authored} authored), ${controls.length} controls, ${components.length} components, ` +
      `${incidents.length} incidents`,
  );
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
