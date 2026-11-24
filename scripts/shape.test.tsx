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
import { applyShape, describeShape, walkOn } from "../src/lib/shape";
import { crossingsOf } from "../src/components/drawing/crossings";
import { dataset } from "../src/lib/data";
import type { Archetype, ShapeChange } from "../src/lib/types";
import { audit } from "./drawing-audit";
import { loadClouds } from "./lib/products";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
    const arrows = v.archetype.edges.map(keyOf).filter((k) => !v.pattern.edges.some((e) => keyOf(e) === k));
    for (const k of arrows) {
      assert.ok(chosen.includes(`data-edge="${k.replace(">", "&gt;")}"`), `${at}: draws ${k}`);
      assert.ok(!own.includes(`data-edge="${k.replace(">", "&gt;")}"`), `${at}: the pattern's own drawing has no ${k}`);
    }
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
    // A reroute or a rename places no box, so the legend for a placed box appears only when one is.
    if (Object.keys(v.archetype.drawn!.boxes).length) assert.match(chosen, /data-legend-placed/, `${at}: the legend says what a dashed box is`);
    assert.doesNotMatch(chosen, /≠|data-differs=/, `${at}: no difference mark`);
    assert.doesNotMatch(own, /data-shaped=|data-legend-placed/, `${at}: the pattern's own drawing carries no platform marks`);
    // Another platform, or the mapping without the option, keeps its own shape.
    // A hosting option draws its own changes on top of the mapping's; only the ones it adds are missing without it.
    if (v.host) {
      const mapped = drawnOn(v.pattern, cloudProductFor(v.pattern.id, v.product.id)!, null);
      const own = added.filter((b) => !mapped.blocks.some((x) => x.id === b.id));
      assert.doesNotMatch(page(v.pattern.id, `cloud=${cloudSlug(v.product.id)}`), new RegExp(own.map((b) => `data-block="${b.id}"`).join("|") || "$^"), `${at}: only the option that changes the shape draws it`);
    }
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
        assert.equal(seq.includes(`>${title.replace(/&/g, "&amp;")}<`), passes, `${at}: ${title} is in the sequence only where the walk passes it`);
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
  // A scheduled run comes in through Knative's cluster-local gateway, a second way in that does not pass the front end.
  assert.ok(drawn.edges.some((e) => keyOf(e) === "events->knativeLocalGateway") && drawn.edges.some((e) => keyOf(e) === "knativeLocalGateway->agent"), "the scheduled run passes the local gateway");
  assert.ok(!drawn.edges.some((e) => e.from === "entry" && e.to === "knativeLocalGateway"), "the front end does not");
  // The mapping itself (plain Kubernetes) and every cloud keep the pattern's shape.
  assert.equal(drawnOn(chat, cloudProductFor(chat.id, "cloudOnPrem")!, null), chat);
  // A cloud that changes the shape for its own reasons does so in its own mapping, never through the Knative option.
  for (const id of ["cloudAws", "cloudAzure", "cloudGcp"]) {
    const p = cloudProductFor(chat.id, id)!;
    if (!p.implementation.shape?.length) assert.equal(drawnOn(chat, p, null), chat, id);
    else assert.ok(!drawnOn(chat, p, null).blocks.some((b) => b.id === "knativeActivator"), `${id}: no Knative activator`);
  }
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

  // add: an arrow the pattern does not draw, labelled, with the why on hover; no pin and no step moves
  const add = apply([{ add: { from: "events", to: "gateway", label: "scheduled prompt" }, why: "Schedules call the gateway themselves.", url: DOCS }]);
  assert.deepEqual(add.problems, []);
  const extra = add.archetype.edges.find((e) => keyOf(e) === "events->gateway")!;
  assert.deepEqual([extra.label, extra.path, extra.note, Boolean(extra.outbound)], ["scheduled prompt", "primary", "Schedules call the gateway themselves.", false]);
  assert.equal(add.archetype.drawn!.arrows["events->gateway"], "Schedules call the gateway themselves.");
  assert.deepEqual(add.archetype.drawn!.follows, Object.fromEntries(chat.edges.map((e) => [keyOf(e), [keyOf(e)]])), "the pattern's own arrows are drawn as they are");
  assert.deepEqual(add.archetype.pins, chat.pins, "the pins stay where they were");
  assert.deepEqual(walkOn(add.archetype, chat.walkthrough!).steps.map((s) => s.follow), chat.walkthrough!.steps.map((s) => s.follow), "the walk is the pattern's");
  assert.ok(boundaryLayout(add.archetype).lines.find((l) => l.key === "events->gateway")!.label!.lines.join(" ").includes("scheduled"), "drawn with its label");
  audit(add.archetype, { content: false });
  const addLines = describeShape(chat, [{ add: { from: "events", to: "gateway", label: "scheduled prompt" }, why: "Why.", url: DOCS }]);
  assert.deepEqual(addLines.map((l) => [l.key, l.kind, l.where]), [["events->gateway", "add", "Triggers & schedules → AI gateway, added"]]);

  // across a trust boundary it says what it passes through, and its kind is the one its ends give it
  const out = apply([{ add: { from: "agent", to: "openWeb", label: "direct fetch", crossing: { via: "Nothing of ours: the harness opens it itself" } }, why: "The harness fetches pages itself.", url: DOCS }]);
  assert.deepEqual(out.problems, []);
  const fetch = out.archetype.edges.find((e) => keyOf(e) === "agent->openWeb")!;
  assert.deepEqual([fetch.path, fetch.outbound, fetch.crossing], ["external", true, { kind: "direct", via: "Nothing of ours: the harness opens it itself" }], "dashed, called, and crossing directly");
  const crossing = crossingsOf(out.archetype).find((c) => c.key === "agent->openWeb")!;
  assert.deepEqual([crossing.authored, crossing.via], [true, "Nothing of ours: the harness opens it itself"], "the crossings register lists it as authored");
  const brokered = apply([{ add: { from: "gateway", to: "sources", label: "package lookups", crossing: { via: "AI gateway: allowlisted index only" } }, why: "Why.", url: DOCS }]);
  assert.equal(brokered.archetype.edges.find((e) => keyOf(e) === "gateway->sources")!.crossing!.kind, "brokered", "a control point at one end brokers it");

  // to a box an earlier change inserts, and as an arrow a later change inserts a box on
  const chain = apply([
    { insert: { id: "localGateway", title: "Local gateway", on: "events->agent" }, why: "Scheduled runs come in through a local gateway.", url: DOCS },
    { add: { from: "gateway", to: "localGateway", label: "cluster-local calls" }, why: "The gateway reaches the agent the same way.", url: DOCS },
    { add: { from: "memory", to: "provider", label: "embeddings", crossing: { via: "Nothing of ours in the path" } }, why: "The store calls the model for embeddings.", url: DOCS },
    { insert: { id: "proxy", title: "Egress proxy", on: "memory->provider" }, why: "Its calls leave through the proxy.", url: DOCS },
  ]);
  assert.deepEqual(chain.problems, []);
  assert.ok(chain.archetype.edges.some((e) => keyOf(e) === "gateway->localGateway"), "an arrow to an inserted box");
  const legs = chain.archetype.edges.filter((e) => keyOf(e) === "memory->proxy" || keyOf(e) === "proxy->provider");
  assert.deepEqual(legs.map((e) => [keyOf(e), e.label, e.path, e.crossing?.kind]), [["memory->proxy", "embeddings", "primary", undefined], ["proxy->provider", undefined, "external", "direct"]], "the leg that crosses keeps the crossing");
  assert.ok(!chain.archetype.edges.some((e) => keyOf(e) === "memory->provider"), "the added arrow is split");
  audit(chain.archetype, { content: false });
});

