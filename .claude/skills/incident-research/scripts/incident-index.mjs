#!/usr/bin/env node
/**
 * Print what the incident catalogue already holds, so a scan knows where to start and what it
 * must not file twice: every incident with its date, pattern and category, every "also seen"
 * entry, every source address, and the next free file number.
 *
 *   node incident-index.mjs           the index
 *   node incident-index.mjs --urls    only the source addresses already cited (for de-duplication)
 *
 * Reads src/data/generated/dataset.json, so run `npm run data` first if the YAML has changed.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let dataset;
try {
  dataset = JSON.parse(readFileSync(join(root, "src/data/generated/dataset.json"), "utf8"));
} catch {
  console.error("Run this from the repository root, after `npm run data`.");
  process.exit(1);
}
const incidents = [...dataset.incidents].sort((a, b) => b.date.localeCompare(a.date));
const urls = new Set();
for (const i of incidents) {
  for (const s of i.sources ?? []) urls.add(s.url);
  for (const st of i.steps ?? []) for (const s of st.sources ?? []) urls.add(s.url);
  for (const r of i.alsoSeen ?? []) for (const s of r.sources ?? []) urls.add(s.url);
}
if (process.argv.includes("--urls")) {
  console.log([...urls].sort().join("\n"));
  process.exit(0);
}
const arch = new Map(dataset.archetypes.map((a) => [a.id, a.title]));
const files = readdirSync(join(root, "data/incidents")).filter((f) => /^\d+-.*\.yaml$/.test(f)).sort();
const next = String(Math.max(0, ...files.map((f) => Number(f.split("-")[0]))) + 1).padStart(2, "0");
const dir = join(root, "docs/research/incidents");
const scans = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort() : [];

console.log(`Today (UTC): ${new Date().toISOString().slice(0, 10)}`);
console.log(`Last incident scan: ${scans.length ? scans.at(-1).replace(".md", "") : "none on record"}`);
console.log(`Newest incident on file: ${incidents[0]?.date ?? "none"}`);
console.log(`Next file: data/incidents/${next}-<id>.yaml`);
console.log(`Sources already cited: ${urls.size}\n`);
console.log("INCIDENTS  (date · id · category · pattern)");
for (const i of incidents) {
  console.log(`  ${i.date}  ${i.id.padEnd(34)} ${i.category.padEnd(16)} ${arch.get(i.archetype) ?? i.archetype}`);
  console.log(`           ${i.title}`);
  for (const r of i.alsoSeen ?? []) console.log(`           also seen: ${r.title}`);
}
const byCat = {};
for (const i of incidents) byCat[i.category] = (byCat[i.category] ?? 0) + 1;
console.log(`\nBy category: ${Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
const unused = dataset.archetypes.filter((a) => !incidents.some((i) => i.archetype === a.id)).map((a) => a.title);
console.log(`Patterns with no incident yet: ${unused.join(" · ") || "none"}`);
