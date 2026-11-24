import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { PatternPage } from "../src/components/patterns/PatternPage";
import { AssetsAndActors, OwaspCoverage, ThreatModelPanel, placeName } from "../src/components/patterns/ThreatModel";
import { RATING_STYLE, contrast } from "../src/components/patterns/threat-style";
import { buildIndex } from "../src/components/shell/SearchPalette";
import { boundaryLayout } from "../src/components/drawing/layout";
import { cloudProductsFor, cloudSlug, drawnOn } from "../src/components/cloud/model";
import { controlName, dataset, riskCode, threatModelFor } from "../src/lib/data";
import { patternHref, riskHref } from "../src/lib/routes";
import { placesOn } from "../src/lib/shape";
import type { ThreatModel } from "../src/lib/types";
import { checkThreatModel, type ThreatModelContext } from "./lib/threat-models";

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
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const reverse = (k: string) => k.split("->").reverse().join("->");

/** The fixture the tab was built against: the chat agent's threat model. */
const chat = dataset.archetypes.find((a) => a.id === "archChatAgent")!;
const model = threatModelFor(chat.id)!;
const atlasRelease = parse(readFileSync(join(process.cwd(), "data/mitre/atlas/2026.10/ATLAS.yaml"), "utf8")) as { techniques: Record<string, { name: string }> };
const ctx: ThreatModelContext = {
  archetypes: dataset.archetypes,
  riskIds: new Set(dataset.risks.map((r) => r.id)),
  incidentIds: new Set(dataset.incidents.map((i) => i.id)),
  frameworkEntries: dataset.frameworkEntries,
  atlasIds: new Set(Object.keys(atlasRelease.techniques)),
};
const raw = () => parse(readFileSync(join(process.cwd(), "data/reference/threat-models/cloud-chat-agent.yaml"), "utf8")) as ThreatModel;

test("the chat agent's threat model is in the dataset, and every model is one per pattern, named after its file", () => {
  assert.ok(model, "the fixture is compiled");
  assert.deepEqual(checkThreatModel(raw(), "cloud-chat-agent.yaml", ctx), [], "the fixture passes the checker's rules");
  const patterns = dataset.threatModels.map((m) => m.pattern);
  assert.equal(new Set(patterns).size, patterns.length, "one model per pattern");
  for (const m of dataset.threatModels) assert.ok(dataset.archetypes.some((a) => a.id === m.pattern), `${m.pattern} is a pattern`);
});

