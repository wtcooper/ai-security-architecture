#!/usr/bin/env node
/**
 * Print the pattern catalogue as a researcher needs it: what each pattern covers, the products
 * already filed under it, and when the last scan ran. Everything a new finding is compared with.
 *
 *   node catalogue.mjs            the catalogue, grouped by where the AI runs
 *   node catalogue.mjs --names    only the product and example names already filed (for de-duplication)
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
const flat = (blocks) => (blocks ?? []).map((b) => (Array.isArray(b) ? b.join(" ") : b)).join(" ").replace(/\s+/g, " ").trim();
const toolsOf = (id) => dataset.tools.filter((t) => t.architecture === id);
const vendor = new Map((dataset.vendors ?? []).map((v) => [v.id, v.name]));

if (process.argv.includes("--names")) {
  const names = new Set();
  for (const a of dataset.archetypes) for (const e of a.exemplars ?? []) names.add(`${e.name}  →  ${a.title} (example, as of ${e.asOf ?? "?"})`);
  for (const t of dataset.tools) names.add(`${t.name}  →  ${dataset.archetypes.find((a) => a.id === t.architecture)?.title} (tool, ${vendor.get(t.vendor) ?? t.vendor})`);
  console.log([...names].sort((x, y) => x.localeCompare(y)).join("\n"));
  process.exit(0);
}

const dir = join(root, "docs/research/patterns");
const scans = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort() : [];
console.log(`Today (UTC): ${new Date().toISOString().slice(0, 10)}`);
console.log(`Last pattern scan: ${scans.length ? scans.at(-1).replace(".md", "") : "none on record"}`);
console.log(`Patterns: ${dataset.archetypes.length}\n`);

const surfaces = [...new Set(dataset.archetypes.map((a) => a.surface))];
for (const s of surfaces) {
  console.log(`== ${s} ==`);
  for (const a of dataset.archetypes.filter((x) => x.surface === s).sort((x, y) => x.rank - y.rank)) {
    console.log(`\n${a.title}  (${a.id}, ${a.slug})`);
    console.log(`  Use when: ${a.useWhen}`);
    console.log(`  What it is: ${flat(a.summary)}`);
    const zones = (a.zones ?? []).filter((z) => z.owner !== "governance").map((z) => z.owner).join(" · ");
    console.log(`  Who runs what: ${zones}`);
    for (const d of a.distinguishedBy ?? []) console.log(`  Not the same as: ${flat([d]).slice(0, 260)}${flat([d]).length > 260 ? "…" : ""}`);
    const ex = (a.exemplars ?? []).map((e) => `${e.name} (${e.asOf ?? "?"})`).join(", ");
    if (ex) console.log(`  Examples: ${ex}`);
    const tools = toolsOf(a.id).map((t) => t.name).join(", ");
    if (tools) console.log(`  Tools catalogued: ${tools}`);
  }
  console.log("");
}
