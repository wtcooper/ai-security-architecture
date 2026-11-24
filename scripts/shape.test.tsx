/**
 * Per-platform shapes (src/lib/shape.ts): a platform whose own documentation shows another shape
 * draws the pattern with its changes applied, the pattern's own drawing stays as it is, and every
 * such drawing is held to the same layout rules as the pattern's.
 */
import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { PatternPage } from "../src/components/patterns/PatternPage";
import { BoxDiagram } from "../src/components/drawing/BoxDiagram";
import { FlowSequence } from "../src/components/reference/FlowSequence";
import { OnCloud } from "../src/components/cloud/CloudViews";
import { boundaryLayout } from "../src/components/drawing/layout";
import { cloudProductFor, cloudSlug, drawnOn, drawnVariants, hostedAs, shapeLinesFor } from "../src/components/cloud/model";
import { applyShape, walkOn } from "../src/lib/shape";
import { dataset } from "../src/lib/data";
import type { Archetype, ShapeChange } from "../src/lib/types";
import { audit } from "./drawing-audit";

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
const keyOf = (e: { from: string; to: string }) => `${e.from}->${e.to}`;
const reverse = (k: string) => k.split("->").reverse().join("->");
const chat = dataset.archetypes.find((a) => a.id === "archChatAgent")!;
const variants = dataset.archetypes.flatMap((a) => drawnVariants(a).map((v) => ({ pattern: a, ...v })));
let tried = 0;
const apply = (changes: ShapeChange[], base: Archetype = chat) => applyShape(base, changes, { key: `${base.id}|test|${(tried += 1)}`, on: "on Testcloud" });
const DOCS = "https://example.com/docs";

test("at least one platform draws a pattern with another shape, and every such drawing is a complete drawing", () => {
  assert.ok(variants.length > 0, "a mapping or hosting option records a change of shape");
  for (const v of variants) {
    const at = `${v.pattern.id} ${v.label}`;
    const spec = boundaryLayout(v.archetype);
    assert.notEqual(spec, boundaryLayout(v.pattern), `${at}: laid out on its own`);
    assert.deepEqual(spec.boxes.map((b) => b.id).sort(), v.archetype.blocks.map((b) => b.id).sort(), `${at}: every block is a box`);
    assert.deepEqual(spec.lines.map((l) => l.key).sort(), v.archetype.edges.map(keyOf).sort(), `${at}: every edge is an arrow`);
    const places = new Set([...spec.boxes.map((b) => b.id), ...spec.lines.map((l) => l.key)]);
    for (const p of [...v.archetype.pins.mitigations, ...v.archetype.pins.risks]) assert.ok(places.has(p.at), `${at}: ${p.at} is on the drawing`);
    // The control numbering is the pattern's: a change moves chips, it never renumbers them.
    assert.deepEqual(v.archetype.mitigations, v.pattern.mitigations, `${at}: the same controls, numbered the same`);
  }
});

test("the drawing audit runs on every platform's own shape, against the same layout rules", () => {
  for (const v of variants) {
    const { findings, spec } = audit(v.archetype, { content: false });
    assert.equal(spec, boundaryLayout(v.archetype), `${v.pattern.id} ${v.label}: the audit measures the platform's drawing`);
    assert.deepEqual(findings.map((f) => `${f.rule}: ${f.detail}`), [], `${v.pattern.slug} ${v.label} (npm run drawing:audit -- ${v.pattern.slug})`);
  }
});

