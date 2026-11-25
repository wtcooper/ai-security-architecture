import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { checkFeed, type FeedContext } from "./lib/feed";
import { categoryProblem, checkIncidentPatterns, INCIDENT_PATTERN_LIMITS, loadIncidentPatterns, type IncidentPatternContext } from "./lib/incident-patterns";
import { FEED_ON_INCIDENT_PATTERN, IncidentPatternPage } from "../src/components/incidents/IncidentPatternPage";
import { IncidentPatternsIndex, LANDINGS_ON_CARD, legacyIncidentsTarget } from "../src/components/incidents/IncidentPatternsIndex";
import { IncidentWalkthrough } from "../src/components/incidents/IncidentWalkthrough";
import { incidentsNewestFirst } from "../src/components/incidents/model";
import { buildIndex } from "../src/components/shell/SearchPalette";
import { SiteHeader } from "../src/components/shell/SiteHeader";
import { archetypeById, controlName, dataset, incidentById, incidentPatternById, incidentPatterns, riskTitle } from "../src/lib/data";
import { CATEGORY_COLOURS, categoryById, INCIDENT_CATEGORIES } from "../src/lib/incident-categories";
import { deriveIncidentPattern, landsOn } from "../src/lib/incident-patterns";
import { feedHref, incidentPatternHref, patternHref } from "../src/lib/routes";
import { THREAT_LISTS, type FeedItem, type IncidentPatternAuthored } from "../src/lib/types";

/*
 * The incident patterns' content is written elsewhere, so the shipped files may hold only their
 * required fields. Every rule and every page section is checked here against fixtures; the
 * shipped files are only held to the rules.
 */

const ctx: IncidentPatternContext = {
  controlIds: new Set(dataset.mitigations.map((m) => m.id)),
  riskIds: new Set(dataset.risks.map((r) => r.id)),
  owaspIds: new Set(THREAT_LISTS.flatMap((l) => Object.keys(dataset.frameworkEntries[l] ?? {}))),
  atlasIds: new Set(Object.keys(dataset.atlasTechniques)),
  deepDiveIds: new Set(dataset.incidents.map((i) => i.id)),
};

/** A complete incident pattern; each test breaks one field of it. */
const full = (over: Record<string, unknown> = {}) => ({
  id: "promptInjection",
  slug: "prompt-injection",
  order: 1,
  name: "Prompt injection and agent hijack",
  short: "Content the agent reads steers it into acting for someone else.",
  since: "2026-11-25",
  overview: "An agent reads text from places its user does not control and treats instructions in it as its own.",
  howItWorks: ["The attacker plants instructions where the agent will read them.", "The agent reads them as part of its task.", "It acts on them with the user's access."],
  signs: ["Tool calls the user did not ask for.", "Data sent to an address nobody configured."],
  stops: [
    { control: "cap-input-guardrails", how: "Screens retrieved content for instructions before the model reads it." },
    { control: "cap-agent-egress-control", how: "Blocks the call that would carry the data out." },
  ],
  risks: ["riskPromptInjection"],
  owasp: ["LLM01:2026", "ASI01"],
  atlas: ["AML.T0051.001"],
  notSameAs: [{ pattern: "supplyChain", why: "There the attacker's code ships inside something trusted; here only text reaches the agent." }],
  ...over,
});
/** The second file a contrast can name. */
const other = (over: Record<string, unknown> = {}) => ({ id: "supplyChain", slug: "poisoned-supply-chain", order: 2, name: "Poisoned supply chain", short: "Something trusted arrives with the attacker's code in it.", since: "2026-11-25", ...over });
const fileOf = (doc: Record<string, unknown>) => `${String(doc.order ?? 0).padStart(2, "0")}-${String(doc.slug)}.yaml`;
const check = (docs: Record<string, unknown>[]) => checkIncidentPatterns(docs.map((doc) => ({ file: fileOf(doc), doc })), ctx);
/** One problem, for the first file, naming the file and the field. */
function rejects(over: Record<string, unknown>, field: string, pattern: RegExp) {
  const doc = full(over);
  const { problems } = check([doc, other()]);
  const prefix = `incident-patterns/${fileOf(doc)}: ${field}`;
  assert.ok(
    problems.some((p) => p.startsWith(prefix) && pattern.test(p)),
    `expected a problem "${prefix}…" matching ${pattern} for ${JSON.stringify(over)}; got ${JSON.stringify(problems)}`,
  );
}

