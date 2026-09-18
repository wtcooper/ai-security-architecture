#!/usr/bin/env node
// Lists CoSAI controls, mitigations and risks (or tools with their reference sets) from the
// compiled dataset, so a mapping session works from live ids rather than memory.
//   node cosai-index.mjs            -> everything
//   node cosai-index.mjs mcp        -> entries whose id/title/description mention "mcp"
//   node cosai-index.mjs tools      -> tools with candidate default capabilities
//   node cosai-index.mjs tools toolClaudeCode -> one tool's candidate capability set
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "src/data/generated/dataset.json");
if (!existsSync(path)) {
  console.error("Run `npm run data` first (from the repository root).");
  process.exit(1);
}
const d = JSON.parse(readFileSync(path, "utf8"));
const q = (process.argv[2] ?? "").toLowerCase();
const one = (p) => (Array.isArray(p) ? p.flat().join(" ") : String(p ?? "")).replace(/\s+/g, " ").slice(0, 140);
const hit = (...parts) => !q || parts.join(" ").toLowerCase().includes(q);

if (q === "tools") {
  const arch = new Map(d.archetypes.map((a) => [a.id, a]));
  const only = process.argv[3];
  for (const t of d.tools) {
    if (only && t.id !== only) continue;
    const a = arch.get(t.architecture);
    console.log(`\n${t.id} — ${t.name} (${t.vendor}) on ${t.architecture}`);
    for (const c of d.capabilities.filter((c) => c.mitigationMappings.some((m) => a?.mitigations.includes(m.mitigation)))) console.log(`  ${c.title} (${c.id})`);
  }
  process.exit(0);
}

const section = (title, items, desc) => {
  const rows = items.filter((i) => hit(i.id, i.title, one(desc(i))));
  if (!rows.length) return;
  console.log(`\n## ${title} (${rows.length})`);
  for (const i of rows) console.log(`${i.title} (${i.id}): ${one(desc(i))}`);
};
section("Controls", d.controls, (c) => c.description);
section("Mitigations", d.mitigations, (c) => c.description);
section("Technology capabilities", d.capabilities, (c) => c.description);
section("Risks", d.risks, (r) => r.shortDescription);
