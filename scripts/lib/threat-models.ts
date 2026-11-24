/**
 * The threat models: one file per pattern in data/reference/threat-models/, named after the
 * pattern's own file. The rules are the authors' checker's (tm_check.py), so a file it passes
 * passes here: limits on every field, places that are the pattern's own boxes and arrows, risks,
 * incidents and controls that exist (the controls pinned on the pattern), ATLAS ids from the
 * vendored release and OWASP ids from the lists the model names, with a reason for every item of
 * those lists that no threat names. A pattern without a file is allowed until every pattern has one.
 *
 * Each ATLAS technique a model uses is carried into the dataset with its name and tactics, so the
 * page never needs the 2 MB release.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import { readVerifiedSource } from "./mitigations";
import { THREAT_EVIDENCE, THREAT_LISTS, THREAT_RATINGS, type Archetype, type AtlasTechnique, type FrameworkEntryInfo, type ThreatModel } from "../../src/lib/types";

interface AtlasRelease {
  tactics: Record<string, { name: string }>;
  techniques: Record<string, { id: string; name: string }>;
  relationships: Record<string, { achieves?: { target: string }[]; specializes?: { target: string }[] }>;
}

/** Field limits, as the format sets them. */
export const THREAT_LIMITS = {
  summary: 600,
  concentrates: 300,
  scope: 300,
  asset: 90,
  access: 120,
  wants: 80,
  title: 80,
  story: 320,
  why: 160,
  question: 160,
} as const;

/** Characters as a reader counts them (and as the checker does), not UTF-16 units. */
const len = (s: unknown) => [...String(s ?? "")].length;
const list = <T>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

/** The vendored ATLAS release, checked against its manifest. */
async function loadAtlas(root: string): Promise<AtlasRelease> {
  const { sources } = parse(await readFile(join(root, "data/mitre/sources.yaml"), "utf8")) as { sources: Parameters<typeof readVerifiedSource>[1][] };
  const source = sources.find((s) => s.framework === "MITRE ATLAS");
  if (!source) throw new Error("data/mitre/sources.yaml: no MITRE ATLAS release");
  return parse(await readVerifiedSource(root, source)) as AtlasRelease;
}

/** A technique as the page names it: a sub-technique under its parent, with the tactics it achieves. */
function techniqueOf(atlas: AtlasRelease, id: string): AtlasTechnique {
  const t = atlas.techniques[id];
  const parentId = atlas.relationships[id]?.specializes?.[0]?.target;
  const parent = parentId ? atlas.techniques[parentId] : undefined;
  const tacticsOf = (x: string) => list(atlas.relationships[x]?.achieves).map((r) => atlas.tactics[r.target]?.name).filter((n): n is string => Boolean(n));
  const tactics = tacticsOf(id).length ? tacticsOf(id) : parentId ? tacticsOf(parentId) : [];
  return { id, name: parent ? `${parent.name}: ${t.name}` : t.name, tactics };
}

/** What the build needs to check a threat model against. */
export interface ThreatModelContext {
  archetypes: Archetype[];
  riskIds: Set<string>;
  incidentIds: Set<string>;
  frameworkEntries: Record<string, Record<string, FrameworkEntryInfo>>;
  /** The ATLAS technique ids in the vendored release. */
  atlasIds: Set<string>;
}

/**
 * Everything wrong with one threat model, in the checker's words; empty when it passes. `file` is
 * its file name, which must be the pattern's own.
 */
