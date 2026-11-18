#!/usr/bin/env node
// Lists CoSAI controls, the control catalogue (MITRE mitigations, with authored cap-*
// specialisations marked under their parent) and risks from the compiled dataset, so a mapping
// session works from live ids rather than memory. For each catalogue control it also shows the
// status worked out from data/org/controls.yaml and the organisation's controls mapped to it.
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
const capabilities = d.mitigations; // a catalogue control is a MITRE mitigation or a cap-* specialisation of one
const specialisationsOf = (id) => capabilities.filter((c) => c.parent === id);
// The organisation's own controls (data/org/controls.yaml) that map to one catalogue control.
const yours = (id) => (d.orgControls ?? []).filter((o) => o.maps.includes(id)).map((o) => `${o.name}${o.status ? ` (${o.status})` : ""}`);

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
section("CoSAI controls", d.controls, (c) => c.description);
section(
  "Controls (MITRE mitigations and cap-* specialisations; map your own controls to these in data/org/controls.yaml)",
  // Parents first, each followed by its specialisations.
  capabilities.filter((c) => !c.parent).flatMap((c) => [c, ...specialisationsOf(c.id)]),
  (c) => (c.parent ? c.implementation : c.description),
  (c) => {
    const surfaces = Object.entries(c.surfaces).filter(([, s]) => s.applies).map(([id]) => id).join(", ");
    const kind = c.parent ? `specialisation of ${c.parent}` : specialisationsOf(c.id).length ? `parent of ${specialisationsOf(c.id).map((s) => s.id).join(", ")}` : "MITRE";
    const mine = yours(c.id);
    return `${kind} | supports CoSAI controls: ${c.controls.map((id) => controlTitle.get(id) ?? id).join(", ")} | surfaces: ${surfaces}${d.status?.[c.id]?.status ? ` | status: ${d.status[c.id].status}` : ""}${mine.length ? ` | yours: ${mine.join("; ")}` : ""}`;
  },
);
section("Risks", d.risks, (r) => r.shortDescription);
