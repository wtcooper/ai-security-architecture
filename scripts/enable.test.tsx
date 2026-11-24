import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { EnablePanel } from "../src/components/enable/EnablePanel";
import { ControlTable } from "../src/components/enable/ControlTable";
import { PatternPage } from "../src/components/patterns/PatternPage";
import { PatternRisks } from "../src/components/patterns/PatternPanels";
import { PatternFinder } from "../src/components/patterns/PatternFinder";
import HomePage from "../src/app/page";
import { CloudsBrowser } from "../src/components/cloud/CloudsBrowser";
import { cloudOptionsForControl, cloudProductsFor, cloudSlug, optionsFor } from "../src/components/cloud/model";
import { ControlDetail } from "../src/components/controls/ControlDetail";
import { ProductSettings, SettingsTable } from "../src/components/enable/ProductSettings";
import { recommendedOf } from "../src/components/enable/SettingParts";
import { coverageWord } from "../src/components/enable/labels";
import { baselineNotPinned, controlGroups, controlsDelivered, settingGroups } from "../src/components/enable/model";
import { controlName, dataset, enablement, isBaseline, productsForArchetype, toolsForArchetype } from "../src/lib/data";

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
    assert.deepEqual(groups.flatMap((g) => g.controls.map((m) => m.id)).sort(), [...arch.mitigations].sort(), arch.id);
    for (const g of groups) {
      const authored = enablement.groups.find((x) => x.id === g.id)!;
      assert.equal(g.title, dataset.frameworkEntries["nist-csf"][g.id].label, `${arch.id}: ${g.id} carries the CSF name`);
      assert.equal(g.blurb, authored.surfaces?.[arch.surface]?.blurb ?? authored.blurb, `${arch.id}: ${g.id}`);
      // Rows count up with the chips on the drawing.
      const pins = g.controls.map((m) => arch.mitigations.indexOf(m.id));
      assert.deepEqual(pins, [...pins].sort((x, y) => x - y), `${arch.id}: ${g.id} is in pin order`);
    }
    const order = groups.map((g) => enablement.groups.findIndex((x) => x.id === g.id));
    assert.deepEqual(order, [...order].sort((x, y) => x - y), `${arch.id}: families in CSF order`);
    // The baseline is either drawn here or named beneath the table, never dropped.
    const named = new Set([...arch.mitigations.filter(isBaseline), ...baselineNotPinned(arch).map((m) => m.id)]);
    assert.deepEqual([...named].sort(), [...enablement.baseline].sort(), arch.id);
  }
});

