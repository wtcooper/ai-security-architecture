import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import {
  checkDecisions,
  checkFeed,
  checkOverviews,
  checkStories,
  DECISIONS_FILE,
  FEED_LIMITS,
  loadFeed,
  OVERVIEWS_FILE,
  publicFeed,
  STORIES_FILE,
  type FeedContext,
  type LoadedFeedItem,
} from "./lib/feed";
import { IncidentFeed, landing } from "../src/components/incidents/IncidentFeed";
import { IncidentWalkthrough } from "../src/components/incidents/IncidentWalkthrough";
import { newSince, previousVisit, visitOf, VISIT_MS } from "../src/components/incidents/last-visit";
import { byWeek, weekOf } from "../src/components/incidents/model";
import { coverage } from "../src/components/incidents/months";
import { FEED_ON_PATTERN, PatternIncidents } from "../src/components/patterns/PatternPanels";
import { buildIndex } from "../src/components/shell/SearchPalette";
import { archetypeById, controlName, dataset, incidentPatternById, toolById } from "../src/lib/data";
import {
  FEED_ON_INCIDENT_PATTERN,
  feedForCategory,
  feedForIncident,
  feedForPattern,
  feedIndexOf,
  feedTitles,
  feedWindow,
  homeHeadlines,
  incidentPatternCards,
  initialWindow,
  isoWeek,
  latestDay,
  sectionUnits,
  withStories,
} from "../src/lib/feed";
import { IncidentPatternPage } from "../src/components/incidents/IncidentPatternPage";
import { IncidentPatternsIndex } from "../src/components/incidents/IncidentPatternsIndex";
import { feedItems } from "../src/lib/feed-server";
import { FEED_KINDS } from "../src/lib/feed-vocabulary";
import { controlHref, feedHref, incidentPatternHref, incidentReportsHref, legacyFeedTarget, patternHref, toolHref } from "../src/lib/routes";
import { feedRss } from "../src/lib/rss";
import type { FeedItem, FeedOverviews, FeedStory } from "../src/lib/types";

/*
 * The feed's data is written elsewhere and may not exist yet, so every fixture lives here and
 * the shipped pages are checked against it. Nothing in this file writes to data/feed/.
 */

const MCP = "archRemoteMcpServer";
const CHAT = "archChatAgent";
const CODING = "archCodingAgentThirdParty";
const MITTWALD = "mittwald-mcp-server";
const LITELLM = "litellm-release-hijack";
const ARTEX = "artex-campaigns";
const CLAUDE_CODE = "toolClaudeCode";
const TRACING = "cap-agent-tracing";
/** Claude Code's single-setting updates in the ISO week that starts on Monday 23 November 2026. */
const ROLL_UP = `settings-${CLAUDE_CODE}-2026-w48`;

const STORIES: FeedStory[] = [
  { id: "artex", title: "ARTEX: one public agent framework, many attackers", incident: ARTEX },
  { id: ROLL_UP, title: "Claude Code settings, week of 23 November" },
];

const ctx: FeedContext = {
  patternIds: new Set(dataset.archetypes.map((a) => a.id)),
  incidentIds: new Set(dataset.incidents.map((i) => i.id)),
  categoryIds: new Set(dataset.incidentPatterns.map((p) => p.id)),
  productIds: new Set(dataset.tools.map((t) => t.id)),
  controlIds: new Set(dataset.mitigations.map((m) => m.id)),
  stories: STORIES,
  exists: (path) => path === "data/tooling/anthropic/claude-code.yaml",
};
/** An incident pattern's name, as the page writes it. */
const nameOf = (id: string) => incidentPatternById.get(id)!.name.replace(/&/g, "&amp;");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

/** Filed the day it came to light, unless a fixture says otherwise. */
const filedOn = (over: Record<string, unknown>) => (typeof over.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(over.date) ? over.date : "2026-11-07");
/** A valid incident, written as the old files are (no kind); each test breaks one field of it. */
const item = (over: Record<string, unknown> = {}) => ({
  id: "test-item",
  weight: "notable",
  date: "2026-11-07",
  added: filedOn(over),
  title: "A web host's MCP server handed over its customers' session tokens",
  summary: "An attacker with a new account exploited a flaw in the server and read the tokens of the customers who used it.",
  category: "identity",
  perspective: "target",
  evidence: "confirmed",
  patterns: [MCP],
  sources: [{ title: "Security notice", url: "https://example.org/notice", publisher: "Example", date: "2026-11-07" }],
  ...over,
});
/** A valid item of another kind: no incident pattern or evidence, and a line on why it matters. */
const news = (over: Record<string, unknown> = {}) => ({
  id: "test-news",
  kind: "productUpdate",
  weight: "notable",
  date: "2026-11-07",
  added: filedOn(over),
  title: "Claude Code adds a managed setting that pins the tracing endpoint",
  summary: "Administrators can now pin where Claude Code sends its OpenTelemetry traces in managed settings.",
  why: "An agent's own traces can no longer be redirected by the person running it.",
  vendor: "Anthropic",
  products: [CLAUDE_CODE],
  controls: [TRACING],
  patterns: [CODING],
  sources: [{ title: "Managed settings", url: "https://example.org/settings", publisher: "Anthropic", date: "2026-11-07" }],
  ...over,
});
const problemsOf = (items: unknown[], file = "2026-11.yaml") => checkFeed([{ file, doc: { items } }], ctx).problems;
/** One problem, for the item, naming the file and the item. */
function rejects(over: Record<string, unknown>, pattern: RegExp, base: (over?: Record<string, unknown>) => Record<string, unknown> = item, file = "2026-11.yaml") {
  const built = base(over);
  const problems = problemsOf([built], file);
  assert.ok(
    problems.some((p) => p.startsWith(`feed/${file} item ${String(built.id ?? "test-item")}: `) && pattern.test(p)),
    `expected a problem matching ${pattern} for ${JSON.stringify(over)}; got ${JSON.stringify(problems)}`,
  );
}

// --- The loader's rules -----------------------------------------------------------------------------

test("a well-formed feed file passes, and the feed reads newest first across files", () => {
  assert.deepEqual(problemsOf([item()]), []);
  assert.deepEqual(problemsOf([item({ incident: MITTWALD, cves: ["CVE-2026-12345"], patterns: [] })]), []);
  const { feed, problems } = checkFeed(
    [
      { file: "2026-10.yaml", doc: { items: [item({ id: "older", date: "2026-10-30" })] } },
      { file: "2026-11.yaml", doc: { items: [item({ id: "mid", date: "2026-11-03" }), item({ id: "newest", date: "2026-11-20" })] } },
    ],
    ctx,
  );
  assert.deepEqual(problems, []);
  assert.deepEqual(feed.map((f) => f.id), ["newest", "mid", "older"]);
  // Folded YAML arrives with line breaks and a trailing newline; the feed keeps plain text.
  const folded = checkFeed([{ file: "2026-11.yaml", doc: { items: [item({ summary: "One line\nand the next.\n" })] } }], ctx).feed[0];
  assert.equal(folded.summary, "One line and the next.");
});

test("an item written before kinds existed is an incident, and every kind is one of the six, guidance among them", () => {
  const [old] = checkFeed([{ file: "2026-11.yaml", doc: { items: [item()] } }], ctx).feed;
  assert.equal(old.kind, "incident");
  assert.equal(old.category, "identity");
  assert.deepEqual(FEED_KINDS.map((k) => k.id), ["incident", "productUpdate", "tool", "launch", "guidance", "research"]);
  assert.deepEqual(FEED_KINDS.map((k) => k.chip), ["Incidents", "Product updates", "Tools", "Launches", "Guidance", "Research"]);
  for (const kind of ["productUpdate", "tool", "launch", "guidance", "research"]) assert.deepEqual(problemsOf([news({ kind })]), [], kind);
  assert.deepEqual(problemsOf([item({ kind: "incident", why: "Session tokens reached an outsider." })]), [], "an incident may say why too");
  rejects({ kind: "news" }, /kind "news" is not one of incident, productUpdate, tool, launch, guidance, research/);
  rejects({ category: "identity" }, /category is for incidents only; a guidance leaves it out/, (o) => news({ kind: "guidance", ...o }));
});

test("every item has a weight, headline, notable or brief, and a day has at most three headlines", () => {
  for (const weight of ["headline", "notable", "brief"]) assert.deepEqual(problemsOf([item({ weight })]), [], weight);
  rejects({ weight: undefined }, /needs a weight: headline, notable or brief/);
  rejects({ weight: "" }, /needs a weight/, news);
  rejects({ weight: "major" }, /weight "major" is not one of headline, notable, brief/);
  assert.equal(checkFeed([{ file: "2026-11.yaml", doc: { items: [news({ weight: "brief" })] } }], ctx).feed[0].weight, "brief");
  const four = ["a", "b", "c", "d"].map((id) => item({ id, weight: "headline" }));
  const problems = problemsOf(four);
  assert.deepEqual(problems, ["feed/2026-11.yaml item d: is headline number 4 on 2026-11-07; at most 3 a day (already: a, b and c). Make it notable"]);
  // Another day, or another weight, is no fourth headline.
  assert.deepEqual(problemsOf([...four.slice(0, 3), item({ id: "d", weight: "headline", date: "2026-11-08" }), item({ id: "e", weight: "notable" })]), []);
  // Across files the rule still holds: the day is what counts.
  const across = checkFeed(
    [
      { file: "2026-11.yaml", doc: { items: four.slice(0, 3) } },
      { file: "2026-11-extra.yaml", doc: { items: [item({ id: "late", weight: "headline" })] } },
    ],
    ctx,
  ).problems;
  assert.ok(across.some((p) => p.startsWith("feed/2026-11-extra.yaml item late: is headline number 4")), across.join("\n"));
});