test("a pattern with a change draws the changed shape when its platform is chosen, and its own shape otherwise", () => {
  for (const v of variants) {
    const at = `${v.pattern.id} ${v.label}`;
    const query = `cloud=${cloudSlug(v.product.id)}${v.host ? `&host=${v.host}` : ""}`;
    const chosen = page(v.pattern.id, query);
    const own = page(v.pattern.id);
    const added = v.archetype.blocks.filter((b) => !v.pattern.blocks.some((x) => x.id === b.id));
    const gone = v.pattern.edges.map(keyOf).filter((k) => !v.archetype.edges.some((e) => keyOf(e) === k));
    for (const b of added) {
      assert.ok(chosen.includes(`data-block="${b.id}"`), `${at}: draws ${b.id}`);
      assert.ok(!own.includes(`data-block="${b.id}"`), `${at}: the pattern's own drawing has no ${b.id}`);
    }
    for (const k of gone) {
      assert.ok(!chosen.includes(`data-edge="${k.replace(">", "&gt;")}"`), `${at}: does not draw ${k}`);
      assert.ok(own.includes(`data-edge="${k.replace(">", "&gt;")}"`), `${at}: the pattern's own drawing has ${k}`);
    }
    // What it draws differently is marked quietly and says why on hover; no difference symbol.
    for (const id of Object.keys(v.archetype.drawn!.boxes)) assert.match(chosen, new RegExp(`data-block="${id}" data-shaped="box"`), `${at}: ${id} is marked as placed for the platform`);
    assert.match(chosen, /data-legend-placed/, `${at}: the legend says what a dashed box is`);
    assert.doesNotMatch(chosen, /≠|data-differs=/, `${at}: no difference mark`);
    assert.doesNotMatch(own, /data-shaped=|data-legend-placed/, `${at}: the pattern's own drawing carries no platform marks`);
    // Another platform, or the mapping without the option, keeps its own shape.
    if (v.host) assert.doesNotMatch(page(v.pattern.id, `cloud=${cloudSlug(v.product.id)}`), new RegExp(added.map((b) => `data-block="${b.id}"`).join("|") || "$^"), `${at}: only the option that changes the shape draws it`);
  }
});

