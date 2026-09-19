import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { DefenseMatrix } from "../src/components/defenses/DefenseMatrix";
import { matrixHref } from "../src/components/defenses/DefenseNavigation";
import { mitigationMatrixItem, matchesMatrixFilters } from "../src/components/defenses/model";
import { CapabilitiesRoute } from "../src/components/capabilities/CapabilitiesBrowser";
import { MitigationsBrowser } from "../src/components/mitigations/MitigationsBrowser";
import { ControlsBrowser } from "../src/components/browse/ControlsBrowser";
import { controls, mitigations, mitigationAliases, orgSurfaceStatusFor, orgSurfacePostureFor, orgCapabilities, surfaces } from "../src/lib/data";

const all = { category: "", surface: "" };
const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
function page(path: string, query = "") {
  return renderToStaticMarkup(<AppRouterContext.Provider value={router}>
    <PathnameContext.Provider value={path}><SearchParamsContext.Provider value={new URLSearchParams(query)}>
      {path === "/capabilities" ? <CapabilitiesRoute /> : path === "/controls" ? <ControlsBrowser /> : <MitigationsBrowser />}
    </SearchParamsContext.Provider></PathnameContext.Provider>
  </AppRouterContext.Provider>);
}
const rows = (h: string) => [...h.matchAll(/data-id="/g)].length;
const chips = (h: string) => [...h.matchAll(/<button[^>]*aria-pressed/g)].length;

test("every capability appears in the matrix in its control group, on the surfaces where it applies", () => {
  for (const capability of mitigations) {
    const item = mitigationMatrixItem(capability);
    assert.ok(item.placements.length, capability.id);
    for (const p of item.placements) {
      assert.equal(p.category, capability.category);
      assert.ok(capability.surfaces[p.surface].applies, `${capability.id} ${p.surface}`);
    }
    const html = renderToStaticMarkup(<DefenseMatrix items={[item]} {...all} label="Capabilities" onSelect={() => {}} />);
    assert.equal(chips(html), new Set(item.placements.map((p) => `${p.category}/${p.surface}`)).size, "no duplicate chips within a cell");
  }
});

test("shared filters require category and surface to match the same placement", () => {
  const item = { id: "test", title: "Test", placements: [{ category: "data", surface: "cloud" }, { category: "infra", surface: "endpoint" }] };
  assert.equal(matchesMatrixFilters(item, { category: "data", surface: "endpoint" }), false);
  assert.equal(matchesMatrixFilters(item, { category: "data", surface: "cloud" }), true);
  assert.equal(matrixHref("/capabilities", "data", "cloud"), "/capabilities?group=data&surface=cloud");
  assert.equal(matrixHref("/mitigations", "", ""), "/mitigations");
});

test("controls is a master-detail page; capabilities is the pin matrix; /mitigations opens the same matrix", () => {
  const html = page("/controls");
  assert.equal(rows(html), controls.length);
  for (const control of controls) assert.ok(html.includes(control.title.replaceAll("&", "&amp;")), control.id);
  assert.match(page("/controls", "control=controlInputValidationAndSanitization"), /Delivered by capabilities/);
  assert.match(html, /Show org data/);
  const matrix = page("/capabilities");
  assert.match(matrix, /CoSAI control group/);
  assert.match(matrix, /Show org data/);
  assert.equal(chips(matrix.match(/<table[\s\S]*?<\/table>/)![0]), mitigations.flatMap((m) => mitigationMatrixItem(m).placements).length);
  const table = (html: string) => html.match(/<table[\s\S]*?<\/table>/)![0];
  assert.equal(table(page("/mitigations")), table(matrix), "historical route keeps the capability matrix");
});

test("specialisations sit beside their MITRE parent and restore retired capabilities", () => {
  const specialisations = mitigations.filter((m) => m.parent);
  assert.ok(specialisations.length >= 15);
  for (const s of specialisations) {
    const parent = mitigations.find((m) => m.id === s.parent)!;
    assert.ok(parent && !parent.parent, s.id);
    assert.equal(s.category, parent.category);
    assert.ok(s.controls.every((c) => parent.controls.includes(c)), s.id);
    assert.ok(s.legacy?.length, s.id);
    for (const legacy of s.legacy!) assert.ok(mitigationAliases[legacy]?.includes(s.parent!), `${legacy} was migrated onto ${s.parent}`);
  }
  const html = page("/capabilities", "capability=cap-prompt-injection-screening");
  assert.match(html, /Authored specialisation of AML\.M0020/);
  assert.match(html, /Specialises/);
  assert.match(page("/capabilities", "capability=AML.M0020"), /Specialised as/);
});

test("native and legacy deep links retain their subjects", () => {
  const method = mitigations[0];
  for (const path of ["/mitigations", "/capabilities"]) {
    const html = page(path, `mitigation=${encodeURIComponent(method.id)}`);
    assert.match(html, /Upstream definition/);
    assert.ok(html.includes(method.id));
  }
  const legacy = Object.entries(mitigationAliases).find(([, ids]) => ids.length)!;
  const aliased = page("/capabilities", `capability=${encodeURIComponent(legacy[0])}`);
  assert.match(aliased, /This older link/);
  assert.ok(aliased.includes(legacy[1][0]));
});

test("org overlays retain matrix entries and distinguish absent assessments from recorded status", () => {
  const items = mitigations.map(mitigationMatrixItem);
  const render = (overlay: boolean) => renderToStaticMarkup(<DefenseMatrix items={items} {...all} label="Capabilities" onSelect={() => {}} statusFor={overlay ? orgSurfaceStatusFor : undefined} />);
  const names = (html: string) => [...html.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
  assert.deepEqual(names(render(false)), names(render(true)));
  let missing = 0, recorded = 0;
  for (const method of mitigations) for (const surface of surfaces) {
    const record = orgSurfacePostureFor(method.id, surface.id);
    assert.equal(orgSurfaceStatusFor(method.id, surface.id), record?.status ?? "notAssessed");
    if (record.contributions.length) recorded++; else missing++;
  }
  assert.ok(recorded && missing);
  assert.match(render(true), /Not assessed/);
  assert.match(render(true), / — Enabled/);
  assert.doesNotMatch(render(false), /Not assessed/);
});

test("Show org data changes the capability page and the controls page", (t) => {
  const record = orgCapabilities.find((c) => Object.keys(c.surfaces).length)!;
  const off = page("/capabilities", `capability=${record.capability}`);
  const controlsOff = page("/controls");
  t.mock.method(React, "useSyncExternalStore", () => true);
  const on = page("/capabilities", `capability=${record.capability}`);
  assert.notEqual(off, on);
  assert.ok(on.includes(record.title));
  const table = (html: string) => html.match(/<table[\s\S]*?<\/table>/)![0].replaceAll(/style="[^\"]*"|title="[^\"]*"/g, "");
  assert.equal(table(off), table(on), "org toggle changes colors, never adds org names to matrix cells");
  const controlsOn = page("/controls");
  assert.notEqual(controlsOff, controlsOn);
  assert.match(controlsOn, /Rolled up from the capabilities/);
});