const sandbox = dataset.archetypes.find((a) => a.id === "archAgentSandbox")!;
/** Is one drawn box inside another's rectangle? */
const within = (spec: ReturnType<typeof boundaryLayout>, inner: string, outer: string) => {
  const [i, o] = [spec.boxes.find((b) => b.id === inner)!, spec.boxes.find((b) => b.id === outer)!];
  return i.x >= o.x && i.y >= o.y && i.x + i.w <= o.x + o.w && i.y + i.h <= o.y + o.h;
};

test("a move within a box's own zone takes it out of the box that holds it, with the call from that box", () => {
  const why = "The sandbox is a service the agent calls, not code in its process.";
  const out = apply([{ move: { block: "localTools", zone: "zoneCloud", col: 1.5, row: 2, call: "code & files / output" }, why, url: DOCS }]);
  assert.deepEqual(out.problems, []);
  const lt = out.archetype.blocks.find((b) => b.id === "localTools")!;
  assert.deepEqual([lt.zone, lt.parent, lt.col, lt.row], ["zoneCloud", undefined, 1.5, 2], "its own box, in the zone it was in, at the cell given");
  const call = out.archetype.edges.find((e) => keyOf(e) === "agent->localTools")!;
  assert.deepEqual([call.label, call.outbound, call.path, call.crossing], ["code & files / output", true, "primary", undefined], "called by the agent, across no boundary");
  assert.equal(out.archetype.drawn!.boxes.localTools, why, "marked as placed for the platform, with its why");
  assert.deepEqual(out.archetype.pins, chat.pins, "its pins and its arrows' pins stay where they were");
  const spec = boundaryLayout(out.archetype);
  assert.ok(!within(spec, "localTools", "agent"), "drawn outside the agent");
  assert.deepEqual(audit(out.archetype, { content: false }).findings, [], "laid out by the same rules");
  assert.deepEqual(describeShape(chat, [{ move: { block: "localTools", zone: "zoneCloud" }, why, url: DOCS }]).map((l) => l.where), ["Native tools, taken out of Agent harness"]);
  // Without a cell it is placed beside the box it leaves.
  const beside = apply([{ move: { block: "localTools", zone: "zoneCloud" }, why, url: DOCS }]);
  assert.deepEqual(beside.problems, []);
  assert.deepEqual([beside.archetype.blocks.find((b) => b.id === "localTools")!.col, beside.archetype.blocks.find((b) => b.id === "localTools")!.row], [2, 3], "under the agent, the box it left");

  // One level at a time: the tools out of the harness stay in the sandbox; the harness out of the sandbox
  // stands on its own, in one cell, and a boundary only holds, so nothing calls it from there.
  const sessions = applyShape(sandbox, [
    { move: { block: "localTools", zone: "zoneCloud", call: "each action" }, why: "The tool server stays in the session.", url: DOCS },
    { move: { block: "harness", zone: "zoneCloud", col: 2, row: 0 }, why: "The harness runs outside the session.", url: DOCS },
  ], { key: "sandbox|test|sessions", on: "on Testcloud" });
  assert.deepEqual(sessions.problems, []);
  const [tools, harness] = ["localTools", "harness"].map((id) => sessions.archetype.blocks.find((b) => b.id === id)!);
  assert.equal(tools.parent, "sandbox", "the tools stay in the session");
  assert.deepEqual([harness.parent, harness.rowSpan], [undefined, undefined], "the harness stands on its own, in one cell");
  assert.ok(sessions.archetype.edges.some((e) => keyOf(e) === "harness->localTools" && e.label === "each action"), "the harness calls the tools it held");
  assert.ok(!sessions.archetype.edges.some((e) => e.from === "sandbox"), "the session calls nothing");
  const drawn = boundaryLayout(sessions.archetype);
  assert.ok(within(drawn, "localTools", "sandbox") && !within(drawn, "harness", "sandbox"), "drawn so");
  assert.deepEqual(audit(sessions.archetype, { content: false }).findings, []);
  const twice = (c: ShapeChange) => applyShape(sandbox, [{ move: { block: "localTools", zone: "zoneCloud" }, why: "Why.", url: DOCS }, c], { key: `sandbox|test|${(tried += 1)}`, on: "on Testcloud" }).problems.join(" | ");
  assert.match(twice({ move: { block: "harness", zone: "zoneCloud", call: "runs" }, why: "Why.", url: DOCS }), /Sandbox only holds; it does not call Agent harness/);
  assert.match(apply([{ move: { block: "gateway", zone: "zoneCloud" }, why: "Why.", url: DOCS }]).problems.join(" | "), /already in zoneCloud and stands on its own/);
});