test("a complete incident pattern passes, and the patterns come out by order", () => {
  const { patterns, problems } = check([other(), full()]);
  assert.deepEqual(problems, []);
  assert.deepEqual(patterns.map((p) => p.id), ["promptInjection", "supplyChain"]);
  // Only the required fields: still valid, and nothing is invented for the rest.
  const bare = check([other()]).patterns[0];
  assert.deepEqual(Object.keys(bare).sort(), ["id", "name", "order", "short", "since", "slug"]);
});

test("the loader wants id, slug, order, name, short and since, each well formed", () => {
  for (const field of ["id", "slug", "order", "name", "short", "since"]) {
    const doc: Record<string, unknown> = full();
    delete doc[field];
    const file = field === "slug" ? "01-undefined.yaml" : fileOf(doc);
    const problems = checkIncidentPatterns([{ file, doc }, { file: fileOf(other()), doc: other() }], ctx).problems;
    assert.ok(problems.some((p) => p.startsWith(`incident-patterns/${file}: ${field}: required`)), `${field}: ${JSON.stringify(problems)}`);
  }
  rejects({ id: "prompt-injection" }, "id", /must be camelCase/);
  rejects({ slug: "Prompt_Injection" }, "slug", /must be kebab-case/);
  rejects({ order: 0 }, "order", /whole number from 1/);
  rejects({ since: "25/11/2026" }, "since", /must be a real day, YYYY-MM-DD/);
  rejects({ since: "2026-02-30" }, "since", /must be a real day/);
});

test("ids, slugs and orders are unique, a slug is never a deep dive's id, and the file is named after the slug", () => {
  const twice = check([full(), other({ id: "promptInjection", slug: "prompt-injection", order: 1 })]).problems;
  assert.ok(twice.some((p) => /id: "promptInjection" is also the id of/.test(p)), twice.join("\n"));
  assert.ok(twice.some((p) => /slug: "prompt-injection" is also the slug of/.test(p)), twice.join("\n"));
  assert.ok(twice.some((p) => /order: 1 is also the order of/.test(p)), twice.join("\n"));
  const deepDive = dataset.incidents[0].id;
  rejects({ slug: deepDive }, "slug", new RegExp(`"${deepDive}" is the id of a deep dive`));
  rejects({ slug: "feed" }, "slug", /old address of the feed/);
  const misnamed = checkIncidentPatterns([{ file: "01-injection.yaml", doc: full() }], ctx).problems;
  assert.ok(misnamed.some((p) => p.startsWith("incident-patterns/01-injection.yaml: slug: the file is named <NN>-<slug>.yaml")), misnamed.join("\n"));
});

test("controls, risks, OWASP and ATLAS ids must exist, and every contrast names an incident pattern", () => {
  rejects({ stops: [{ control: "cap-nope", how: "x" }, full().stops[1]] }, "stops 1", /control "cap-nope" is not in the control catalogue/);
  rejects({ stops: [full().stops[0], { control: "cap-agent-egress-control" }] }, "stops 2", /needs a how/);
  rejects({ risks: ["riskNope"] }, "risks", /"riskNope" is not a risk/);
  rejects({ owasp: ["LLM99:2026"] }, "owasp", /"LLM99:2026" is not an OWASP id/);
  rejects({ atlas: ["AML.T9999"] }, "atlas", /"AML.T9999" is not an ATLAS technique in the vendored release/);
  rejects({ notSameAs: [{ pattern: "exploitedNope", why: "x" }] }, "notSameAs 1", /pattern "exploitedNope" is not an incident pattern id/);
  rejects({ notSameAs: [{ pattern: "promptInjection", why: "x" }] }, "notSameAs 1", /this incident pattern itself/);
  rejects({ notSameAs: [{ pattern: "supplyChain" }] }, "notSameAs 1", /needs a why/);
  // A short OWASP id is read as the one edition the site carries.
  const { patterns, problems } = check([full({ owasp: ["LLM01", "MCP03"] }), other()]);
  assert.deepEqual(problems, []);
  assert.deepEqual(patterns[0].owasp, ["LLM01:2026", "MCP03:2025"]);
});

