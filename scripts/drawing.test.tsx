import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { BoxDiagram } from "../src/components/drawing/BoxDiagram";
import { CrossingsRegister } from "../src/components/drawing/CrossingsRegister";
import { crossingsOf, standIn } from "../src/components/drawing/crossings";
import { PatternDrawing } from "../src/components/drawing/PatternDrawing";
import { boundaryLayout, ownedControls, type Rect } from "../src/components/drawing/layout";
import { dataset, riskCode } from "../src/lib/data";
import { audit } from "./drawing-audit";
import type { Archetype } from "../src/lib/types";

const each = (fn: (a: Archetype) => void) => () => {
  for (const a of dataset.archetypes) fn(a);
};
const keyOf = (e: { from: string; to: string }) => `${e.from}->${e.to}`;
const reverse = (k: string) => k.split("->").reverse().join("->");
const inside = (r: Rect, o: Rect) => r.x >= o.x && r.y >= o.y && r.x + r.w <= o.x + o.w && r.y + r.h <= o.y + o.h;
const overlaps = (p: Rect, q: Rect) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;

test(
  "every block is a box and every edge is an arrow, on every pattern",
  each((a) => {
    const spec = boundaryLayout(a);
    assert.deepEqual(spec.boxes.map((b) => b.id).sort(), a.blocks.map((b) => b.id).sort(), `${a.id}: boxes`);
    assert.deepEqual(spec.lines.map((l) => l.key).sort(), a.edges.map(keyOf).sort(), `${a.id}: arrows`);
    for (const l of spec.lines) {
      assert.ok(l.pts.length >= 2, `${a.id}: ${l.key} has a path`);
      for (let i = 1; i < l.pts.length; i++)
        assert.ok(l.pts[i][0] === l.pts[i - 1][0] || l.pts[i][1] === l.pts[i - 1][1], `${a.id}: ${l.key} runs at right angles`);
      if (a.edges.find((e) => keyOf(e) === l.key)?.label) assert.ok(l.label?.lines.length, `${a.id}: ${l.key} carries its label`);
    }
  }),
);