test("an inserted box can stand outside the box the arrow it splits leaves", () => {
  const why = "Browsing goes through a separate session.";
  // localTools->offlineWeb leaves the harness and the sandbox: by default the new hop is drawn inside the harness.
  const inside = applyShape(sandbox, [{ insert: { id: "browser", title: "Browser session", on: "localTools->offlineWeb" }, why, url: DOCS }], { key: "sandbox|test|inside", on: "on Testcloud" });
  assert.deepEqual(inside.problems, []);
  assert.equal(inside.archetype.blocks.find((b) => b.id === "browser")!.parent, "harness");
  // parent null draws it on its own, between the sandbox and the offline web.
  const own = applyShape(sandbox, [{ insert: { id: "browser", title: "Browser session", on: "localTools->offlineWeb", parent: null, labels: ["browser actions", "browse & search"] }, why, url: DOCS }], { key: "sandbox|test|own", on: "on Testcloud" });
  assert.deepEqual(own.problems, []);
  const browser = own.archetype.blocks.find((b) => b.id === "browser")!;
  assert.deepEqual([browser.parent, browser.zone], [undefined, "zoneCloud"]);
  const spec = boundaryLayout(own.archetype);
  assert.ok(!within(spec, "browser", "sandbox"), "drawn outside the sandbox");
  assert.deepEqual(own.archetype.edges.filter((e) => e.from === "browser" || e.to === "browser").map((e) => [keyOf(e), e.label]), [["localTools->browser", "browser actions"], ["browser->offlineWeb", "browse & search"]]);
  assert.deepEqual(audit(own.archetype, { content: false }).findings, []);
  // So do an explicit cell, and the build's checks on what parent may be.
  const placed = applyShape(sandbox, [{ insert: { id: "browser", title: "Browser session", on: "localTools->offlineWeb", parent: null, col: 2.5, row: 2 }, why, url: DOCS }], { key: "sandbox|test|placed", on: "on Testcloud" });
  assert.deepEqual([placed.problems, placed.archetype.blocks.find((b) => b.id === "browser")!.col], [[], 2.5]);
  const problems = (c: ShapeChange) => apply([c]).problems.join(" | ");
  assert.match(problems({ insert: { id: "hop", title: "X", on: "entry->agent", parent: null }, why, url: DOCS }), /neither end of entry->agent is drawn inside one/);
  assert.match(problems({ insert: { id: "hop", title: "X", on: "entry->agent", parent: "nothing" }, why, url: DOCS }), /parent nothing is not a box of archChatAgent; null draws it outside every box/);
});