test("every length and count is held to the format", () => {
  const L = INCIDENT_PATTERN_LIMITS;
  rejects({ name: "x".repeat(L.name + 1) }, "name", /61 characters; at most 60/);
  rejects({ short: "x".repeat(L.short + 1) }, "short", /141 characters; at most 140/);
  rejects({ overview: "x".repeat(L.overview + 1) }, "overview", /701 characters; at most 700/);
  rejects({ howItWorks: ["a", "b"] }, "howItWorks", /has 2; 3 to 5/);
  rejects({ howItWorks: ["a", "b", "c", "d", "e", "f"] }, "howItWorks", /has 6; 3 to 5/);
  rejects({ howItWorks: ["a", "b", "x".repeat(L.step + 1)] }, "howItWorks 3", /161 characters; at most 160/);
  rejects({ signs: ["one"] }, "signs", /has 1; 2 to 4/);
  rejects({ signs: ["a", "x".repeat(L.sign + 1)] }, "signs 2", /141 characters; at most 140/);
  rejects({ stops: [full().stops[0]] }, "stops", /has 1; 2 to 6 controls/);
  rejects({ stops: [{ control: "cap-input-guardrails", how: "x".repeat(L.how + 1) }, full().stops[1]] }, "stops 1", /how is 161 characters; at most 160/);
  rejects({ notSameAs: [] }, "notSameAs", /has 0; 1 to 3/);
  rejects({ notSameAs: [{ pattern: "supplyChain", why: "x".repeat(L.why + 1) }] }, "notSameAs 1", /why is 161 characters; at most 160/);
  assert.deepEqual(check([full({ name: "x".repeat(L.name), short: "x".repeat(L.short), overview: "x".repeat(L.overview) }), other()]).problems, []);
});

test("the loader rejects unknown and derived fields, and the retired word", () => {
  const { problems } = check([full({ deepDives: ["x"], colour: "red" }), other()]);
  assert.ok(problems.some((p) => /unknown field\(s\) deepDives, colour; deep dives, feed items and landings are derived/.test(p)), problems.join("\n"));
  rejects({ overview: "It runs on every archetype." }, "overview", /says "archetype"/);
});