test("How it works lists each change of shape with its why and its link, then the prose differences", () => {
  for (const v of variants) {
    const html = renderToStaticMarkup(<OnCloud archetype={v.pattern} product={v.product} />);
    const lines = shapeLinesFor(v.pattern, v.product);
    assert.equal([...html.matchAll(/data-shape-change="/g)].length, lines.length, `${v.label}: a line per change`);
    assert.equal([...html.matchAll(/data-difference="/g)].length, v.product.implementation.differences?.length ?? 0, `${v.label}: the remaining prose differences`);
    for (const c of v.product.implementation.shape ?? []) {
      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
      assert.ok(html.includes(esc(c.why)), `${v.label}: says why`);
      assert.ok(html.includes(`href="${c.url}"`), `${v.label}: links to the page that says so`);
    }
    assert.ok(html.indexOf("data-shape-change=") < (html.indexOf("data-difference=") + 1 || Infinity), `${v.label}: changes of shape come first`);
  }
});

test("walks follow the platform's shape: a split step shares its number, the pattern's numbering is kept", () => {
  for (const v of variants) {
    const spec = boundaryLayout(v.archetype);
    const lines = new Set(spec.lines.map((l) => l.key));
    for (const walk of [v.pattern.walkthrough!, ...(v.pattern.scenarios ?? [])]) {
      const drawn = walkOn(v.archetype, walk);
      const at = `${v.pattern.id} ${v.label} "${walk.title}"`;
      assert.deepEqual([...new Set(drawn.steps.map((s) => s.n))], walk.steps.map((_, i) => i + 1), `${at}: every step of the pattern's walk is kept, in order`);
      for (const s of drawn.steps.filter((x) => !x.skipped)) assert.ok(lines.has(s.follow) || lines.has(reverse(s.follow)), `${at}: ${s.follow} is drawn`);
      const html = renderToStaticMarkup(<BoxDiagram archetype={v.archetype} spec={spec} pins="risks" walk={drawn} />);
      const numbered = drawn.steps.filter((s) => !s.skipped && !s.continues).length;
      assert.equal([...html.matchAll(/aria-label="Step \d+"/g)].length, numbered, `${at}: a number per step drawn, none on a continuation`);
      // A box the platform inserts is a lifeline only in a walk that passes it.
      const seq = renderToStaticMarkup(<FlowSequence archetype={v.archetype} walk={drawn} />);
      for (const id of Object.keys(v.archetype.drawn!.boxes)) {
        const title = v.archetype.blocks.find((b) => b.id === id)!.title;
        const passes = drawn.steps.some((s) => !s.skipped && s.follow.split("->").includes(id));
        assert.equal(seq.includes(`>${title}<`), passes, `${at}: ${title} is in the sequence only where the walk passes it`);
      }
    }
  }
});

test("the Knative option draws the activator between the front door and the agent, and the walkthrough passes it", () => {
  const product = hostedAs(cloudProductFor(chat.id, "cloudOnPrem")!, "knative");
  const drawn = drawnOn(chat, product, "knative");
  assert.notEqual(drawn, chat);
  assert.ok(drawn.edges.some((e) => keyOf(e) === "entry->knativeActivator") && drawn.edges.some((e) => keyOf(e) === "knativeActivator->agent"), "the arrow is split");
  assert.ok(!drawn.edges.some((e) => keyOf(e) === "entry->agent"), "the direct arrow is gone");
  assert.equal(drawn.blocks.find((b) => b.id === "knativeActivator")!.zone, "zoneCloud", "drawn inside the organisation's boundary");
  // The mapping itself (plain Kubernetes) and every cloud keep the pattern's shape.
  assert.equal(drawnOn(chat, cloudProductFor(chat.id, "cloudOnPrem")!, null), chat);
  for (const id of ["cloudAws", "cloudAzure", "cloudGcp"]) assert.equal(drawnOn(chat, cloudProductFor(chat.id, id)!, null), chat, id);
  const walk = walkOn(drawn, chat.walkthrough!);
  const second = walk.steps.filter((s) => s.n === 2);
  assert.deepEqual(second.map((s) => [s.follow, Boolean(s.continues)]), [["entry->knativeActivator", false], ["knativeActivator->agent", true]], "step 2 passes the activator");
  const reply = walk.steps.filter((s) => s.n === 9);
  assert.deepEqual(reply.map((s) => s.follow), ["agent->knativeActivator", "knativeActivator->entry"], "the reply comes back through it");
  const seq = renderToStaticMarkup(<FlowSequence archetype={drawn} walk={walk} />);
  assert.match(seq, /Application front end → Knative activator → Agent harness/, "the prose reads it as one hop through the activator");
});

test("each kind of change applies to a copy, and pins and walk steps follow what they were on", () => {
  // insert, with its own legs' labels and the arrow's pins sent to the second leg
  const ins = apply([{ insert: { id: "proxy", title: "Egress proxy", summary: "Allowlisted egress", on: "gateway->openWeb", labels: ["search", "fetch"] }, pins: "proxy->openWeb", why: "Fetches leave through a proxy.", url: DOCS }]);
  assert.deepEqual(ins.problems, []);
  assert.deepEqual(ins.archetype.edges.filter((e) => e.from === "proxy" || e.to === "proxy").map((e) => [keyOf(e), e.label, e.path]), [["gateway->proxy", "search", "primary"], ["proxy->openWeb", "fetch", "external"]], "dashed only where it reaches outside");
  assert.ok(ins.archetype.pins.risks.some((p) => p.at === "proxy->openWeb" && p.risk === "riskPromptInjection"), "the risk on the arrow moved to the named leg");
  assert.equal(chat.edges.some((e) => keyOf(e) === "gateway->openWeb"), true, "the pattern itself is untouched");

  // move, out of the box that held it, with a call arrow from it
  const moved = apply([{ move: { block: "localTools", zone: "zoneExternal", call: "code execution" }, why: "The sandbox is a managed service outside your network.", url: DOCS }]);
  assert.deepEqual(moved.problems, []);
  const lt = moved.archetype.blocks.find((b) => b.id === "localTools")!;
  assert.equal(lt.zone, "zoneExternal");
  assert.equal(lt.parent, undefined, "it no longer sits inside the agent");
  assert.ok(moved.archetype.edges.some((e) => keyOf(e) === "agent->localTools" && e.label === "code execution" && e.outbound), "the agent calls it");
  audit(moved.archetype, { content: false });

  // drop: an arrow with pins must say where they go; a step on it is skipped with a note
  const bare = apply([{ drop: "gateway->openWeb", why: "Search is the provider's.", url: DOCS }]);
  assert.ok(bare.problems.some((p) => /carries riskPromptInjection.*pins/.test(p)), "a dropped arrow's pins need a place");
  const dropped = apply([{ drop: "gateway->openWeb", pins: "gateway", why: "Search is the provider's.", url: DOCS }]);
  assert.deepEqual(dropped.problems, []);
  assert.ok(dropped.archetype.pins.risks.some((p) => p.at === "gateway" && p.risk === "riskPromptInjection"));
  const web = chat.scenarios!.find((s) => s.steps.some((st) => st.follow === "gateway->openWeb"))!;
  const skipped = walkOn(dropped.archetype, web).steps.filter((s) => s.skipped);
  assert.equal(skipped.length, web.steps.filter((s) => s.follow === "gateway->openWeb" || s.follow === "openWeb->gateway").length);
  assert.ok(skipped.every((s) => s.skipped === "Not drawn on Testcloud: Search is the provider's."), "skipped with the reason");
  const seq = renderToStaticMarkup(<FlowSequence archetype={dropped.archetype} walk={walkOn(dropped.archetype, web)} />);
  assert.match(seq, /data-step-skipped="true"/, "the sequence lists the step with its note");

  // reroute: the flow starts at the provider; its pins and steps go with it
  const rerouted = apply([{ reroute: { from: "gateway->openWeb", to: "provider->openWeb" }, why: "The provider runs the search.", url: DOCS }]);
  assert.deepEqual(rerouted.problems, []);
  assert.ok(rerouted.archetype.pins.risks.some((p) => p.at === "provider->openWeb"));
  const steps = walkOn(rerouted.archetype, web).steps.map((s) => s.follow);
  assert.ok(steps.includes("provider->openWeb") && steps.includes("openWeb->provider") && !steps.includes("gateway->openWeb"), "the walk follows the new arrow both ways");
  audit(rerouted.archetype, { content: false });

  // rename
  const renamed = apply([{ rename: { at: "agent->gateway", label: "every model and tool call" }, why: "All calls cross it here.", url: DOCS }]);
  assert.deepEqual(renamed.problems, []);
  assert.equal(renamed.archetype.edges.find((e) => keyOf(e) === "agent->gateway")!.label, "every model and tool call");
  assert.ok(boundaryLayout(renamed.archetype).lines.find((l) => l.key === "agent->gateway")!.label!.lines.join(" ").includes("every model"));
});

test("the build refuses a change that names what is not there, reuses an id, or says too much", () => {
  const problems = (c: ShapeChange) => apply([c]).problems.join(" | ");
  assert.match(problems({ insert: { id: "agent", title: "X", on: "entry->agent" }, why: "Why.", url: DOCS }), /already used/);
  assert.match(problems({ insert: { id: "hop", title: "X", on: "agent->entry" }, why: "Why.", url: DOCS }), /drawn as entry->agent/);
  assert.match(problems({ move: { block: "nothing", zone: "zoneExternal" }, why: "Why.", url: DOCS }), /not a box/);
  assert.match(problems({ move: { block: "gateway", zone: "zoneGovernance" }, why: "Why.", url: DOCS }), /governance zone/);
  assert.match(problems({ reroute: { from: "gateway->openWeb", to: "agent->provider" }, why: "Why.", url: DOCS }), /keeps one end/);
  assert.match(problems({ rename: { at: "agent->gateway", label: "x".repeat(80) }, why: "Why.", url: DOCS }), /keep it to 60/);
  assert.match(problems({ rename: { at: "agent->gateway", label: "calls" }, why: "One. Two. Three.", url: DOCS }), /3 sentences/);
  assert.match(problems({ rename: { at: "agent->gateway", label: "calls" }, why: "Why.", url: "http://x" } as ShapeChange), /needs url/);
  assert.match(problems({ drop: "agent->gateway", reroute: { from: "a->b", to: "c->b" }, why: "Why.", url: DOCS } as unknown as ShapeChange), /exactly one/);
});
