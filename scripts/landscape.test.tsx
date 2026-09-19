import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { dataset, landscape, mitigations } from "../src/lib/data";
import { loadLandscape, resolvePlacement } from "./lib/landscape";
import { aiKindOf, coverageOf, isAiSpecific, parents, placementOf, tilesFor, tilesInCell, tilesInGroup } from "../src/components/landscape/model";
import { DomainPoster } from "../src/components/landscape/DomainPoster";
import { AssetFunctionMatrix } from "../src/components/landscape/AssetFunctionMatrix";
import { LayerStack } from "../src/components/landscape/LayerStack";

const parentIds = new Set(parents.map((m) => m.id));
const tiles = (html: string) => [...html.matchAll(/data-tile="([^"]+)"/g)].map((m) => m[1]);
const draw = (viewId: string, overlay: boolean, surface: string | null = null, aiOnly = false) => {
  const view = landscape.views.find((v) => v.id === viewId)!;
  const props = { view, tiles: tilesFor(surface, overlay, aiOnly), surface, aiOnly, overlay, selected: null, onSelect: () => {} };
  const el = viewId === "matrix" ? <AssetFunctionMatrix {...props} /> : viewId === "layers" ? <LayerStack {...props} /> : <DomainPoster {...props} />;
  return renderToStaticMarkup(el);
};

test("the landscape compiles from YAML exactly as the dataset carries it", async () => {
  assert.deepEqual(await loadLandscape(process.cwd(), parentIds), dataset.landscape);
  assert.equal(landscape.views.length, 3);
  await assert.rejects(loadLandscape(process.cwd(), new Set([...parentIds, "D3-NEW"])), /D3-NEW has no landscape placement/);
});

test("every MITRE parent has one resolvable home per view; specialisations are never placed", () => {
  assert.equal(Object.keys(landscape.placements).length, parents.length);
  for (const m of mitigations) {
    if (m.parent) {
      assert.equal(landscape.placements[m.id], undefined, m.id);
      continue;
    }
    for (const view of landscape.views) {
      const placed = resolvePlacement(view, landscape.placements[m.id][view.id]);
      assert.ok(placed, `${m.id} in ${view.id}`);
      const p = placementOf(view, m.id);
      if (view.kind === "matrix") assert.deepEqual(placed, { row: p.a, column: p.b });
      else assert.deepEqual(placed, p.b ? { group: p.a, lane: p.b } : { group: p.a });
    }
  }
  const domains = landscape.views.find((v) => v.id === "domains")!;
  assert.equal(resolvePlacement(domains, "workloads"), null, "a group with lanes needs a lane");
  assert.equal(resolvePlacement(domains, "identity/x"), null, "a group without lanes takes none");
  assert.equal(resolvePlacement(domains, "nowhere"), null);
});

test("each drawing shows every parent exactly once, and a surface filter keeps only what applies there", () => {
  for (const view of landscape.views) {
    const shown = tiles(draw(view.id, false));
    assert.deepEqual([...shown].sort(), [...parentIds].sort(), view.id);
    for (const s of dataset.surfaces) {
      const onSurface = tiles(draw(view.id, false, s.id));
      assert.deepEqual([...onSurface].sort(), parents.filter((m) => m.surfaces[s.id]?.applies).map((m) => m.id).sort(), `${view.id} ${s.id}`);
    }
  }
  const matrix = landscape.views.find((v) => v.id === "matrix")!;
  const all = tilesFor(null, false);
  const cells = matrix.rows!.flatMap((r) => matrix.columns!.map((c) => tilesInCell(matrix, all, r.id, c.id).length));
  assert.equal(cells.reduce((a, b) => a + b, 0), parents.length);
  assert.ok(cells.some((n) => n === 0), "the matrix has structural gaps to show");
  assert.match(draw("matrix", false), /none in catalogue/);
  const layers = landscape.views.find((v) => v.id === "layers")!;
  assert.equal(layers.groups!.reduce((n, g) => n + tilesInGroup(layers, all, g.id).length, 0), parents.length);
});

test("the org overlay tints tiles and adds coverage without changing which tiles are drawn", () => {
  for (const view of landscape.views) {
    const off = draw(view.id, false);
    const on = draw(view.id, true);
    assert.deepEqual(tiles(off), tiles(on), view.id);
    assert.notEqual(off, on);
    assert.doesNotMatch(off, /not assessed/);
    assert.match(on, /not assessed/);
  }
  const c = coverageOf(tilesFor(null, true));
  assert.equal(c.total, parents.length);
  assert.equal(c.enabled + c.inProgress + c.gap + c.notAssessed, c.total);
  assert.ok(c.enabled > 0 && c.notAssessed > 0, "the example org has recorded some and left most unassessed");
  const endpoint = coverageOf(tilesFor("surfaceEndpoint", true));
  assert.ok(endpoint.gap >= 1, "the example org records an endpoint gap");
});

test("AI-specific = ATLAS parents plus D3FEND parents with an authored AI specialisation; the filter keeps exactly those", () => {
  const specific = parents.filter(isAiSpecific);
  for (const m of parents) {
    const kind = aiKindOf(m);
    if (m.origin.framework === "MITRE ATLAS") assert.equal(kind, "native", m.id);
    else if (mitigations.some((s) => s.parent === m.id)) assert.equal(kind, "extended", m.id);
    else assert.equal(kind, "foundational", m.id);
  }
  assert.ok(specific.some((m) => aiKindOf(m) === "extended"), "the extended tier is not empty");
  assert.ok(specific.length < parents.length, "the filter hides something");
  for (const view of landscape.views) {
    assert.deepEqual(tiles(draw(view.id, false, null, true)).sort(), specific.map((m) => m.id).sort(), view.id);
  }
  assert.match(draw("domains", false, null, true), /Nothing AI-specific/);
});