test("the build refuses what the checker refuses", () => {
  const cases: [string, (t: ThreatModel) => void, RegExp][] = [
    ["a place that is not on the pattern", (t) => (t.threats[0].at = ["agent->openWeb"]), /agent->openWeb is not a box or arrow/],
    ["an ATLAS id not in the release", (t) => (t.threats[0].atlas = ["AML.T9999"]), /AML\.T9999 is not an ATLAS technique/],
    ["a control not pinned on the pattern", (t) => (t.threats[0].controls = ["D3-NI"]), /control D3-NI is not pinned/],
    ["an OWASP id outside the lists named", (t) => (t.lists = ["owasp-llm-2026"]), /ASI01 is not in the lists named/],
    ["a list item with no threat and no reason", (t) => (t.coverage = t.coverage.slice(1)), /LLM07:2026 is named by no threat/],
    ["a reason for an item a threat names", (t) => t.coverage.push({ id: "LLM01:2026", why: "x" }), /LLM01:2026 is named by a threat/],
    ["ids out of order", (t) => (t.threats[1].id = "T7"), /ids must run T1, T2/],
    ["a story over its limit", (t) => (t.threats[0].story = "x".repeat(321)), /story missing or over 320/],
    ["an em dash", (t) => (t.summary = "One — two"), /em dash/],
    ["a pattern id in text", (t) => (t.scope = "As on archChatAgent"), /pattern id in text/],
    ["too few threats", (t) => (t.threats = t.threats.slice(0, 4)), /5 to 10 threats/],
    ["an unknown incident", (t) => (t.threats[0].incidents = ["nope"]), /unknown incident nope/],
  ];
  for (const [what, change, message] of cases) {
    const t = raw();
    change(t);
    assert.match(checkThreatModel(t, "cloud-chat-agent.yaml", ctx).join("\n"), message, what);
  }
  assert.match(checkThreatModel(raw(), "chat-agent.yaml", ctx).join("\n"), /named after the pattern's own file/, "a file named otherwise");
});

test("each ATLAS technique a model uses is carried with its name and tactics", () => {
  for (const m of dataset.threatModels) {
    for (const t of m.threats) {
      for (const id of t.atlas) {
        const technique = dataset.atlasTechniques[id];
        assert.ok(technique?.name && technique.tactics.length, `${m.pattern} ${t.id}: ${id} has a name and a tactic`);
        assert.ok(technique.name.endsWith(atlasRelease.techniques[id].name), `${id}: named as the release names it`);
      }
    }
  }
  assert.equal(dataset.atlasTechniques["AML.T0051.001"]?.name, "LLM Prompt Injection: Indirect", "a sub-technique is named under its parent");
  assert.deepEqual(dataset.atlasTechniques["AML.T0051.001"]?.tactics, ["Execution"]);
});

test("the Threat model tab reads top down: summary, where risk concentrates, a row per threat, then the folds, closed", () => {
  const html = page(chat.id, "tab=threats");
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Threat model<span[^>]*>9</, "the tab, with its count, after How it works");
  const at = (marker: string) => html.indexOf(marker);
  assert.ok(html.includes(esc(model.summary.trim())), "the executive summary");
  assert.ok(html.includes(esc(model.concentrates.trim())) && /Where risk concentrates/.test(html), "where risk concentrates");
  assert.ok(at("data-threat-summary") < at("data-concentrates") && at("data-concentrates") < at("data-threat-table") && at("data-threat-table") < at("data-threat-folds"), "in that order");
  assert.equal([...html.matchAll(/<li id="threat-T\d+"/g)].length, model.threats.length, "a row per threat");
  for (const t of model.threats) {
    const row = html.slice(at(`id="threat-${t.id}"`), at(`id="threat-T${Number(t.id.slice(1)) + 1}"`) > 0 ? at(`id="threat-T${Number(t.id.slice(1)) + 1}"`) : at("data-threat-folds"));
    assert.ok(row.includes(esc(t.title)), `${t.id}: its title`);
    assert.match(row, new RegExp(`data-rating="${t.rating}">${RATING_STYLE[t.rating].label}<`), `${t.id}: its rating chip`);
    assert.match(row, new RegExp(`data-evidence="${t.evidence}">`), `${t.id}: its evidence word`);
    for (const id of t.owasp.slice(0, 3)) assert.ok(row.includes(`>${id.replace(/:\d{4}$/, "")}<`), `${t.id}: tag ${id}`);
    assert.match(row, /aria-expanded="false"/, `${t.id}: closed until opened`);
  }
  for (const title of ["Assets and threat actors", "OWASP coverage", "Design review questions", "Scope and rating"]) {
    assert.match(html, new RegExp(`aria-expanded="false"[^>]*><span class="eyebrow[^"]*">${title}`), `${title}: a fold, closed`);
  }
  // Nothing is lit on the drawing until a threat is opened.
  assert.doesNotMatch(html, /data-place="true"/);
});