test("every item says when the run filed it (added), apart from when it came to light (date)", () => {
  assert.deepEqual(problemsOf([item({ added: "2026-11-26" })]), [], "filed weeks after it came to light");
  assert.equal(checkFeed([{ file: "2026-11.yaml", doc: { items: [item({ added: "2026-12-02" })] } }], ctx).feed[0].added, "2026-12-02", "added may fall in a later month than the file's");
  rejects({ added: undefined }, /needs added: the day the run filed it, YYYY-MM-DD/);
  rejects({ added: "" }, /needs added/, news);
  for (const added of ["2026-11-7", "26/11/2026", "2026-02-30", "today"]) rejects({ added }, /added "[^"]+" must be a real day, YYYY-MM-DD \(the day the run filed it\)/);
});

test("category and evidence are required for incidents only, and the other kinds leave the incident fields out", () => {
  rejects({ category: undefined }, /category/);
  rejects({ evidence: undefined }, /evidence "" is not one of/);
  rejects({ perspective: undefined }, /perspective "" is not one of target, weapon/);
  const [other] = checkFeed([{ file: "2026-11.yaml", doc: { items: [news()] } }], ctx).feed;
  assert.equal(other.kind, "productUpdate");
  assert.ok(!("category" in other) && !("evidence" in other) && !("perspective" in other), "no incident fields on a product update");
  rejects({ category: "identity" }, /category is for incidents only; a productUpdate leaves it out/, news);
  rejects({ evidence: "confirmed", perspective: "target" }, /perspective, evidence are for incidents only/, news);
  rejects({ incident: MITTWALD, fit: "loose", fitNote: "x" }, /fit, fitNote, incident are for incidents only/, news);
});

test("why, vendor, products, controls: each held to its rule", () => {
  rejects({ why: undefined }, /a productUpdate needs a why: why it matters for security, in one line/, news);
  rejects({ why: "" }, /needs a why/, news);
  rejects({ why: "x".repeat(FEED_LIMITS.why + 1) }, /why is 161 characters; at most 160/, news);
  assert.deepEqual(problemsOf([news({ why: "x".repeat(FEED_LIMITS.why) })]), []);
  rejects({ why: "It changes the coding archetype." }, /why says "archetype"/, news);
  rejects({ vendor: "x".repeat(FEED_LIMITS.vendor + 1) }, /vendor is 81 characters; at most 80/, news);
  rejects({ products: ["claude-code"] }, /products: "claude-code" is not a product on the site \(a tooling id in data\/tooling\/\); did you mean toolClaudeCode\?/, news);
  rejects({ products: ["toolNope"] }, /products: "toolNope" is not a product on the site/, news);
  rejects({ products: CLAUDE_CODE }, /products must be a list/, news);
  rejects({ products: [CLAUDE_CODE, CLAUDE_CODE] }, /products names one twice/, news);
  rejects({ controls: ["cap-nope"] }, /controls: "cap-nope" is not a control in the catalogue/, news);
  rejects({ controls: [TRACING, TRACING] }, /controls names one twice/, news);
  const [kept] = checkFeed([{ file: "2026-11.yaml", doc: { items: [news()] } }], ctx).feed;
  assert.deepEqual([kept.why, kept.vendor, kept.products, kept.controls], [news().why, "Anthropic", [CLAUDE_CODE], [TRACING]]);
});

test("the title, summary and why are held to 90, 280 and 160 characters, and to the site's words", () => {
  assert.deepEqual([FEED_LIMITS.title, FEED_LIMITS.summary, FEED_LIMITS.why], [90, 280, 160]);
  rejects({ title: "x".repeat(91) }, /title is 91 characters; at most 90/);
  rejects({ summary: "x".repeat(281) }, /summary is 281 characters; at most 280/);
  assert.deepEqual(problemsOf([item({ title: "x".repeat(90), summary: "x".repeat(280) })]), []);
  // Characters as a reader counts them: an accent or a dash is one.
  assert.deepEqual(problemsOf([item({ title: "é".repeat(90) })]), []);
  rejects({ title: "" }, /needs a title/);
  rejects({ summary: undefined }, /needs a summary/);
  rejects({ title: "A flaw in the coding archetype" }, /title says "archetype"/);
  rejects({ summary: "It would replay on two Archetypes." }, /summary says "archetype"/);
  rejects({ severity: "high" }, /unknown field\(s\) severity/);
});

test("an update says what changes, where it stands and on what; watch is a status, and an applied one points at something real", () => {
  const update = (over: Record<string, unknown> = {}) => ({ update: { action: "settings", status: "applied", target: "data/tooling/anthropic/claude-code.yaml", note: "Adds the tracing endpoint setting.", ...over } });
  assert.deepEqual(problemsOf([news(update())]), []);
  assert.deepEqual(problemsOf([news(update({ action: "onboard", status: "proposed", target: "toolNotYetHere" }))]), [], "a proposed onboard names what is not there yet");
  assert.deepEqual(problemsOf([news(update({ action: "onboard", status: "watch", target: "toolNotYetHere", note: "Recheck when it is generally available (after 8 December)." }))]), [], "watch");
  assert.deepEqual(problemsOf([news(update({ action: "controlGuidance", status: "applied", target: TRACING }))]), []);
  rejects(update({ action: "rewrite" }), /update: action "rewrite" is not one of settings, toolOption, onboard, newControl, newPattern, controlGuidance/, news);
  rejects(update({ status: "done" }), /update: status "done" is not one of applied, proposed, declined, watch/, news);
  rejects(update({ target: "" }), /update needs a target/, news);
  rejects(update({ note: undefined }), /update needs a note/, news);
  rejects(update({ status: "watch", note: undefined }), /update needs a note: what to look for, and when to check again/, news);
  rejects(update({ note: "x".repeat(FEED_LIMITS.updateNote + 1) }), /update: note is 201 characters; at most 200/, news);
  rejects(update({ owner: "me" }), /update: unknown field\(s\) owner/, news);
  rejects(update({ target: "data/tooling/nobody/nothing.yaml" }), /update: applied, but its target data\/tooling\/nobody\/nothing.yaml does not exist/, news);
  rejects(update({ action: "newControl", target: "cap-nope" }), /update: applied, but its target "cap-nope" is not a control in the catalogue/, news);
  rejects({ update: "soon" }, /update must be a mapping/, news);
  const [kept] = checkFeed([{ file: "2026-11.yaml", doc: { items: [news(update({ status: "watch" }))] } }], ctx).feed;
  assert.deepEqual(kept.update, { action: "settings", status: "watch", target: "data/tooling/anthropic/claude-code.yaml", note: "Adds the tracing endpoint setting." });
  // What the site has of an item carries no update and no decision.
  const [shown] = publicFeed([{ ...kept, decision: { decision: "approve" } }]);
  assert.ok(!("update" in shown) && !("decision" in shown), JSON.stringify(shown));
  assert.equal(shown.title, kept.title);
});

test("decisions.yaml answers proposed updates: each names an item that proposes one, once", () => {
  const { feed } = checkFeed([{ file: "2026-11.yaml", doc: { items: [news({ update: { action: "onboard", status: "proposed", target: "toolX", note: "Onboard X." } }), item()] } }], ctx);
  assert.deepEqual(checkDecisions([{ id: "test-news", decision: "approve", note: "Go ahead." }], feed), { decisions: [{ id: "test-news", decision: "approve", note: "Go ahead." }], problems: [] });
  assert.deepEqual(checkDecisions(null, feed).problems, [], "an empty file decides nothing");
  const problems = (doc: unknown) => checkDecisions(doc, feed).problems;
  assert.match(problems({ id: "x" })[0], /^feed\/decisions\.yaml: needs a list of decisions/);
  assert.match(problems([{ id: "no-such", decision: "approve" }])[0], /^feed\/decisions\.yaml entry no-such: "no-such" is not an item in the feed/);
  assert.match(problems([{ id: "test-item", decision: "approve" }])[0], /entry test-item: item test-item proposes no site update to decide on/);
  assert.ok(problems([{ id: "test-news", decision: "approve" }, { id: "test-news", decision: "decline" }]).some((p) => /decided twice/.test(p)));
  assert.match(problems([{ id: "test-news", decision: "maybe" }])[0], /decision "maybe" is not one of approve, decline/);
  assert.match(problems([{ id: "test-news", decision: "decline", note: "x".repeat(201) }])[0], /note is 201 characters; at most 200/);
  assert.match(problems([{ id: "test-news", decision: "approve", by: "me" }])[0], /unknown field\(s\) by/);
});

test("an item's story is one in stories.yaml, and a settings roll-up holds one product's updates of one ISO week", () => {
  assert.deepEqual(problemsOf([item({ story: "artex" })]), []);
  assert.equal(checkFeed([{ file: "2026-11.yaml", doc: { items: [item({ story: "artex" })] } }], ctx).feed[0].story, "artex");
  rejects({ story: "no-such-story" }, /story "no-such-story" is not a story in feed\/stories\.yaml/);
  rejects({ story: "" }, /story, when given, names a story/);
  assert.deepEqual(problemsOf([news({ story: "artex" })]), [], "a storyline takes items of any kind");
  // ISO weeks: 23 November 2026 starts week 48; 1 January 2027 is in 2026's week 53.
  assert.deepEqual(isoWeek("2026-11-23"), { year: 2026, week: 48 });
  assert.deepEqual(isoWeek("2026-11-29"), { year: 2026, week: 48 });
  assert.deepEqual(isoWeek("2027-01-01"), { year: 2026, week: 53 });
  assert.deepEqual(isoWeek("2026-01-01"), { year: 2026, week: 1 });
  const inWeek = (over: Record<string, unknown> = {}) => news({ date: "2026-11-24", story: ROLL_UP, ...over });
  assert.deepEqual(problemsOf([inWeek()]), []);
  rejects({ date: "2026-11-30" }, new RegExp(`story ${ROLL_UP} rolls up toolClaudeCode's settings in 2026 week 48, but 2026-11-30 is in 2026 week 49`), inWeek);
  rejects({ kind: "launch" }, /but it is a launch, not a product update/, inWeek);
  rejects({ products: ["toolCodex"] }, /but it does not name toolClaudeCode in products/, inWeek);
});