test(
  "every control pin, every control a control-plane box owns and every risk pin has a place on the drawing",
  each((a) => {
    const spec = boundaryLayout(a);
    const places = new Set([...spec.boxes.map((b) => b.id), ...spec.lines.map((l) => l.key)]);
    const drawable = (at: string) => places.has(at) || places.has(reverse(at));
    for (const p of a.pins.mitigations) assert.ok(drawable(p.at), `${a.id}: control ${p.mitigation} at ${p.at}`);
    for (const p of a.pins.risks) assert.ok(drawable(p.at), `${a.id}: risk ${p.risk} at ${p.at}`);
    const controls = renderToStaticMarkup(<BoxDiagram archetype={a} spec={spec} pins="capabilities" />);
    // Every pinned control is on the drawing at least once, and each control-plane box shows what it owns.
    for (const id of a.mitigations) assert.ok(controls.includes(`data-control="${id}"`), `${a.id}: chip for ${id}`);
    const owned = a.blocks.filter((b) => b.kind === "governance").reduce((n, b) => n + ownedControls(a, b).length, 0);
    const onEdges = new Set(a.pins.mitigations.filter((p) => !a.blocks.some((b) => b.id === p.at)).map((p) => `${p.mitigation}@${p.at}`)).size;
    const onBlocks = a.blocks.filter((b) => b.kind !== "governance").reduce((n, b) => n + ownedControls(a, b).length, 0);
    assert.equal([...controls.matchAll(/data-control="/g)].length, owned + onEdges + onBlocks, `${a.id}: one chip per control per place`);
    assert.doesNotMatch(controls, /data-risk="/, `${a.id}: no risk tags among the controls`);

    const risks = renderToStaticMarkup(<BoxDiagram archetype={a} spec={spec} pins="risks" />);
    for (const p of a.pins.risks) {
      assert.ok(risks.includes(`data-risk="${p.risk}"`), `${a.id}: tag for ${p.risk}`);
      assert.ok(risks.includes(`>${riskCode(p.risk)}<`), `${a.id}: ${p.risk} shows its code`);
    }
    assert.equal([...risks.matchAll(/data-risk="/g)].length, new Set(a.pins.risks.map((p) => `${p.risk}@${p.at}`)).size, `${a.id}: one tag per risk pin`);
    assert.doesNotMatch(risks, /data-control="/, `${a.id}: controls give way to risks`);
  }),
);

test(
  "no two sibling boxes overlap, and every box lies inside the boundary of its zone",
  each((a) => {
    const spec = boundaryLayout(a);
    const box = new Map(spec.boxes.map((b) => [b.id, b]));
    const owner = new Map((a.zones ?? []).map((z) => [z.id, z.owner]));
    const boundary = new Map(spec.boundaries.map((b) => [b.zone, b]));
    for (const b of a.blocks) {
      const r = box.get(b.id)!;
      assert.ok(inside(r, { x: 0, y: 0, w: spec.width, h: spec.height }), `${a.id}: ${b.id} is on the canvas`);
      if (b.parent) assert.ok(inside(r, box.get(b.parent)!), `${a.id}: ${b.id} sits inside ${b.parent}`);
      if (owner.get(b.zone ?? "") === "user" || b.kind === "actor" || b.kind === "origin") {
        // People stand outside every boundary.
        for (const z of spec.boundaries) assert.ok(!overlaps(r, z), `${a.id}: ${b.id} is outside ${z.zone}`);
      } else {
        const z = boundary.get(b.zone ?? "");
        assert.ok(z, `${a.id}: zone ${b.zone} is drawn`);
        assert.ok(inside(r, z!), `${a.id}: ${b.id} sits inside ${b.zone}`);
        for (const other of spec.boundaries) if (other.zone !== b.zone) assert.ok(!overlaps(r, other), `${a.id}: ${b.id} stays out of ${other.zone}`);
      }
      for (const sib of a.blocks) {
        if (sib.id <= b.id || sib.parent !== b.parent) continue;
        assert.ok(!overlaps(r, box.get(sib.id)!), `${a.id}: ${b.id} and ${sib.id} overlap`);
      }
    }
    for (const p of spec.boundaries) for (const q of spec.boundaries) if (p.zone < q.zone) assert.ok(!overlaps(p, q), `${a.id}: boundaries ${p.zone} and ${q.zone} overlap`);
  }),
);

test(
  "no arrow runs through a box that is not one of its ends",
  each((a) => {
    const spec = boundaryLayout(a);
    const parents = new Set(a.blocks.map((b) => b.parent).filter(Boolean));
    for (const l of spec.lines) {
      const ends = l.key.split("->");
      for (const b of spec.boxes) {
        if (ends.includes(b.id) || parents.has(b.id)) continue;
        for (let i = 1; i < l.pts.length; i++) {
          const [x1, y1] = l.pts[i - 1];
          const [x2, y2] = l.pts[i];
          const seg = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
          const hit = seg.x < b.x + b.w && b.x < seg.x + seg.w + 0.01 && seg.y < b.y + b.h && b.y < seg.y + seg.h + 0.01 && seg.x + seg.w > b.x && seg.y + seg.h > b.y;
          const through = y1 === y2 ? y1 > b.y && y1 < b.y + b.h && hit : x1 > b.x && x1 < b.x + b.w && seg.y < b.y + b.h && seg.y + seg.h > b.y;
          assert.ok(!through, `${a.id}: ${l.key} runs through ${b.id}`);
        }
      }
    }
  }),
);

test(
  "every step of every walk follows a drawn arrow, and a walk numbers its steps onto the drawing",
  each((a) => {
    const spec = boundaryLayout(a);
    const keys = new Set(spec.lines.map((l) => l.key));
    for (const walk of [a.walkthrough, ...(a.scenarios ?? [])]) {
      if (!walk) continue;
      for (const s of walk.steps) assert.ok(keys.has(s.follow) || keys.has(reverse(s.follow)), `${a.id}: "${walk.title}" step ${s.follow}`);
      const html = renderToStaticMarkup(<BoxDiagram archetype={a} spec={spec} pins="risks" walk={walk} />);
      assert.equal([...html.matchAll(/aria-label="Step \d+"/g)].length, walk.steps.length, `${a.id}: "${walk.title}" numbers every step`);
    }
  }),
);

test(
  "the drawing renders for every pattern in both pin modes, with its words taken from the pattern",
  each((a) => {
    for (const pins of ["capabilities", "risks"] as const) {
      const html = renderToStaticMarkup(<PatternDrawing archetype={a} pins={pins} onPickMitigation={() => {}} onHighlight={() => {}} />);
      assert.match(html, /data-drawing="boundaries"/, a.id);
      for (const z of a.zones ?? []) {
        if (z.owner === "user" || !a.blocks.some((b) => b.zone === z.id)) continue;
        assert.ok(html.includes(`data-zone="${z.id}"`), `${a.id}: boundary ${z.id}`);
      }
      for (const b of a.blocks) assert.ok(html.includes(`data-block="${b.id}"`), `${a.id}: box ${b.id}`);
      // A provider reached under contract sits in the external band on some patterns: that band is not tagged "no agreement".
      const contracted = a.blocks.some((b) => b.kind === "provider" && (a.zones ?? []).find((z) => z.id === b.zone)?.owner === "external");
      if (contracted) assert.doesNotMatch(html, /no agreement/, `${a.id}: a contracted provider is not tagged "no agreement"`);
      // The drawing's own words (everything but the pattern's text) use the reader's vocabulary.
      const chrome = html.replace(/<text[^>]*>[\s\S]*?<\/text>/g, "").replace(/aria-label="[^"]*: trust-boundary drawing"/, "");
      assert.doesNotMatch(chrome, /capabilit|archetype|architecture/i, `${a.id}: reader-facing words`);
    }
  }),
);

test("a lit control and a lit risk are marked, and a cloud's services relabel the boxes", () => {
  const a = dataset.archetypes.find((x) => x.id === "archChatAgent")!;
  const spec = boundaryLayout(a);
  const control = a.mitigations[0];
  const lit = renderToStaticMarkup(<BoxDiagram archetype={a} spec={spec} highlight={{ kind: "mitigation", id: control }} />);
  const marked = [...lit.matchAll(/data-control="([^"]+)" data-lit="true"/g)].map((m) => m[1]);
  assert.ok(marked.length && marked.every((id) => id === control), "only the picked control is lit");
  const risk = a.pins.risks[0].risk;
  const litRisk = renderToStaticMarkup(<BoxDiagram archetype={a} spec={spec} pins="risks" highlight={{ kind: "risk", id: risk }} />);
  assert.ok([...litRisk.matchAll(/data-risk="([^"]+)" data-lit="true"/g)].every((m) => m[1] === risk));
  assert.match(litRisk, /data-lit="true"/);

  const cloud = dataset.clouds.find((c) => c.implementations.some((i) => i.architecture === a.id))!;
  const impl = cloud.implementations.find((i) => i.architecture === a.id)!;
  const services = new Map(impl.bindings.map((b) => [b.block, { service: b.service, build: b.build, note: b.note }]));
  const html = renderToStaticMarkup(<BoxDiagram archetype={a} spec={spec} services={services} />);
  const escape = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  for (const b of impl.bindings) {
    // A long service name wraps; its first word is always on the box.
    assert.ok(html.includes(escape(b.service.split(/\s+/)[0])), `${cloud.id}: ${b.block} shows ${b.service}`);
  }
  if (impl.bindings.some((b) => b.build)) assert.match(html, /YOU BUILD THIS/);
});

test(
  "the crossings register lists every flow that crosses a trust boundary once",
  each((a) => {
    // A person or an outside caller stands outside whatever zone its block names, so its flows cross.
    const owners = new Map((a.zones ?? []).map((z) => [z.id, z.owner as string]));
    const zone = new Map(a.blocks.map((b) => [b.id, standIn(b, owners)]));
    const crossing = a.edges.filter((e) => zone.get(e.from) !== zone.get(e.to)).map(keyOf);
    assert.deepEqual(crossingsOf(a).map((c) => c.key), crossing, a.id);
    const html = renderToStaticMarkup(<CrossingsRegister archetype={a} />);
    assert.equal([...html.matchAll(/id="crossing-/g)].length, crossing.length, `${a.id}: a row per crossing`);
    for (const c of crossingsOf(a)) {
      assert.ok(c.via.trim(), `${a.id}: ${c.key} says what it passes through`);
      assert.ok(["brokered", "vendor", "person", "direct"].includes(c.kind), `${a.id}: ${c.key}`);
    }
  }),
);

test("the coding agent's crossings are the ones its pattern file states", () => {
  const a = dataset.archetypes.find((x) => x.id === "archCodingAgentThirdParty")!;
  const crossings = crossingsOf(a);
  assert.equal(crossings.length, 12);
  assert.ok(crossings.every((c) => c.authored));
  assert.equal(crossings.find((c) => c.key === "toolPlane->openWeb")!.kind, "direct");
});

// The pattern standard (docs/PATTERN-STANDARD.md), enforced: every measured rule, on every pattern.
test(
  "every pattern meets the standard: the drawing's layout rules and the content the drawing needs",
  each((a) => {
    const { findings } = audit(a);
    assert.deepEqual(findings.map((f) => `${f.rule}: ${f.detail}`), [], `${a.slug} (npm run drawing:audit -- ${a.slug})`);
  }),
);
