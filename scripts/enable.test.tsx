import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { EnablePanel } from "../src/components/enable/EnablePanel";
import { ArchitecturesBrowser } from "../src/components/reference/ArchitecturesBrowser";
import { ProductSettings } from "../src/components/enable/ProductSettings";
import { coverageWord } from "../src/components/enable/labels";
import { pinnedByLayer } from "../src/components/enable/model";
import { dataset, enablement, layerFor, productsForArchetype, toolsForArchetype, additionsFor } from "../src/lib/data";

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

test("step 4 shows one pill per product and the picked product's settings, each naming its chips", () => {
  const arch = dataset.archetypes.find((a) => productsForArchetype(a.id).some((p) => p.id === "toolClaudeCode"))!;
  const products = productsForArchetype(arch.id);
  const html = renderToStaticMarkup(
    <ProductSettings archetype={arch} products={products} selected="toolClaudeCode" onPick={() => {}} lit={null} onLight={() => {}} />,
  );
  assert.equal([...html.matchAll(/role="tab"/g)].length, products.length, "a pill per product");
  const cc = products.find((p) => p.id === "toolClaudeCode")!;
  assert.equal([...html.matchAll(/id="setting-toolClaudeCode-/g)].length, cc.settings.length, "a row per setting");
  for (const s of cc.settings) for (const id of s.mitigations) {
    assert.ok(html.includes(`>${arch.mitigations.indexOf(id) + 1}</button>`), `${s.id} shows chip for ${id}`);
  }
  // Nothing is recorded in data/status.yaml, so every row reads Not enabled and the page says where to record it.
  assert.equal([...html.matchAll(/>Not enabled</g)].length, cc.settings.length);
  assert.match(html, /data\/status\.yaml/);
  assert.doesNotMatch(html, /Built-in|Not in tool/, "the capability grid is gone");
});

test("a product not yet catalogued setting by setting falls back to its capability record", () => {
  const arch = dataset.archetypes.find((a) => productsForArchetype(a.id).some((p) => !p.settings.length))!;
  const product = productsForArchetype(arch.id).find((p) => !p.settings.length)!;
  const html = renderToStaticMarkup(
    <ProductSettings archetype={arch} products={productsForArchetype(arch.id)} selected={product.id} onPick={() => {}} lit={null} onLight={() => {}} />,
  );
  assert.match(html, /not catalogued row by row yet/);
});

test("coverage collapses to Built-in, Partial and Not in tool", () => {
  assert.equal(coverageWord("native"), "builtIn");
  assert.equal(coverageWord("partial"), "partial");
  assert.equal(coverageWord("external"), "notInTool");
  assert.equal(coverageWord("none"), "notInTool");
  assert.equal(coverageWord(undefined), "unverified");
});

test("the Enable tab opens on four folded steps, and every pinned capability unfolds its own step, numbered as on the drawing", () => {
  const panel = (arch: (typeof dataset.archetypes)[number], open: string | null) =>
    renderToStaticMarkup(
      <EnablePanel archetype={arch} open={open} onOpen={() => {}} onShowDrawing={() => {}} tool={null} focus={null} onPickTool={() => {}} />,
    );
  for (const arch of dataset.archetypes) {
    const folded = panel(arch, null);
    for (const id of ["foundations", "surface", "use-case", "tools"]) assert.match(folded, new RegExp(`id="${id}"`), arch.id);
    assert.doesNotMatch(folded, /id="capability-/, `${arch.id}: steps open folded`);
    assert.equal([...folded.matchAll(/aria-expanded="false"/g)].length, 4);
    for (const [i, id] of arch.mitigations.entries()) {
      const html = panel(arch, id);
      assert.match(html, new RegExp(`id="capability-${id.replace(/\./g, "\\.")}"`), `${arch.id}: ${id} has a row`);
      assert.match(html, /Status/);
      assert.ok(html.includes(`>${i + 1}</span>`), `${arch.id}: ${id} is chip ${i + 1}`);
    }
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

test("a cloud architecture lists its clouds first, binds every component and covers every pinned capability", () => {
  for (const cloud of dataset.clouds) {
    for (const impl of cloud.implementations) {
      const arch = dataset.archetypes.find((a) => a.id === impl.architecture)!;
      const products = productsForArchetype(arch.id);
      assert.equal(products[0].kind, "cloud", `${arch.id}: clouds lead`);
      const product = products.find((p) => p.id === cloud.id)!;
      const delivered = new Set(product.settings.flatMap((s) => s.mitigations));
      for (const id of arch.mitigations) assert.ok(delivered.has(id), `${cloud.id} ${arch.id}: ${id} has a row`);
      const html = renderToStaticMarkup(
        <ProductSettings archetype={arch} products={products} selected={cloud.id} onPick={() => {}} lit={null} onLight={() => {}} />,
      );
      assert.match(html, new RegExp(`What plays each component on ${cloud.short}`));
      // Matched as React escapes text, so a service name may carry any character.
      const escape = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
      for (const b of impl.bindings) assert.ok(html.includes(escape(b.service)), `${cloud.id} ${arch.id}: ${b.block} binding shown`);
    }
  }
});
