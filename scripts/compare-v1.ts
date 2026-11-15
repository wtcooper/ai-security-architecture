/**
 * Compares the patterns as they stand with the risk-first version kept on the `v1` branch, so a
 * restructure that was meant to move things cannot quietly drop them.
 *
 *   git show v1:src/data/generated/dataset.json > /tmp/v1.json
 *   npx tsx scripts/compare-v1.ts /tmp/v1.json            a table, then every difference
 *   npx tsx scripts/compare-v1.ts /tmp/v1.json --quiet    the table only
 *
 * "Dropped" is anything v1 had that is gone. "Changed" is text that differs after allowing for
 * the one deliberate rewording (archetype -> pattern). "Added" is new since v1.
 */
import { readFileSync } from "node:fs";
import { dataset } from "../src/lib/data";

// The v1 dataset is read as untyped JSON: its shapes are older than the current types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const v1: Any = JSON.parse(readFileSync(process.argv[2], "utf8"));
const quiet = process.argv.includes("--quiet");

/** Text as a reader would compare it: whitespace folded, and the one deliberate rewording undone. */
const norm = (v: unknown): string =>
  JSON.stringify(v ?? null)
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bsub-archetype/gi, "variant")
    .replace(/\bArchetypes\b/g, "Patterns")
    .replace(/\bArchetype\b/g, "Pattern")
    .replace(/\barchetypes\b/g, "patterns")
    .replace(/\barchetype\b/g, "pattern")
    .trim();

interface Diff {
  where: string;
  kind: "dropped" | "changed" | "added";
  what: string;
}
const diffs: Diff[] = [];
const note = (where: string, kind: Diff["kind"], what: string) => diffs.push({ where, kind, what });

/** Compare two keyed lists: what is gone, what is new, and which listed fields differ. */
function keyed(where: string, label: string, was: Any[], now: Any[], key: (x: Any) => string, fields: string[]) {
  const a = new Map(was.map((x) => [key(x), x]));
  const b = new Map(now.map((x) => [key(x), x]));
  for (const [k, x] of a) {
    const y = b.get(k);
    if (!y) note(where, "dropped", `${label} ${k}`);
    else for (const f of fields) if (norm(x[f]) !== norm(y[f])) note(where, x[f] === undefined ? "added" : y[f] === undefined ? "dropped" : "changed", `${label} ${k}: ${f}`);
  }
  for (const k of b.keys()) if (!a.has(k)) note(where, "added", `${label} ${k}`);
}

