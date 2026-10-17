#!/usr/bin/env node
// Lists CoSAI controls, the capability catalogue (MITRE mitigations, with authored cap-*
// specialisations marked under their parent) and risks from the compiled dataset, so a mapping
// session works from live ids rather than memory.
//   node cosai-index.mjs            -> everything
//   node cosai-index.mjs mcp        -> entries whose id/title/text mention "mcp"
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
const controlTitle = new Map(d.controls.map((c) => [c.id, c.title]));
const capabilities = d.mitigations; // a capability is a MITRE mitigation or a cap-* specialisation of one
const specialisationsOf = (id) => capabilities.filter((c) => c.parent === id);

const section = (title, items, desc, extra = () => "") => {
  const rows = items.filter((i) => hit(i.id, i.title, one(desc(i)), extra(i)));
  if (!rows.length) return;
  console.log(`\n## ${title} (${rows.length})`);
  for (const i of rows) {
    console.log(`${i.title} (${i.id}): ${one(desc(i))}`);
    const more = extra(i);
    if (more) console.log(`    ${more}`);
  }
};
section("Controls", d.controls, (c) => c.description);
section(
  "Capabilities (MITRE mitigations and cap-* specialisations; status is set on these in data/status.yaml)",
  // Parents first, each followed by its specialisations.
  capabilities.filter((c) => !c.parent).flatMap((c) => [c, ...specialisationsOf(c.id)]),
  (c) => (c.parent ? c.implementation : c.description),
  (c) => {
    const surfaces = Object.entries(c.surfaces).filter(([, s]) => s.applies).map(([id]) => id).join(", ");
    const kind = c.parent ? `specialisation of ${c.parent}` : specialisationsOf(c.id).length ? `parent of ${specialisationsOf(c.id).map((s) => s.id).join(", ")}` : "MITRE";
    return `${kind} | supports: ${c.controls.map((id) => controlTitle.get(id) ?? id).join(", ")} | surfaces: ${surfaces}${d.status?.[c.id]?.status ? ` | status: ${d.status[c.id].status}` : ""}`;
  },
);
section("Risks", d.risks, (r) => r.shortDescription);
