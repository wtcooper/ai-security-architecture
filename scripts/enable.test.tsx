import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { EnablePanel } from "../src/components/enable/EnablePanel";
import { ArchitecturesBrowser } from "../src/components/reference/ArchitecturesBrowser";
import { ToolsMatrix } from "../src/components/enable/ToolsMatrix";
import { coverageWord } from "../src/components/enable/labels";
import { pinnedByLayer } from "../src/components/enable/model";
import { dataset, enablement, layerFor, toolsForArchetype, additionsFor } from "../src/lib/data";

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const page = (query = "") =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value="/reference">
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>
          <ArchitecturesBrowser />
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );

test("every pinned capability falls in exactly one layer, and use-case additions are what is left", () => {
  const foundations = new Set(enablement.foundations.flatMap((g) => g.mitigations));
  for (const arch of dataset.archetypes) {
    const layers = pinnedByLayer(arch);
    assert.deepEqual(layers.flatMap((l) => l.capabilities.map((m) => m.id)).sort(), [...arch.mitigations].sort(), arch.id);
    const baseline = new Set(enablement.surfaces[arch.surface].mitigations);
    for (const m of additionsFor(arch)) {
      assert.ok(!foundations.has(m.id) && !baseline.has(m.id), `${arch.id}: ${m.id} repeats an earlier layer`);
      assert.equal(layerFor(m.id, arch), "useCase");
    }
  }
});

test("the tools grid has one row per pinned capability and one word per cell", () => {
  const arch = dataset.archetypes.find((a) => toolsForArchetype(a.id).length > 1)!;
  const tools = toolsForArchetype(arch.id);
  const html = renderToStaticMarkup(<ToolsMatrix archetype={arch} tools={tools} selected={null} onPick={() => {}} />);
  assert.equal([...html.matchAll(/<th scope="row"/g)].length, arch.mitigations.length);
  assert.equal([...html.matchAll(/<td /g)].length, arch.mitigations.length * tools.length);
  assert.doesNotMatch(html, /Settable|3rd-party|Not offered/, "the registry's finer grades collapse to three words");
});

test("coverage collapses to Built-in, Partial and Not in tool", () => {
  assert.equal(coverageWord("native"), "builtIn");
  assert.equal(coverageWord("partial"), "partial");
  assert.equal(coverageWord("external"), "notInTool");
  assert.equal(coverageWord("none"), "notInTool");
  assert.equal(coverageWord(undefined), "unverified");
});

test("the Enable tab walks four steps and lists every pinned capability once, numbered as on the drawing", () => {
  for (const arch of dataset.archetypes) {
    const html = renderToStaticMarkup(
      <EnablePanel archetype={arch} open={null} onOpen={() => {}} onShowDrawing={() => {}} tool={null} focus={null} onPickTool={() => {}} />,
    );
    for (const id of ["foundations", "surface", "use-case", "tools"]) assert.match(html, new RegExp(`id="${id}"`), arch.id);
    const rows = [...html.matchAll(/id="capability-([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual([...rows].sort(), [...arch.mitigations].sort(), `${arch.id}: one row per chip`);
    assert.match(html, /Status/);
  }
});

test("an architecture opens on its overview; a tab or product link opens Enable", () => {
  const arch = dataset.archetypes.find((a) => toolsForArchetype(a.id).length)!;
  assert.doesNotMatch(page(`archetype=${arch.id}`), /id="tools"/);
  assert.match(page(`archetype=${arch.id}&tab=enable`), /id="tools"/);
  const tool = toolsForArchetype(arch.id)[0];
  const linked = page(`tool=${tool.id}`);
  assert.match(linked, /id="tools"/);
  assert.match(linked, new RegExp(tool.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(linked, /role="tab"[^>]*>Risks/);
});