const rows: string[] = [];
for (const was of v1.archetypes as Any[]) {
  const now = dataset.archetypes.find((a) => a.id === was.id) as Any | undefined;
  const where = was.id;
  if (!now) {
    note(where, "dropped", "the whole pattern");
    continue;
  }
  const before = diffs.length;
  for (const f of ["surface", "rank", "title", "abbrev", "summary", "description", "distinguishedBy", "sources", "deviations"]) {
    if (f === "deviations") keyed(where, "deviation", was.deviations ?? [], now.deviations ?? [], (d) => d.subject, ["reason"]);
    else if (norm(was[f]) !== norm(now[f])) note(where, "changed", f);
  }
  keyed(where, "example", was.exemplars ?? [], now.exemplars ?? [], (e) => e.name, ["note", "url", "asOf"]);
  keyed(where, "zone", was.zones ?? [], now.zones ?? [], (z) => z.id, ["owner", "title", "note"]);
  keyed(where, "block", was.blocks, now.blocks, (b) => b.id, ["kind", "title", "zone", "parent", "col", "row", "rowSpan", "note", "cosaiComponent", "icon", "mitigations"]);
  for (const b of was.blocks as Any[]) {
    const nb = (now.blocks as Any[]).find((x) => x.id === b.id);
    if (nb) keyed(where, `item of ${b.id}:`, b.items ?? [], nb.items ?? [], (i) => i.id ?? i.label, ["label", "icon", "note", "mitigations"]);
  }
  keyed(where, "flow", was.edges, now.edges, (e) => `${e.from}->${e.to}`, ["label", "path", "bidir", "note", "route"]);
  keyed(where, "control pin", was.pins.mitigations, now.pins.mitigations, (p) => `${p.mitigation}@${p.at}`, ["note"]);
  keyed(where, "risk pin", was.pins.risks, now.pins.risks, (p) => `${p.risk}@${p.at}`, ["note"]);
  if (norm(was.mitigations) !== norm(now.mitigations)) {
    const kept = (now.mitigations as string[]).slice(0, was.mitigations.length);
    note(where, norm(kept) === norm(was.mitigations) ? "added" : "changed", norm(kept) === norm(was.mitigations) ? `controls appended (chip numbers unchanged): ${(now.mitigations as string[]).slice(was.mitigations.length).join(", ")}` : "the order of controls, so chip numbers moved");
  }
  if (norm([...was.risks].sort()) !== norm([...now.risks].sort())) note(where, "changed", "the set of risks");
  const walks = (a: Any) => [a.walkthrough, ...(a.scenarios ?? [])].filter(Boolean) as Any[];
  keyed(where, "walk", walks(was), walks(now), (w) => w.title, ["summary", "risks"]);
  for (const w of walks(was)) {
    const nw = walks(now).find((x) => x.title === w.title);
    if (!nw) continue;
    if (w.steps.length !== nw.steps.length) note(where, "changed", `walk "${w.title}": ${w.steps.length} steps -> ${nw.steps.length}`);
    w.steps.forEach((st: Any, i: number) => {
      const ns = nw.steps[i];
      if (!ns) return;
      for (const f of ["follow", "label", "note", "risks"]) if (norm(st[f]) !== norm(ns[f])) note(where, st[f] === undefined ? "added" : "changed", `walk "${w.title}" step ${i + 1}: ${f}`);
    });
  }
  const g1 = (v1.guidance as Any[]).find((g) => g.archetype === was.id);
  const g2 = (dataset.guidance as Any[]).find((g) => g.archetype === was.id);
  if (g1 && !g2) note(where, "dropped", "guidance");
  if (g1 && g2) {
    for (const f of ["mode", "status", "overview", "sources"]) if (norm(g1[f]) !== norm(g2[f])) note(where, "changed", `guidance ${f}`);
    keyed(where, "guidance item", g1.items, g2.items, (i) => i.title, ["mitigations", "body", "tools"]);
  }
  const t1 = (v1.tools as Any[]).filter((t) => t.architecture === was.id);
  const t2 = (dataset.tools as Any[]).filter((t) => t.architecture === was.id);
  keyed(where, "tool", t1, t2, (t) => t.id, ["name", "vendor", "summary", "variants", "facts", "items", "riskNotes", "advisories", "sources"]);
  for (const t of t1) {
    const nt = t2.find((x) => x.id === t.id);
    if (!nt) continue;
    keyed(where, `${t.id} setting`, t.settings ?? [], nt.settings ?? [], (s) => s.id, ["name", "where", "recommended", "why", "mitigations", "url", "default", "requires"]);
    keyed(where, `${t.id} control row`, t.controls ?? [], nt.controls ?? [], (c) => c.mitigation, ["coverage", "mechanism", "note", "steps"]);
  }
  for (const c1 of v1.clouds as Any[]) {
    const c2 = (dataset.clouds as Any[]).find((c) => c.id === c1.id);
    const i1 = c1.implementations.find((i: Any) => i.architecture === was.id);
    const i2 = c2?.implementations.find((i: Any) => i.architecture === was.id);
    if (i1 && !i2) note(where, "dropped", `${c1.id} mapping`);
    if (!i1 || !i2) continue;
    keyed(where, `${c1.id} binding`, i1.bindings, i2.bindings, (b) => b.block, ["service", "note", "build", "url"]);
    for (const id of i1.settings) if (!i2.settings.includes(id)) note(where, "dropped", `${c1.id} setting ${id}`);
    for (const id of i2.settings) if (!i1.settings.includes(id)) note(where, "added", `${c1.id} setting ${id}`);
  }
  const inc1 = (v1.incidents as Any[]).filter((i) => i.archetype === was.id).map((i) => i.id);
  const inc2 = (dataset.incidents as Any[]).filter((i) => i.archetype === was.id).map((i) => i.id);
  for (const id of inc1) if (!inc2.includes(id)) note(where, "dropped", `incident ${id}`);

  const mine = diffs.slice(before);
  const n = (k: Diff["kind"]) => mine.filter((d) => d.kind === k).length;
  rows.push(
    `${(now.slug as string).padEnd(36)} ${String(was.blocks.length).padStart(3)}→${String(now.blocks.length).padEnd(3)} ${String(was.edges.length).padStart(3)}→${String(now.edges.length).padEnd(3)} ${String(was.pins.mitigations.length).padStart(3)}→${String(now.pins.mitigations.length).padEnd(3)} ${String(was.pins.risks.length).padStart(3)}→${String(now.pins.risks.length).padEnd(3)} ${String(t1.length).padStart(2)}→${String(t2.length).padEnd(2)}  ${String(n("dropped") || "·").padStart(7)} ${String(n("changed") || "·").padStart(7)} ${String(n("added") || "·").padStart(5)}`,
  );
}

