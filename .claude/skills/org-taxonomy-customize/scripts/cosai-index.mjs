#!/usr/bin/env node
// Lists CoSAI controls, the cap-* capability catalogue, technology categories, mitigations and
// risks (or tools with the capabilities they may be assessed against) from the compiled dataset,
// so a mapping session works from live ids rather than memory.
//   node cosai-index.mjs            -> everything
//   node cosai-index.mjs mcp        -> entries whose id/title/description mention "mcp"
//   node cosai-index.mjs tools      -> tools with the capabilities each may be assessed against
//   node cosai-index.mjs tools toolClaudeCode -> one tool's eligible capability set
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
const categoryTitle = new Map(d.technologyCategories.map((c) => [c.id, c.title]));

if (q === "tools") {
  // Mirrors checkOrgToolCapabilities: a product is assessed only against capabilities that
  // deliver a control supported by a mitigation pinned on its architecture.
  const arch = new Map(d.archetypes.map((a) => [a.id, a]));
  const only = process.argv[3];
  for (const t of d.tools) {
    if (only && t.id !== only) continue;
    const a = arch.get(t.architecture);
    const pinned = new Set(d.mitigations.filter((m) => a?.mitigations.includes(m.id)).flatMap((m) => m.controls));
    console.log(`\n${t.id} — ${t.name} (${t.vendor}) on ${t.architecture}`);
    for (const c of d.capabilities.filter((c) => c.controls.some((id) => pinned.has(id)))) {
      const via = c.controls.filter((id) => pinned.has(id)).map((id) => controlTitle.get(id) ?? id);
      console.log(`  ${c.title} (${c.id}) via ${via.join(", ")}`);
    }
  }
  process.exit(0);
}

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
  "Capabilities (cap-*; the only layer that carries status)",
  d.capabilities,
  (c) => c.description,
  (c) => {
    const surfaces = Object.entries(c.surfaces).filter(([, s]) => s.applies).map(([id]) => id).join(", ");
    return `delivers: ${c.controls.map((id) => controlTitle.get(id) ?? id).join(", ")} | technology: ${c.realization.technology.map((id) => categoryTitle.get(id) ?? id).join(", ") || "none"} | surfaces: ${surfaces}`;
  },
);
section("Technology categories (tech-*; no status)", d.technologyCategories, (c) => c.description, (c) => {
  const realises = d.capabilities.filter((cap) => cap.realization.technology.includes(c.id)).map((cap) => cap.id);
  return `realises: ${realises.join(", ") || "none"}`;
});
section("Mitigations", d.mitigations, (c) => c.description);
section("Risks", d.risks, (r) => r.shortDescription);