test("a hosting option is drawn without the mapping's changes it names in dropShape", () => {
  // The ids: camelCase, one per change.
  const ids = (cs: ShapeChange[]) => apply(cs).problems.join(" | ");
  assert.match(ids([{ id: "Not ok", rename: { at: "agent->gateway", label: "calls" }, why: "Why.", url: DOCS }]), /id must be camelCase/);
  assert.match(ids([{ id: "same", rename: { at: "agent->gateway", label: "calls" }, why: "Why.", url: DOCS }, { id: "same", rename: { at: "entry->agent", label: "turns" }, why: "Why.", url: DOCS }]), /id same is already used by another change/);
  assert.deepEqual(apply([{ id: "named", rename: { at: "agent->gateway", label: "calls" }, why: "Why.", url: DOCS }]).problems, []);
  // On AWS the front end calls the runtime through your own code; on EKS the load balancer forwards to the pods.
  const p = cloudProductFor(chat.id, "cloudAws")!;
  const mapped = drawnOn(chat, p, null);
  assert.ok(mapped.blocks.some((b) => b.id === "runtimeCaller") && !mapped.edges.some((e) => keyOf(e) === "entry->agent"));
  const eks = hostedAs(p, "eks");
  assert.ok(p.implementation.hosting!.find((o) => o.id === "eks")!.dropShape!.includes("runtimeCaller"));
  assert.deepEqual(eks.implementation.shape!.map((c) => c.id ?? Object.keys(c).find((k) => k !== "why" && k !== "url")), ["move"], "the move still holds there");
  const onEks = drawnOn(chat, eks, "eks");
  assert.ok(!onEks.blocks.some((b) => b.id === "runtimeCaller") && onEks.edges.some((e) => keyOf(e) === "entry->agent"), "no front-end code on EKS");
  assert.equal(onEks.blocks.find((b) => b.id === "localTools")!.parent, undefined, "Code Interpreter stays apart from the agent");
  assert.ok(drawnVariants(chat).some((v) => v.product.id === "cloudAws" && v.host === "eks"), "a drawing of its own");
  assert.deepEqual(shapeLinesFor(chat, eks).map((l) => l.key), ["localTools"], "How it works lists only what holds");
  // An option that drops every change is drawn as the pattern, and is no drawing of its own.
  const inference = dataset.archetypes.find((a) => a.id === "archSelfHostedInference")!;
  const g = cloudProductFor(inference.id, "cloudGcp")!;
  assert.ok(drawnOn(inference, g, null).blocks.some((b) => b.id === "endpointPicker"), "the GKE mapping draws the endpoint picker");
  assert.equal(drawnOn(inference, hostedAs(g, "cloudRun"), "cloudRun"), inference, "Cloud Run has none");
  assert.ok(!drawnVariants(inference).some((v) => v.product.id === "cloudGcp" && v.host === "cloudRun"));
  const endpoints = drawnOn(inference, hostedAs(g, "agentPlatformEndpoints"), "agentPlatformEndpoints");
  assert.ok(!endpoints.blocks.some((b) => b.id === "endpointPicker") && endpoints.blocks.some((b) => b.id === "managedModelCopy"), "endpoints drop the picker and keep their own change");
});