test("stories.yaml: ids unique, titles at most 90, the deep dive it names exists, and a roll-up names a product and a real week", () => {
  const check = (stories: unknown) => checkStories({ stories }, ctx);
  const ok = check([...STORIES, { id: "settings-toolCodex-2026-w53", title: "Codex settings, week of 28 December" }]);
  assert.deepEqual(ok.problems, []);
  assert.deepEqual(ok.stories.map((s) => s.id), ["artex", ROLL_UP, "settings-toolCodex-2026-w53"]);
  assert.deepEqual(checkStories(null, ctx), { stories: [], problems: [] }, "no file is no stories");
  const problems = (stories: unknown) => check(stories).problems;
  assert.deepEqual(problems([{ id: "artex", title: "A" }, { id: "artex", title: "B" }]), ["feed/stories.yaml story artex: duplicate id; each story is listed once"]);
  assert.deepEqual(problems([{ id: "artex", title: "x".repeat(91) }]), ["feed/stories.yaml story artex: title is 91 characters; at most 90"]);
  assert.deepEqual(problems([{ id: "artex" }]), ["feed/stories.yaml story artex: needs a title"]);
  assert.deepEqual(problems([{ id: "artex", title: "ARTEX", incident: "no-such-dive" }]), ['feed/stories.yaml story artex: incident "no-such-dive" is not a deep dive (data/incidents/)']);
  assert.deepEqual(problems([{ id: "ARTEX", title: "ARTEX" }]), ['feed/stories.yaml story ARTEX: id "ARTEX" must be kebab-case (lower-case letters, digits and hyphens)']);
  assert.deepEqual(problems([{ id: "artex", title: "ARTEX", owner: "me" }]), ["feed/stories.yaml story artex: unknown field(s) owner"]);
  assert.match(problems([{ id: "settings-claude-code-2026-w48", title: "T" }])[0], /story settings-claude-code-2026-w48: a settings roll-up's id is settings-<toolId>-<YYYY>-w<NN>/);
  assert.match(problems([{ id: "settings-toolNope-2026-w48", title: "T" }])[0], /story settings-toolNope-2026-w48: a settings roll-up names "toolNope", which is not a product on the site/);
  assert.match(problems([{ id: "settings-toolClaudeCode-2027-w53", title: "T" }])[0], /week 53 is not an ISO week of 2027 \(1 to 52\)/);
  assert.match(problems([{ title: "T" }])[0], /^feed\/stories\.yaml story #1: needs an id/);
  assert.match(checkStories([{ id: "x" }], ctx).problems[0], /^feed\/stories\.yaml: needs a stories: list/);
  assert.match(checkStories({ stories: [], extra: 1 }, ctx).problems[0], /unknown top-level key\(s\) extra/);
});

test("overviews.yaml: a real day, a week by its Monday, each at most 400 or 600 characters, once; a day the run filed items on, a week items are dated in", () => {
  // A day's overview is for a day the run filed items (their `added`); a week's, for a week items are dated in.
  const days = { added: new Set(["2026-11-26", "2026-11-24", "2026-11-17"]), dates: new Set(["2026-11-26", "2026-11-24", "2026-11-17", "2026-11-10"]) };
  const ok = checkOverviews({ days: [{ date: "2026-11-26", overview: "Two plain sentences.\nOn two lines.\n" }], weeks: [{ week: "2026-11-23", overview: "The week." }] }, days);
  assert.deepEqual(ok.problems, []);
  assert.deepEqual(ok.overviews, { days: [{ date: "2026-11-26", overview: "Two plain sentences. On two lines." }], weeks: [{ week: "2026-11-23", overview: "The week." }] });
  assert.deepEqual(checkOverviews(null), { overviews: { days: [], weeks: [] }, problems: [] }, "no file is no overviews");
  const problems = (doc: unknown) => checkOverviews(doc, days).problems;
  assert.deepEqual(problems({ weeks: [{ week: "2026-11-24", overview: "x" }] }), ["feed/overviews.yaml week 2026-11-24: 2026-11-24 is not a Monday; a week is named by the Monday it starts on (2026-11-23)"]);
  assert.deepEqual(problems({ days: [{ date: "2026-02-30", overview: "x" }] }), ['feed/overviews.yaml day 2026-02-30: date "2026-02-30" must be a real day, YYYY-MM-DD']);
  assert.deepEqual(problems({ days: [{ date: "2026-11-26", overview: "x".repeat(401) }] }), ["feed/overviews.yaml day 2026-11-26: overview is 401 characters; at most 400"]);
  assert.deepEqual(problems({ days: [{ date: "2026-11-26", overview: "x".repeat(400) }] }), []);
  assert.deepEqual(problems({ weeks: [{ week: "2026-11-23", overview: "x".repeat(601) }] }), ["feed/overviews.yaml week 2026-11-23: overview is 601 characters; at most 600"]);
  assert.deepEqual(problems({ weeks: [{ week: "2026-11-23", overview: "x".repeat(600) }] }), []);
  assert.deepEqual(problems({ days: [{ date: "2026-11-26", overview: "" }] }), ["feed/overviews.yaml day 2026-11-26: needs an overview"]);
  assert.deepEqual(problems({ days: [{ date: "2026-11-26", overview: "a" }, { date: "2026-11-26", overview: "b" }] }), ["feed/overviews.yaml day 2026-11-26: listed twice; keep one overview per day"]);
  assert.deepEqual(problems({ days: [{ date: "2026-11-25", overview: "a" }] }), ["feed/overviews.yaml day 2026-11-25: no item was added this day; a day's overview belongs to a day the run filed items on"]);
  assert.deepEqual(problems({ days: [{ date: "2026-11-10", overview: "a" }] }), ["feed/overviews.yaml day 2026-11-10: no item was added this day; a day's overview belongs to a day the run filed items on"], "dated that day is not filed that day");
  assert.deepEqual(problems({ weeks: [{ week: "2026-11-09", overview: "a" }] }), [], "an item dated that week, though filed later");
  assert.deepEqual(problems({ weeks: [{ week: "2026-11-02", overview: "a" }] }), ["feed/overviews.yaml week 2026-11-02: no item is dated this week; an overview belongs to a week that has items"]);
  assert.deepEqual(problems({ days: [{ date: "2026-11-26", overview: "a", by: "me" }] }), ["feed/overviews.yaml day 2026-11-26: unknown field(s) by"]);
  assert.deepEqual(problems({ months: [] }), ["feed/overviews.yaml: unknown top-level key(s) months; it holds days: and weeks: only"]);
  assert.deepEqual(problems({ days: [{ date: "2026-11-26", overview: "On the coding archetype." }] }), ['feed/overviews.yaml day 2026-11-26: overview says "archetype"; the reader\'s word is pattern']);
});

test("the loader rejects duplicate ids, across files as well as within one", () => {
  const across = checkFeed(
    [
      { file: "2026-11.yaml", doc: { items: [item()] } },
      { file: "2026-10.yaml", doc: { items: [item({ date: "2026-10-02" })] } },
    ],
    ctx,
  ).problems;
  assert.ok(across.some((p) => p.startsWith("feed/2026-10.yaml item test-item: duplicate id: also an item in feed/2026-11.yaml")), across.join("\n"));
  assert.ok(problemsOf([item(), item()]).some((p) => /duplicate id/.test(p)));
  rejects({ id: "Not_Kebab" }, /kebab-case/);
  assert.ok(problemsOf([item({ id: undefined })]).some((p) => p.startsWith("feed/2026-11.yaml item #1: needs an id")));
});

test("the loader rejects a malformed date, and a date outside the file's month", () => {
  for (const date of ["2026-11-7", "07/11/2026", "2026-11", "2026-02-30", "", undefined]) rejects({ date }, /must be a real day, YYYY-MM-DD/);
  rejects({ date: "2026-10-31" }, /outside 2026-11/);
  rejects({ date: "2026-12-01" }, /outside 2026-11/);
  assert.ok(problemsOf([item()], "november.yaml").some((p) => /name the file after the month/.test(p)));
  assert.ok(problemsOf([item()], "2026-13.yaml").some((p) => /name the file after the month/.test(p)));
});

test("the loader rejects a category that is no incident pattern, and evidence or perspective that is not on its list", () => {
  rejects({ category: "bias" }, new RegExp(`category "bias" is not an incident pattern \\(data/incident-patterns/\\): one of ${dataset.incidentPatterns.map((p) => p.id).join(", ")}`));
  for (const p of dataset.incidentPatterns) assert.deepEqual(problemsOf([item({ category: p.id })]), [], p.id);
  rejects({ evidence: "rumoured" }, /evidence "rumoured" is not one of exploited, confirmed, demonstrated, reported/);
  rejects({ perspective: "victim" }, /perspective "victim" is not one of target, weapon/);
});

test("a loose fit is marked with fit: loose and says why in a fitNote", () => {
  const loose = checkFeed([{ file: "2026-11.yaml", doc: { items: [item({ fit: "loose", fitNote: "A gateway flaw, not a default left open." })] } }], ctx);
  assert.deepEqual(loose.problems, []);
  assert.equal(loose.feed[0].fit, "loose");
  assert.equal(loose.feed[0].fitNote, "A gateway flaw, not a default left open.");
  assert.equal("fit" in checkFeed([{ file: "2026-11.yaml", doc: { items: [item()] } }], ctx).feed[0], false, "no fit when it fits");
  rejects({ fit: "tight", fitNote: "x" }, /fit "tight" is not one of loose/);
  rejects({ fit: "loose" }, /fit: loose needs a fitNote/);
  rejects({ fitNote: "x" }, /fitNote goes with fit: loose/);
  rejects({ fit: "loose", fitNote: "x".repeat(FEED_LIMITS.fitNote + 1) }, /fitNote is 161 characters; at most 160/);
});

test("the loader rejects an unknown pattern, more than three, and an incident that is not a deep dive", () => {
  rejects({ patterns: ["archNope"] }, /pattern "archNope" does not exist/);
  rejects({ patterns: [MCP, CHAT, "archAgentWorkflow", "archActionAgent"] }, /names 4 patterns; at most 3/);
  rejects({ patterns: [MCP, MCP] }, /names a pattern twice/);
  rejects({ patterns: MCP }, /patterns must be a list/);
  rejects({ incident: "no-such-incident" }, /incident "no-such-incident" is not a deep dive/);
  rejects({ cves: ["CVE-26-1"] }, /not a CVE identifier/);
});

test("the loader wants one to three sources, each with an https address and a publisher", () => {
  const source = (n: number) => ({ title: `Page ${n}`, url: `https://example.org/${n}`, publisher: "Example" });
  rejects({ sources: [] }, /needs 1 to 3 sources/);
  rejects({ sources: undefined }, /needs 1 to 3 sources/);
  rejects({ sources: [1, 2, 3, 4].map(source) }, /needs 1 to 3 sources, the primary first; has 4/);
  assert.deepEqual(problemsOf([item({ sources: [1, 2, 3].map(source) })]), []);
  rejects({ sources: [{ ...source(1), url: "http://example.org/1" }] }, /source 1: url "http:\/\/example.org\/1" must be an https:\/\/ address/);
  rejects({ sources: [{ ...source(1), url: "example.org/1" }] }, /must be an https:\/\/ address/);
  rejects({ sources: [{ ...source(1), title: "" }] }, /source 1 needs the page's own title/);
  rejects({ sources: [{ ...source(1), publisher: undefined }] }, /source 1 needs a publisher/);
  rejects({ sources: [source(1), source(1)] }, /source 2 repeats/);
  rejects({ sources: [{ ...source(1), date: "last week" }] }, /source 1: date "last week"/);
});

test("no feed files at all is an empty feed; stories, overviews and decisions are read as what they are, never as months", async () => {
  const root = mkdtempSync(join(tmpdir(), "feed-"));
  try {
    const fails: string[] = [];
    const bare = { ...ctx, stories: undefined };
    assert.deepEqual((await loadFeed(root, bare, (m) => fails.push(m))).feed, [], "no data/feed folder");
    const dir = join(root, "data", "feed");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "README.md"), "# The feed\n");
    assert.deepEqual((await loadFeed(root, bare, (m) => fails.push(m))).feed, [], "only a README");
    writeFileSync(join(dir, DECISIONS_FILE), "# The owner's answers\n");
    assert.deepEqual((await loadFeed(root, bare, (m) => fails.push(m))).feed, [], "an empty decisions file");
    assert.equal(fails.length, 0, fails.join("\n"));
    writeFileSync(join(dir, STORIES_FILE), `stories:\n  - id: artex\n    title: "ARTEX: one public agent framework, many attackers"\n    incident: ${ARTEX}\n`);
    writeFileSync(join(dir, OVERVIEWS_FILE), "days:\n  - date: 2026-11-20\n    overview: >\n      A launch.\nweeks:\n  - week: 2026-11-16\n    overview: The week of the launch.\n");
    writeFileSync(
      join(dir, "2026-11.yaml"),
      "items:\n  - id: proposes\n    kind: launch\n    weight: headline\n    story: artex\n    date: 2026-11-20\n    added: 2026-11-20\n    title: A launch\n    summary: It launched.\n    why: Data goes somewhere new.\n    patterns: []\n" +
        "    update: { action: newPattern, status: proposed, target: archNew, note: A new pattern. }\n    sources: [{ title: Post, url: 'https://example.org/p', publisher: Example }]\n",
    );
    writeFileSync(join(dir, DECISIONS_FILE), "- id: proposes\n  decision: approve\n  note: Yes.\n");
    const loaded = await loadFeed(root, bare, (m) => fails.push(m));
    assert.equal(fails.length, 0, fails.join("\n"));
    assert.deepEqual(loaded.feed[0].decision, { decision: "approve", note: "Yes." }, "the decision is joined to its item, for the review queue");
    assert.deepEqual(loaded.stories, [{ id: "artex", title: "ARTEX: one public agent framework, many attackers", incident: ARTEX }]);
    assert.deepEqual(loaded.overviews, { days: [{ date: "2026-11-20", overview: "A launch." }], weeks: [{ week: "2026-11-16", overview: "The week of the launch." }] });
    // What the build writes: the story's title on the item, and no review material.
    const [shown] = withStories(publicFeed(loaded.feed), loaded.stories);
    assert.deepEqual([shown.story, shown.storyTitle, shown.storyIncident], ["artex", "ARTEX: one public agent framework, many attackers", ARTEX]);
    assert.ok(!("update" in shown) && !("decision" in shown));
    writeFileSync(join(dir, "2026-10.yaml"), "items:\n  - id: broken\n    weight: brief\n    date: 2026-11-01\n");
    writeFileSync(join(dir, STORIES_FILE), "stories:\n  - id: artex\n    title: A\n  - id: artex\n    title: B\n");
    await loadFeed(root, bare, (m) => fails.push(m));
    assert.ok(fails.some((f) => f.startsWith("feed/2026-10.yaml item broken: date 2026-11-01 is outside 2026-10")), fails.join("\n"));
    assert.ok(fails.includes("feed/stories.yaml story artex: duplicate id; each story is listed once"), fails.join("\n"));
    for (const f of [DECISIONS_FILE, STORIES_FILE, OVERVIEWS_FILE]) assert.ok(!fails.some((x) => x.startsWith(`feed/${f}: name the file`)), `${f} is not read as a month`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- The pages, read with a fixture feed --------------------------------------------------------

/**
 * Sixteen items over five weeks, every kind and weight, two stories and the overviews of the newest
 * day and two weeks; the newest day is Thursday 26 November 2026. Checked by the loader like any
 * feed file, then made what the build writes.
 */
const OVERVIEWS: FeedOverviews = {
  days: [{ date: "2026-11-26", overview: "Wiz ties a second intrusion to ARTEX, and Claude Code pins its traces." }],
  weeks: [
    { week: "2026-11-23", overview: "ARTEX spreads: the Swiss NCSC and Wiz both report intrusions run by it." },
    { week: "2026-11-16", overview: "A web host's MCP server gave away its customers' tokens." },
  ],
};
const MIXED: FeedItem[] = (() => {
  const nov = [
    item({ id: "artex-wiz", weight: "headline", date: "2026-11-26", category: "aiAttacker", perspective: "weapon", evidence: "exploited", patterns: [], story: "artex", title: "Wiz ties a second cloud intrusion to ARTEX" }),
    news({ id: "claude-tracing", date: "2026-11-26", story: ROLL_UP }),
    news({ id: "claude-hooks", weight: "brief", date: "2026-11-26", story: ROLL_UP, title: "Claude Code lets administrators lock its hooks", summary: "A managed setting stops users adding their own hooks.", controls: undefined }),
    news({
      id: "skills-scanner",
      kind: "tool",
      weight: "brief",
      date: "2026-11-26",
      title: "Tencent ships a scanner for MCP servers and agent skills",
      vendor: "Tencent",
      products: undefined,
      controls: ["cap-mcp-tool-integrity"],
      patterns: [MCP],
      update: { action: "toolOption", status: "proposed", target: "tencent-ai-infra-guard", note: "List AI-Infra-Guard under Tool and MCP Server Integrity." },
      sources: [
        { title: "AI-Infra-Guard", url: "https://example.org/aig", publisher: "Tencent", date: "2026-11-26" },
        { title: "Coverage", url: "https://example.org/press", publisher: "Press", date: "2026-11-27" },
      ],
    }),
    item({ id: "artex-ncsc", date: "2026-11-24", category: "aiAttacker", perspective: "weapon", evidence: "confirmed", patterns: [], story: "artex", title: "The Swiss NCSC reports AI-run intrusions in two sectors" }),
    news({ id: "nist-guidance", kind: "guidance", date: "2026-11-24", title: "NIST publishes an overlay for securing AI agents", vendor: "NIST", products: undefined, controls: undefined, patterns: [] }),
    news({ id: "private-inference", kind: "launch", weight: "brief", date: "2026-11-24", title: "xAI offers private inference", vendor: "xAI", products: undefined, controls: undefined, patterns: [], update: { action: "onboard", status: "watch", target: "toolXaiPrivate", note: "Recheck once it is generally available." } }),
    item({ id: "mcp-tokens", weight: "headline", date: "2026-11-20", category: "identity", evidence: "exploited", patterns: [MCP], incident: MITTWALD }),
    news({ id: "evals-post", kind: "research", weight: "brief", date: "2026-11-20", title: "How a lab measures prompt injection resistance", vendor: "Anthropic", products: undefined, patterns: [], update: { action: "controlGuidance", status: "declined", target: TRACING, note: "No change to the tracing guidance." } }),
    item({ id: "package-hijack", date: "2026-11-17", category: "supplyChain", evidence: "confirmed", patterns: ["archActionAgent"] }),
    item({ id: "chat-injection", date: "2026-11-16", category: "promptInjection", evidence: "demonstrated", patterns: [MCP, CHAT] }),
    item({ id: "open-gateway", weight: "brief", date: "2026-11-15", category: "exposed", evidence: "reported", patterns: [] }),
    // Found late: it came to light on 9 November and the run filed it on the 26th, so it is in Latest and in its own week.
    item({ id: "mcp-follow-up", date: "2026-11-09", added: "2026-11-26", category: "identity", evidence: "confirmed", patterns: [MCP], incident: MITTWALD, title: "Mittwald says 56 projects were taken over" }),
    item({ id: "agent-intrusion", date: "2026-11-02", category: "aiAttacker", evidence: "exploited", patterns: [MCP] }),
  ];
  const oct = [
    item({ id: "sandbox-escape", weight: "headline", date: "2026-10-30", category: "breakout", evidence: "demonstrated", patterns: [MCP], incident: LITELLM, title: "An agent sandbox escape through a symlinked config file" }),
    item({ id: "oldest-mcp", date: "2026-10-27", category: "identity", evidence: "confirmed", patterns: [MCP] }),
  ];
  const { feed, problems } = checkFeed([{ file: "2026-11.yaml", doc: { items: nov } }, { file: "2026-10.yaml", doc: { items: oct } }], ctx);
  assert.deepEqual(problems, [], "the fixture is a valid feed");
  return withStories(publicFeed(feed), STORIES);
})();
/** The same items as the loader has them: with their updates and the owner's decision. */
const LOADED: LoadedFeedItem[] = (() => {
  const { feed } = checkFeed([{ file: "2026-11.yaml", doc: { items: [news({ id: "skills-scanner", kind: "tool", date: "2026-11-26", update: { action: "toolOption", status: "proposed", target: "tencent-ai-infra-guard", note: "List AI-Infra-Guard under Tool and MCP Server Integrity." } })] } }], ctx);
  return [...feed.map((f) => ({ ...f, decision: { decision: "approve" as const, note: "Add it." } })), ...MIXED.filter((f) => f.id !== "skills-scanner")];
})();
const FIXTURE = MIXED.filter((f) => f.kind === "incident");
const ids = (items: { id: string }[]) => items.map((f) => f.id);
const TODAY = "2026-11-26";

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const render = (path: string, query: string, node: React.ReactNode) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={path}>
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>{node}</SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
type FeedProps = Parameters<typeof IncidentFeed>[0];
const feedPage = (query = "", props: Partial<FeedProps> = {}) => render("/feed", query, <IncidentFeed items={MIXED} overviews={OVERVIEWS} today={TODAY} {...props} />);
/** A section's markup, by its key ("latest", or "week-<Monday>"). */
const sectionOf = (html: string, key: string) => {
  const start = html.indexOf(`data-section="${key}"`);
  assert.ok(start >= 0, `no section ${key}`);
  return html.slice(start, html.indexOf("</section>", start));
};
/** The sections in order, each with its count and whether it is open. */
const sections = (html: string) =>
  [...html.matchAll(/data-section="([^"]+)" data-open="(true|false)"[\s\S]*?data-section-count="(\d+)"/g)].map((m) => ({ key: m[1], open: m[2] === "true", count: Number(m[3]) }));
/** The items listed, in order, by their data-item. */
const listed = (html: string) => [...html.matchAll(/data-item="([^"]+)"/g)].map((m) => m[1]);
/** One row's markup. */
const rowOf = (html: string, id: string) => {
  const start = html.indexOf(`data-item="${id}"`);
  assert.ok(start >= 0, `no row ${id}`);
  return html.slice(html.lastIndexOf("<li", start), html.indexOf("</li>", start));
};

test("weeks run Monday to Sunday", () => {
  assert.equal(weekOf("2026-11-16"), "2026-11-16");
  assert.equal(weekOf("2026-11-20"), "2026-11-16");
  assert.equal(weekOf("2026-11-22"), "2026-11-16");
  assert.equal(weekOf("2026-11-15"), "2026-11-09");
  assert.equal(weekOf("2027-01-01"), "2026-12-28");
  assert.deepEqual(byWeek(MIXED).map((w) => w.week), ["2026-11-23", "2026-11-16", "2026-11-09", "2026-11-02", "2026-10-26"]);
});

test("the index carries what the sections need: the Latest day and every week, with counts by kind and an overview or its headlines", () => {
  const index = feedIndexOf(MIXED, OVERVIEWS);
  assert.equal(index.total, 16);
  assert.equal(index.latest, TODAY);
  assert.deepEqual(index.months, [{ month: "2026-11", count: 14 }, { month: "2026-10", count: 2 }]);
  assert.deepEqual(index.kinds, { incident: 10, productUpdate: 2, tool: 1, launch: 1, guidance: 1, research: 1 });
  // Latest is what the run filed on its newest day (added), the late find among it, with that day's overview.
  assert.deepEqual(index.day, { date: TODAY, count: 5, kinds: { incident: 2, productUpdate: 2, tool: 1, launch: 0, guidance: 0, research: 0 }, overview: OVERVIEWS.days[0].overview });
  // Filed on a later day than the newest date: Latest follows the filing day.
  const later = feedIndexOf(MIXED.map((f) => (f.id === "oldest-mcp" ? { ...f, added: "2026-11-27" } : f)), OVERVIEWS);
  assert.deepEqual([later.latest, later.day?.count, later.day?.overview], ["2026-11-27", 1, undefined]);
  assert.deepEqual(later.day?.headlines, [MIXED.find((f) => f.id === "oldest-mcp")!.title], "no overview for that day: its headlines' titles");
  assert.deepEqual(
    index.weeks.map((w) => [w.week, w.count, w.overview ?? null, w.headlines ?? null]),
    [
      ["2026-11-23", 7, OVERVIEWS.weeks[0].overview, null],
      ["2026-11-16", 4, OVERVIEWS.weeks[1].overview, null],
      // No overview: the week's headlines, or with none, its notable items.
      ["2026-11-09", 2, null, ["Mittwald says 56 projects were taken over"]],
      ["2026-11-02", 1, null, [item().title]],
      ["2026-10-26", 2, null, ["An agent sandbox escape through a symlinked config file"]],
    ],
  );
  assert.deepEqual(index.weeks[0].kinds, { incident: 2, productUpdate: 2, tool: 1, launch: 1, guidance: 1, research: 0 });
  assert.ok(!("proposed" in index), "the index lists no proposal");
  assert.deepEqual(feedIndexOf([]), { total: 0, latest: "", months: [], kinds: Object.fromEntries(FEED_KINDS.map((k) => [k.id, 0])), incidents: { category: {}, evidence: {}, pattern: {} }, weeks: [] });
});

test("the feed page: Latest, then this week and the weeks before it, each with its heading, its count and its overview", () => {
  const html = feedPage();
  assert.match(html, /<h1[^>]*>Daily feed<\/h1>/);
  assert.match(html, /The AI security daily: what changed in AI security, why it matters and what it touches on this site, reviewed every day\./);
  assert.match(html, /data-feed-status[^>]*><span>16 items<\/span><span>Latest 26 November 2026<\/span>/);
  assert.match(html, /<a href="\/feed\.xml"[^>]*data-rss[^>]*>[\s\S]*?RSS<\/a>/);
  assert.deepEqual(sections(html), [
    { key: "latest", open: true, count: 5 },
    { key: "week-2026-11-23", open: false, count: 7 },
    { key: "week-2026-11-16", open: false, count: 4 },
    { key: "week-2026-11-09", open: false, count: 2 },
    { key: "week-2026-11-02", open: false, count: 1 },
    { key: "week-2026-10-26", open: false, count: 2 },
  ]);
  // The headings: Today's feed (filed today), This week (it is this week), then the weeks by their Monday.
  const headings = [...html.matchAll(/<h2 id="[^"]+-title"[^>]*><span class="display[^"]*">([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(headings, ["Today’s feed", "This week", "Week of 16 November 2026", "Week of 9 November 2026", "Week of 2 November 2026", "Week of 26 October 2026"]);
  assert.match(sectionOf(html, "latest"), /26 November 2026 · <span data-section-count="5">5 items<\/span>/);
  assert.match(sectionOf(html, "week-2026-11-23"), /From 23 November 2026 · <span data-section-count="7">7 items<\/span>/);
  // Every overview is visible, open or folded; a week without one shows its headlines' titles.
  assert.ok(sectionOf(html, "latest").includes(`data-overview="true">${esc(OVERVIEWS.days[0].overview)}</p>`));
  assert.ok(sectionOf(html, "week-2026-11-23").includes(`data-overview="true">${esc(OVERVIEWS.weeks[0].overview)}</p>`));
  assert.ok(sectionOf(html, "week-2026-11-16").includes(`data-overview="true">${esc(OVERVIEWS.weeks[1].overview)}</p>`));
  assert.match(sectionOf(html, "week-2026-10-26"), /data-overview-headlines="true"><li>An agent sandbox escape through a symlinked config file<\/li><\/ul>/);
  // Another day, the newest filing day is the latest feed, named by its day; another week, there is no This week.
  const tomorrow = feedPage("", { today: "2026-11-27" });
  assert.match(tomorrow, /<span class="display[^"]*">Latest feed · 26 November 2026<\/span><span class="text-\[12.5px\] text-ink-3"><span data-section-count="5">5 items<\/span>[\s\S]*?<span class="display[^"]*">This week<\/span>/);
  assert.doesNotMatch(tomorrow, /Today’s feed/);
  assert.doesNotMatch(feedPage("", { today: "2026-12-01" }), />This week</);
  assert.match(feedPage("", { today: "2026-12-01" }), /<span class="display[^"]*">Week of 23 November 2026<\/span>/);
});

test("Latest is always open and the weeks are folded, each with an expander", () => {
  const html = feedPage();
  const latest = sectionOf(html, "latest");
  assert.match(latest, /data-section-items="true"/);
  assert.doesNotMatch(latest, /data-expander/, "Latest has nothing to fold");
  for (const w of ["2026-11-23", "2026-11-16", "2026-11-09", "2026-11-02", "2026-10-26"]) {
    const week = sectionOf(html, `week-${w}`);
    assert.doesNotMatch(week, /data-section-items|data-item=/, `${w} is folded`);
    assert.match(week, new RegExp(`<button type="button" aria-expanded="false" aria-controls="week-${w}-items" data-expander="true"[^>]*>[\\s\\S]*?Show the \\d+ items?</button>`), w);
  }
  // Only Latest's items are drawn until a week is opened: what the run filed on its newest day, the late find among them.
  assert.deepEqual(listed(html), ["artex-wiz", "claude-tracing", "claude-hooks", "mcp-follow-up"]);
  // Opened, a week lists its items, Latest's among them, and its expander says Hide.
  const open = feedPage("", { open: ["2026-11-23", "2026-10-26"] });
  assert.deepEqual(sections(open).map((s) => s.open), [true, true, false, false, false, true]);
  assert.match(sectionOf(open, "week-2026-11-23"), /aria-expanded="true"[^>]*>[\s\S]*?Hide the items<\/button>/);
  assert.deepEqual(listed(sectionOf(open, "week-2026-11-23")), ["artex-wiz", "artex-ncsc", "claude-tracing", "claude-hooks", "nist-guidance"]);
  assert.deepEqual(listed(sectionOf(open, "week-2026-10-26")), ["sandbox-escape", "oldest-mcp"]);
});

test("an open section groups items by story, then lists the rest by weight and date, with the briefs behind +N briefs", () => {
  const latest = sectionOf(feedPage(), "latest");
  // The ARTEX story (a headline) first, then Claude Code's settings roll-up (notable, with its brief), then the
  // late find (notable, dated 9 November), then the fold.
  assert.deepEqual([...latest.matchAll(/data-story="([^"]+)"/g)].map((m) => m[1]), ["artex", ROLL_UP]);
  assert.deepEqual(listed(latest), ["artex-wiz", "claude-tracing", "claude-hooks", "mcp-follow-up"]);
  assert.match(latest, /data-story="artex"[\s\S]*?<span class="eyebrow">Story<\/span><span[^>]*data-story-title="true">ARTEX: one public agent framework, many attackers<\/span><span[^>]*>1 item<\/span><a [^>]*href="\/incidents\/artex-campaigns"[^>]*>Deep dive →<\/a>/);
  assert.match(latest, new RegExp(`data-story="${ROLL_UP}"[\\s\\S]*?data-story-title="true">Claude Code settings, week of 23 November</span><span[^>]*>2 items</span>`));
  assert.match(latest, /<button type="button" aria-expanded="false" data-briefs="1"[^>]*>\+1 brief<\/button>/);
  assert.doesNotMatch(latest, /data-item="skills-scanner"/, "the brief is folded");
  const opened = sectionOf(feedPage("", { briefsOpen: ["latest"] }), "latest");
  assert.deepEqual(listed(opened), ["artex-wiz", "claude-tracing", "claude-hooks", "mcp-follow-up", "skills-scanner"]);
  assert.match(opened, /aria-expanded="true" data-briefs="1"[^>]*>Hide the 1 brief</);
  // A week: stories with their items newest first, then standalone items by weight then date.
  const week = sectionOf(feedPage("", { open: ["2026-11-23"], briefsOpen: ["2026-11-23"] }), "week-2026-11-23");
  assert.deepEqual(listed(week), ["artex-wiz", "artex-ncsc", "claude-tracing", "claude-hooks", "nist-guidance", "skills-scanner", "private-inference"]);
  const units = sectionUnits(MIXED.filter((f) => weekOf(f.date) === "2026-11-16"));
  assert.deepEqual(units.shown.map((u) => u.key), ["mcp-tokens", "package-hijack", "chat-injection"], "a headline, then notable items newest first");
  assert.deepEqual(units.briefs.map((u) => u.key), ["evals-post"]);
  assert.equal(units.briefCount, 1);
  // A story of briefs only folds with the briefs.
  const quiet = sectionUnits([MIXED.find((f) => f.id === "claude-hooks")!, MIXED.find((f) => f.id === "nist-guidance")!]);
  assert.deepEqual([quiet.shown.map((u) => u.key), quiet.briefs.map((u) => u.key)], [["nist-guidance"], [`story-${ROLL_UP}`]]);
});

test("the weeks group by date: an item filed late is in Latest and in the week it came to light, anchored once, on Latest", () => {
  const html = feedPage("", { open: ["2026-11-23", "2026-11-09"] });
  assert.equal([...html.matchAll(/id="artex-wiz"/g)].length, 1);
  assert.ok(sectionOf(html, "latest").includes('id="artex-wiz"'));
  assert.ok(sectionOf(html, "week-2026-11-23").includes('id="artex-ncsc"'), "an item filed on an older day is anchored in its week");
  // The late find: listed in Latest and in the week of 9 November, not in this week.
  assert.ok(listed(sectionOf(html, "latest")).includes("mcp-follow-up"));
  assert.deepEqual(listed(sectionOf(html, "week-2026-11-09")), ["mcp-follow-up"], "the week of its date (the brief folded)");
  assert.ok(!listed(sectionOf(html, "week-2026-11-23")).includes("mcp-follow-up"), "not the week it was filed in");
  assert.equal([...html.matchAll(/id="mcp-follow-up"/g)].length, 1);
  assert.ok(sectionOf(html, "latest").includes('id="mcp-follow-up"'));
  // A link to an item opens its week (Latest is open already), and its section's briefs when it is one.
  const at = (id: string) => landing(MIXED.find((f) => f.id === id), TODAY);
  assert.deepEqual(at("artex-wiz"), { week: null, briefs: null });
  assert.deepEqual(at("mcp-follow-up"), { week: null, briefs: null }, "filed today: it is on Latest");
  assert.deepEqual(at("skills-scanner"), { week: null, briefs: "latest" });
  assert.deepEqual(at("artex-ncsc"), { week: "2026-11-23", briefs: null });
  assert.deepEqual(at("open-gateway"), { week: "2026-11-09", briefs: "2026-11-09" });
  assert.deepEqual(landing(undefined, TODAY), { week: null, briefs: null });
});

test("each item shows its kind, weight, date, title, summary, why it matters, tags, Read more and the other sources", () => {
  const html = feedPage("", { open: ["2026-11-16", "2026-11-23"], briefsOpen: ["latest"] });
  const row = rowOf(html, "chat-injection");
  assert.match(row, /data-kind="incident"[^>]*>[\s\S]*?Incident<\/span><span data-weight="notable"[^>]*>Notable<\/span><time dateTime="2026-11-16"[^>]*>16 Nov<\/time>/);
  const chip = row.match(/<a [^>]*data-incident-pattern="promptInjection"[^>]*>(?:<span[^>]*><\/span>)([^<]+)<\/a>/);
  assert.ok(chip && chip[0].includes(`href="${incidentPatternHref("promptInjection")}"`), "a link to the incident pattern");
  assert.equal(chip![1], nameOf("promptInjection"));
  assert.match(row, />Demonstrated</);
  assert.ok(row.includes(esc(item().title)) && row.includes(item().summary));
  assert.match(row, /Replays on/);
  for (const id of [MCP, CHAT]) assert.ok(row.includes(`href="${patternHref(id, { tab: "incidents" })}"`), `links ${id}`);
  assert.match(row, /<a href="https:\/\/example.org\/notice"[^>]*data-read-more[^>]*>Read more →<\/a><span[^>]*>Example, 7 Nov 2026<\/span>/);
  assert.doesNotMatch(row, /data-why/, "an incident with no why says none");
  // A headline is marked, notable and brief quietly.
  assert.match(rowOf(html, "artex-wiz"), /<span data-weight="headline"[^>]*class="[^"]*uppercase[^"]*text-introduced[^"]*">Headline<\/span>/);
  assert.match(rowOf(html, "skills-scanner"), /<span data-weight="brief"[^>]*class="[^"]*text-ink-3[^"]*">Brief<\/span>/);
  assert.match(rowOf(html, "mcp-tokens"), new RegExp(`href="/incidents/${MITTWALD}"[^>]*>Deep dive →`));

  const update = rowOf(html, "claude-tracing");
  assert.match(update, /data-kind="productUpdate"/);
  assert.match(update, /<span class="font-semibold">Why it matters: <\/span>An agent&#x27;s own traces can no longer be redirected/);
  assert.match(update, /data-vendor="true">Anthropic</);
  assert.ok(update.includes(`href="${toolHref(CLAUDE_CODE)}"`) && update.includes(`>${toolById.get(CLAUDE_CODE)!.name}<`), "the product");
  assert.ok(update.includes(`href="${controlHref(TRACING)}"`) && update.includes(`>${controlName(TRACING)}<`), "the control");
  assert.ok(update.includes(`href="${patternHref(CODING)}"`), "a pattern it touches");
  assert.doesNotMatch(update, /data-incident-pattern|Replays on|In the wild/);
  const tool = rowOf(html, "skills-scanner");
  assert.match(tool, /href="https:\/\/example.org\/aig"[^>]*>Read more →<\/a><span[^>]*>Tencent, 26 Nov 2026/);
  assert.match(tool, /data-other-sources="true">Also: <span><a href="https:\/\/example.org\/press"[^>]*>Press, 27 Nov 2026 ↗/);
  assert.match(rowOf(html, "nist-guidance"), /data-kind="guidance"[^>]*>[\s\S]*?Guidance<\/span>/);
});

test("the kind chips apply to every section: the counts, Latest's items and each week follow them", () => {
  const html = feedPage();
  const kinds = html.slice(html.indexOf('aria-label="Kind"'), html.indexOf("</div>", html.indexOf('aria-label="Kind"')));
  assert.match(kinds, /aria-pressed="true"[^>]*>All <span[^>]*>16</);
  const chips = [...kinds.matchAll(/data-kind-chip="([^"]+)"[^>]*>([^<]+) <span[^>]*>(\d+)</g)].map((m) => [m[1], m[2], Number(m[3])]);
  assert.deepEqual(chips, [["incident", "Incidents", 10], ["productUpdate", "Product updates", 2], ["tool", "Tools", 1], ["launch", "Launches", 1], ["guidance", "Guidance", 1], ["research", "Research", 1]]);
  assert.ok(html.indexOf("data-kind-filters") < html.indexOf('data-section="latest"'), "the chips are at the top, above every section");

  const updates = feedPage("kind=productUpdate", { open: ["2026-11-16"] });
  assert.match(updates, /data-kind-chip="productUpdate"[^>]*aria-pressed="true"/);
  assert.deepEqual(sections(updates).map((s) => [s.key, s.count]), [["latest", 2], ["week-2026-11-23", 2], ["week-2026-11-16", 0], ["week-2026-11-09", 0], ["week-2026-11-02", 0], ["week-2026-10-26", 0]]);
  assert.deepEqual(listed(sectionOf(updates, "latest")), ["claude-tracing", "claude-hooks"]);
  assert.doesNotMatch(sectionOf(updates, "week-2026-11-16"), /data-expander|data-section-items/, "an empty week has nothing to open");
  // Overviews stay: they are the section's, not the kind's.
  assert.ok(sectionOf(updates, "week-2026-11-16").includes(esc(OVERVIEWS.weeks[1].overview)));

  const guidance = feedPage("kind=guidance", { open: ["2026-11-23"] });
  assert.match(sectionOf(guidance, "latest"), /No guidance filed on 26 November 2026\./);
  assert.deepEqual(listed(sectionOf(guidance, "week-2026-11-23")), ["nist-guidance"]);
  const incidents = feedPage("kind=incident", { open: ["2026-11-16"], briefsOpen: ["2026-11-16"] });
  assert.deepEqual(listed(sectionOf(incidents, "week-2026-11-16")), ["mcp-tokens", "package-hijack", "chat-injection"]);
  assert.deepEqual(sections(incidents).map((s) => s.count), [2, 2, 3, 2, 1, 2]);
  assert.match(incidents, /data-incident-filters-elsewhere="true">To narrow incidents by incident pattern, pattern or evidence, use <a [^>]*href="\/incidents#reports"/);
  // An unknown kind is ignored rather than emptying the page.
  assert.deepEqual(sections(feedPage("kind=news")).map((s) => s.count), [5, 7, 4, 2, 1, 2]);
});

test("the feed page has no incident pattern, pattern or evidence filter; an old address with one goes to the Incidents page's report list", () => {
  const html = feedPage();
  assert.doesNotMatch(html, /aria-label="Incident pattern"|<select|data-incident-filters="|Any evidence|All patterns/);
  const q = (s: string) => new URLSearchParams(s);
  assert.equal(legacyFeedTarget(q("category=identity&pattern=archChatAgent&evidence=exploited")), "/incidents?category=identity&pattern=archChatAgent&evidence=exploited#reports");
  assert.equal(legacyFeedTarget(q(`incident=${MITTWALD}`)), `/incidents?incident=${MITTWALD}#reports`);
  assert.equal(legacyFeedTarget(q("kind=incident&evidence=reported")), "/incidents?evidence=reported#reports");
  // With an item in view it stays on the feed, at the item.
  assert.equal(legacyFeedTarget(q("category=identity"), "#mcp-tokens"), "/feed#mcp-tokens");
  assert.equal(legacyFeedTarget(q("kind=tool")), null, "the kind is the feed's own filter");
  assert.equal(legacyFeedTarget(q("")), null);
  assert.match(feedPage("category=identity"), /The incident filters are on the Incidents page now\. Taking you there…/);
  assert.equal(incidentReportsHref({ category: "identity", evidence: "exploited" }), "/incidents?category=identity&evidence=exploited#reports");
  assert.equal(incidentReportsHref(), "/incidents#reports");
});

test("the feed says so when it is empty", () => {
  const empty = feedPage("", { items: [], overviews: undefined });
  assert.match(empty, /Nothing in the feed yet\./);
  assert.match(empty, /<span>0 items<\/span>/);
  assert.doesNotMatch(empty, /data-section=|data-kind-filters/);
});

test("the page is built with its newest days, knows every week from the index, and loads a week's month when it is opened", () => {
  const index = feedIndexOf(MIXED, OVERVIEWS);
  assert.equal(initialWindow(MIXED).from, "2026-11-20", "seven days back from the newest date: the whole of the newest week");
  // The feed page also takes every item filed in its newest seven days, the late find among them, whatever its date.
  const { from, addedFrom, items } = feedWindow(MIXED);
  assert.deepEqual([from, addedFrom], ["2026-11-20", "2026-11-20"]);
  assert.ok(from <= weekOf(index.latest));
  assert.deepEqual(ids(items), [...ids(MIXED.filter((f) => f.date >= "2026-11-20")), "mcp-follow-up"]);
  assert.deepEqual(coverage(index, from, new Set()), { from: "2026-11-20", next: "2026-11" });
  assert.deepEqual(coverage(index, from, new Set(["2026-11"])), { from: "2026-11-01", next: "2026-10" });
  assert.deepEqual(coverage(index, from, new Set(["2026-11", "2026-10"])), { from: "", next: null });
  assert.deepEqual(coverage(index, "2026-11-01", new Set()), { from: "2026-11-01", next: "2026-10" }, "a window that starts on the first needs nothing more of its month");
  assert.deepEqual(coverage(index, "", new Set()), { from: "", next: null }, "an empty feed is whole");
  // As built: every week's heading, count and overview, though only the newest days are loaded.
  const built = render("/feed", "", <IncidentFeed initial={items} from={from} addedFrom={addedFrom} index={index} today={TODAY} />);
  assert.deepEqual(sections(built).map((s) => [s.key, s.count]), sections(feedPage()).map((s) => [s.key, s.count]));
  assert.deepEqual(listed(sectionOf(built, "latest")), listed(sectionOf(feedPage(), "latest")), "Latest is whole as built, the late find in it");
  assert.ok(sectionOf(built, "week-2026-11-16").includes(esc(OVERVIEWS.weeks[1].overview)));
  // The week of the late find is not whole as built: opened, it waits for its month rather than show one item.
  const partial = render("/feed", "", <IncidentFeed initial={items} from={from} addedFrom={addedFrom} index={index} today={TODAY} open={["2026-11-09"]} loadMonth={() => new Promise(() => {})} />);
  assert.doesNotMatch(sectionOf(partial, "week-2026-11-09"), /data-item=/);
  assert.match(sectionOf(partial, "week-2026-11-09"), /Loading Nov 2026…/);
  // An older week opened before its month is in waits for it.
  const waiting = render("/feed", "", <IncidentFeed initial={items} from={from} index={index} today={TODAY} open={["2026-10-26"]} loadMonth={() => new Promise(() => {})} />);
  assert.match(sectionOf(waiting, "week-2026-10-26"), /data-feed-more="2026-11"[^>]*><span aria-live="polite">Loading Nov 2026…<\/span>/);
  assert.match(sectionOf(waiting, "week-2026-11-23"), /data-expander/, "the newest week needs nothing loaded");
});

test("the feed counts and marks what is new since the reader's last visit, in the header and in each section", () => {
  const before = visitOf(MIXED.filter((f) => !["artex-wiz", "chat-injection"].includes(f.id)), Date.UTC(2026, 10, 25, 9));
  const html = feedPage("", { lastVisit: before, open: ["2026-11-16"] });
  assert.match(html, /data-feed-new="2"[^>]*>2 new since your last visit<span[^>]*> \(25 Nov 2026\)/);
  const marked = listed(html).filter((id) => rowOf(html, id).includes("data-new"));
  assert.deepEqual(marked, ["artex-wiz", "chat-injection"]);
  assert.match(sectionOf(html, "latest"), /data-section-new="1"> · 1 new</);
  assert.match(sectionOf(html, "week-2026-11-16"), /data-section-new="1"> · 1 new</);
  // New goes by when the run filed it: a visit on the 25th, before the run filed the late find on the 26th, makes it new.
  const visitedBeforeTheRun = visitOf(MIXED.filter((f) => f.added <= "2026-11-25"), Date.UTC(2026, 10, 25, 9));
  assert.deepEqual([...newSince(MIXED, visitedBeforeTheRun)].sort(), ["artex-wiz", "claude-hooks", "claude-tracing", "mcp-follow-up", "skills-scanner"]);
  assert.match(feedPage("", { lastVisit: visitedBeforeTheRun }), /data-feed-new="5"/);
  assert.match(feedPage("", { lastVisit: visitOf(MIXED, Date.UTC(2026, 10, 27)) }), />Nothing new since your last visit</);
  assert.doesNotMatch(feedPage("", { lastVisit: null }), /since your last visit|data-new/);
  assert.doesNotMatch(feedPage(), /since your last visit|data-new/, "without storage, the page marks nothing");
});

test("a visit is remembered by the items it saw, filed since a day, and a reload within the hour is the same visit", () => {
  const visit = visitOf(FIXTURE, 1_000);
  assert.deepEqual(visit.seen, ids(FIXTURE));
  assert.equal(visit.from, "2026-09-27", "sixty days before the newest filing day");
  // What was in hand is what was filed from `loadedFrom` on; anything filed earlier is never new next time.
  const partial = visitOf(FIXTURE.filter((f) => f.added >= "2026-11-14"), 1_000, "2026-11-14");
  assert.equal(partial.from, "2026-11-14");
  assert.deepEqual([...newSince(FIXTURE, partial)], [], "the items filed earlier were not in hand, so they are not new");
  // Filed after the visit, it is new whatever its date; filed before what the visit remembered, it never is.
  const late = { ...FIXTURE[0], id: "late-find", date: "2026-08-01", added: "2026-11-27" };
  const ancient = { ...FIXTURE[0], id: "ancient", date: "2026-11-26", added: "2026-08-01" };
  assert.deepEqual([...newSince([late, ancient, ...FIXTURE], visit)], ["late-find"]);
  assert.deepEqual([...newSince(FIXTURE, null)], []);
  const earlier = visitOf(FIXTURE.slice(1), 0);
  assert.equal(previousVisit(null, 5), null);
  assert.equal(previousVisit({ last: visit, before: earlier }, 1_000 + VISIT_MS + 1), visit, "after an hour, the last visit");
  assert.equal(previousVisit({ last: visit, before: earlier }, 1_000 + 60_000), earlier, "within the hour, the one before");
});

// --- What is not public ------------------------------------------------------------------------------

/** What would show if review material reached a reader. */
const REVIEW = /Proposed site updates|Site update|decisions\.yaml|data-proposed|data-approve-line|data-decision|data-site-update|decision: approve|To approve/;

test("no page and no RSS item shows a site update, a proposal or an approve line, even given items that still carry them", () => {
  // The loader's items, update and decision and all: the page renders none of it.
  const html = render("/feed", "", <IncidentFeed items={LOADED} today={TODAY} open={["2026-11-23", "2026-11-16"]} briefsOpen={["latest", "2026-11-23", "2026-11-16"]} />);
  assert.ok(listed(html).includes("skills-scanner"));
  assert.doesNotMatch(html, REVIEW);
  for (const f of LOADED) if (f.update) assert.ok(!html.includes(esc(f.update.note)), `${f.id}: its update note`);
  const xml = feedRss(LOADED, "https://example.org");
  assert.doesNotMatch(xml, /Site update|proposed|decisions\.yaml|approve/);
  for (const f of LOADED) if (f.update) assert.ok(!xml.includes(f.update.note), `${f.id}: its update note in feed.xml`);
  // And what the build writes never carries them.
  assert.ok(MIXED.every((f) => !("update" in f) && !("decision" in f)));
  assert.ok(feedItems.every((f) => !("update" in f) && !("decision" in f)), "the shipped feed carries no update");
});

test("the review queue prints the waiting proposals and watch items, by action, with the line that approves each", () => {
  const root = mkdtempSync(join(tmpdir(), "queue-"));
  try {
    const dir = join(root, "data", "feed");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "2026-11.yaml"),
      [
        "items:",
        "  - { id: onboard-x, date: 2026-11-24, title: X launches, update: { action: onboard, status: proposed, target: toolX, note: Onboard X. } }",
        "  - { id: onboard-y, date: 2026-11-25, title: Y launches, update: { action: onboard, status: watch, target: toolY, note: Recheck after 8 December. } }",
        "  - { id: new-control, date: 2026-11-20, title: A control, update: { action: newControl, status: proposed, target: cap-new, note: Add a control. } }",
        "  - { id: done, date: 2026-11-21, title: Done, update: { action: settings, status: applied, target: data/x.yaml, note: Applied. } }",
        "  - { id: plain, date: 2026-11-22, title: Plain }",
        "",
      ].join("\n"),
    );
    writeFileSync(join(dir, DECISIONS_FILE), "- { id: new-control, decision: approve, note: Go. }\n");
    const out = execFileSync(process.execPath, [join(process.cwd(), "scripts", "review-queue.mjs"), root], { encoding: "utf8" });
    assert.match(out, /^Review queue: 2 proposals waiting, 1 to watch \(newest item 2026-11-25\)/);
    assert.ok(out.indexOf("Onboard a product (2)") < out.indexOf("New control (1)"), "grouped, in the order of the actions");
    assert.match(out, /proposed  2026-11-24  onboard-x\n {12}X launches\n {12}target: {2}toolX\n {12}note: {4}Onboard X\.\n {12}approve: - \{ id: onboard-x, decision: approve \}/);
    assert.match(out, /watch {5}2026-11-25  onboard-y[\s\S]*?note: {4}Recheck after 8 December\./);
    assert.ok(out.indexOf("onboard-x") < out.indexOf("onboard-y"), "the proposals before what is watched");
    assert.match(out, /new-control[\s\S]*?decided: approved \(Go\.\); the next daily run carries it out/);
    assert.doesNotMatch(out, /\bdone\b|plain/, "applied and plain items are not waiting");
    assert.equal(JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")).scripts.queue, "node scripts/review-queue.mjs", "npm run queue");
    const none = mkdtempSync(join(tmpdir(), "queue-"));
    assert.match(execFileSync(process.execPath, [join(process.cwd(), "scripts", "review-queue.mjs"), none], { encoding: "utf8" }), /^Nothing waiting/);
    rmSync(none, { recursive: true, force: true });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- The other pages that show the feed -------------------------------------------------------------

test("the home page lists the latest feed's headline and notable items first, then the newest by date, then briefs, twelve at most", () => {
  const top = homeHeadlines(MIXED);
  assert.equal(top.length, 12);
  assert.deepEqual(ids(top), [
    // Filed on the newest day (26 November), the late find among them, newest by date first.
    "artex-wiz", "claude-tracing", "mcp-follow-up",
    // Then the other headline and notable items, newest by date first.
    "artex-ncsc", "nist-guidance", "mcp-tokens", "package-hijack", "chat-injection", "agent-intrusion", "sandbox-escape", "oldest-mcp",
    // Then the briefs, the newest day's first.
    "claude-hooks",
  ]);
  assert.deepEqual(ids(homeHeadlines(MIXED, 3)), ["artex-wiz", "claude-tracing", "mcp-follow-up"]);
  // Without the late find's filing day it falls back to its date.
  assert.deepEqual(ids(homeHeadlines(MIXED.map((f) => (f.id === "mcp-follow-up" ? { ...f, added: f.date } : f)))).indexOf("mcp-follow-up"), 7);
  assert.deepEqual(homeHeadlines([]), []);
});

test("a pattern's Incidents tab lists its five newest incidents, then all of them on the Incidents page", () => {
  const arch = archetypeById.get(MCP)!;
  const html = render(`/patterns/${arch.slug}`, "tab=incidents", <PatternIncidents archetype={arch} feed={MIXED} />);
  const mine = feedForPattern(MCP, MIXED);
  assert.equal(mine.length, 6, "incidents only: the tool on the same pattern is not one");
  assert.match(html, /In the feed/);
  const linked = [...html.matchAll(/href="\/feed#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(linked, ids(mine.slice(0, FEED_ON_PATTERN)));
  assert.ok(html.includes(`href="${incidentReportsHref({ pattern: MCP })}"`) && html.includes("All 6 incident reports →"));
  assert.equal(incidentReportsHref({ pattern: MCP }), "/incidents?pattern=archRemoteMcpServer#reports");
  const built = render(`/patterns/${arch.slug}`, "tab=incidents", <PatternIncidents archetype={arch} feed={mine.slice(0, FEED_ON_PATTERN)} total={mine.length} />);
  assert.ok(built.includes("All 6 incident reports →"));
  const quiet = archetypeById.get("archTrainingPipeline")!;
  assert.doesNotMatch(render("/patterns/x", "", <PatternIncidents archetype={quiet} feed={FIXTURE} />), /In the feed/);
});

test("a deep dive links to the feed items that point to it: one on the feed, several on the Incidents page", () => {
  const many = render(`/incidents/${MITTWALD}`, "", <IncidentWalkthrough id={MITTWALD} feed={FIXTURE} />);
  assert.equal(feedForIncident(MITTWALD, FIXTURE).length, 2);
  assert.match(many, new RegExp(`In the feed: <a [^>]*href="/incidents\\?incident=${MITTWALD}#reports">2 reports</a>`));
  const one = render(`/incidents/${LITELLM}`, "", <IncidentWalkthrough id={LITELLM} feed={FIXTURE} />);
  assert.match(one, /In the feed: <a [^>]*href="\/feed#sandbox-escape">1 report<\/a>/);
  const none = render("/incidents/x", "", <IncidentWalkthrough id="mckinsey-lilli" feed={FIXTURE} />);
  assert.doesNotMatch(none, /In the feed/);
});

test("site search finds a feed item by its title, from the compact index of titles, and lands on it in the feed", () => {
  const titles = feedTitles(MIXED);
  assert.deepEqual(Object.keys(titles.find((t) => t.id === "claude-tracing")!), ["id", "kind", "date", "title"], "no more than search needs");
  assert.deepEqual(Object.keys(titles.find((t) => t.id === "mcp-tokens")!), ["id", "kind", "date", "title", "category"]);
  const entries = buildIndex(titles).filter((e) => e.kind === "Daily feed");
  assert.equal(entries.length, MIXED.length);
  const first = entries.find((e) => e.href === "/feed#mcp-tokens")!;
  assert.equal(first.title, item().title);
  assert.match(first.hint!, new RegExp(`^${incidentPatternById.get("identity")!.name} · 20 Nov 2026`));
  assert.equal(entries.find((e) => e.href === "/feed#skills-scanner")!.hint, "Tool · 26 Nov 2026");
  assert.equal(entries.find((e) => e.href === "/feed#nist-guidance")!.hint, "Guidance · 24 Nov 2026");
  assert.equal(buildIndex([]).filter((e) => e.kind === "Daily feed").length, 0, "until the titles arrive, search finds the rest");
});

test("a page that shows a few items reads the same given only those as given the whole feed", () => {
  const today = "2026-11-25";
  const whole = render("/incidents", "", <IncidentPatternsIndex feed={MIXED} today={today} />);
  const built = render("/incidents", "", <IncidentPatternsIndex cards={incidentPatternCards(MIXED, today)} total={MIXED.length} today={today} />);
  const fromFeed = (html: string) => [...html.matchAll(/data-card-counts="true">([^<]+)<|data-card-latest="([^"]+)"[\s\S]*?<\/time>/g)].map((m) => m[0]);
  assert.ok(fromFeed(whole).length >= dataset.incidentPatterns.length);
  assert.deepEqual(fromFeed(built), fromFeed(whole), "/incidents/: counts and the newest title per card");
  assert.deepEqual(incidentPatternCards(MIXED, today).identity, { recent: 3, latest: { id: "mcp-tokens", date: "2026-11-20", title: item().title } });
  for (const p of dataset.incidentPatterns) {
    const reports = feedForCategory(p.id, MIXED);
    const asBuilt = render(`/incidents/${p.slug}`, "", <IncidentPatternPage id={p.id} reports={reports.slice(0, FEED_ON_INCIDENT_PATTERN)} />);
    assert.equal((asBuilt.match(/data-feed-item=/g) ?? []).length, Math.min(reports.length, FEED_ON_INCIDENT_PATTERN), p.id);
  }
  const arch = archetypeById.get(MCP)!;
  const mine = feedForPattern(MCP, MIXED);
  assert.equal(
    render("/p", "", <PatternIncidents archetype={arch} feed={mine.slice(0, FEED_ON_PATTERN)} total={mine.length} />),
    render("/p", "", <PatternIncidents archetype={arch} feed={MIXED} />),
  );
  assert.equal(feedHref({ kind: "tool" }, "x"), "/feed?kind=tool#x");
});

test("the shipped feed is newest first, weighed, and stays out of the dataset every page loads", () => {
  assert.ok(!("feed" in dataset), "dataset.json carries no feed");
  const dates = feedItems.map((f) => f.date);
  assert.deepEqual(dates, [...dates].sort().reverse(), "the shipped feed is newest first");
  for (const f of feedItems) {
    assert.ok(FEED_KINDS.some((k) => k.id === f.kind), `${f.id} has a kind`);
    assert.ok(["headline", "notable", "brief"].includes(f.weight), `${f.id} has a weight`);
  }
  assert.equal(dataset.meta.counts.feed, feedItems.length);
  for (const p of dataset.incidentPatterns) assert.equal(p.feedCount, feedForCategory(p.id, feedItems).length, p.id);
  assert.deepEqual(latestDay(MIXED).day, TODAY);
});
