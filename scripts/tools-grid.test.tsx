import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { GridView } from "../src/components/tooling/GridView";
import { rowsFor, cellFor } from "../src/components/tooling/model";
import { dataset, controlById, mitigationById, toolsForArchetype } from "../src/lib/data";
import { orgEntriesFor } from "../src/lib/frameworks";
import { renameMitigationKeys } from "./rename-mitigations";

const architecture = dataset.archetypes.find((a) => a.mitigations.includes("AML.M0020") && toolsForArchetype(a.id).length > 1)!;
const tools = toolsForArchetype(architecture.id);
const groups = rowsFor(architecture.id);
const render = (overlay: boolean, products = tools) => renderToStaticMarkup(
  <GridView archetypeId={architecture.id} tools={products} groups={groups} overlay={overlay} onPickTool={() => {}} />,
);

// Only names/links belonging to the general taxonomy, excluding organization and product links.
const taxonomyLinks = (html: string) => [...html.matchAll(/href="(\/(?:controls|mitigations|capabilities)\?[^\"]+)"/g)].map((m) => m[1]);

test("all architecture rows start from CoSAI controls and preserve every pinned mitigation", () => {
  for (const arch of dataset.archetypes) {
    const groups = rowsFor(arch.id);
    const allRows = groups.flatMap((g) => g.rows);
    assert.deepEqual(new Set(allRows.flatMap((r) => r.mitigations)), new Set(arch.mitigations), arch.id);
    assert.equal(new Set(allRows.map((r) => r.id)).size, allRows.length);
    for (const group of groups) {
      for (let i = 0; i < group.rows.length;) {
        const first = group.rows[i];
        const control = controlById.get(first.controlId)!;
        assert.ok(control);
        assert.equal(control.category, group.id);
        assert.equal(first.label, control.title);
        assert.ok(first.controlSpan > 0);
        const rows = group.rows.slice(i, i + first.controlSpan);
        for (const [j, row] of rows.entries()) {
          assert.equal(row.controlId, first.controlId);
          assert.equal(row.mitigations.length, 1, "product evidence stays tied to one method");
          assert.ok(mitigationById.get(row.mitigations[0])!.controls.includes(control.id));
          if (j) assert.equal(row.controlSpan, 0);
        }
        i += first.controlSpan;
      }
    }
  }
});

test("org overlay retains all three taxonomy columns and adds mappings, product columns and status", () => {
  const off = render(false);
  const on = render(true);
  for (const html of [off, on]) {
    const header = html.match(/<thead[\s\S]*?<\/thead>/)![0];
    const labels = [...header.matchAll(/<th\b[^>]*>([^<]+)<\/th>/g)].map((m) => m[1]);
    assert.deepEqual(labels.slice(0, 3), ["CoSAI controls", "Mitigations", "Technology capabilities"]);
    assert.ok(!html.includes("Reference mitigation"));
    assert.ok(!html.includes("Enterprise mitigations"));
    assert.ok(!html.includes("MITRE mitigation names"));
  }
  assert.deepEqual(taxonomyLinks(off), taxonomyLinks(on));
  assert.ok(!off.includes("Tools and status"));
  assert.ok(!off.includes("vendor docs"));
  assert.ok(!off.includes("/frameworks?"));
  assert.ok(on.includes("Tools and status"));
  assert.ok(on.includes("vendor docs"));
  assert.ok(on.includes("/frameworks?"));
  assert.ok(on.includes("Available") || on.includes("Not available"));
  assert.ok(on.includes("No technology category mapped"), "unmapped methods stay visible");
  if (dataset.meta.org.example) {
    const cells = [...on.matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]);
    for (const path of ["/controls?control=controlUserDataManagement", "/mitigations?mitigation=AML.M0020", "/capabilities?capability=tech-dlp"]) {
      assert.ok(cells.some((cell) => cell.includes(path) && cell.includes("EX-DLP")), path);
    }
  }
});

test("taxonomy still renders when the architecture has no product records", () => {
  for (const overlay of [false, true]) {
    const html = render(overlay, []);
    assert.ok(taxonomyLinks(html).length);
    assert.ok(!html.includes('colSpan="0"'));
    assert.ok(!html.includes("Tools and status"));
  }
});

test("each product status and vendor record applies to exactly the displayed mitigation", () => {
  for (const row of groups.flatMap((g) => g.rows)) for (const tool of tools) {
    const cell = cellFor(tool, row);
    assert.equal(cell.parts.length, 1);
    assert.equal(cell.parts[0].mitigation, row.mitigations[0]);
    assert.equal(cell.parts[0].control, tool.controls.find((c) => c.mitigation === row.mitigations[0]));
  }
});

test("technology org mappings are explicit and survive the legacy schema migration", () => {
  if (dataset.meta.org.example) {
    const dlp = orgEntriesFor("capabilities", "tech-dlp").map((e) => e.id);
    assert.ok(dlp.includes("EX-DLP"));
    assert.ok(!dlp.includes("EX-GUARDRAILS"), "sharing broad AI guardrails cannot manufacture an injection-defense mapping");
  }
  const source = "entries:\n  - mitigations: [AML.M0020]\n    capabilities: [tech-dlp, tech-llm-guardrails]\n";
  assert.equal(renameMitigationKeys(source), source);
  assert.equal(renameMitigationKeys("capabilities: [AML.M0020]\n"), "mitigations: [AML.M0020]\n");
  assert.throws(() => renameMitigationKeys("capabilities: [tech-dlp, AML.M0020]\n"), /Mixed technology/);
});