test("the build refuses a dropShape that names no change, sits on the mapped option, or leaves a later change with nothing to apply to", async () => {
  const root = await mkdtemp(join(tmpdir(), "shape-"));
  await mkdir(join(root, "data", "clouds"), { recursive: true });
  const aws = await readFile(join(process.cwd(), "data", "clouds", "aws.yaml"), "utf8");
  const failures = async (yaml: string) => {
    await writeFile(join(root, "data", "clouds", "aws.yaml"), yaml);
    const out: string[] = [];
    await loadClouds(root, { archetypes: dataset.archetypes, mitigationIds: new Set(dataset.mitigations.map((m) => m.id)), fail: (m) => out.push(m) });
    return out.filter((m) => /dropShape|dropDifferences/.test(m)).join(" | ");
  };
  assert.equal(await failures(aws), "", "the data as it is");
  const once = (from: string, to: string) => {
    assert.equal(aws.split(from).length, 2, `the edit applies once: ${from}`);
    return aws.replace(from, to);
  };
  assert.match(await failures(once("albOidcClaimsVerify]\n        dropShape: [runtimeCaller]", "albOidcClaimsVerify]\n        dropShape: [nothingLikeIt]")), /dropShape names nothingLikeIt, which is not the id of a change in the mapping's shape \(runtimeCaller\)/);
  // The first mapped option in the file is the chat agent's AgentCore Runtime, the mapping itself.
  assert.match(await failures(aws.replace("        mapped: true\n", "        mapped: true\n        dropShape: [runtimeCaller]\n")), /hosting agentCoreRuntime: dropShape is for a variant: the mapped option is the mapping itself and drops none of its own changes/);
  assert.match(await failures(once("dropShape: [starterFunction, callbackApproval]\n        alsoNeeded:\n          - service: \"AWS Lambda ingress function\"", "dropDifferences: [events->harness]\n        alsoNeeded:\n          - service: \"AWS Lambda ingress function\"")), /dropDifferences names events->harness, which is not where one of the mapping's differences is/);
  // Dropping the inserted box but not the change that rerouted the arrow onto it leaves the reroute nothing to move.
  const picker = (await readFile(join(process.cwd(), "data", "clouds", "gcp.yaml"), "utf8")).replace("dropShape: [endpointPicker, pickedPod, pickerMetrics]\n        alsoNeeded:", "dropShape: [endpointPicker]\n        alsoNeeded:");
  await writeFile(join(root, "data", "clouds", "aws.yaml"), "id: cloudNone\nname: None\nshort: None\nsettings: []\nimplementations: []\n");
  await writeFile(join(root, "data", "clouds", "gcp.yaml"), picker);
  const out: string[] = [];
  await loadClouds(root, { archetypes: dataset.archetypes, mitigationIds: new Set(dataset.mitigations.map((m) => m.id)), fail: (m) => out.push(m) });
  assert.match(out.join(" | "), /hosting cloudRun: once dropShape is applied, shape change 1 \(reroute endpointPicker->api\): from "endpointPicker->api" is not an arrow/);
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
  // add: both ends exist (or are inserted earlier), it is a new arrow, and a crossing is said exactly where there is one
  assert.match(problems({ add: { from: "nothing", to: "agent", label: "calls" }, why: "Why.", url: DOCS }), /nothing is not a box of archChatAgent, nor one an earlier change inserts/);
  assert.match(
    apply([
      { add: { from: "localGateway", to: "agent", label: "calls" }, why: "Why.", url: DOCS },
      { insert: { id: "localGateway", title: "Local gateway", on: "events->agent" }, why: "Why.", url: DOCS },
    ]).problems.join(" | "),
    /localGateway is not a box/,
    "a box inserted later in the list is not there yet",
  );
  assert.match(problems({ add: { from: "entry", to: "agent", label: "turn" }, why: "Why.", url: DOCS }), /entry->agent is already an arrow/);
  assert.match(problems({ add: { from: "agent", to: "entry", label: "reply" }, why: "Why.", url: DOCS }), /already drawn as entry->agent/);
  assert.match(problems({ add: { from: "agent", to: "agent", label: "loop" }, why: "Why.", url: DOCS }), /loops back/);
  assert.match(problems({ add: { from: "agent", to: "localTools", label: "calls" }, why: "Why.", url: DOCS }), /drawn inside Agent harness/);
  assert.match(problems({ add: { from: "gateway", to: "govPolicy", label: "policy" }, why: "Why.", url: DOCS }), /control-plane box/);
  assert.match(problems({ add: { from: "agent", to: "openWeb", label: "fetch" }, why: "Why.", url: DOCS }), /different trust zones; say what the arrow passes through on our side with crossing/);
  assert.match(problems({ add: { from: "events", to: "gateway", label: "prompt", crossing: { via: "AI gateway" } }, why: "Why.", url: DOCS }), /stand in one/);
  assert.match(problems({ add: { from: "agent", to: "openWeb", label: "fetch", crossing: { via: "x", kind: "direct" } }, why: "Why.", url: DOCS } as unknown as ShapeChange), /crossing is \{ via \}/);
  assert.match(problems({ add: { from: "events", to: "gateway", label: "" }, why: "Why.", url: DOCS }), /needs a label/);
  assert.match(problems({ add: { from: "events", to: "gateway", label: "prompt" }, pins: "gateway", why: "Why.", url: DOCS }), /pins says where an arrow's pins go/);
  assert.match(problems({ add: { from: "events", to: "gateway", label: "prompt", route: "hv" }, why: "Why.", url: DOCS } as unknown as ShapeChange), /add has unknown field route/);
});