test("the settings step reads like the controls step: same headings, same order, each row naming the control it delivers", () => {
  const capName = (id: string) => dataset.mitigations.find((m) => m.id === id)!.title;
  for (const arch of dataset.archetypes) {
    const products = productsForArchetype(arch.id);
    for (const product of products.filter((p) => p.settings.length)) {
      const where = `${arch.id} ${product.id}`;
      const html = renderToStaticMarkup(<ProductSettings archetype={arch} products={products} selected={product.id} onPick={() => {}} lit={null} onLight={() => {}} />);
      // A pattern that is bought offers a pill per product here; a hosted one makes its choices in the step before.
      const hostedPattern = products.some((p) => p.kind === "cloud");
      assert.equal([...html.matchAll(/role="tab"/g)].length, hostedPattern ? 0 : products.length, `${where}: a pill per product, or none where the choice is its own step`);
      assert.equal([...html.matchAll(new RegExp(`id="setting-${product.id}-`, "g"))].length, product.settings.length, `${where}: a row per setting`);
      // One line about the product; the background is folded, and there is no table of components here.
      assert.match(html, new RegExp(`data-product-header="${product.id}"`), where);
      assert.doesNotMatch(html, /data-binding=|data-built-on=|What plays each component on \w+ <|No settings recorded/, `${where}: no background before the settings`);
      // The same plain headings as the controls step, in the same order, with anything else last.
      const controlOrder = controlGroups(arch).map((g) => g.id);
      const bands = [...html.matchAll(/data-setting-group="([^"]+)"/g)].map((m) => m[1]);
      const expected = settingGroups(arch, product.settings).map((g) => g.id);
      assert.deepEqual(bands, expected, `${where}: bands`);
      const named = bands.filter((id) => id !== "extras");
      assert.deepEqual(named, controlOrder.filter((id) => named.includes(id)), `${where}: bands follow the controls' order`);
      if (bands.includes("extras")) assert.equal(bands.at(-1), "extras", `${where}: unnumbered hardening comes last`);
      for (const g of controlGroups(arch)) if (named.includes(g.id)) assert.ok(html.includes(esc(g.plain)), `${where}: heading ${g.plain}`);
      // Each row, closed, says what to set and to what, and names the control it delivers, not just its number.
      for (const st of product.settings) {
        const row = html.slice(html.indexOf(`id="setting-${product.id}-${st.id}"`));
        const cell = row.slice(0, row.indexOf("</li>"));
        for (const text of [st.name, recommendedOf(st).value ?? st.recommended]) assert.ok(cell.includes(esc(text)), `${where} ${st.id}: shows "${text.slice(0, 30)}"`);
        const [first] = controlsDelivered(arch, st);
        if (first) {
          assert.match(cell, new RegExp(`data-delivers="${first.replace(/[.]/g, "\\.")}"`), `${where} ${st.id}: delivers ${first}`);
          assert.ok(cell.includes(esc(capName(first))), `${where} ${st.id}: names ${first}, not only its number`);
        }
      }
      // Nothing is recorded in data/org/controls.yaml, so there is no status column; the detail waits for a row to be opened.
      assert.doesNotMatch(html, />Not enabled<|data-setting-open/, `${where}: no empty status column, no open detail`);
      // An open row holds how and why, the path, every control it delivers and the vendor's page.
      for (const st of product.settings.slice(0, 3)) {
        const key = `${product.id}-${st.id}`;
        const open = renderToStaticMarkup(<SettingsTable product={product} archetype={arch} lit={null} onLight={() => {}} defaultOpen={key} />);
        const body = open.slice(open.indexOf(`data-setting-open="${key}"`));
        const cell = body.slice(0, body.indexOf("</li>"));
        for (const text of [recommendedOf(st).how ?? "", st.why, st.where]) assert.ok(cell.includes(esc(text)), `${where} ${st.id}: open row shows "${text.slice(0, 30)}"`);
        for (const id of controlsDelivered(arch, st).slice(1)) assert.ok(cell.includes(esc(capName(id))), `${where} ${st.id}: open row names ${id}`);
        assert.ok(cell.includes(esc(st.url)), `${where} ${st.id}: links the vendor's page`);
      }
    }
  }
});

