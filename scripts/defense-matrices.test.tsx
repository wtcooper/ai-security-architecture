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
import { capabilities, mitigations, mitigationAliases, orgSurfaceStatusFor, orgSurfacePostureFor, orgCapabilitySurfaceStatusFor, orgCapabilities, surfaces } from "../src/lib/data";

const all = { category: "", surface: "" };
const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
function page(path: string, query = "") {
  return renderToStaticMarkup(<AppRouterContext.Provider value={router}>
    <PathnameContext.Provider value={path}><SearchParamsContext.Provider value={new URLSearchParams(query)}>
      {path === "/capabilities" ? <CapabilitiesRoute /> : <MitigationsBrowser />}
    </SearchParamsContext.Provider></PathnameContext.Provider>
  </AppRouterContext.Provider>);
}

test("every technology appears in the matrix only on existing mitigation placement paths", () => {
  for (const capability of capabilities) {
    const item = capabilityMatrixItem(capability);
    assert.ok(item.placements.length, capability.id);
    for (const p of item.placements) {
      assert.ok(capability.mitigationMappings.some(({ mitigation }) => {
        const method = mitigations.find((m) => m.id === mitigation)!;
        return method.category === p.category && method.surfaces[p.surface]?.applies;
      }));
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

test("both pages render a matrix and equal navigation, and preserve shared filters in switch links", () => {
  const category = mitigations[0].category;
  for (const path of ["/capabilities", "/mitigations"]) {
    const html = page(path, `group=${category}&surface=surfaceCloud`);
    assert.match(html, /<table /);
    assert.match(html, /CoSAI control group/);
    assert.match(html, /aria-label="Defense matrices"/);
    const destination = path === "/capabilities" ? "/mitigations" : "/capabilities";
    assert.ok(html.includes(`href="${destination}?group=${category}&amp;surface=surfaceCloud"`));
    assert.match(html, /href="\/capabilities"/);
    assert.match(html, /href="\/mitigations"/);
    assert.doesNotMatch(html, /Your status|Technology deployment: Not assessed/);
  }
});

test("capability details and native and legacy mitigation deep links retain their subjects", () => {
  assert.match(page("/capabilities", "capability=tech-dlp"), /Repository key: tech-dlp/);
  const method = mitigations[0];
  for (const path of ["/mitigations", "/capabilities"]) {
    const html = page(path, `mitigation=${encodeURIComponent(method.id)}`);
    assert.match(html, /Close detail/);
    assert.ok(html.includes(method.id));
  }
  const legacy = Object.entries(mitigationAliases).find(([, ids]) => ids.length)!;
  const html = page("/capabilities", `capability=${encodeURIComponent(legacy[0])}`);
  assert.match(html, /This older mitigation link/);
  assert.ok(html.includes(legacy[1][0]));
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
  assert.match(html, / — In progress| — Gap/);
});


test("Show org data changes the actual capability page and displays capability deployments", (t) => {
  const off = page("/capabilities", "capability=tech-dlp");
  t.mock.method(React, "useSyncExternalStore", () => true);
  const on = page("/capabilities", "capability=tech-dlp");
  assert.notEqual(off, on);
  assert.doesNotMatch(off, /Organization capability deployment|Capability deployments/);
  assert.match(on, /Organization capability deployment|Capability deployments/);
  assert.ok(on.includes(orgCapabilities.find((c) => c.capability === "tech-dlp")!.title));
  assert.match(on, /In progress/);
  const methods = page("/mitigations");
  assert.match(methods, /Organization capability support/);
  assert.match(methods, /No capability mapping/);
});
