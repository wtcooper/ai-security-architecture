import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { DefenseMatrix } from "../src/components/defenses/DefenseMatrix";
import { matrixHref } from "../src/components/defenses/DefenseNavigation";
import { capabilityMatrixItem, mitigationMatrixItem, matchesMatrixFilters } from "../src/components/defenses/model";
import { CapabilitiesRoute } from "../src/components/capabilities/CapabilitiesBrowser";
import { MitigationsBrowser } from "../src/components/mitigations/MitigationsBrowser";
import { ControlsBrowser } from "../src/components/browse/ControlsBrowser";
import { controls, controlById, capabilities, mitigations, mitigationAliases, orgSurfaceStatusFor, orgSurfacePostureFor, orgCapabilitySurfaceStatusFor, orgCapabilities, surfaces } from "../src/lib/data";

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

test("every capability appears in the matrix under the groups of the controls it delivers, on its own surfaces", () => {
  for (const capability of capabilities) {
    const item = capabilityMatrixItem(capability);
    assert.ok(item.placements.length, capability.id);
    for (const p of item.placements) {
      assert.ok(capability.controls.some((id) => controlById.get(id)!.category === p.category), `${capability.id} ${p.category}`);
      assert.ok(capability.surfaces[p.surface].applies, `${capability.id} ${p.surface}`);
    }
    const html = renderToStaticMarkup(<DefenseMatrix items={[item]} {...all} label="Capabilities" onSelect={() => {}} />);
    const buttons = [...html.matchAll(/<button /g)].length;
    assert.equal(buttons, new Set(item.placements.map((p) => `${p.category}/${p.surface}`)).size, "no duplicate chips within a cell");
  }
});

test("shared filters require category and surface to match the same placement", () => {
  const item = { id: "test", title: "Test", placements: [{ category: "data", surface: "cloud" }, { category: "infra", surface: "endpoint" }] };
  assert.equal(matchesMatrixFilters(item, { category: "data", surface: "endpoint" }), false);
  assert.equal(matchesMatrixFilters(item, { category: "data", surface: "cloud" }), true);
  assert.equal(matrixHref("/capabilities", "data", "cloud"), "/capabilities?group=data&surface=cloud");
  assert.equal(matrixHref("/mitigations", "", ""), "/mitigations");
});

test("controls and mitigations are separate master-detail pages; capabilities keep their surface matrix", () => {
  const html = page("/controls");
  assert.equal(rows(html), controls.length);
  for (const control of controls) assert.ok(html.includes(control.title.replaceAll("&", "&amp;")), control.id);
  assert.match(html, /Delivered by capabilities/);
  assert.match(html, /Show org data/);
  assert.doesNotMatch(html, /Organization capability deployment|Defense matrices/);
  const methods = page("/mitigations");
  assert.equal(rows(methods), mitigations.length);
  for (const method of mitigations) assert.ok(methods.includes(method.title.replaceAll("&", "&amp;")), method.id);
  assert.doesNotMatch(methods, /Show org data/);
  const matrix = page("/capabilities");
  assert.match(matrix, /CoSAI control group/);
  assert.match(matrix, /Show org data/);
  assert.doesNotMatch(matrix, /Defense matrices|Implements/);
});

test("capability surfaces are authored and columns differ", () => {
  for (const capability of capabilities) {
    for (const surface of surfaces) assert.ok(capability.surfaces[surface.id]?.note, `${capability.id} ${surface.id}`);
  }
  const columns = surfaces.map((s) => new Set(capabilities.filter((c) => capabilityMatrixItem(c).placements.some((p) => p.surface === s.id)).map((c) => c.id)));
  assert.ok(columns.some((a, i) => columns.some((b, j) => i !== j && a.size !== b.size)), "surface columns differ");
  assert.match(page("/capabilities", "capability=cap-workload-isolation"), /not available/);
});

test("capability details show realisation; native and legacy mitigation deep links retain their subjects", () => {
  const html = page("/capabilities", "capability=cap-runtime-guardrails");
  assert.match(html, /Capability · cap-runtime-guardrails/);
  for (const heading of ["Delivers CoSAI controls", "How it is realised", "Technology", "Process", "People"]) assert.ok(html.includes(heading), heading);
  const method = mitigations[0];
  for (const path of ["/mitigations", "/capabilities"]) {
    const page$ = page(path, `mitigation=${encodeURIComponent(method.id)}`);
    assert.match(page$, /Upstream definition/);
    assert.ok(page$.includes(method.id));
  }
  const legacy = Object.entries(mitigationAliases).find(([, ids]) => ids.length)!;
  const aliased = page("/capabilities", `capability=${encodeURIComponent(legacy[0])}`);
  assert.match(aliased, /This older mitigation link/);
  assert.ok(aliased.includes(legacy[1][0]));
});

test("org overlays retain matrix entries and distinguish absent assessments from recorded status", () => {
  const items = mitigations.map(mitigationMatrixItem);
  const render = (overlay: boolean) => renderToStaticMarkup(<DefenseMatrix items={items} {...all} label="Mitigations" onSelect={() => {}} statusFor={overlay ? orgSurfaceStatusFor : undefined} />);
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
  assert.doesNotMatch(render(false), /Not assessed/);
  const html = renderToStaticMarkup(<DefenseMatrix items={capabilities.map(capabilityMatrixItem)} {...all} label="Capabilities" onSelect={() => {}} statusFor={orgCapabilitySurfaceStatusFor} />);
  assert.match(html, /Not assessed/);
  assert.match(html, / — In progress| — Gap| — Enabled/);
});

test("Show org data changes the capability page and the controls page, and stays off the reference catalogue", (t) => {
  const record = orgCapabilities.find((c) => Object.keys(c.surfaces).length)!;
  const off = page("/capabilities", `capability=${record.capability}`);
  const controlsOff = page("/controls");
  t.mock.method(React, "useSyncExternalStore", () => true);
  const on = page("/capabilities", `capability=${record.capability}`);
  assert.notEqual(off, on);
  assert.doesNotMatch(off, /Organization capability deployment|Organization capabilities mapped here/);
  assert.match(on, /Organization capabilities mapped here/);
  assert.ok(on.includes(record.title));
  const table = (html: string) => html.match(/<table[\s\S]*?<\/table>/)![0].replaceAll(/style="[^\"]*"|title="[^\"]*"/g, "");
  assert.equal(table(off), table(on), "org toggle changes colors, never adds org names to matrix cells");
  const controlsOn = page("/controls");
  assert.notEqual(controlsOff, controlsOn);
  assert.match(controlsOn, /Rolled up from the capabilities/);
  const methods = page("/mitigations", "mitigation=AML.M0020");
  assert.doesNotMatch(methods, /Organization capability support|Show org data|Org capability<\/span>/);
});