export function checkThreatModel(t: ThreatModel, file: string, ctx: ThreatModelContext): string[] {
  const problems: string[] = [];
  const p = (msg: string) => problems.push(msg);
  const a = ctx.archetypes.find((x) => x.id === t?.pattern);
  if (!a) return [`unknown pattern ${t?.pattern}`];
  if (file !== `${a.slug}.yaml`) p(`the file is named after the pattern's own file, ${a.slug}.yaml`);
  const listIds = Object.fromEntries(THREAT_LISTS.map((l) => [l, new Set(Object.keys(ctx.frameworkEntries[l] ?? {}))])) as Record<string, Set<string>>;
  const blocks = new Set(a.blocks.map((b) => b.id));
  const edges = new Set(a.edges.flatMap((e) => [`${e.from}->${e.to}`, `${e.to}->${e.from}`]));
  for (const k of ["summary", "concentrates", "scope"] as const) {
    if (!t[k]) p(`${k} missing`);
    if (len(t[k]) > THREAT_LIMITS[k]) p(`${k} over ${THREAT_LIMITS[k]} characters (${len(t[k])})`);
  }
  const lists = list(t.lists);
  if (!lists.includes("owasp-llm-2026")) p("lists must include owasp-llm-2026");
  for (const l of lists) if (!listIds[l]) p(`unknown list ${l}`);
  const assets = list(t.assets);
  if (assets.length < 3 || assets.length > 6) p("3 to 6 assets");
  for (const x of assets) if (len(x) > THREAT_LIMITS.asset) p(`asset over ${THREAT_LIMITS.asset}: ${String(x).slice(0, 40)}`);
  const actors = list(t.actors);
  if (actors.length < 3 || actors.length > 6) p("3 to 6 actors");
  for (const x of actors) if (len(x?.access) > THREAT_LIMITS.access || len(x?.wants) > THREAT_LIMITS.wants || !x?.who) p(`actor fields: ${x?.who}`);

  const threats = list(t.threats);
  if (threats.length < 5 || threats.length > 10) p("5 to 10 threats");
  const named = new Set<string>();
  threats.forEach((x, i) => {
    const w = `threat ${x.id}`;
    if (x.id !== `T${i + 1}`) p(`${w}: ids must run T1, T2, ...`);
    if (len(x.title) > THREAT_LIMITS.title) p(`${w}: title over ${THREAT_LIMITS.title}`);
    if (!(THREAT_RATINGS as readonly string[]).includes(x.rating)) p(`${w}: rating`);
    if (!(THREAT_EVIDENCE as readonly string[]).includes(x.evidence)) p(`${w}: evidence`);
    if (!x.story || len(x.story) > THREAT_LIMITS.story) p(`${w}: story missing or over ${THREAT_LIMITS.story} (${len(x.story)})`);
    const places = list(x.at);
    if (places.length < 1 || places.length > 4) p(`${w}: 1 to 4 places`);
    for (const y of places) if (!blocks.has(y) && !edges.has(y)) p(`${w}: ${y} is not a box or arrow of the pattern`);
    if (!list(x.risks).length) p(`${w}: no risks`);
    for (const y of list(x.risks)) if (!ctx.riskIds.has(y)) p(`${w}: unknown risk ${y}`);
    for (const y of list(x.atlas)) if (!ctx.atlasIds.has(y)) p(`${w}: ${y} is not an ATLAS technique in the vendored release`);
    for (const y of list(x.owasp)) {
      if (!lists.some((l) => listIds[l]?.has(y))) p(`${w}: ${y} is not in the lists named`);
      named.add(y);
    }
    const controls = list(x.controls);
    if (controls.length < 1 || controls.length > 5) p(`${w}: 1 to 5 controls`);
    for (const y of controls) if (!a.mitigations.includes(y)) p(`${w}: control ${y} is not pinned on the pattern`);
    for (const y of list(x.incidents)) if (!ctx.incidentIds.has(y)) p(`${w}: unknown incident ${y}`);
    for (const y of list(x.refs)) if (!String(y?.url ?? "").startsWith("https://")) p(`${w}: ref url`);
    if (list(x.refs).length > 2) p(`${w}: at most 2 refs`);
  });

  const coverage = new Map(list(t.coverage).map((c) => [c.id, c]));
  for (const l of lists) for (const y of listIds[l] ?? []) if (!named.has(y) && !coverage.has(y)) p(`coverage: ${y} is named by no threat and has no reason`);
  for (const [y, c] of coverage) {
    if (named.has(y)) p(`coverage: ${y} is named by a threat, so needs no reason`);
    if (len(c.why) > THREAT_LIMITS.why) p(`coverage ${y}: why over ${THREAT_LIMITS.why}`);
  }
  const questions = list(t.questions);
  if (questions.length < 4 || questions.length > 8) p("4 to 8 questions");
  for (const y of questions) if (len(y) > THREAT_LIMITS.question) p(`question over ${THREAT_LIMITS.question}: ${String(y).slice(0, 40)}`);
  // Text names things: no em dashes, and no pattern id outside the id field.
  if (JSON.stringify(t).includes("\u2014")) p("em dash in text");
  const text = Object.fromEntries(Object.entries(t).filter(([k]) => k !== "pattern"));
  if (/\barch[A-Z]\w+/.test(JSON.stringify(text))) p("pattern id in text");
  return problems;
}

export async function loadThreatModels(
  root: string,
  ctx: Omit<ThreatModelContext, "atlasIds"> & { fail: (msg: string) => void },
): Promise<{ threatModels: ThreatModel[]; atlasTechniques: Record<string, AtlasTechnique> }> {
  const dir = join(root, "data", "reference", "threat-models");
  const files = (await readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".yaml")).sort();
  const atlas = await loadAtlas(root);
  const full: ThreatModelContext = { ...ctx, atlasIds: new Set(Object.keys(atlas.techniques)) };
  const models: ThreatModel[] = [];
  for (const file of files) {
    let t: ThreatModel;
    try {
      t = parse(await readFile(join(dir, file), "utf8")) as ThreatModel;
    } catch (e) {
      ctx.fail(`threat-models/${file}: ${(e as Error).message}`);
      continue;
    }
    for (const msg of checkThreatModel(t, file, full)) ctx.fail(`threat-models/${file}: ${msg}`);
    if (!ctx.archetypes.some((a) => a.id === t?.pattern)) continue;
    if (models.some((m) => m.pattern === t.pattern)) {
      ctx.fail(`threat-models/${file}: a second threat model for ${t.pattern}`);
      continue;
    }
    models.push({ ...t, lists: list(t.lists), assets: list(t.assets), actors: list(t.actors), threats: list(t.threats), coverage: list(t.coverage), questions: list(t.questions) });
  }
  const order = new Map(ctx.archetypes.map((a, i) => [a.id, i]));
  models.sort((x, y) => (order.get(x.pattern) ?? 0) - (order.get(y.pattern) ?? 0));
  const used = [...new Set(models.flatMap((m) => m.threats.flatMap((x) => list(x.atlas))))].filter((id) => full.atlasIds.has(id)).sort();
  return { threatModels: models, atlasTechniques: Object.fromEntries(used.map((id) => [id, techniqueOf(atlas, id)])) };
}
