import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { GridView } from "../src/components/tooling/GridView";
import { rowsFor, cellFor } from "../src/components/tooling/model";
import { dataset, capabilityById, controlById, mitigationById, toolsForArchetype, orgCapabilities } from "../src/lib/data";
import { orgEntriesFor } from "../src/lib/frameworks";
import { renameMitigationKeys } from "./rename-mitigations";

const architecture = dataset.archetypes.find((a) => a.mitigations.includes("AML.M0020") && toolsForArchetype(a.id).length > 1)!;
const tools = toolsForArchetype(architecture.id);
const groups = rowsFor(architecture.id);
const render = (overlay: boolean, products = tools) => renderToStaticMarkup(
  <GridView archetypeId={architecture.id} tools={products} groups={groups} overlay={overlay} onPickTool={() => {}} />,
);

const taxonomyButtons = (html: string) => [...html.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);

test("all architecture rows are capabilities the drawing calls for and preserve every pinned mitigation", () => {
  for (const arch of dataset.archetypes) {
    const groups = rowsFor(arch.id);
    const allRows = groups.flatMap((g) => g.rows);
    assert.deepEqual(new Set(allRows.flatMap((r) => r.mitigations)), new Set(arch.mitigations), arch.id);
    assert.equal(new Set(allRows.map((r) => r.id)).size, allRows.length);
    for (const group of groups) {
      for (const row of group.rows) {
        const capability = capabilityById.get(row.capabilityId)!;
        assert.ok(capability);
        assert.equal(controlById.get(capability.controls[0])!.category, group.id);
        assert.equal(row.label, capability.title);
        assert.equal(row.id, capability.id, "one row per capability");
        assert.deepEqual(row.categories, capability.realization.technology);
        assert.ok(row.mitigations.length);
        for (const id of row.mitigations) assert.ok(mitigationById.get(id)!.controls.some((c) => capability.controls.includes(c)));
      }
    }
  }
});

test("org overlay retains two compact taxonomy columns and adds only product columns and status", () => {
  const off = render(false);
  const on = render(true);
  for (const html of [off, on]) {
    const header = html.match(/<thead[\s\S]*?<\/thead>/)![0];
    const labels = [...header.matchAll(/<th\b[^>]*>([^<]+)<\/th>/g)].map((m) => m[1]);
    assert.deepEqual(labels.slice(0, 2), ["Capabilities", "Technology categories"]);
    assert.ok(!html.includes("Reference mitigation"));
    assert.ok(!html.includes("Enterprise mitigations"));
    assert.ok(!html.includes("MITRE mitigation names"));
  }
  assert.deepEqual(taxonomyButtons(off), taxonomyButtons(on).filter((name) => !tools.some((t) => t.name === name)));
  assert.ok(!off.includes("Tools and status"));
  assert.ok(!off.includes("vendor docs"));
  assert.ok(!off.includes("/frameworks?"));
  assert.ok(on.includes("Tools and status"));
  assert.ok(on.includes("vendor docs"));
  assert.ok(!on.includes("/frameworks?"));
  assert.ok(on.includes("Available") || on.includes("Not available"));
  for (const record of orgCapabilities) {
    assert.ok(!on.includes(record.title), "org names belong in details: " + record.title);
    assert.ok(!on.includes(record.id), "org identifiers belong in details: " + record.id);
  }
});

test("taxonomy still renders when the architecture has no product records", () => {
  for (const overlay of [false, true]) {
    const html = render(overlay, []);
    assert.ok(taxonomyButtons(html).length);
    assert.ok(!html.includes('colSpan="0"'));
    assert.ok(!html.includes("Tools and status"));
  }
});

test("product details preserve the evidence for every underlying mitigation", () => {
  for (const row of groups.flatMap((g) => g.rows)) for (const tool of tools) {
    const cell = cellFor(tool, row);
    assert.deepEqual(cell.parts.map((p) => p.mitigation), row.mitigations);
    for (const part of cell.parts) assert.equal(part.control, tool.controls.find((c) => c.mitigation === part.mitigation));
    if (cell.parts.length > 1) assert.equal(cell.decisive, undefined, "composite coverage must not link to a single mitigation’s documentation");
  }
});

test("org capability mappings are explicit and survive the legacy schema migration", () => {
  if (dataset.meta.org.example) {
    const dlp = orgEntriesFor("capabilities", "cap-ai-data-protection").map((e) => e.id);
    assert.ok(dlp.includes("EX-DLP"));
    assert.ok(!dlp.includes("EX-GUARDRAILS"), "guardrails deliver a different capability");
  }
  const source = "entries:\n  - mitigations: [AML.M0020]\n    capabilities: [tech-dlp, tech-llm-guardrails]\n";
  assert.equal(renameMitigationKeys(source), source);
  assert.equal(renameMitigationKeys("capabilities: [AML.M0020]\n"), "mitigations: [AML.M0020]\n");
  assert.throws(() => renameMitigationKeys("capabilities: [tech-dlp, AML.M0020]\n"), /Mixed technology/);
});

test("composite product coverage cannot hide a missing or differently implemented mitigation", () => {
  const row = groups.flatMap((g) => g.rows).find((r) => r.mitigations.length > 1)!;
  const base = tools[0].controls[0];
  const native = { ...tools[0], controls: row.mitigations.map((mitigation) => ({ ...base, mitigation, coverage: "native" as const })) };
  assert.equal(cellFor(native, row).coverage, "native");
  assert.equal(cellFor(native, row).mixed, false);
  const missing = cellFor({ ...native, controls: native.controls.slice(1) }, row);
  assert.equal(missing.coverage, "unknown");
  assert.equal(missing.mixed, true);
  assert.deepEqual(missing.missing, [row.mitigations[0]]);
  const mixed = cellFor({ ...native, controls: native.controls.map((c, i) => ({ ...c, coverage: i ? "native" : "external" })) }, row);
  assert.equal(mixed.mixed, true);
  assert.equal(mixed.decisive, undefined);
});
