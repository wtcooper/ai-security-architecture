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
  Rect,
  Risk,
  RiskOverlay,
  Surface,
  Vocabulary,
} from "../src/lib/types";
import { CAPABILITY_STATUSES, FULL_LIST_FRAMEWORKS, PHASES } from "../src/lib/types";
import { BAND_DEVIATIONS, bandFor, cosaiBandFor, type BandId } from "../src/lib/bands";
import { chipSpots, ICON_NAMES, layoutArchetype, tagSpots } from "../src/lib/flow-layout";
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

/** One file per architecture, so each stays reviewable on its own. */
async function loadArchetypes(): Promise<AuthoredArchetype[]> {
  const dir = join(ROOT, "data", "reference", "architectures");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".yaml")).sort();
  return Promise.all(
    files.map(async (f) => {
      try {
        return await loadYaml<AuthoredArchetype>(join(dir, f));
      } catch (e) {
        throw new Error(`architectures/${f}: ${(e as Error).message}`);
      }
    }),
  );
}

/**
 * An architecture as authored: the build computes the geometry and derives the risk and
 * capability lists from the pins.
 */
type AuthoredArchetype = Omit<Archetype, "layout" | "risks" | "capabilities">;

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

  const authoredArchetypes = await loadArchetypes();

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
  const archetypes = checkArchetypes(authoredArchetypes, {
    surfaces: capabilitiesDoc.surfaces,
    capabilities: capabilitiesDoc.capabilities,
    riskIds,
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
 * The flow-style reference architectures. Same contract as everything else here: a dangling id
 * fails the build. The rules specific to this dataset encode its editorial discipline:
 *
 *   - Every risk and capability on the page is pinned to a specific block or flow. The
 *     architecture-level lists are derived from the pins, so the side rail can never claim
 *     something the drawing does not show.
 *   - A pinned capability must apply on the architecture's surface per capabilities.yaml, which
 *     is what stops this tab and the Capabilities tab drifting into contradiction.
 *   - Scenario steps walk real edges. A step may follow a bidirectional edge in reverse; a
 *     one-way edge walked backwards is a wrong diagram, not a wrong scenario.
 */
const BLOCK_KINDS = new Set(["actor", "service", "provider", "external", "governance"]);
const PATH_CLASSES = new Set(["primary", "secondary", "external", "governance"]);
const ICONS = new Set<string>(ICON_NAMES);

function checkArchetypes(
  authored: AuthoredArchetype[],
  ctx: {
    surfaces: Surface[];
    capabilities: Capability[];
    riskIds: Set<string>;
    mapTargets: Set<string>;
  },
): Archetype[] {
  const surfaceIds = new Set(ctx.surfaces.map((s) => s.id));
  const capabilityById = new Map(ctx.capabilities.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const bySurface = new Map<string, number>();

  const out = authored.map((arch) => {
    const where = `architecture ${arch.id}`;
    if (!/^arch[A-Z]/.test(arch.id ?? "")) fail(`${where}: id must match ^arch[A-Z]`);
    if (seen.has(arch.id)) fail(`${where}: duplicate id`);
    seen.add(arch.id);
    if (!surfaceIds.has(arch.surface)) fail(`${where}: unknown surface ${arch.surface}`);
    bySurface.set(arch.surface, (bySurface.get(arch.surface) ?? 0) + 1);

    if (!arch.summary?.length) fail(`${where}: needs a summary`);
    if (!arch.description?.length) fail(`${where}: needs a description`);
    if (!arch.sources?.length) fail(`${where}: needs at least one source`);
    if (!arch.blocks?.length) fail(`${where}: needs blocks`);
    if (!arch.edges?.length) fail(`${where}: needs edges`);
    for (const ex of arch.exemplars ?? []) {
      // Named products age fast. An undated one silently becomes a wrong claim.
      if (!ex.asOf?.trim()) fail(`${where}: exemplar "${ex.name}" needs an asOf date`);
      if (!ex.note?.trim()) fail(`${where}: exemplar "${ex.name}" needs a note`);
    }
    for (const d of arch.deviations ?? []) {
      if (!d.reason?.trim()) fail(`${where}: deviation "${d.subject}" has no reason`);
    }

    // --- Blocks --------------------------------------------------------------
    const blockIds = new Set<string>();
    for (const block of arch.blocks ?? []) {
      const at = `${where} block ${block.id}`;
      if (blockIds.has(block.id)) fail(`${at}: duplicate block id`);
      blockIds.add(block.id);
      if (!BLOCK_KINDS.has(block.kind)) fail(`${at}: unknown kind ${block.kind}`);
      if (!block.title?.trim()) fail(`${at}: needs a title`);
      // The title tab is as wide as the block; a longer title draws outside it.
      if (block.kind !== "actor" && (block.title?.length ?? 0) > 24) {
        fail(`${at}: title "${block.title}" is longer than 24 characters and will overflow its tab`);
      }
      if (
        !Number.isInteger(block.col) ||
        block.col < 0 ||
        !Number.isInteger(block.row) ||
        block.row < 0
      ) {
        fail(`${at}: needs non-negative integer col and row`);
      }
      if (block.icon && !ICONS.has(block.icon)) fail(`${at}: unknown icon ${block.icon}`);
      if (block.kind === "actor" && !block.icon) fail(`${at}: an actor block needs an icon`);
      if (block.cosaiComponent && !ctx.mapTargets.has(block.cosaiComponent)) {
        fail(`${at}: unknown component or actor ${block.cosaiComponent}`);
      }
      const itemIds = new Set<string>();
      for (const item of block.items ?? []) {
        if (itemIds.has(item.id)) fail(`${at}: duplicate item ${item.id}`);
        itemIds.add(item.id);
        if (!item.label?.trim()) fail(`${at} item ${item.id}: needs a label`);
        if (!ICONS.has(item.icon)) fail(`${at} item ${item.id}: unknown icon ${item.icon}`);
        if (item.cosaiComponent && !ctx.mapTargets.has(item.cosaiComponent)) {
          fail(`${at} item ${item.id}: unknown component or actor ${item.cosaiComponent}`);
        }
      }
    }
    // No two blocks may claim the same grid cell — overlap is a wrong drawing, not a layout bug.
    const cells = new Map<string, string>();
    for (const block of arch.blocks ?? []) {
      for (let r = block.row; r < block.row + (block.rowSpan ?? 1); r++) {
        const key = `${block.col},${r}`;
        const holder = cells.get(key);
        if (holder) fail(`${where}: blocks ${holder} and ${block.id} both occupy grid cell ${key}`);
        cells.set(key, block.id);
      }
    }

    // --- Edges ---------------------------------------------------------------
    const edgeKeys = new Set<string>();
    const bidir = new Set<string>();
    for (const edge of arch.edges ?? []) {
      const key = `${edge.from}->${edge.to}`;
      const at = `${where} edge ${key}`;
      if (edgeKeys.has(key)) fail(`${at}: duplicate edge`);
      edgeKeys.add(key);
      if (edge.bidir) bidir.add(key);
      if (edge.from === edge.to) fail(`${at}: loops back on itself`);
      if (!blockIds.has(edge.from)) fail(`${at}: unknown source block ${edge.from}`);
      if (!blockIds.has(edge.to)) fail(`${at}: unknown target block ${edge.to}`);
      if (!PATH_CLASSES.has(edge.path)) {
        fail(`${at}: path must be one of ${[...PATH_CLASSES].join(", ")}`);
      }
      if (edge.route && edge.route !== "hv" && edge.route !== "vh") {
        fail(`${at}: route must be "hv" or "vh"`);
      }
    }

    // --- Pins ----------------------------------------------------------------
    const resolvePin = (at: string, ref: string) => {
      if (blockIds.has(ref) || edgeKeys.has(ref)) return;
      const [a, b] = (ref ?? "").split("->");
      if (a && b && bidir.has(`${b}->${a}`)) return;
      fail(`${at}: "${ref}" is neither a block id nor an edge "from->to"`);
    };
    const risks: string[] = [];
    for (const pin of arch.pins?.risks ?? []) {
      const at = `${where} risk pin ${pin.risk} @ ${pin.at}`;
      if (!ctx.riskIds.has(pin.risk)) fail(`${at}: unknown risk`);
      resolvePin(at, pin.at);
      if (!risks.includes(pin.risk)) risks.push(pin.risk);
    }
    const capabilities: string[] = [];
    for (const pin of arch.pins?.capabilities ?? []) {
      const at = `${where} capability pin ${pin.capability} @ ${pin.at}`;
      const capability = capabilityById.get(pin.capability);
      if (!capability) fail(`${at}: unknown capability`);
      else if (capability.surfaces?.[arch.surface]?.applies === false) {
        fail(
          `${at}: capability does not apply on ${arch.surface} per capabilities.yaml — ` +
            "fix one of the two, they cannot both be right",
        );
      }
      resolvePin(at, pin.at);
      if (!capabilities.includes(pin.capability)) capabilities.push(pin.capability);
    }
    if (!risks.length) fail(`${where}: needs at least one pinned risk`);
    if (!capabilities.length) fail(`${where}: needs at least one pinned capability`);

    // --- Scenarios -----------------------------------------------------------
    for (const scenario of arch.scenarios ?? []) {
      const at = `${where} scenario "${scenario.title}"`;
      if (!scenario.steps?.length) fail(`${at}: has no steps`);
      for (const step of scenario.steps ?? []) {
        if (edgeKeys.has(step.follow)) continue;
        const [a, b] = (step.follow ?? "").split("->");
        if (a && b && bidir.has(`${b}->${a}`)) continue;
        fail(`${at}: step "${step.follow}" follows no edge (reverse needs bidir: true)`);
      }
    }

    const resolved = { ...arch, risks, capabilities };
    const layout = layoutArchetype(resolved);
    checkDiagramCollisions(where, resolved, layout);
    return { ...resolved, layout } satisfies Archetype;
  });

  // The catalogue is being rebuilt flow-style one architecture at a time (the zone-style set is
  // archived), so an empty surface is reported rather than failed while the pilots settle.
  const emptySurfaces = ctx.surfaces.filter((s) => !bySurface.get(s.id)).map((s) => s.id);

  const anchored = new Set(
    out
      .flatMap((a) => [
        ...a.blocks.map((b) => b.cosaiComponent),
        ...a.blocks.flatMap((b) => (b.items ?? []).map((i) => i.cosaiComponent)),
      ])
      .filter(Boolean),
  );
  const pinCount = out.reduce((s, a) => s + a.pins.risks.length + a.pins.capabilities.length, 0);
  console.log(
    `architectures: ${out.length} flow-style architectures, ${pinCount} pins, ` +
      `${anchored.size} risk-map components anchored` +
      (emptySurfaces.length ? ` — no architecture yet for: ${emptySurfaces.join(", ")}` : ""),
  );
  return out;
}

/**
 * The drawings must stay legible without a human squinting at 28 screenshots: the build
 * re-runs the exact placement maths the renderer uses (flow-layout.ts exports it to both
 * sides) and fails when a flow would pass through a block, or a chip or risk tag would land
 * on one, or a tag stack would run off the top of the canvas. The fix is always authored —
 * a route hint, a different grid cell, or fewer pins on one target.
 */
function checkDiagramCollisions(
  where: string,
  arch: Omit<Archetype, "layout">,
  layout: ReturnType<typeof layoutArchetype>,
): void {
  const inflate = (r: Rect, by: number): Rect => ({
    x: r.x - by,
    y: r.y - by,
    w: r.w + 2 * by,
    h: r.h + 2 * by,
  });
  const hits = (r: Rect, s: Rect) =>
    r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;
  const blockRects = Object.entries(layout.blocks);

  // Flows through blocks. Path data is our own "M x y L x y ..." — parse the segments back.
  for (const edge of layout.edges) {
    const nums = edge.d.match(/-?[\d.]+/g)!.map(Number);
    for (let i = 0; i + 3 < nums.length; i += 2) {
      const seg: Rect = {
        x: Math.min(nums[i], nums[i + 2]) - 1,
        y: Math.min(nums[i + 1], nums[i + 3]) - 1,
        w: Math.abs(nums[i + 2] - nums[i]) + 2,
        h: Math.abs(nums[i + 3] - nums[i + 1]) + 2,
      };
      for (const [id, rect] of blockRects) {
        if (id === edge.from || id === edge.to) continue;
        if (hits(seg, inflate(rect, -2))) {
          fail(
            `${where}: flow ${edge.from}->${edge.to} passes through block ${id} — ` +
              `move a block, or set route: ${
                (archEdgeOf(arch, edge)?.route ?? "hv") === "hv" ? "vh" : "hv"
              }`,
          );
        }
      }
    }
  }

  const edgeGeoOf = (ref: string) => {
    const found =
      layout.edges.find((e) => `${e.from}->${e.to}` === ref) ??
      layout.edges.find((e) => `${e.to}->${e.from}` === ref);
    return found ? { midX: found.midX, midY: found.midY, horizontal: found.horizontal } : undefined;
  };

  const checkSpots = (kind: string, at: string, rects: Rect[], ownBlock?: string) => {
    for (const r of rects) {
      if (r.y < 2) fail(`${where}: ${kind} at ${at} runs off the top of the canvas — fewer pins there, or move the block down a row`);
      for (const [id, rect] of blockRects) {
        if (id === ownBlock) continue;
        if (hits(r, inflate(rect, -2))) {
          fail(`${where}: ${kind} at ${at} lands on block ${id} — pin it elsewhere or adjust the grid`);
        }
      }
    }
  };

  const chipGroups = new Map<string, number>();
  for (const pin of arch.pins.capabilities) {
    chipGroups.set(pin.at, (chipGroups.get(pin.at) ?? 0) + 1);
  }
  for (const [at, n] of chipGroups) {
    const spots = chipSpots(n, layout.blocks[at], edgeGeoOf(at));
    checkSpots(
      "capability chip",
      at,
      spots.map((s) => ({ x: s.x - 9, y: s.y - 9, w: 18, h: 18 })),
      layout.blocks[at] ? at : undefined,
    );
  }

  const tagGroups = new Map<string, number>();
  for (const pin of arch.pins.risks) {
    tagGroups.set(pin.at, (tagGroups.get(pin.at) ?? 0) + 1);
  }
  for (const [at, n] of tagGroups) {
    // Tag width depends on the code ("R01"), which is constant-width here.
    const { rects } = tagSpots(Array.from({ length: n }, () => 32), layout.blocks[at], edgeGeoOf(at));
    checkSpots("risk tag", at, rects);
  }
}

const archEdgeOf = (arch: Omit<Archetype, "layout">, geo: { from: string; to: string }) =>
  arch.edges.find((e) => e.from === geo.from && e.to === geo.to);

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
