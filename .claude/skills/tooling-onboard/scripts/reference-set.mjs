#!/usr/bin/env node
// Prints the reference control set of an architecture — the capabilities and risks pinned on
// it — from the compiled dataset. A tool entry may only write controls[] / riskNotes[] for these.
//   node reference-set.mjs                          -> list architectures
//   node reference-set.mjs archCodingAgentThirdParty
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "src/data/generated/dataset.json");
if (!existsSync(path)) {
  console.error("Run `npm run data` first (from the repository root).");
  process.exit(1);
}
const d = JSON.parse(readFileSync(path, "utf8"));
const id = process.argv[2];
if (!id) {
  for (const a of d.archetypes) console.log(`${a.id}  ${a.surface}  ${a.title}  (${a.capabilities.length} capabilities, ${a.risks.length} risks)`);
  process.exit(0);
}
const a = d.archetypes.find((x) => x.id === id);
if (!a) { console.error(`unknown architecture ${id}`); process.exit(1); }
const cap = new Map(d.capabilities.map((c) => [c.id, c]));
const risk = new Map(d.risks.map((r) => [r.id, r]));
const one = (p) => (Array.isArray(p) ? p.flat().join(" ") : String(p ?? "")).replace(/\s+/g, " ").slice(0, 150);
console.log(`# ${a.title} (${a.id})\n\n## Pinned capabilities (${a.capabilities.length})`);
for (const c of a.capabilities) console.log(`- ${c} — ${cap.get(c)?.title}: ${one(cap.get(c)?.description)}`);
console.log(`\n## Pinned risks (${a.risks.length})`);
for (const r of a.risks) console.log(`- ${r} — ${risk.get(r)?.title}`);
