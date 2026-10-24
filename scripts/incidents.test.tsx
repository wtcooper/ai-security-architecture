import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { IncidentList } from "../src/components/incidents/IncidentList";
import { IncidentWalkthrough } from "../src/components/incidents/IncidentWalkthrough";
import { incidentsNewestFirst } from "../src/components/incidents/model";
import { archetypeById, capabilityName, incidents } from "../src/lib/data";
import { INCIDENT_CATEGORIES } from "../src/lib/incident-categories";

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const render = (path: string, query: string, node: React.ReactNode) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={path}>
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>{node}</SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
const rows = (html: string) => [...html.matchAll(/href="\/incidents\/([^"?]+)"/g)].map((m) => m[1]);

test("the list shows every incident once, newest first", () => {
  const html = render("/incidents", "", <IncidentList />);
  assert.deepEqual(rows(html), incidentsNewestFirst().map((i) => i.id));
  const dates = incidentsNewestFirst().map((i) => i.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("each attack type and architecture filter narrows the list to its incidents", () => {
  for (const c of INCIDENT_CATEGORIES) {
    const want = incidentsNewestFirst().filter((i) => i.category === c.id).map((i) => i.id);
    assert.deepEqual(rows(render("/incidents", `type=${c.id}`, <IncidentList />)), want, c.id);
  }
  const arch = incidents[0].archetype;
  const want = incidentsNewestFirst().filter((i) => i.archetype === arch).map((i) => i.id);
  assert.deepEqual(rows(render("/incidents", `arch=${arch}`, <IncidentList />)), want);
});

test("a walk-through opens on step 1, and its last step names each break and links it to its Enable row", () => {
  for (const inc of incidents) {
    const first = render(`/incidents/${inc.id}`, "", <IncidentWalkthrough id={inc.id} />);
    assert.match(first, new RegExp(`Step 1 of ${inc.steps.length}`), inc.id);
    const last = render(`/incidents/${inc.id}`, `step=${inc.steps.length}`, <IncidentWalkthrough id={inc.id} />);
    assert.match(last, /Capabilities that break this chain/, inc.id);
    const arch = archetypeById.get(inc.archetype)!;
    for (const b of inc.breaks) {
      assert.ok(last.includes(`#capability-${b.capability}`), `${inc.id}: ${b.capability} links to its Enable row`);
      assert.ok(last.includes(capabilityName(b.capability).replace(/&/g, "&amp;")), `${inc.id}: ${b.capability} named`);
      assert.ok(arch.mitigations.includes(b.capability), `${inc.id}: ${b.capability} pinned`);
    }
  }
});