// The catalogues behind the patterns: nothing may be missing, and their text should be as it was.
const catalogue = (label: string, was: Any[], now: Any[], fields: string[]) => keyed("catalogue", label, was, now, (x) => x.id, fields);
catalogue("risk", v1.risks, dataset.risks as Any[], ["title", "category", "shortDescription", "longDescription", "controls", "personas"]);
catalogue("CoSAI control", v1.controls, dataset.controls as Any[], ["title", "category", "description", "risks", "components", "personas"]);
catalogue("component", v1.components, dataset.components as Any[], ["title", "category", "description"]);
catalogue("persona", v1.personas, dataset.personas as Any[], ["title", "description"]);
catalogue("control", v1.mitigations, dataset.mitigations as Any[], ["title", "category", "implementation", "examples", "controls", "risks", "components", "surfaces", "description", "parent", "features"]);
catalogue("incident", v1.incidents, dataset.incidents as Any[], ["title", "subtitle", "archetype", "category", "summary", "breaks", "risks", "steps"]);
catalogue("framework", v1.frameworks, dataset.frameworks as Any[], ["name", "version"]);
for (const [fw, entries] of Object.entries(v1.frameworkEntries as Any)) for (const id of Object.keys(entries as Any)) if (!(dataset.frameworkEntries as Any)[fw]?.[id]) note("catalogue", "dropped", `framework entry ${fw} ${id}`);
catalogue("vendor", v1.vendors, dataset.vendors as Any[], ["name"]);

console.log(`${"pattern".padEnd(36)} blocks  flows   ctlpins riskpin tools  dropped changed added`);
for (const r of rows) console.log(r);
const cat = diffs.filter((d) => d.where === "catalogue");
console.log(`${"catalogues (risks, controls, …)".padEnd(36)} ${"".padEnd(37)} ${String(cat.filter((d) => d.kind === "dropped").length || "·").padStart(7)} ${String(cat.filter((d) => d.kind === "changed").length || "·").padStart(7)} ${String(cat.filter((d) => d.kind === "added").length || "·").padStart(5)}`);
const total = (k: Diff["kind"]) => diffs.filter((d) => d.kind === k).length;
console.log(`\n${total("dropped")} dropped, ${total("changed")} changed, ${total("added")} added`);
if (!quiet) for (const k of ["dropped", "changed", "added"] as const) for (const d of diffs.filter((x) => x.kind === k)) console.log(`${k.padEnd(8)} ${d.where.padEnd(28)} ${d.what}`);
