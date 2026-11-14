import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { EnablePanel } from "../src/components/enable/EnablePanel";
import { ArchitecturesBrowser } from "../src/components/reference/ArchitecturesBrowser";
import { ProductSettings } from "../src/components/enable/ProductSettings";
import { coverageWord } from "../src/components/enable/labels";
import { baselineNotPinned, controlGroups } from "../src/components/enable/model";
import { dataset, enablement, isBaseline, productsForArchetype, toolsForArchetype } from "../src/lib/data";

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

test("every pinned capability falls in exactly one security domain, named for the architecture's surface", () => {
  for (const arch of dataset.archetypes) {
    const groups = controlGroups(arch);
    assert.deepEqual(groups.flatMap((g) => g.capabilities.map((m) => m.id)).sort(), [...arch.mitigations].sort(), arch.id);
    for (const g of groups) {
      const authored = enablement.groups.find((x) => x.id === g.id)!;
      assert.equal(g.title, authored.surfaces?.[arch.surface]?.title ?? authored.title, `${arch.id}: ${g.id}`);
      // Rows count up with the chips on the drawing.
      const pins = g.capabilities.map((m) => arch.mitigations.indexOf(m.id));
      assert.deepEqual(pins, [...pins].sort((x, y) => x - y), `${arch.id}: ${g.id} is in pin order`);
    }
    // The baseline is either drawn here or named beneath the table, never dropped.
    const named = new Set([...arch.mitigations.filter(isBaseline), ...baselineNotPinned(arch).map((m) => m.id)]);
    assert.deepEqual([...named].sort(), [...enablement.baseline].sort(), arch.id);
  }
});

test("the tools step shows one pill per product and the picked product's settings, each naming its chips", () => {
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
  // Every registry product has its table today; a newly onboarded one may not, so strip one.
  const arch = dataset.archetypes.find((a) => productsForArchetype(a.id)[0]?.kind === "tool")!;
  const products = productsForArchetype(arch.id).map((p, i) => (i === 0 && p.kind === "tool" ? { ...p, settings: [] } : p));
  const product = products.find((p) => p.kind === "tool" && !p.settings.length)!;
  const html = renderToStaticMarkup(
    <ProductSettings archetype={arch} products={products} selected={product.id} onPick={() => {}} lit={null} onLight={() => {}} />,
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

test("the Enable tab is two steps: the controls unfolded by domain, numbered as on the drawing, and the products folded", () => {
  const panel = (arch: (typeof dataset.archetypes)[number], open: string | null) =>
    renderToStaticMarkup(
      <EnablePanel archetype={arch} open={open} onOpen={() => {}} onShowDrawing={() => {}} tool={null} focus={null} onPickTool={() => {}} />,
    );
  for (const arch of dataset.archetypes) {
    const html = panel(arch, null);
    assert.match(html, /id="controls"[^>]*><button[^>]*aria-expanded="true"/, `${arch.id}: controls open`);
    assert.match(html, /id="tools"[^>]*><button[^>]*aria-expanded="false"/, `${arch.id}: products folded`);
    assert.equal([...html.matchAll(/aria-controls="/g)].length, 2, `${arch.id}: two steps`);
    assert.doesNotMatch(html, /role="tab"/, `${arch.id}: no product is open`);
    for (const g of controlGroups(arch)) assert.match(html, new RegExp(`id="group-${g.id}"`), `${arch.id}: ${g.id} has a band`);
    assert.equal([...html.matchAll(/id="capability-/g)].length, arch.mitigations.length, `${arch.id}: a row per pinned capability`);
    for (const [i, id] of arch.mitigations.entries()) {
      const row = html.slice(html.indexOf(`id="capability-${id}"`));
      assert.ok(row.slice(0, row.indexOf("</li>")).includes(`>${i + 1}</span>`), `${arch.id}: ${id} is chip ${i + 1}`);
    }
    assert.equal([...html.matchAll(/>Every AI deployment</g)].length, arch.mitigations.filter(isBaseline).length, `${arch.id}: baseline rows are tagged`);
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
