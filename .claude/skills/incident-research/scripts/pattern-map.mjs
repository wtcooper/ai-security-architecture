#!/usr/bin/env node
/**
 * Print what a pattern is made of, from the compiled dataset: its boundaries, boxes, flows,
 * pinned controls and pinned risks, with the ids an author or an incident path has to use.
 *
 *   node pattern-map.mjs                 list every pattern (id, slug, title)
 *   node pattern-map.mjs <id-or-slug>    one pattern in full
 *
 * Reads src/data/generated/dataset.json, so run `npm run data` first if the YAML has changed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let dataset;
try {
  dataset = JSON.parse(readFileSync(join(root, "src/data/generated/dataset.json"), "utf8"));
} catch {
  console.error("Run this from the repository root, after `npm run data`.");
  process.exit(1);
}
const title = new Map([...dataset.mitigations.map((m) => [m.id, m.title]), ...dataset.risks.map((r) => [r.id, r.title])]);
const want = process.argv[2];

if (!want) {
  for (const a of dataset.archetypes) console.log(`${a.id.padEnd(30)} ${a.slug.padEnd(38)} ${a.title}`);
  process.exit(0);
}
const a = dataset.archetypes.find((x) => x.id === want || x.slug === want);
if (!a) {
  console.error(`No pattern "${want}". Run with no argument to list them.`);
  process.exit(1);
}
const zoneOf = new Map((a.zones ?? []).map((z) => [z.id, z]));
console.log(`${a.title}  (${a.id}, /patterns/${a.slug}/, ${a.surface})\n`);
console.log("BOUNDARIES");
for (const z of a.zones ?? []) console.log(`  ${z.id.padEnd(16)} ${z.owner.padEnd(11)} ${z.title ?? ""}${z.gloss ? ` · ${z.gloss}` : ""}`);
console.log("\nBOXES  (id · kind · boundary · col,row · title · holds)");
for (const b of a.blocks) {
  const where = `${b.cell?.col ?? b.col},${b.cell?.row ?? b.row}`;
  const holds = (b.items ?? []).map((i) => i.label).join(", ");
  console.log(`  ${b.id.padEnd(18)} ${b.kind.padEnd(10)} ${(zoneOf.get(b.zone)?.owner ?? "-").padEnd(10)} ${where.padEnd(5)} ${b.title}${b.parent ? `  (inside ${b.parent})` : ""}${holds ? `  [${holds}]` : ""}`);
}
console.log("\nFLOWS  (the key an incident path or a walk step uses)");
for (const e of a.edges) {
  const key = `${e.from}->${e.to}`;
  const back = e.bidir || e.outbound ? "  (reverse allowed)" : "";
  const cross = e.crossing ? `  crossing: ${e.crossing.kind}` : "";
  console.log(`  ${key.padEnd(34)} ${e.path.padEnd(8)} ${e.label ?? ""}${back}${cross}`);
}
console.log("\nCONTROLS PINNED  (chip number · id · title · where)");
a.mitigations.forEach((id, i) => {
  const at = [...new Set(a.pins.mitigations.filter((p) => p.mitigation === id).map((p) => p.at))].join(", ");
  console.log(`  ${String(i + 1).padStart(2)}  ${id.padEnd(38)} ${(title.get(id) ?? "").padEnd(46)} ${at}`);
});
console.log("\nRISKS PINNED  (id · title · where)");
for (const id of a.risks) {
  const at = [...new Set(a.pins.risks.filter((p) => p.risk === id).map((p) => p.at))].join(", ");
  console.log(`  ${id.padEnd(44)} ${(title.get(id) ?? "").padEnd(44)} ${at}`);
}
const walks = [a.walkthrough, ...(a.scenarios ?? [])].filter(Boolean);
console.log(`\nWALKS  ${walks.map((w) => `"${w.title}" (${w.steps.length})`).join(" · ")}`);