test("a product not yet catalogued setting by setting falls back to its control record", () => {
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

test("the Enable tab opens as folded steps; a lit control opens the controls, banded by category and numbered as on the drawing", () => {
  const panel = (arch: (typeof dataset.archetypes)[number], open: string | null) =>
    renderToStaticMarkup(
      <EnablePanel archetype={arch} open={open} onOpen={() => {}} onShowDrawing={() => {}} tool={null} focus={null} onPickTool={() => {}} />,
    );
  for (const arch of dataset.archetypes) {
    // At rest: the controls and the settings, each one folded line, and nothing else.
    const folded = panel(arch, null);
    // Two steps for what is bought; three for what is hosted, with the choices between the controls and their settings.
    const hostedPattern = arch.surface === "surfaceCloud";
    assert.equal([...folded.matchAll(/aria-controls="/g)].length, hostedPattern ? 3 : 2, `${arch.id}: ${hostedPattern ? "three" : "two"} steps`);
    assert.doesNotMatch(folded, /aria-expanded="true"/, `${arch.id}: every step starts folded`);
    assert.ok(folded.indexOf('id="controls"') < folded.indexOf('id="tools"'), `${arch.id}: controls, then settings`);
    if (hostedPattern) assert.ok(folded.indexOf('id="controls"') < folded.indexOf('id="choose"') && folded.indexOf('id="choose"') < folded.indexOf('id="tools"'), `${arch.id}: the choices sit between them`);
    else assert.doesNotMatch(folded, /id="choose"/, `${arch.id}: nothing to choose beyond the product`);
    assert.doesNotMatch(folded, /id="control-|role="tab"|data-action|data-built-on/, `${arch.id}: no rows until a step is opened`);
    // A control lit on the drawing opens the controls step on its row.
    const html = panel(arch, arch.mitigations[0]);
    assert.match(html, /id="controls"[^>]*><button[^>]*aria-expanded="true"/, `${arch.id}: controls open`);
    assert.match(html, /id="tools"[^>]*><button[^>]*aria-expanded="false"/, `${arch.id}: settings stay folded`);
    for (const g of controlGroups(arch)) assert.match(html, new RegExp(`id="group-${g.id}"`), `${arch.id}: ${g.id} has a band`);
    assert.equal([...html.matchAll(/id="control-/g)].length, arch.mitigations.length, `${arch.id}: a row per pinned control`);
    for (const [i, id] of arch.mitigations.entries()) {
      const row = html.slice(html.indexOf(`id="control-${id}"`));
      assert.ok(row.slice(0, row.indexOf("</li>")).includes(`>${i + 1}</span>`), `${arch.id}: ${id} is chip ${i + 1}`);
    }
    // Nothing is recorded in data/org/controls.yaml, so the rows carry no status column of "Not set".
    assert.doesNotMatch(html, />Not set</, `${arch.id}: no empty status column`);
    assert.equal([...html.matchAll(/data-baseline/g)].length, arch.mitigations.filter(isBaseline).length, `${arch.id}: a row says when every AI deployment needs it`);
  }
});

test("a control row is one line of reference; what to do and why are in the open row, at every place it is pinned", () => {
  for (const arch of dataset.archetypes) {
    const open = arch.mitigations[0];
    const table = renderToStaticMarkup(<ControlTable groups={controlGroups(arch)} archetype={arch} open={open} onOpen={() => {}} />);
    assert.equal([...table.matchAll(/data-instruction/g)].length, arch.mitigations.length, `${arch.id}: a row per control`);
    for (const id of arch.mitigations) assert.ok(table.includes(esc(controlName(id))), `${arch.id}: ${id} is named`);
    // The instruction is not in the folded rows: only the open one carries what to do and why.
    const here = arch.pins.mitigations.filter((p) => p.mitigation === open);
    assert.equal([...table.matchAll(/data-do/g)].length, here.length, `${arch.id}: instructions only in the open row`);
    for (const pin of here) {
      assert.ok(table.includes(esc(pin.do)), `${arch.id}: ${pin.mitigation} @ ${pin.at} says what to do`);
      assert.ok(table.includes(esc(pin.why)), `${arch.id}: ${pin.mitigation} @ ${pin.at} says why`);
    }
    // Each category has a plain heading and one sentence on what it is for; the CSF name is the reference beside it.
    for (const g of controlGroups(arch)) assert.ok(table.includes(esc(g.plain)) && table.includes(esc(g.title)) && table.includes(esc(g.blurb)), `${arch.id}: ${g.id} heading`);
    assert.equal([...table.matchAll(/data-definition/g)].length, 1, `${arch.id}: one definition, in the open row`);
    // The open row holds what it takes to put the control in place, and nothing tucked behind a further fold.
    assert.doesNotMatch(table, /In detail|Reduces here|Delivered by:/, `${arch.id}: no extra detail in the open row`);
  }
});

test("every instruction is written for someone who is not a security architect", () => {
  // Words a reader outside security would stop at. The precise term belongs in the note, not in the instruction.
  const JARGON = /\b(IdP|SSO|DLP|egress|harness|brokered|zone-2|TLS|JWT|OAuth|HITL|blast radius|loopback|least[- ]privilege|microVM|exfiltrat\w*|provenance|principal|attestation|CODEOWNERS|introspection|SSRF|ingress|deputy)\b/i;
  // An instruction says what to do: it does not open on a thing ("The gateway…", "Per-tool grants…").
  const NOUN_OPENER = /^(The|A|An|Our|Their|Its|Each|Every|Per|This|That|These|Those|Which|What|Who|Whose|One|Any|All|No|Some)\b/;
  for (const arch of dataset.archetypes) {
    for (const pin of arch.pins.mitigations) {
      const at = `${arch.id} ${pin.mitigation} @ ${pin.at}`;
      assert.doesNotMatch(pin.do, NOUN_OPENER, `${at}: starts by saying what to do: "${pin.do.slice(0, 40)}"`);
      assert.doesNotMatch(`${pin.do} ${pin.why}`, JARGON, `${at}: plain words`);
      assert.ok(pin.do.length <= 260 && pin.why.length <= 220, `${at}: short enough to read at a glance`);
    }
  }
});

test("with a tool chosen, each control it covers names that tool's settings", () => {
  const arch = dataset.archetypes.find((a) => productsForArchetype(a.id).some((p) => p.id === "toolClaudeCode"))!;
  const product = productsForArchetype(arch.id).find((p) => p.id === "toolClaudeCode")!;
  const covered = arch.mitigations.filter((id) => optionsFor(product, id).length);
  assert.ok(covered.length > 3, "the tool delivers several controls");
  const table = renderToStaticMarkup(<ControlTable groups={controlGroups(arch)} archetype={arch} open={covered[0]} onOpen={() => {}} product={product} />);
  assert.equal([...table.matchAll(/data-option-names/g)].length, covered.length, "a settings line on every control the tool covers, and only those");
  const first = optionsFor(product, covered[0])[0];
  assert.match(table, /data-native-options="toolClaudeCode"/);
  for (const text of [first.name, first.recommended]) assert.ok(table.includes(esc(text)), `the open row shows "${text.slice(0, 40)}"`);
});

test("a pattern opens on How it works, with a link to Enable; a tab link opens that tab and a product link opens its settings", () => {
  const arch = dataset.archetypes.find((a) => toolsForArchetype(a.id).length)!;
  const home = page(arch.id);
  assert.match(home, /role="tab"[^>]*aria-selected="true"[^>]*>How it works/, "How it works is the default tab");
  assert.match(home, /data-enable-link[\s\S]*How to enable it/, "it leads with the way to Enable");
  assert.doesNotMatch(home, /id="controls"/);
  assert.match(home, /Use this pattern when: /);
  assert.ok(home.includes(arch.useWhen.replace(/'/g, "&#x27;")), "the header says when the pattern applies");
  // Five tabs: How it works, Threat model, Enable, Data flows, Incidents. The risks are a section of How it works.
  const labels = [...home.matchAll(/role="tab"[^>]*>([A-Za-z ]+)/g)].map((m) => m[1].trim());
  assert.deepEqual(labels.slice(0, 5), ["How it works", "Threat model", "Enable", "Data flows", "Incidents"]);
  assert.match(page(arch.id, "tab=threats"), /role="tab"[^>]*aria-selected="true"[^>]*>Threat model/, "the threat model has its own address");
  assert.match(home, new RegExp(`>Risks<span[^>]*>\\s*${arch.risks.length}<`), "the risks are a section of How it works");
  assert.match(page(arch.id, "tab=enable"), /id="controls"/);
  // An old link to the Risks tab lands on How it works.
  assert.match(page(arch.id, "tab=risks"), /role="tab"[^>]*aria-selected="true"[^>]*>How it works/);
  assert.match(page(arch.id, "tab=flows"), /Boundary crossings/);
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

test("a pattern page shows its summary and examples in the header; How it works is the overview, the description and three folds", () => {
  const text = (blocks: unknown) => (Array.isArray(blocks) ? blocks.map((b) => (Array.isArray(b) ? b.join(" ") : String(b))).join(" ") : String(blocks ?? "")).replace(/\s+/g, " ").trim();
  const seen = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
  for (const arch of dataset.archetypes) {
    const enable = seen(page(arch.id));
    assert.ok(enable.includes(text(arch.summary).slice(0, 80)), `${arch.id}: the summary is in the header`);
    for (const e of arch.exemplars ?? []) assert.ok(enable.includes(e.name), `${arch.id}: example ${e.name} is named in the header`);
    const how = page(arch.id, "tab=overview");
    // How it works opens on the overview: what it is and what sets it apart. Guidance, the authors' notes on the
    // drawing and a separate "why its own pattern" are not for the reader.
    assert.ok(seen(how).includes(arch.overview.trim().slice(0, 80)), `${arch.id}: the overview`);
    assert.doesNotMatch(how, /How to govern this pattern|Why this is its own pattern|departs from the catalogue|data-guidance-item/, `${arch.id}: no authors' sections`);
    // Then "In more detail": the description, shown plainly.
    assert.match(how, /In more detail/, `${arch.id}: the description follows the overview`);
    for (const para of arch.description) assert.ok(seen(how).includes(text([para]).slice(0, 60)), `${arch.id}: "${text([para]).slice(0, 30)}" is shown`);
    assert.ok(how.indexOf("data-overview") < how.indexOf("data-detail"), `${arch.id}: overview first`);
    // No components, examples or side-by-side folds: the header names the examples and the drawing's hover help each box's options.
    assert.doesNotMatch(how, />Components<|>Examples<|>Each (?:platform|cloud) side by side<|data-cloud-comparison|data-component=|data-example=/, `${arch.id}: the removed folds are gone`);
    for (const q of cloudProductsFor(arch.id).map((p) => `tab=overview&cloud=${cloudSlug(p.id)}`)) {
      const on = page(arch.id, q);
      assert.doesNotMatch(on, />Components<|>Examples<|>Each (?:platform|cloud) side by side<|data-cloud-comparison|data-component=/, `${arch.id} ${q}: the removed folds are gone`);
      // One fold for the platform, then the sources last.
      assert.equal([...on.matchAll(/data-on-cloud="/g)].length, 1, `${arch.id} ${q}: one fold for the platform`);
      assert.ok(on.lastIndexOf(">Sources<") > on.indexOf("data-on-cloud="), `${arch.id} ${q}: sources come last`);
    }
    assert.match(how, />Sources</, arch.id);
  }
});

test("How it works lists every risk of the pattern, and the Incidents tab every incident on it", () => {
  for (const arch of dataset.archetypes) {
    const risks = renderToStaticMarkup(<PatternRisks archetype={arch} lit={null} onLight={() => {}} onPickControl={() => {}} />);
    for (const id of arch.risks) assert.match(risks, new RegExp(`id="risk-${id}"`), `${arch.id}: ${id} is listed`);
    assert.equal([...risks.matchAll(/id="risk-/g)].length, arch.risks.length, arch.id);
    const incidents = page(arch.id, "tab=incidents");
    for (const inc of dataset.incidents.filter((i) => i.archetype === arch.id)) {
      assert.ok(incidents.includes(`/incidents/${inc.id}`), `${arch.id}: ${inc.id} is listed`);
    }
  }
});

test("a cloud architecture lists its clouds first, binds every component and covers every pinned control", () => {
  for (const cloud of dataset.clouds) {
    for (const impl of cloud.implementations) {
      const arch = dataset.archetypes.find((a) => a.id === impl.architecture)!;
      const products = productsForArchetype(arch.id);
      assert.equal(products[0].kind, "cloud", `${arch.id}: clouds lead`);
      const product = products.find((p) => p.id === cloud.id)!;
      const delivered = new Set(product.settings.flatMap((s) => s.mitigations));
      for (const id of arch.mitigations) assert.ok(delivered.has(id), `${cloud.id} ${arch.id}: ${id} has a row`);
    }
  }
});

test("what a box holds is in its hover help and its accessible description, now How it works has no component list", () => {
  for (const arch of dataset.archetypes) {
    const html = page(arch.id);
    for (const b of arch.blocks.filter((x) => x.items?.length)) {
      const g = html.match(new RegExp(`<g data-block="${b.id}"[^>]*>`))?.[0] ?? "";
      for (const item of b.items!) assert.ok(g.includes(esc(item.label)), `${arch.id}: ${b.id} holds ${item.label}`);
    }
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
    assert.doesNotMatch(generic, /data-built-on=|data-option-names|data-legend-cloud/, `${arch.id}: cloud-neutral until a cloud is chosen`);
    for (const product of products) {
      const html = page(arch.id, `cloud=${cloudSlug(product.id)}`);
      const where = `${arch.id} on ${product.cloud.short}`;
      assert.match(html, new RegExp(`aria-pressed="true"[^>]*data-cloud="${product.id}"`), `${where}: the switch shows the cloud`);
      assert.doesNotMatch(html, /id="(controls|tools)"[^>]*><button[^>]*aria-expanded="true"/, `${where}: choosing a cloud leaves the steps folded`);
      assert.match(html, /data-legend-cloud/, `${where}: the legend explains the service names`);
      // The settings step, opened on the cloud, shows that cloud's settings.
      const settings = page(arch.id, `tool=${product.id}`);
      assert.match(settings, new RegExp(`data-settings="${product.id}"`), `${where}: the settings step shows the cloud's settings`);
      // Every pinned control names at least one of the cloud's own settings.
      const table = renderToStaticMarkup(<ControlTable groups={controlGroups(arch)} archetype={arch} open={null} onOpen={() => {}} product={product} />);
      assert.equal([...table.matchAll(/data-option-names/g)].length, arch.mitigations.length, `${where}: every control names a setting`);
      for (const id of arch.mitigations) {
        const options = optionsFor(product, id);
        assert.ok(options.length, `${where}: ${id} has a setting`);
        assert.ok(table.includes(esc(options[0].name)), `${where}: ${id} names ${options[0].name}`);
      }
      // An older link that opened the cloud as a product also sets the page's cloud.
      assert.match(settings, new RegExp(`aria-pressed="true"[^>]*data-cloud="${product.id}"`), `${where}: the older link still chooses the cloud`);
    }
  }
});

test("an open control gives each cloud option's place, value and reason", () => {
  const arch = dataset.archetypes.find((a) => a.id === "archChatAgent")!;
  const [product] = cloudProductsFor(arch.id);
  const control = arch.mitigations[0];
  const html = renderToStaticMarkup(
    <EnablePanel archetype={arch} open={control} onOpen={() => {}} onShowDrawing={() => {}} tool={null} onPickTool={() => {}} cloud={product} />,
  );
  for (const s of optionsFor(product, control)) {
    assert.match(html, new RegExp(`data-native-options="${product.id}"`));
    for (const text of [s.name, s.where, s.recommended, s.why]) assert.ok(html.includes(esc(text)), `the open control shows "${text.slice(0, 40)}"`);
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
  const detail = renderToStaticMarkup(<ControlDetail mitigation={dataset.mitigations.find((m) => m.id === "D3-OTF")!} />);
  assert.match(detail, /data-control-clouds/);
  for (const c of cloudOptionsForControl("D3-OTF")) assert.ok(detail.includes(esc(c.cloud.name)), `the control names ${c.cloud.name}`);
});

test("Enable is laid out the same way on every pattern, the software factory included: controls, choices, then settings", () => {
  for (const id of ["archChatAgent", "archSoftwareFactory"]) {
    const arch = dataset.archetypes.find((a) => a.id === id)!;
    const [product] = cloudProductsFor(arch.id);
    const html = renderToStaticMarkup(<EnablePanel archetype={arch} open={arch.mitigations[0]} onOpen={() => {}} onShowDrawing={() => {}} tool={product.id} onPickTool={() => {}} cloud={product} />);
    assert.match(html, /data-control-table="names"/, id);
    assert.ok(html.indexOf('id="controls"') < html.indexOf('id="choose"') && html.indexOf('id="choose"') < html.indexOf('id="tools"'), `${id}: controls, choices, then settings`);
    assert.doesNotMatch(html, /data-layout-switch|Compare layouts/, `${id}: no layout switch`);
    // The default never reads as the value to set.
    assert.doesNotMatch(html, /Default: /, id);
  }
});
