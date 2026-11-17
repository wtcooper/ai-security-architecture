import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { EnablePanel } from "../src/components/enable/EnablePanel";
import { PatternPage } from "../src/components/patterns/PatternPage";
import { PatternFinder } from "../src/components/patterns/PatternFinder";
import { ComponentList } from "../src/components/reference/ArchetypeDetail";
import HomePage from "../src/app/page";
import { CloudsBrowser } from "../src/components/cloud/CloudsBrowser";
import { CloudComparison } from "../src/components/cloud/CloudViews";
import { cloudOptionsForControl, cloudProductsFor, cloudSlug, controlPlaneOptions, optionsFor } from "../src/components/cloud/model";
import { CapabilityDetail } from "../src/components/capabilities/CapabilityDetail";
import { ProductSettings } from "../src/components/enable/ProductSettings";
import { coverageWord } from "../src/components/enable/labels";
import { baselineNotPinned, controlGroups } from "../src/components/enable/model";
import { dataset, enablement, isBaseline, productsForArchetype, toolsForArchetype } from "../src/lib/data";

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const page = (archetypeId: string, query = "") =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value="/patterns/x">
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>
          <PatternPage archetypeId={archetypeId} />
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );

test("every pinned control falls in exactly one NIST CSF category, shown in CSF order", () => {
  for (const arch of dataset.archetypes) {
    const groups = controlGroups(arch);
    assert.deepEqual(groups.flatMap((g) => g.capabilities.map((m) => m.id)).sort(), [...arch.mitigations].sort(), arch.id);
    for (const g of groups) {
      const authored = enablement.groups.find((x) => x.id === g.id)!;
      assert.equal(g.title, dataset.frameworkEntries["nist-csf"][g.id].label, `${arch.id}: ${g.id} carries the CSF name`);
      assert.equal(g.blurb, authored.surfaces?.[arch.surface]?.blurb ?? authored.blurb, `${arch.id}: ${g.id}`);
      // Rows count up with the chips on the drawing.
      const pins = g.capabilities.map((m) => arch.mitigations.indexOf(m.id));
      assert.deepEqual(pins, [...pins].sort((x, y) => x - y), `${arch.id}: ${g.id} is in pin order`);
    }
    const order = groups.map((g) => enablement.groups.findIndex((x) => x.id === g.id));
    assert.deepEqual(order, [...order].sort((x, y) => x - y), `${arch.id}: families in CSF order`);
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

test("every control in the catalogue has one CSF category, and the Frameworks crosswalk is the same mapping", () => {
  const family = new Map(enablement.groups.flatMap((g) => g.mitigations.map((id) => [id, g.id] as const)));
  assert.equal(family.size, enablement.groups.reduce((n, g) => n + g.mitigations.length, 0), "no control is listed twice");
  for (const m of dataset.mitigations) {
    assert.ok(family.has(m.id), `${m.id} has a CSF category`);
    assert.deepEqual(dataset.authoredMappings["nist-csf"].mitigations?.[m.id], [family.get(m.id)], `${m.id} crosswalk`);
  }
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
    assert.equal([...html.matchAll(/id="control-/g)].length, arch.mitigations.length, `${arch.id}: a row per pinned capability`);
    for (const [i, id] of arch.mitigations.entries()) {
      const row = html.slice(html.indexOf(`id="control-${id}"`));
      assert.ok(row.slice(0, row.indexOf("</li>")).includes(`>${i + 1}</span>`), `${arch.id}: ${id} is chip ${i + 1}`);
    }
    assert.equal([...html.matchAll(/>Every AI deployment</g)].length, arch.mitigations.filter(isBaseline).length, `${arch.id}: baseline rows are tagged`);
    assert.match(html, /Status/);
  }
});

test("a pattern opens on Enable; a tab link opens that tab and a product link opens its settings", () => {
  const arch = dataset.archetypes.find((a) => toolsForArchetype(a.id).length)!;
  const home = page(arch.id);
  assert.match(home, /id="controls"/, "Enable is the default tab");
  assert.match(home, /Use this pattern when: /);
  assert.ok(home.includes(arch.useWhen.replace(/'/g, "&#x27;")), "the header says when the pattern applies");
  assert.match(home, /role="tab"[^>]*aria-selected="true"[^>]*>Enable/);
  assert.doesNotMatch(page(arch.id, "tab=overview"), /id="controls"/);
  assert.match(page(arch.id, "tab=risks"), /Risks on this pattern/);
  assert.doesNotMatch(page(arch.id, "tab=risks"), /Boundary crossings/, "risks and flows are separate tabs");
  assert.match(page(arch.id, "tab=flows"), /Boundary crossings/);
  assert.doesNotMatch(page(arch.id, "tab=flows"), /Risks on this pattern/);
  assert.match(page(arch.id, "tab=incidents"), /incident/i);
  // The drawing comes first and the tabs sit beneath it; there is one drawing, with no second view to switch to.
  assert.ok(home.indexOf('id="pattern-drawing"') < home.indexOf('id="pattern-tabs"'), "the tabs are under the drawing");
  assert.doesNotMatch(home, />Detailed</);
  // The mouse is the page's until the drawing is clicked into; the drawing says so.
  assert.match(home, /Click the drawing to zoom and pan with the mouse/);
  assert.doesNotMatch(home, /data-drawing="boundaries" data-active/, "the drawing does not take the wheel until clicked");
  const tool = toolsForArchetype(arch.id)[0];
  const linked = page(arch.id, `tool=${tool.id}`);
  assert.match(linked, /id="tools"/);
  assert.match(linked, new RegExp(`id="setting-${tool.id}-|not catalogued row by row`), "the product's settings are open");
});

test("nothing version 1 showed about a pattern is missing: its summary, how it works, examples, deviations and sources", () => {
  const text = (blocks: unknown) => (Array.isArray(blocks) ? blocks.map((b) => (Array.isArray(b) ? b.join(" ") : String(b))).join(" ") : String(blocks ?? "")).replace(/\s+/g, " ").trim();
  const seen = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
  for (const arch of dataset.archetypes) {
    const enable = seen(page(arch.id));
    assert.ok(enable.includes(text(arch.summary).slice(0, 80)), `${arch.id}: the summary is in the header`);
    for (const e of arch.exemplars ?? []) assert.ok(enable.includes(e.name), `${arch.id}: example ${e.name} is named in the header`);
    const how = page(arch.id, "tab=overview");
    assert.ok(seen(how).includes(text(arch.description).slice(0, 80)), `${arch.id}: how it works`);
    // The other sections fold; each is present with its count, and opens to the full text.
    assert.match(how, /Why this is its own pattern/, arch.id);
    if (arch.exemplars?.length) assert.match(how, new RegExp(`Examples[^<]*(<[^>]+>\\s*)*${arch.exemplars.length}`), `${arch.id}: examples section`);
    if (arch.deviations?.length) assert.match(how, /Where this drawing departs from the catalogue/, `${arch.id}: deviations section`);
    assert.match(how, /Sources/, arch.id);
  }
});

test("the Risks tab lists every risk of the pattern, and the Incidents tab every incident on it", () => {
  for (const arch of dataset.archetypes) {
    const risks = page(arch.id, "tab=risks");
    for (const id of arch.risks) assert.match(risks, new RegExp(`id="risk-${id}"`), `${arch.id}: ${id} is listed`);
    assert.equal([...risks.matchAll(/id="risk-/g)].length, arch.risks.length, arch.id);
    const incidents = page(arch.id, "tab=incidents");
    for (const inc of dataset.incidents.filter((i) => i.archetype === arch.id)) {
      assert.ok(incidents.includes(`/incidents/${inc.id}`), `${arch.id}: ${inc.id} is listed`);
    }
  }
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

test("How it works lists every component and everything each one holds, so nothing is hover-only", () => {
  const seen = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
  for (const arch of dataset.archetypes) {
    assert.match(page(arch.id, "tab=overview"), new RegExp(`Components[^<]*(<[^>]+>\\s*)*${arch.blocks.length}`), `${arch.id}: components section`);
    const html = renderToStaticMarkup(<ComponentList archetype={arch} />);
    const text = seen(html);
    assert.equal([...html.matchAll(/data-component="/g)].length, arch.blocks.length, `${arch.id}: every box once`);
    for (const b of arch.blocks) for (const item of b.items ?? []) assert.ok(text.includes(item.label), `${arch.id}: ${b.id} holds ${item.label}`);
  }
});

test("the landing page explains how to read a pattern before the finder, and the finder shows one situation with a preview", () => {
  const home = renderToStaticMarkup(<HomePage />);
  assert.ok(home.indexOf("How to read a pattern") > 0 && home.indexOf("How to read a pattern") < home.indexOf('role="tablist"'), "how to read comes first");
  assert.doesNotMatch(home, /href="\/tools/, "there is no tools page");
  const finder = renderToStaticMarkup(<PatternFinder />);
  const listed = [...finder.matchAll(/data-pattern="([^"]+)"/g)].map((m) => m[1]);
  const first = dataset.archetypes.filter((a) => a.surface === "surfaceEndpoint").map((a) => a.id);
  assert.deepEqual([...listed].sort(), [...first].sort(), "only the selected situation is listed");
  assert.equal([...finder.matchAll(/role="tab"/g)].length, 3, "one tab per situation");
  const preview = finder.match(/data-preview="([^"]+)"/)?.[1];
  assert.equal(preview, listed[0], "the first listed pattern is previewed");
  assert.match(finder, /trust-boundary drawing/, "the preview carries the pattern's drawing");
});

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

test("a pattern read as built on a cloud names every component's service and that cloud's option for every control", () => {
  for (const arch of dataset.archetypes) {
    const products = cloudProductsFor(arch.id);
    const generic = page(arch.id);
    if (!products.length) {
      assert.doesNotMatch(generic, /data-cloud-switch/, `${arch.id}: no cloud switch where nothing is mapped`);
      continue;
    }
    assert.match(generic, /data-cloud-switch/, `${arch.id}: the cloud switch is offered`);
    assert.doesNotMatch(generic, /data-built-on=|data-option-names/, `${arch.id}: cloud-neutral until a cloud is chosen`);
    for (const product of products) {
      const html = page(arch.id, `cloud=${cloudSlug(product.id)}`);
      const where = `${arch.id} on ${product.cloud.short}`;
      assert.match(html, new RegExp(`aria-pressed="true"[^>]*data-cloud="${product.id}"`), `${where}: the switch shows the cloud`);
      assert.match(html, new RegExp(`data-built-on="${product.id}"`), `${where}: Enable opens with the cloud's card`);
      // Every component the cloud names is in the card, with its service.
      for (const b of product.implementation.bindings) {
        assert.match(html, new RegExp(`data-binding="${b.block}"`), `${where}: ${b.block} is in the component table`);
        assert.ok(html.includes(esc(b.service)), `${where}: ${b.block} names ${b.service}`);
      }
      // Every control-plane box that owns a control lists the settings that deliver it.
      for (const b of arch.blocks.filter((x) => x.kind === "governance")) {
        if (controlPlaneOptions(arch, product, b).length) assert.match(html, new RegExp(`data-control-plane="${b.id}"`), `${where}: ${b.id} lists its settings`);
      }
      // Every pinned control names at least one of the cloud's own options.
      assert.equal([...html.matchAll(/data-option-names/g)].length, arch.mitigations.length, `${where}: every control names an option`);
      for (const id of arch.mitigations) {
        const options = optionsFor(product, id);
        assert.ok(options.length, `${where}: ${id} has an option`);
        assert.ok(html.includes(esc(options[0].name)), `${where}: ${id} names ${options[0].name}`);
      }
      // The settings step stands open on the chosen cloud, and the drawing's legend says what the names are.
      assert.match(html, /id="tools"[^>]*><button[^>]*aria-expanded="true"/, `${where}: the settings step is open`);
      assert.match(html, /data-legend-cloud/, `${where}: the legend explains the service names`);
      // An older link that opened the cloud as a product shows the same thing.
      assert.match(page(arch.id, `tool=${product.id}`), new RegExp(`data-built-on="${product.id}"`), `${where}: the older link still works`);
    }
  }
});

test("an open control gives each cloud option's place, value and reason; How it works compares the clouds side by side", () => {
  const arch = dataset.archetypes.find((a) => a.id === "archChatAgent")!;
  const [product] = cloudProductsFor(arch.id);
  const control = arch.mitigations[0];
  const html = renderToStaticMarkup(
    <EnablePanel archetype={arch} open={control} onOpen={() => {}} onShowDrawing={() => {}} tool={null} onPickTool={() => {}} cloud={product} onCloud={() => {}} />,
  );
  for (const s of optionsFor(product, control)) {
    assert.match(html, new RegExp(`data-native-options="${product.id}"`));
    for (const text of [s.name, s.where, s.recommended, s.why]) assert.ok(html.includes(esc(text)), `the open control shows "${text.slice(0, 40)}"`);
  }
  for (const a of dataset.archetypes) {
    const products = cloudProductsFor(a.id);
    if (!products.length) continue;
    assert.match(page(a.id, `tab=overview&cloud=${cloudSlug(products[0].id)}`), /data-cloud-comparison/, `${a.id}: the comparison opens with a cloud chosen`);
    const list = renderToStaticMarkup(<ComponentList archetype={a} cloud={products[0]} />);
    assert.equal([...list.matchAll(/data-component-service/g)].length, products[0].implementation.bindings.length, `${a.id}: every named component shows its service`);
    const table = renderToStaticMarkup(<CloudComparison archetype={a} products={products} />);
    for (const p of products) for (const b of p.implementation.bindings) assert.ok(table.includes(esc(b.service)), `${a.id}: ${p.cloud.short} ${b.block}`);
  }
});

test("Reference › Clouds lists every pattern on a cloud and an option for every control it delivers; a control lists its cloud options", () => {
  for (const cloud of dataset.clouds) {
    const html = renderToStaticMarkup(
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value="/reference/clouds">
          <SearchParamsContext.Provider value={new URLSearchParams(`cloud=${cloudSlug(cloud.id)}`)}>
            <CloudsBrowser />
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>,
    );
    assert.match(html, new RegExp(`data-cloud-page="${cloud.id}"`));
    for (const impl of cloud.implementations) {
      assert.match(html, new RegExp(`data-cloud-pattern="${impl.architecture}"`), `${cloud.id}: ${impl.architecture} is listed`);
      const slug = dataset.archetypes.find((a) => a.id === impl.architecture)!.slug;
      assert.ok(html.includes(`/patterns/${slug}?cloud=${cloudSlug(cloud.id)}`), `${cloud.id}: ${slug} opens on this cloud`);
    }
    // Every setting an implementation uses is on the page, under a control it delivers.
    const used = new Set(cloud.implementations.flatMap((i) => i.settings));
    for (const s of cloud.settings.filter((x) => used.has(x.id))) assert.ok(html.includes(esc(s.name)), `${cloud.id}: setting ${s.name}`);
  }
  // Every control pinned on a cloud pattern has an option on each cloud that maps that pattern.
  for (const arch of dataset.archetypes) {
    for (const product of cloudProductsFor(arch.id)) {
      for (const id of arch.mitigations) {
        const entry = cloudOptionsForControl(id).find((c) => c.cloud.id === product.id);
        assert.ok(entry?.options.some((o) => o.patterns.some((a) => a.id === arch.id)), `${id} on ${product.cloud.short} for ${arch.id}`);
      }
    }
  }
  const detail = renderToStaticMarkup(<CapabilityDetail mitigation={dataset.mitigations.find((m) => m.id === "D3-OTF")!} />);
  assert.match(detail, /data-control-clouds/);
  for (const c of cloudOptionsForControl("D3-OTF")) assert.ok(detail.includes(esc(c.cloud.name)), `the control names ${c.cloud.name}`);
});
