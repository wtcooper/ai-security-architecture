import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { DefenseMatrix } from "../src/components/defenses/DefenseMatrix";
import { matrixHref } from "../src/components/defenses/DefenseNavigation";
import { GROUPING_META, mitigationMatrixItem, matchesMatrixFilters } from "../src/components/defenses/model";
import { CapabilitiesBrowser } from "../src/components/capabilities/CapabilitiesBrowser";
import { ControlsBrowser } from "../src/components/browse/ControlsBrowser";
import { controls, controlStatusFor, enablement, enableGroupFor, mitigations, mitigationAliases, mitigationsForControl, orgControls, orgControlsFor, status, statusFor } from "../src/lib/data";

const all = { category: "", surface: "" };
const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
function page(path: string, query = "") {
  return renderToStaticMarkup(<AppRouterContext.Provider value={router}>
    <PathnameContext.Provider value={path}><SearchParamsContext.Provider value={new URLSearchParams(query)}>
      {path === "/reference/cosai-controls" ? <ControlsBrowser /> : <CapabilitiesBrowser />}
    </SearchParamsContext.Provider></PathnameContext.Provider>
  </AppRouterContext.Provider>);
}
const rows = (h: string) => [...h.matchAll(/data-id="/g)].length;
const chips = (h: string) => [...h.matchAll(/<button[^>]*aria-pressed/g)].length;

test("every control appears in the matrix once per surface it applies on, under its CSF category or its CoSAI group", () => {
  for (const control of mitigations) {
    for (const by of ["csf", "cosai"] as const) {
      const item = mitigationMatrixItem(control, by);
      assert.ok(item.placements.length, control.id);
      for (const p of item.placements) {
        assert.equal(p.category, by === "csf" ? enableGroupFor(control.id)!.id : control.category);
        assert.ok(GROUPING_META[by].rows.some((r) => r.id === p.category), `${control.id}: ${p.category} is a row`);
        assert.ok(control.surfaces[p.surface].applies, `${control.id} ${p.surface}`);
      }
      const html = renderToStaticMarkup(
        <DefenseMatrix items={[item]} {...all} rows={GROUPING_META[by].rows} rowHeader={GROUPING_META[by].rowHeader} label="Controls" onSelect={() => {}} />,
      );
      assert.equal(chips(html), new Set(item.placements.map((p) => `${p.category}/${p.surface}`)).size, "no duplicate chips within a cell");
    }
  }
  assert.deepEqual(GROUPING_META.csf.rows.map((r) => r.id), enablement.groups.map((g) => g.id), "rows are the CSF categories, in CSF order");
});

test("shared filters require category and surface to match the same placement", () => {
  const item = { id: "test", title: "Test", placements: [{ category: "data", surface: "cloud" }, { category: "infra", surface: "endpoint" }] };
  assert.equal(matchesMatrixFilters(item, { category: "data", surface: "endpoint" }), false);
  assert.equal(matchesMatrixFilters(item, { category: "data", surface: "cloud" }), true);
  assert.equal(matrixHref("/controls", "data", "cloud"), "/controls?group=data&surface=cloud");
  assert.equal(matrixHref("/controls", "", ""), "/controls");
});

test("CoSAI controls is a master-detail page under Reference; the control catalogue is a matrix by CSF category", () => {
  const html = page("/reference/cosai-controls");
  assert.equal(rows(html), controls.length);
  for (const control of controls) assert.ok(html.includes(control.title.replaceAll("&", "&amp;")), control.id);
  assert.match(page("/reference/cosai-controls", "control=controlInputValidationAndSanitization"), /Delivered by controls in the catalogue/);
  assert.doesNotMatch(html, /Show org data/);
  const matrix = page("/controls");
  const table = (h: string) => h.match(/<table[\s\S]*?<\/table>/)![0];
  assert.match(table(matrix), /NIST CSF category/);
  for (const g of enablement.groups) assert.ok(table(matrix).includes(g.title), `${g.id} is a row`);
  assert.match(matrix, /Status/);
  // The matrix shows the most granular control: a parent with specialisations is represented by them.
  const specialised = new Set(mitigations.flatMap((m) => (m.parent ? [m.parent] : [])));
  const granular = mitigations.filter((m) => !specialised.has(m.id));
  assert.equal(chips(table(matrix)), granular.flatMap((m) => mitigationMatrixItem(m).placements).length);
  assert.doesNotMatch(table(matrix), /Generative AI Guardrails/);
  // The CoSAI grouping is one switch away, with the same controls in it.
  const cosai = page("/controls", "by=cosai");
  assert.match(table(cosai), /CoSAI control group/);
  assert.equal(chips(table(cosai)), granular.flatMap((m) => mitigationMatrixItem(m, "cosai").placements).length);
  // A control's detail names its CSF category and the CoSAI controls it contributes to.
  const detail = page("/controls", "control=D3-MFA");
  assert.match(detail, /NIST CSF category/);
  assert.match(detail, /PR\.AA/);
  assert.match(detail, /Contributes to CoSAI controls/);
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
  const html = page("/controls", "control=cap-sensitive-data-redaction");
  assert.match(html, /Authored here, as a more specific form of Generative AI Guardrails/);
  assert.match(html, /Specialises/);
  assert.match(page("/controls", "control=AML.M0020"), /Specialised as/);
});

test("native and legacy deep links retain their subjects", () => {
  const method = mitigations[0];
  const html = page("/controls", `control=${encodeURIComponent(method.id)}`);
  assert.match(html, /Upstream definition/);
  assert.ok(html.includes(method.id));
  const legacy = Object.entries(mitigationAliases).find(([, ids]) => ids.length)!;
  const aliased = page("/controls", `control=${encodeURIComponent(legacy[0])}`);
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
  const items = mitigations.map((m) => mitigationMatrixItem(m, "cosai"));
  const render = () => renderToStaticMarkup(<DefenseMatrix items={items} {...all} label="Capabilities" onSelect={() => {}} statusFor={statusFor} />);
  const names = (html: string) => [...html.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
  const before = render();
  assert.doesNotMatch(before, / — Enabled/);
  withStatus({ "D3-MFA": { status: "enabled" } }, () => {
    const after = render();
    assert.deepEqual(names(before), names(after));
    assert.match(after, / — Enabled/);
  });
  // The organisation's own controls show beneath the catalogue control, by name; the catalogue name stays the heading.
  const mine = [
    { id: "SEC-014", name: "Phishing-resistant sign-in", status: "enabled" as const, maps: ["D3-MFA"] },
    { id: "SEC-015", name: "Privileged access workstation sign-in", status: "gap" as const, maps: ["D3-MFA", "D3-APA"], link: "https://policies.example.com/sec-015" },
  ];
  orgControls.push(...mine);
  try {
    const detail = page("/controls", "control=D3-MFA");
    assert.match(detail, /Multi-factor Authentication/);
    assert.match(detail, /Phishing-resistant sign-in/);
    assert.match(detail, /Privileged access workstation sign-in/);
    assert.match(detail, /also delivers 1 other control/, "a control of yours can deliver more than one of ours");
    assert.doesNotMatch(detail, /SEC-014|SEC-015/, "your identifiers are never shown");
    assert.equal(orgControlsFor("D3-APA").length, 1, "and one of ours can be delivered by several of yours");
  } finally {
    orgControls.splice(orgControls.length - mine.length, mine.length);
  }
});

test("the catalogue shows names, never identifiers: no control id in the text of any control's page", () => {
  const visible = (html: string) =>
    [...html.replace(/<(script|style)[\s\S]*?<\/\1>/g, "").matchAll(/>([^<]+)<|\s(?:title|aria-label|alt|placeholder)="([^"]*)"/g)].map((m) => m[1] ?? m[2]).join(" \n ");
  const ids = mitigations.map((m) => m.id);
  const leak = (html: string) => {
    const text = visible(html);
    return ids.filter((id) => new RegExp(`(^|[^A-Za-z0-9.-])${id.replace(/[.]/g, "\\.")}([^A-Za-z0-9-]|$)`).test(text));
  };
  assert.deepEqual(leak(page("/controls")), [], "the catalogue matrix");
  for (const m of mitigations) assert.deepEqual(leak(page("/controls", `control=${m.id}`)), [], `${m.id}: its own page`);
  for (const c of controls) assert.deepEqual(leak(page("/reference/cosai-controls", `control=${c.id}`)), [], `CoSAI ${c.id}`);
});
