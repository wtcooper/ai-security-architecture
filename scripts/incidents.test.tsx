import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { IncidentPatternsIndex } from "../src/components/incidents/IncidentPatternsIndex";
import { IncidentWalkthrough } from "../src/components/incidents/IncidentWalkthrough";
import { incidentsNewestFirst } from "../src/components/incidents/model";
import { archetypeById, controlName, incidents } from "../src/lib/data";

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const render = (path: string, query: string, node: React.ReactNode) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={path}>
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>{node}</SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );

test("the Incidents index lists every deep dive once, newest first", () => {
  const html = render("/incidents", "", <IncidentPatternsIndex />);
  const rows = [...html.matchAll(/data-deep-dive="([^"]+)"><a [^>]*href="\/incidents\/([^"?]+)"/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(rows.map((r) => r[0]), incidentsNewestFirst().map((i) => i.id));
  for (const [id, href] of rows) assert.equal(href, id);
  const dates = incidentsNewestFirst().map((i) => i.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("a walk-through opens on step 1, and its last step names each break and links it to its Enable row", () => {
  for (const inc of incidents) {
    const first = render(`/incidents/${inc.id}`, "", <IncidentWalkthrough id={inc.id} />);
    assert.match(first, new RegExp(`Step 1 of ${inc.steps.length}`), inc.id);
    const last = render(`/incidents/${inc.id}`, `step=${inc.steps.length}`, <IncidentWalkthrough id={inc.id} />);
    assert.match(last, /Controls that break this chain/, inc.id);
    const arch = archetypeById.get(inc.archetype)!;
    for (const b of inc.breaks) {
      assert.ok(last.includes(`#control-${b.control}`), `${inc.id}: ${b.control} links to its Enable row`);
      assert.ok(last.includes(controlName(b.control).replace(/&/g, "&amp;")), `${inc.id}: ${b.control} named`);
      assert.ok(arch.mitigations.includes(b.control), `${inc.id}: ${b.control} pinned`);
    }
  }
});
