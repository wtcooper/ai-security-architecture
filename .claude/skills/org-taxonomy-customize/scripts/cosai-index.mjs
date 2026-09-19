#!/usr/bin/env node
// Lists CoSAI controls, the capability catalogue (MITRE mitigations, with authored cap-*
// specialisations marked under their parent), technology categories and risks (or tools with
// the capabilities they may be assessed against) from the compiled dataset, so a mapping
// session works from live ids rather than memory.
//   node cosai-index.mjs            -> everything
//   node cosai-index.mjs mcp        -> entries whose id/title/text mention "mcp"
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
const capabilities = d.mitigations; // a capability is a MITRE mitigation or a cap-* specialisation of one
const byId = new Map(capabilities.map((c) => [c.id, c]));
const specialisationsOf = (id) => capabilities.filter((c) => c.parent === id);
// Technology categories map to the MITRE parent; a specialisation inherits its parent's.
const categoriesFor = (c) => d.technologyCategories.filter((t) => t.mitigationMappings.some((m) => m.mitigation === (c.parent ?? c.id)));
const label = (c) => `${c.title} (${c.id}${c.parent ? `, specialisation of ${c.parent}` : ""})`;

if (q === "tools") {
  // Mirrors checkOrgToolCapabilities: a product is assessed only against capabilities pinned
  // on its architecture — the pinned id itself, the MITRE parent of a pinned specialisation,
  // or a specialisation of a pinned parent.
  const arch = new Map(d.archetypes.map((a) => [a.id, a]));
  const only = process.argv[3];
  for (const t of d.tools) {
    if (only && t.id !== only) continue;
    const a = arch.get(t.architecture);
    const pins = a?.mitigations ?? [];
    const pinned = new Set(pins.flatMap((id) => [id, byId.get(id)?.parent].filter(Boolean)));
    console.log(`\n${t.id} — ${t.name} (${t.vendor}) on ${t.architecture}`);
    for (const c of capabilities) {
      let via;
      if (pins.includes(c.id)) via = "pinned";
      else if (pinned.has(c.id)) via = `parent of pinned ${specialisationsOf(c.id).filter((s) => pins.includes(s.id)).map((s) => s.id).join(", ")}`;
      else if (c.parent && pinned.has(c.parent)) via = `specialisation of pinned ${c.parent}`;
      if (via) console.log(`  ${label(c)} — ${via}`);
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
  "Capabilities (MITRE mitigations and cap-* specialisations; the only layer that carries status)",
  // Parents first, each followed by its specialisations.
  capabilities.filter((c) => !c.parent).flatMap((c) => [c, ...specialisationsOf(c.id)]),
  (c) => (c.parent ? c.implementation : c.description),
  (c) => {
    const surfaces = Object.entries(c.surfaces).filter(([, s]) => s.applies).map(([id]) => id).join(", ");
    const kind = c.parent ? `specialisation of ${c.parent}` : specialisationsOf(c.id).length ? `parent of ${specialisationsOf(c.id).map((s) => s.id).join(", ")}` : "MITRE";
    return `${kind} | supports: ${c.controls.map((id) => controlTitle.get(id) ?? id).join(", ")} | technology: ${categoriesFor(c).map((t) => t.title).join(", ") || "none"} | surfaces: ${surfaces}`;
  },
);
section("Technology categories (tech-*; no status)", d.technologyCategories, (c) => c.description, (c) => {
  const parents = c.mitigationMappings.map((m) => m.mitigation);
  const realises = capabilities.filter((cap) => parents.includes(cap.parent ?? cap.id)).map((cap) => cap.id);
  return `realises: ${realises.join(", ") || "none"}`;
});
section("Risks", d.risks, (r) => r.shortDescription);