test("a threat row opens to its story, places, risks, techniques, OWASP items, controls, incidents and sources, and lights its places", () => {
  for (const t of model.threats) {
    const html = page(chat.id, `tab=threats&threat=${t.id}`);
    const detail = html.slice(html.indexOf(`data-threat-detail="${t.id}"`), html.indexOf("data-threat-folds"));
    assert.ok(detail.length > 0, `${t.id}: the row is open`);
    assert.ok(detail.includes(esc(t.story.trim())), `${t.id}: the story`);
    for (const p of t.at) assert.ok(detail.includes(`data-threat-place="${esc(p)}"`) && detail.includes(esc(placeName(chat, p))), `${t.id}: names ${p}`);
    for (const r of t.risks) assert.ok(detail.includes(`href="${esc(riskHref(r))}"`) && detail.includes(`>${riskCode(r)}<`), `${t.id}: links risk ${r}`);
    for (const id of t.atlas) {
      assert.ok(detail.includes(`href="https://atlas.mitre.org/techniques/${id}"`), `${t.id}: links ${id}`);
      assert.ok(detail.includes(esc(dataset.atlasTechniques[id].name)), `${t.id}: names ${id}`);
    }
    for (const id of t.owasp) assert.match(detail, new RegExp(`data-owasp="${id}"[\\s\\S]*?${esc(dataset.frameworkEntries[model.lists.find((l) => dataset.frameworkEntries[l][id])!][id].label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${t.id}: ${id} with its label`);
    const n = new Map(chat.mitigations.map((id, i) => [id, i + 1]));
    for (const c of t.controls) {
      assert.ok(detail.includes(`data-threat-control="${c}"`) && detail.includes(esc(controlName(c))), `${t.id}: control ${c} by name`);
      assert.ok(detail.includes(`href="${esc(patternHref(chat.id, { control: c }))}"`), `${t.id}: ${c} links to its Enable row`);
      assert.match(detail.slice(detail.indexOf(`data-threat-control="${c}"`)), new RegExp(`^[^]*?>${n.get(c)}</span>`), `${t.id}: ${c} as its numbered chip`);
    }
    for (const id of t.incidents ?? []) assert.ok(detail.includes(`href="/incidents/${id}"`), `${t.id}: incident ${id}`);
    for (const r of t.refs ?? []) assert.ok(detail.includes(`href="${esc(r.url)}"`), `${t.id}: source ${r.url}`);
    // The drawing lights exactly its places, outlined, and the controls that break it.
    const lit = [...html.matchAll(/data-(?:block|edge)="([^"]+)"[^>]*data-place="true"/g)].map((m) => m[1].replace(/&gt;/g, ">"));
    assert.deepEqual(new Set(lit), new Set(t.at.map((p) => (chat.edges.some((e) => `${e.from}->${e.to}` === p) || !p.includes("->") ? p : reverse(p)))), `${t.id}: lights its places`);
    const chips = new Set([...html.matchAll(/data-control="([^"]+)" data-lit="true"/g)].map((m) => m[1]));
    assert.deepEqual(chips, new Set(t.controls), `${t.id}: lights the controls that break it`);
    assert.match(html, /data-legend-places/, `${t.id}: the legend says what the outline means`);
  }
  // Opened on another tab the threat lights nothing; it is the Threat model tab's.
  assert.doesNotMatch(page(chat.id, "tab=overview&threat=T1"), /data-place="true"/);
});

test("an open threat's places follow the platform's own drawing", () => {
  for (const p of cloudProductsFor(chat.id)) {
    const drawn = drawnOn(chat, p, null);
    const spec = boundaryLayout(drawn);
    const lines = new Set(spec.lines.map((l) => l.key));
    for (const t of model.threats) {
      const places = placesOn(drawn, t.at);
      assert.ok(places.length, `${p.cloud.short} ${t.id}: somewhere to light`);
      for (const x of places) assert.ok(x.includes("->") ? lines.has(x) || lines.has(reverse(x)) : drawn.blocks.some((b) => b.id === x), `${p.cloud.short} ${t.id}: ${x} is drawn`);
    }
    const html = page(chat.id, `tab=threats&threat=T1&cloud=${cloudSlug(p.id)}`);
    assert.match(html, /data-place="true"/, `${p.cloud.short}: the open threat is lit`);
  }
});

test("the folds hold the assets and actors, every item of each OWASP list, the questions and the scope", () => {
  const assets = renderToStaticMarkup(<AssetsAndActors model={model} />);
  for (const x of model.assets) assert.ok(assets.includes(esc(x)), `asset ${x}`);
  for (const a of model.actors) for (const v of [a.who, a.access, a.wants]) assert.ok(assets.includes(esc(v)), `actor ${a.who}`);
  const coverage = renderToStaticMarkup(<OwaspCoverage model={model} onReveal={() => {}} />);
  for (const l of model.lists) {
    const items = Object.keys(dataset.frameworkEntries[l]);
    assert.equal(items.length, 10, `${l}: ten items`);
    for (const id of items) {
      const row = coverage.match(new RegExp(`<li[^>]*data-owasp-item="${id}"[\\s\\S]*?</li>`))?.[0] ?? "";
      const by = model.threats.filter((t) => t.owasp.includes(id));
      if (by.length) for (const t of by) assert.ok(row.includes(`>${t.id}</button>`), `${id}: covered by ${t.id}`);
      else assert.ok(row.includes(esc(model.coverage.find((c) => c.id === id)!.why)), `${id}: why not`);
    }
  }
  assert.equal([...coverage.matchAll(/data-owasp-item=/g)].length, model.lists.length * 10, "every item once");
  const open = renderToStaticMarkup(<ThreatModelPanel archetype={chat} open={null} onOpen={() => {}} onPickControl={() => {}} foldsOpen />);
  const questions = open.slice(open.indexOf("data-threat-questions"));
  assert.equal([...questions.slice(0, questions.indexOf("</ol>")).matchAll(/<li>/g)].length, model.questions.length, "every question");
  for (const q of model.questions) assert.ok(open.includes(esc(q)), `question "${q.slice(0, 30)}"`);
  assert.ok(open.slice(open.indexOf("data-threat-scope")).includes(esc(model.scope.trim())), "the scope it is rated for");
});

test("a pattern without a threat model says it is being written", () => {
  const without = dataset.archetypes.filter((a) => !threatModelFor(a.id));
  for (const a of without) {
    const html = renderToStaticMarkup(<ThreatModelPanel archetype={a} open={null} onOpen={() => {}} onPickControl={() => {}} />);
    assert.match(html, /data-threat-model-pending[\s\S]*being written/, `${a.id}: says so`);
    assert.match(page(a.id), /role="tab"[^>]*>Threat model</, `${a.id}: the tab is still offered`);
  }
});

test("Show risks tags every pinned risk where it is pinned, in place of the chips; off by default and kept in the address", () => {
  for (const a of dataset.archetypes) {
    const off = page(a.id);
    assert.match(off, /aria-pressed="false"[^>]*data-show-risks[^>]*>Show risks</, `${a.id}: the toggle, off`);
    assert.doesNotMatch(off, /data-risk="/, `${a.id}: no tags until it is pressed`);
    const on = page(a.id, "risks=1");
    assert.match(on, /aria-pressed="true"[^>]*data-show-risks/, `${a.id}: pressed from the address`);
    const places = new Set(a.pins.risks.map((p) => `${p.risk}@${a.edges.some((e) => `${e.from}->${e.to}` === p.at) || !p.at.includes("->") ? p.at : reverse(p.at)}`));
    assert.equal([...on.matchAll(/<g[^>]*data-risk="/g)].length, places.size, `${a.id}: a tag per pinned risk and place`);
    for (const r of new Set(a.pins.risks.map((p) => p.risk))) assert.match(on, new RegExp(`aria-label="Risk ${riskCode(r)}: ${esc(dataset.risks.find((x) => x.id === r)!.title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${a.id}: ${r} is named`);
    assert.doesNotMatch(on, /<g[^>]*data-control="/, `${a.id}: the chips give way`);
    assert.match(on, /data-legend-risks/, `${a.id}: the legend says what the red tags are`);
  }
});

test("the risk tags and the rating chips keep AA contrast", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const token = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];
  assert.ok(contrast(token("exposed-ink"), token("exposed-soft")) >= 4.5, "a tag's code on its soft fill");
  assert.ok(contrast("#ffffff", token("exposed-ink")) >= 4.5, "a lit tag's code");
  for (const [r, s] of Object.entries(RATING_STYLE)) assert.ok(contrast(s.color, s.background) >= 4.5, `${r}: ${contrast(s.color, s.background).toFixed(2)}`);
});

test("search finds a pattern's threats by title and opens the row", () => {
  const index = buildIndex();
  for (const t of model.threats) {
    const hit = index.find((e) => e.kind === "Threat" && e.title === t.title);
    assert.ok(hit, `${t.id}: in the index`);
    assert.equal(hit!.href, `/patterns/${chat.slug}?tab=threats&threat=${t.id}`, `${t.id}: opens its row`);
  }
  // The address opens the tab with the row open.
  assert.match(page(chat.id, "tab=threats&threat=T2"), /<li id="threat-T2"[^>]*><button[^>]*aria-expanded="true"/);
});