test("no folder is no incident patterns; a folder is read file by file", async () => {
  const root = mkdtempSync(join(tmpdir(), "incident-patterns-"));
  try {
    const fails: string[] = [];
    assert.deepEqual(await loadIncidentPatterns(root, ctx, (m) => fails.push(m)), []);
    mkdirSync(join(root, "data", "incident-patterns"), { recursive: true });
    writeFileSync(join(root, "data", "incident-patterns", "01-prompt-injection.yaml"), "id: promptInjection\nslug: prompt-injection\norder: 1\nname: x\nshort: y\nsince: 2026-11-25\n");
    writeFileSync(join(root, "data", "incident-patterns", "02-broken.yaml"), "id: broken\n");
    const loaded = await loadIncidentPatterns(root, ctx, (m) => fails.push(m));
    assert.equal(loaded.length, 2);
    assert.ok(fails.some((f) => f.startsWith("incident-patterns/02-broken.yaml: slug: required")), fails.join("\n"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the shipped incident patterns pass, by order, and every category is one of them", () => {
  const ids = dataset.incidentPatterns.map((p) => p.id);
  assert.ok(ids.length >= 8, "the eight, at least");
  const orders = dataset.incidentPatterns.map((p) => p.order);
  assert.deepEqual(orders, [...orders].sort((a, b) => a - b));
  for (const id of ["promptInjection", "supplyChain", "identity", "exposed", "exploitedSoftware", "aiMadeExposure", "breakout", "aiAttacker"]) assert.ok(ids.includes(id), id);
  for (const i of dataset.incidents) assert.ok(ids.includes(i.category), `deep dive ${i.id}: ${i.category}`);
  for (const f of dataset.feed) assert.ok(ids.includes(f.category), `feed item ${f.id}: ${f.category}`);
  const deepDiveIds = new Set(dataset.incidents.map((i) => i.id));
  for (const p of dataset.incidentPatterns) assert.ok(!deepDiveIds.has(p.slug) && p.slug !== "feed", `${p.slug} has an address of its own`);
  // The labels are the incident patterns' own names, and each has a colour of its own.
  assert.deepEqual(INCIDENT_CATEGORIES.map((c) => c.label), dataset.incidentPatterns.map((p) => p.name));
  const colours = ids.map((id) => CATEGORY_COLOURS[id]?.rail);
  assert.ok(colours.every(Boolean), "every incident pattern has a colour");
  assert.equal(new Set(colours).size, colours.length, "no two share one");
});

test("a category that is no incident pattern fails, in the feed and for a deep dive alike", () => {
  assert.equal(categoryProblem("identity", ["identity"]), null);
  assert.match(categoryProblem("bias", ["identity", "exposed"])!, /category "bias" is not an incident pattern \(data\/incident-patterns\/\): one of identity, exposed/);
  const feedCtx: FeedContext = { patternIds: new Set(dataset.archetypes.map((a) => a.id)), incidentIds: ctx.deepDiveIds, categoryIds: new Set(["identity"]) };
  const item = { id: "x", date: "2026-11-07", title: "t", summary: "s", category: "exposed", perspective: "target", evidence: "confirmed", patterns: [], sources: [{ title: "a", url: "https://example.org", publisher: "p" }] };
  const { problems } = checkFeed([{ file: "2026-11.yaml", doc: { items: [item] } }], feedCtx);
  assert.ok(problems.some((p) => p.startsWith("feed/2026-11.yaml item x: category \"exposed\" is not an incident pattern")), problems.join("\n"));
});

// --- What is derived ------------------------------------------------------------------------------

const PI_DEEP_DIVES = dataset.incidents.filter((i) => i.category === "promptInjection");
const A = PI_DEEP_DIVES[0];
/** A pattern no prompt injection deep dive is on, so the fixture's own reports are all it has. */
const OTHER = dataset.archetypes.find((a) => !PI_DEEP_DIVES.some((d) => d.archetype === a.id))!.id;
/** Ten reports under prompt injection, one pointing at a deep dive on its own pattern, and one elsewhere. */
const FEED: FeedItem[] = [
  ...Array.from({ length: 10 }, (_, i): FeedItem => ({
    id: `pi-${i}`,
    date: `2026-11-${String(24 - i * 2).padStart(2, "0")}`,
    title: `Report ${i}`,
    summary: "s",
    category: "promptInjection",
    perspective: "target",
    evidence: i % 2 ? "confirmed" : "exploited",
    patterns: i === 0 ? [A.archetype, OTHER] : [OTHER],
    ...(i === 0 ? { incident: A.id } : {}),
    sources: [{ title: "a", url: `https://example.org/${i}`, publisher: "p" }],
  })),
  { id: "elsewhere", date: "2026-11-23", title: "Elsewhere", summary: "s", category: "identity", perspective: "target", evidence: "reported", patterns: [OTHER], sources: [{ title: "a", url: "https://example.org/e", publisher: "p" }] },
];

test("an incident pattern derives its deep dives, its feed items and where it lands, counting each incident once", () => {
  const p = deriveIncidentPattern(full() as IncidentPatternAuthored, dataset.incidents, FEED);
  assert.deepEqual(p.deepDives, incidentsNewestFirst().filter((i) => i.category === "promptInjection").map((i) => i.id));
  assert.deepEqual(p.feed, FEED.filter((f) => f.category === "promptInjection").map((f) => f.id));
  assert.deepEqual(p.landsOn.find((l) => l.pattern === OTHER), { pattern: OTHER, count: 10, feed: 10, deepDives: 0 });
  // A's own feed item names A's pattern, so A is not counted again there; the other deep dives on it are.
  const own = p.landsOn.find((l) => l.pattern === A.archetype)!;
  const onOwn = PI_DEEP_DIVES.filter((d) => d.archetype === A.archetype).length;
  assert.deepEqual(own, { pattern: A.archetype, count: 1 + onOwn - 1, feed: 1, deepDives: onOwn });
  assert.equal(p.landsOn[0].pattern, OTHER, "most often first");
  // The bare counting rule, on its own.
  assert.deepEqual(landsOn([], [A]), [{ pattern: A.archetype, count: 1, feed: 0, deepDives: 1 }]);
});

// --- The pages --------------------------------------------------------------------------------------

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const render = (path: string, query: string, node: React.ReactNode) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={path}>
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>{node}</SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

test("/incidents/ shows a card per incident pattern: name, one-liner, counts, latest report and where it lands", () => {
  const html = render("/incidents", "", <IncidentPatternsIndex feed={FEED} today="2026-11-25" />);
  assert.match(html, /How AI systems are being attacked, sorted into incident patterns\. Each has an overview, the controls that stop it, and deep dives/);
  const cards = [...html.matchAll(/data-incident-pattern-card="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(cards, incidentPatterns.map((p) => p.id));
  /** A card's markup: from its start to the next card's, or to the deep dives. */
  const card = (id: string) => {
    const start = html.indexOf(`data-incident-pattern-card="${id}"`);
    const next = cards[cards.indexOf(id) + 1];
    return html.slice(start, next ? html.indexOf(`data-incident-pattern-card="${next}"`) : html.indexOf('id="deep-dives"'));
  };
  const pi = card("promptInjection");
  const named = incidentPatternById.get("promptInjection")!;
  assert.ok(pi.includes(`href="${incidentPatternHref("promptInjection")}"`) && pi.includes(esc(named.name)) && pi.includes(esc(named.short)));
  // Ten reports, the last 30 days ending 25 November: 24 Nov back to 6 Nov.
  assert.match(pi, new RegExp(`${PI_DEEP_DIVES.length} deep dives? · 10 in the feed, last 30 days`));
  assert.match(pi, /data-card-latest="pi-0"/);
  assert.ok(pi.includes(`href="${feedHref({ category: "promptInjection" }, "pi-0")}"`) && pi.includes("Report 0") && pi.includes("24 Nov 2026"));
  const lands = [...pi.matchAll(/data-card-lands="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(lands.length >= 1 && lands.length <= LANDINGS_ON_CARD);
  assert.equal(lands[0], OTHER);
  assert.ok(pi.includes(`href="${patternHref(OTHER, { tab: "incidents" })}"`));
  // An incident pattern with no report yet says so.
  for (const p of incidentPatterns.filter((x) => !FEED.some((f) => f.category === x.id))) assert.ok(card(p.id).includes("Nothing in the feed yet."), p.id);
});

test("/incidents/ lists every deep dive below the cards, with date, title, incident pattern and pattern", () => {
  const html = render("/incidents", "", <IncidentPatternsIndex feed={FEED} today="2026-11-25" />);
  const rows = [...html.matchAll(/data-deep-dive="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(rows, incidentsNewestFirst().map((i) => i.id));
  assert.ok(html.indexOf("data-deep-dive=") > html.lastIndexOf("data-incident-pattern-card="), "below the cards");
  const first = incidentsNewestFirst()[0];
  const row = html.slice(html.indexOf(`data-deep-dive="${first.id}"`), html.indexOf("</li>", html.indexOf(`data-deep-dive="${first.id}"`)));
  assert.ok(row.includes(`href="/incidents/${first.id}"`) && row.includes(esc(first.title)));
  assert.ok(row.includes(esc(categoryById.get(first.category)!.label)) && row.includes(esc(archetypeById.get(first.archetype)!.title)));
});

test("old links to the incidents list forward: a category to its incident pattern, a pattern to its Incidents tab", () => {
  const q = (s: string) => new URLSearchParams(s);
  assert.equal(legacyIncidentsTarget(q("category=promptInjection")), "/incidents/prompt-injection");
  assert.equal(legacyIncidentsTarget(q("type=exposed")), `/incidents/${incidentPatternById.get("exposed")!.slug}`);
  assert.equal(legacyIncidentsTarget(q("arch=archChatAgent")), patternHref("archChatAgent", { tab: "incidents" }));
  assert.equal(legacyIncidentsTarget(q("")), null);
  assert.equal(legacyIncidentsTarget(q("category=bias")), null);
});

/** The page's sections, in the order they appear. */
const sections = (html: string) => [...html.matchAll(/data-section="([^"]+)"/g)].map((m) => m[1]);

test("an incident pattern page shows every section in order, its exemplars and the newest of the feed", () => {
  const html = render("/incidents/prompt-injection", "", <IncidentPatternPage pattern={full() as IncidentPatternAuthored} feed={FEED} />);
  assert.deepEqual(sections(html), ["overview", "how-it-works", "signs", "stops", "lands", "deep-dives", "feed", "risks", "not-same-as"]);
  assert.match(html, /<nav aria-label="Breadcrumb"[\s\S]*?href="\/incidents">Incidents<\/a>[\s\S]*?›[\s\S]*?aria-current="page"[^>]*>Prompt injection and agent hijack</);
  assert.match(html, /<h1[^>]*>Prompt injection and agent hijack<\/h1>/);
  for (const t of ["Overview", "How it works", "Signs", "What stops it", "Where it lands", "Deep dives", "Recent in the feed", "Risks and frameworks", "Not the same as"]) assert.ok(html.includes(`>${t}<`), t);
  // How it works is numbered.
  assert.match(html, />1<\/span><span[^>]*>The attacker plants instructions/);
  // What stops it: chips into the control catalogue, each with its line.
  for (const s of full().stops) {
    assert.ok(html.includes(`href="/controls?control=${s.control}"`) && html.includes(esc(controlName(s.control))) && html.includes(s.how), s.control);
  }
  // Where it lands, with its counts and links.
  const lands = html.slice(html.indexOf(`data-lands="${OTHER}"`), html.indexOf("</li>", html.indexOf(`data-lands="${OTHER}"`)));
  assert.ok(lands.includes(`href="${patternHref(OTHER, { tab: "incidents" })}"`) && lands.includes(esc(archetypeById.get(OTHER)!.title)));
  assert.match(lands, />10 incidents</);
  // The exemplars: every deep dive filed under it, with date, title, subtitle and pattern.
  const dives = [...html.matchAll(/data-deep-dive="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(dives, incidentsNewestFirst().filter((i) => i.category === "promptInjection").map((i) => i.id));
  const row = html.slice(html.indexOf(`data-deep-dive="${A.id}"`), html.indexOf("</li>", html.indexOf(`data-deep-dive="${A.id}"`)));
  assert.ok(row.includes(`href="/incidents/${A.id}"`) && row.includes(esc(A.title)) && row.includes(esc(archetypeById.get(A.archetype)!.title)));
  assert.ok(row.includes(esc(A.subtitle.trim().split(/\s+/)[0])), "the subtitle");
  // The eight newest reports, then all of them.
  const listed = [...html.matchAll(/data-feed-item="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(listed.length, FEED_ON_INCIDENT_PATTERN);
  assert.deepEqual(listed, FEED.filter((f) => f.category === "promptInjection").slice(0, 8).map((f) => f.id));
  assert.ok(html.includes(`href="/feed?category=promptInjection"`) && html.includes("All 10 in the feed →"));
  // Risks and frameworks, and the line to its nearest incident pattern.
  assert.ok(html.includes(`href="/reference/risks?risk=riskPromptInjection"`) && html.includes(esc(riskTitle("riskPromptInjection"))));
  assert.match(html, /data-owasp="LLM01:2026"[^>]*><span[^>]*>LLM01:2026<\/span> <span[^>]*>Prompt Injection</);
  assert.match(html, /data-atlas="AML.T0051.001"[\s\S]*?LLM Prompt Injection: Indirect/);
  assert.match(html, new RegExp(`data-not-same-as="supplyChain"[\\s\\S]*?href="${incidentPatternHref("supplyChain")}"[\\s\\S]*?Poisoned supply chain`));
});

test("an incident pattern page leaves out what its file leaves out", () => {
  const bare = other() as IncidentPatternAuthored;
  const html = render("/incidents/poisoned-supply-chain", "", <IncidentPatternPage pattern={bare} feed={[]} />);
  const want = dataset.incidents.some((i) => i.category === "supplyChain") ? ["lands", "deep-dives"] : [];
  assert.deepEqual(sections(html), want);
  for (const t of ["Overview", "How it works", "Signs", "What stops it", "Recent in the feed", "Risks and frameworks", "Not the same as"]) assert.ok(!html.includes(`>${t}<`), t);
  // Each shipped incident pattern renders from its own file.
  for (const p of incidentPatterns) assert.match(render(`/incidents/${p.slug}`, "", <IncidentPatternPage id={p.id} />), new RegExp(`<h1[^>]*>${esc(p.name)}</h1>`));
});

test("a deep dive shows its breadcrumb, and its chip leads to its incident pattern", () => {
  for (const inc of dataset.incidents) {
    const html = render(`/incidents/${inc.id}`, "", <IncidentWalkthrough id={inc.id} />);
    const crumb = html.slice(html.indexOf('<nav aria-label="Breadcrumb"'), html.indexOf("</nav>", html.indexOf('<nav aria-label="Breadcrumb"')));
    const ip = incidentPatternById.get(inc.category)!;
    assert.ok(crumb.includes('href="/incidents">Incidents</a>'), inc.id);
    assert.ok(crumb.includes(`href="/incidents/${ip.slug}">${esc(ip.name)}</a>`), `${inc.id}: the incident pattern`);
    assert.ok(crumb.includes(`aria-current="page" class="min-w-0">${esc(inc.title)}</span>`), `${inc.id}: the deep dive's own title`);
    assert.ok(crumb.indexOf("Incidents</a>") < crumb.indexOf(esc(ip.name)) && crumb.indexOf(esc(ip.name)) < crumb.indexOf(esc(inc.title)));
    const chip = html.match(new RegExp(`<a [^>]*data-incident-pattern="${inc.category}"[^>]*>`));
    assert.ok(chip?.[0].includes(`href="/incidents/${ip.slug}"`), `${inc.id}: the chip opens its incident pattern`);
  }
});

test("the nav shows Incidents and Feed, side by side, and marks the one shown", () => {
  for (const [path, on] of [["/incidents", "Incidents"], ["/incidents/prompt-injection", "Incidents"], ["/feed", "Feed"]] as const) {
    const html = render(path, "", <SiteHeader />);
    const nav = html.slice(html.indexOf('<nav aria-label="Sections"'), html.indexOf("</nav>", html.indexOf('<nav aria-label="Sections"')));
    const labels = [...nav.matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1]);
    assert.deepEqual(labels, ["Patterns", "Controls", "Incidents", "Feed"], "Reference is the menu after them");
    assert.ok(nav.indexOf(">Feed<") < nav.indexOf("Reference"));
    assert.match(nav, /href="\/incidents"[^>]*>Incidents</);
    assert.match(nav, /href="\/feed"[^>]*>Feed</);
    assert.match(nav, new RegExp(`aria-current="page"[^>]*>${on}<`), path);
    assert.equal(nav.match(/aria-current="page"/g)?.length, 1, path);
  }
});

test("search finds incident patterns, deep dives and feed reports, each on its own page", () => {
  const entries = buildIndex(FEED);
  const patterns = entries.filter((e) => e.kind === "Incident pattern");
  assert.deepEqual(patterns.map((e) => e.href), incidentPatterns.map((p) => `/incidents/${p.slug}`));
  assert.ok(patterns.find((e) => e.title === incidentPatternById.get("identity")!.name)!.text.includes("llmjacking"));
  const dives = entries.filter((e) => e.kind === "Deep dive");
  assert.equal(dives.length, dataset.incidents.length);
  assert.equal(dives.find((e) => e.href === `/incidents/${A.id}`)!.title, incidentById.get(A.id)!.title);
  assert.ok(dives[0].hint!.includes(categoryById.get(dataset.incidents[0].category)!.label));
  assert.equal(entries.filter((e) => e.kind === "Feed").length, FEED.length);
  assert.equal(entries.filter((e) => e.kind === "Incident").length, 0, "no kind says incident on its own");
});
