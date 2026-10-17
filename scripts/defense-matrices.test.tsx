import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { DefenseMatrix } from "../src/components/defenses/DefenseMatrix";
import { matrixHref } from "../src/components/defenses/DefenseNavigation";
import { mitigationMatrixItem, matchesMatrixFilters } from "../src/components/defenses/model";
import { CapabilitiesBrowser } from "../src/components/capabilities/CapabilitiesBrowser";
import { ControlsBrowser } from "../src/components/browse/ControlsBrowser";
import { controls, controlStatusFor, mitigations, mitigationAliases, mitigationsForControl, status, statusFor } from "../src/lib/data";

const all = { category: "", surface: "" };
const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
function page(path: string, query = "") {
  return renderToStaticMarkup(<AppRouterContext.Provider value={router}>
    <PathnameContext.Provider value={path}><SearchParamsContext.Provider value={new URLSearchParams(query)}>
      {path === "/controls" ? <ControlsBrowser /> : <CapabilitiesBrowser />}
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
  assert.equal(matrixHref("/capabilities", "", ""), "/capabilities");
});

test("controls is a master-detail page; capabilities is the pin matrix", () => {
  const html = page("/controls");
  assert.equal(rows(html), controls.length);
  for (const control of controls) assert.ok(html.includes(control.title.replaceAll("&", "&amp;")), control.id);
  assert.match(page("/controls", "control=controlInputValidationAndSanitization"), /Delivered by capabilities/);
  assert.doesNotMatch(html, /Show org data/);
  const matrix = page("/capabilities");
  assert.match(matrix, /CoSAI control group/);
  assert.match(matrix, /Status/);
  // The matrix shows the most granular capability: a parent with specialisations is represented by them.
  const specialised = new Set(mitigations.flatMap((m) => (m.parent ? [m.parent] : [])));
  assert.equal(
    chips(matrix.match(/<table[\s\S]*?<\/table>/)![0]),
    mitigations.filter((m) => !specialised.has(m.id)).flatMap((m) => mitigationMatrixItem(m).placements).length,
  );
  assert.doesNotMatch(matrix.match(/<table[\s\S]*?<\/table>/)![0], /Generative AI Guardrails/);
});

test("specialisations narrow their MITRE parent and restore retired capabilities", () => {
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
  const html = page("/capabilities", "capability=cap-sensitive-data-redaction");
  assert.match(html, /Authored specialisation of AML\.M0020/);
  assert.match(html, /Specialises/);
  assert.match(page("/capabilities", "capability=AML.M0020"), /Specialised as/);
});

test("native and legacy deep links retain their subjects", () => {
  const method = mitigations[0];
  const html = page("/capabilities", `capability=${encodeURIComponent(method.id)}`);
  assert.match(html, /Upstream definition/);
  assert.ok(html.includes(method.id));
  const legacy = Object.entries(mitigationAliases).find(([, ids]) => ids.length)!;
  const aliased = page("/capabilities", `capability=${encodeURIComponent(legacy[0])}`);
  assert.match(aliased, /This older link/);
  assert.ok(aliased.includes(legacy[1][0]));
});

/** Sets entries in the status file for the length of one test. */
function withStatus(entries: typeof status, run: () => void) {
  Object.assign(status, entries);
  try {
    run();
  } finally {
    for (const id of Object.keys(entries)) delete status[id];
  }
}

test("status comes from the status file: unset reads Not set, parents and controls roll up", () => {
  assert.equal(statusFor("cap-sensitive-data-redaction"), "notSet");
  withStatus({ "cap-sensitive-data-redaction": { status: "enabled" }, "cap-input-guardrails": { status: "enabled" } }, () => {
    assert.equal(statusFor("cap-sensitive-data-redaction"), "enabled");
    // A parent with no entry of its own rolls up its specialisations; a mix reads in progress.
    assert.equal(statusFor("AML.M0020"), "inProgress");
  });
  const control = controls.find((c) => mitigationsForControl(c.id).filter((m) => !m.parent).length > 1)!;
  const parents = mitigationsForControl(control.id).filter((m) => !m.parent);
  const all = (value: "enabled" | "gap") => Object.fromEntries(parents.map((m) => [m.id, { status: value }]));
  withStatus(all("enabled"), () => assert.equal(controlStatusFor(control.id), "enabled"));
  withStatus({ [parents[0].id]: { status: "enabled" } }, () => assert.equal(controlStatusFor(control.id), "inProgress", "one of several is partial"));
  withStatus({ [parents[0].id]: { status: "gap" } }, () => assert.equal(controlStatusFor(control.id), "gap"));
  assert.equal(controlStatusFor(control.id), "notSet");
});

test("status tints matrix chips without changing them, and a display name renames everywhere", () => {
  const items = mitigations.map(mitigationMatrixItem);
  const render = () => renderToStaticMarkup(<DefenseMatrix items={items} {...all} label="Capabilities" onSelect={() => {}} statusFor={statusFor} />);
  const names = (html: string) => [...html.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
  const before = render();
  assert.doesNotMatch(before, / — Enabled/);
  withStatus({ "D3-MFA": { status: "enabled" } }, () => {
    const after = render();
    assert.deepEqual(names(before), names(after));
    assert.match(after, / — Enabled/);
  });
  withStatus({ "D3-MFA": { displayName: "Phishing-resistant sign-in" } }, () => {
    assert.ok(mitigationMatrixItem(mitigations.find((m) => m.id === "D3-MFA")!).title === "Phishing-resistant sign-in");
    const detail = page("/capabilities", "capability=D3-MFA");
    assert.match(detail, /Phishing-resistant sign-in/);
    assert.match(detail, /Multi-factor Authentication/);
  });
});
