import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { checkDecisions, checkFeed, DECISIONS_FILE, FEED_LIMITS, loadFeed, type FeedContext } from "./lib/feed";
import { coverage, IncidentFeed } from "../src/components/incidents/IncidentFeed";
import { IncidentWalkthrough } from "../src/components/incidents/IncidentWalkthrough";
import { newSince, previousVisit, visitOf, VISIT_MS } from "../src/components/incidents/last-visit";
import { byWeek, weekOf } from "../src/components/incidents/model";
import { FEED_ON_PATTERN, PatternIncidents } from "../src/components/patterns/PatternPanels";
import { buildIndex } from "../src/components/shell/SearchPalette";
import { archetypeById, controlName, dataset, incidentPatternById, toolById } from "../src/lib/data";
import { FEED_ON_INCIDENT_PATTERN, feedForCategory, feedForIncident, feedForPattern, feedIndexOf, feedTitles, incidentPatternCards, initialWindow, latestDay } from "../src/lib/feed";
import { IncidentPatternPage } from "../src/components/incidents/IncidentPatternPage";
import { IncidentPatternsIndex } from "../src/components/incidents/IncidentPatternsIndex";
import { feedItems } from "../src/lib/feed-server";
import { FEED_KINDS } from "../src/lib/feed-vocabulary";
import { controlHref, feedHref, incidentPatternHref, patternHref, toolHref } from "../src/lib/routes";
import type { FeedItem } from "../src/lib/types";

/*
 * The feed's data is written elsewhere and may not exist yet, so every fixture lives here and
 * the shipped pages are checked against it. Nothing in this file writes to data/feed/.
 */

const ctx: FeedContext = {
  patternIds: new Set(dataset.archetypes.map((a) => a.id)),
  incidentIds: new Set(dataset.incidents.map((i) => i.id)),
  categoryIds: new Set(dataset.incidentPatterns.map((p) => p.id)),
  productIds: new Set(dataset.tools.map((t) => t.id)),
  controlIds: new Set(dataset.mitigations.map((m) => m.id)),
  exists: (path) => path === "data/tooling/anthropic/claude-code.yaml",
};
/** An incident pattern's name, as the page writes it. */
const nameOf = (id: string) => incidentPatternById.get(id)!.name.replace(/&/g, "&amp;");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

const MCP = "archRemoteMcpServer";
const CHAT = "archChatAgent";
const CODING = "archCodingAgentThirdParty";
const MITTWALD = "mittwald-mcp-server";
const LITELLM = "litellm-release-hijack";
const CLAUDE_CODE = "toolClaudeCode";
const TRACING = "cap-agent-tracing";

/** A valid incident, written as the old files are (no kind); each test breaks one field of it. */
const item = (over: Record<string, unknown> = {}) => ({
  id: "test-item",
  date: "2026-11-07",
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
  date: "2026-11-07",
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

test("an item written before kinds existed is an incident, and every kind is one of the five", () => {
  const [old] = checkFeed([{ file: "2026-11.yaml", doc: { items: [item()] } }], ctx).feed;
  assert.equal(old.kind, "incident");
  assert.equal(old.category, "identity");
  assert.deepEqual(FEED_KINDS.map((k) => k.id), ["incident", "productUpdate", "tool", "launch", "research"]);
  for (const kind of ["productUpdate", "tool", "launch", "research"]) assert.deepEqual(problemsOf([news({ kind })]), [], kind);
  assert.deepEqual(problemsOf([item({ kind: "incident", why: "Session tokens reached an outsider." })]), [], "an incident may say why too");
  rejects({ kind: "news" }, /kind "news" is not one of incident, productUpdate, tool, launch, research/);
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
  rejects({ why: "x".repeat(FEED_LIMITS.why + 1) }, /why is 201 characters; at most 200/, news);
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

test("an update says what changes, where it stands and on what, and an applied one points at something real", () => {
  const update = (over: Record<string, unknown> = {}) => ({ update: { action: "settings", status: "applied", target: "data/tooling/anthropic/claude-code.yaml", note: "Adds the tracing endpoint setting.", ...over } });
  assert.deepEqual(problemsOf([news(update())]), []);
  assert.deepEqual(problemsOf([news(update({ action: "onboard", status: "proposed", target: "toolNotYetHere" }))]), [], "a proposed onboard names what is not there yet");
  assert.deepEqual(problemsOf([news(update({ action: "controlGuidance", status: "applied", target: TRACING }))]), []);
  rejects(update({ action: "rewrite" }), /update: action "rewrite" is not one of settings, toolOption, onboard, newControl, newPattern, controlGuidance/, news);
  rejects(update({ status: "done" }), /update: status "done" is not one of applied, proposed, declined/, news);
  rejects(update({ target: "" }), /update needs a target/, news);
  rejects(update({ note: undefined }), /update needs a note/, news);
  rejects(update({ note: "x".repeat(FEED_LIMITS.updateNote + 1) }), /update: note is 201 characters; at most 200/, news);
  rejects(update({ owner: "me" }), /update: unknown field\(s\) owner/, news);
  rejects(update({ target: "data/tooling/nobody/nothing.yaml" }), /update: applied, but its target data\/tooling\/nobody\/nothing.yaml does not exist/, news);
  rejects(update({ action: "newControl", target: "cap-nope" }), /update: applied, but its target "cap-nope" is not a control in the catalogue/, news);
  rejects({ update: "soon" }, /update must be a mapping/, news);
  const [kept] = checkFeed([{ file: "2026-11.yaml", doc: { items: [news(update({ status: "proposed" }))] } }], ctx).feed;
  assert.deepEqual(kept.update, { action: "settings", status: "proposed", target: "data/tooling/anthropic/claude-code.yaml", note: "Adds the tracing endpoint setting." });
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

test("the loader holds the title and the summary to their lengths, and to the site's words", () => {
  rejects({ title: "x".repeat(FEED_LIMITS.title + 1) }, /title is 121 characters; at most 120/);
  rejects({ summary: "x".repeat(FEED_LIMITS.summary + 1) }, /summary is 421 characters; at most 420/);
  assert.deepEqual(problemsOf([item({ title: "x".repeat(FEED_LIMITS.title), summary: "x".repeat(FEED_LIMITS.summary) })]), []);
  rejects({ title: "" }, /needs a title/);
  rejects({ summary: undefined }, /needs a summary/);
  rejects({ title: "A flaw in the coding archetype" }, /title says "archetype"/);
  rejects({ summary: "It would replay on two Archetypes." }, /summary says "archetype"/);
  rejects({ severity: "high" }, /unknown field\(s\) severity/);
});

test("no feed files at all is an empty feed; the build reads only YAML, and decisions.yaml is not a month", async () => {
  const root = mkdtempSync(join(tmpdir(), "feed-"));
  try {
    const fails: string[] = [];
    assert.deepEqual((await loadFeed(root, ctx, (m) => fails.push(m))).feed, [], "no data/feed folder");
    mkdirSync(join(root, "data", "feed"), { recursive: true });
    writeFileSync(join(root, "data", "feed", "README.md"), "# The feed\n");
    assert.deepEqual((await loadFeed(root, ctx, (m) => fails.push(m))).feed, [], "only a README");
    writeFileSync(join(root, "data", "feed", DECISIONS_FILE), "# The owner's answers\n");
    assert.deepEqual((await loadFeed(root, ctx, (m) => fails.push(m))).feed, [], "an empty decisions file");
    assert.equal(fails.length, 0, fails.join("\n"));
    writeFileSync(
      join(root, "data", "feed", "2026-11.yaml"),
      "items:\n  - id: proposes\n    kind: launch\n    date: 2026-11-20\n    title: A launch\n    summary: It launched.\n    why: Data goes somewhere new.\n    patterns: []\n" +
        "    update: { action: newPattern, status: proposed, target: archNew, note: A new pattern. }\n    sources: [{ title: Post, url: 'https://example.org/p', publisher: Example }]\n",
    );
    writeFileSync(join(root, "data", "feed", DECISIONS_FILE), "- id: proposes\n  decision: approve\n  note: Yes.\n");
    const loaded = await loadFeed(root, ctx, (m) => fails.push(m));
    assert.equal(fails.length, 0, fails.join("\n"));
    assert.deepEqual(loaded.feed[0].decision, { decision: "approve", note: "Yes." }, "the decision is joined to its item");
    writeFileSync(join(root, "data", "feed", "2026-10.yaml"), "items:\n  - id: broken\n    date: 2026-11-01\n");
    await loadFeed(root, ctx, (m) => fails.push(m));
    assert.ok(fails.some((f) => f.startsWith("feed/2026-10.yaml item broken: date 2026-11-01 is outside 2026-10")), fails.join("\n"));
    assert.ok(!fails.some((f) => f.startsWith("feed/decisions.yaml: name the file")), "decisions.yaml is not read as a month");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- The pages, read with a fixture feed --------------------------------------------------------

/** Eight incidents over four weeks; checked by the loader like any feed file. */
const FIXTURE: FeedItem[] = (() => {
  const nov = [
    item({ id: "mcp-tokens", date: "2026-11-20", category: "identity", evidence: "exploited", patterns: [MCP], incident: MITTWALD }),
    item({ id: "package-hijack", date: "2026-11-17", category: "supplyChain", evidence: "confirmed", patterns: ["archActionAgent"] }),
    item({ id: "chat-injection", date: "2026-11-16", category: "promptInjection", evidence: "demonstrated", patterns: [MCP, CHAT] }),
    item({ id: "open-gateway", date: "2026-11-15", category: "exposed", evidence: "reported", patterns: [] }),
    item({ id: "mcp-follow-up", date: "2026-11-09", category: "identity", evidence: "confirmed", patterns: [MCP], incident: MITTWALD }),
    item({ id: "agent-intrusion", date: "2026-11-02", category: "aiAttacker", evidence: "exploited", patterns: [MCP] }),
  ];
  const oct = [
    item({ id: "sandbox-escape", date: "2026-10-30", category: "breakout", evidence: "demonstrated", patterns: [MCP], incident: LITELLM }),
    item({ id: "oldest-mcp", date: "2026-10-27", category: "identity", evidence: "confirmed", patterns: [MCP] }),
  ];
  const { feed, problems } = checkFeed([{ file: "2026-11.yaml", doc: { items: nov } }, { file: "2026-10.yaml", doc: { items: oct } }], ctx);
  assert.deepEqual(problems, [], "the fixture is a valid feed");
  return feed;
})();

/** The incidents, and an item of each other kind: two on the newest day, two with an update waiting for the owner. */
const MIXED: FeedItem[] = (() => {
  const others = [
    news({ id: "claude-tracing", date: "2026-11-21", update: { action: "settings", status: "applied", target: "data/tooling/anthropic/claude-code.yaml", note: "Adds the tracing endpoint setting to Claude Code." } }),
    news({
      id: "skills-scanner",
      kind: "tool",
      date: "2026-11-21",
      title: "Tencent ships a scanner for MCP servers and agent skills",
      vendor: "Tencent",
      products: undefined,
      controls: ["cap-mcp-tool-integrity"],
      patterns: [MCP],
      update: { action: "toolOption", status: "proposed", target: "tencent-ai-infra-guard", note: "List AI-Infra-Guard under Tool and MCP Server Integrity." },
      sources: [
        { title: "AI-Infra-Guard", url: "https://example.org/aig", publisher: "Tencent", date: "2026-11-21" },
        { title: "Coverage", url: "https://example.org/press", publisher: "Press", date: "2026-11-22" },
      ],
    }),
    news({ id: "private-inference", kind: "launch", date: "2026-11-18", title: "xAI offers private inference", vendor: "xAI", products: undefined, controls: undefined, patterns: [], update: { action: "onboard", status: "proposed", target: "toolXaiPrivate", note: "Onboard xAI private inference on the model API pattern." } }),
    news({ id: "evals-post", kind: "research", date: "2026-11-10", title: "How a lab runs security evaluations", vendor: "Anthropic", products: undefined, patterns: [], update: { action: "controlGuidance", status: "declined", target: TRACING, note: "No change to the tracing guidance." } }),
  ];
  const { feed, problems } = checkFeed([{ file: "2026-11.yaml", doc: { items: [...others] } }], ctx);
  assert.deepEqual(problems, [], "the mixed fixture is a valid feed");
  const decided = feed.map((f) => (f.id === "skills-scanner" ? { ...f, decision: { decision: "approve" as const, note: "Add it." } } : f));
  return [...decided, ...FIXTURE].sort((a, b) => b.date.localeCompare(a.date));
})();
const ids = (items: FeedItem[]) => items.map((f) => f.id);

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const render = (path: string, query: string, node: React.ReactNode) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={path}>
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>{node}</SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
const feedPage = (query = "", items: FeedItem[] = FIXTURE, lastVisit?: Parameters<typeof IncidentFeed>[0]["lastVisit"]) =>
  render("/feed", query, <IncidentFeed items={items} lastVisit={lastVisit} />);
/** The items listed under the weeks, in order: each row's anchor. */
const listed = (html: string) => [...html.matchAll(/<li id="([^"]+)"/g)].map((m) => m[1]);
/** One row's markup. */
const rowOf = (html: string, id: string) => {
  const start = html.indexOf(`<li id="${id}"`);
  return html.slice(start, html.indexOf("</li>", start));
};

test("weeks run Monday to Sunday", () => {
  assert.equal(weekOf("2026-11-16"), "2026-11-16");
  assert.equal(weekOf("2026-11-20"), "2026-11-16");
  assert.equal(weekOf("2026-11-22"), "2026-11-16");
  assert.equal(weekOf("2026-11-15"), "2026-11-09");
  assert.equal(weekOf("2027-01-01"), "2026-12-28");
  assert.deepEqual(byWeek(FIXTURE).map((w) => w.week), ["2026-11-16", "2026-11-09", "2026-11-02", "2026-10-26"]);
});

test("the feed page lists every item newest first, under the week each came to light", () => {
  const html = feedPage();
  assert.deepEqual(listed(html), ids(FIXTURE));
  const weeks = [...html.matchAll(/<h2 [^>]*>Week of ([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(weeks, ["16 November 2026", "9 November 2026", "2 November 2026", "26 October 2026"]);
  // Each item sits under its own week's heading.
  const sections = html.split(/<h2 [^>]*>Week of /).slice(1);
  assert.deepEqual(sections.map(listed), [["mcp-tokens", "package-hijack", "chat-injection"], ["open-gateway", "mcp-follow-up"], ["agent-intrusion"], ["sandbox-escape", "oldest-mcp"]]);
  // The header line: what the page is, how many items, the newest, and the RSS feed.
  assert.match(html, /<h1[^>]*>Daily feed<\/h1>/);
  assert.match(html, /The AI security daily: every AI security incident we track, and the product updates, security tools, launches and research that change how AI is secured, newest first/);
  assert.match(html, /data-feed-status[^>]*><span>8 items<\/span><span>Latest 20 November 2026<\/span>/);
  assert.match(html, /<a href="\/feed\.xml"[^>]*data-rss[^>]*>[\s\S]*?RSS<\/a>/);
  assert.doesNotMatch(html, /Incidents views|>Catalogue </);
});

test("an incident shows its kind, date, incident pattern, evidence, story, patterns, deep dive and sources", () => {
  const html = feedPage();
  const row = rowOf(html, "chat-injection");
  assert.match(row, /data-kind="incident"[^>]*>[\s\S]*?Incident<\/span>/);
  assert.match(row, /<time dateTime="2026-11-16"[^>]*>16 Nov<\/time>/);
  // The incident pattern's chip opens its page.
  const chip = row.match(/<a [^>]*data-incident-pattern="promptInjection"[^>]*>(?:<span[^>]*><\/span>)([^<]+)<\/a>/);
  assert.ok(chip && chip[0].includes(`href="${incidentPatternHref("promptInjection")}"`), "a link to the incident pattern");
  assert.equal(chip![1], nameOf("promptInjection"));
  assert.match(row, />Demonstrated</);
  assert.ok(row.includes(esc(item().title)), "the title");
  assert.ok(row.includes(item().summary), "the summary");
  assert.match(row, /Replays on/);
  for (const id of [MCP, CHAT]) assert.ok(row.includes(`href="${patternHref(id, { tab: "incidents" })}"`), `links ${id}`);
  assert.ok(row.includes(archetypeById.get(CHAT)!.title), "names the pattern");
  assert.doesNotMatch(row, /Deep dive/, "no deep dive without an incident");
  assert.match(row, /<a href="https:\/\/example.org\/notice"[^>]*data-read-more[^>]*>Read more →<\/a><span[^>]*>Example, 7 Nov 2026<\/span>/);
  assert.doesNotMatch(row, /data-why|Why it matters/, "an incident with no why says none");

  const told = rowOf(html, "mcp-tokens");
  assert.match(told, new RegExp(`href="/incidents/${MITTWALD}"[^>]*>Deep dive →`));
  assert.match(told, />In the wild</);
  const none = rowOf(html, "open-gateway");
  assert.doesNotMatch(none, /Replays on/, "no pattern, no line");
  assert.match(none, />Single report</);
});

test("an item of another kind shows why it matters, who announced it, its products, controls and patterns, and its sources", () => {
  const html = feedPage("", MIXED);
  const row = rowOf(html, "claude-tracing");
  assert.match(row, /data-kind="productUpdate"[^>]*>[\s\S]*?Product update<\/span>/);
  assert.match(row, /<time dateTime="2026-11-21"[^>]*>21 Nov<\/time>/);
  assert.match(row, /<span class="font-semibold">Why it matters: <\/span>An agent&#x27;s own traces can no longer be redirected/);
  assert.match(row, /data-vendor="true">Anthropic</);
  // A product opens its settings on the pattern it belongs to, as search does.
  assert.ok(row.includes(`href="${toolHref(CLAUDE_CODE)}"`) && row.includes(`>${toolById.get(CLAUDE_CODE)!.name}<`), "the product");
  assert.equal(toolHref(CLAUDE_CODE), `/patterns/${archetypeById.get(CODING)!.slug}?tool=${CLAUDE_CODE}`);
  // A control is a chip into the catalogue, by its name.
  assert.ok(row.includes(`href="${controlHref(TRACING)}"`) && row.includes(`>${controlName(TRACING)}<`), "the control");
  assert.match(row, /Patterns: /);
  assert.ok(row.includes(`href="${patternHref(CODING)}"`), "a pattern it touches, on its own page");
  assert.doesNotMatch(row, /data-incident-pattern|Replays on|In the wild|Confirmed/, "no incident pattern or evidence");
  assert.match(row, /href="https:\/\/example.org\/settings"[^>]*>Read more →/);
  // The other sources follow the first.
  const tool = rowOf(html, "skills-scanner");
  assert.match(tool, /data-kind="tool"/);
  assert.match(tool, /href="https:\/\/example.org\/aig"[^>]*>Read more →<\/a><span[^>]*>Tencent, 21 Nov 2026/);
  assert.match(tool, /data-other-sources="true">Also: <span><a href="https:\/\/example.org\/press"[^>]*>Press, 22 Nov 2026 ↗/);
});

test("an item with an update says where it stands, with its note; a proposed one says what the owner decided", () => {
  const html = feedPage("", MIXED);
  assert.match(rowOf(html, "claude-tracing"), /data-site-update="applied"[^>]*><span[^>]*>Site update: applied<\/span> Adds the tracing endpoint setting to Claude Code\./);
  assert.match(rowOf(html, "private-inference"), />Site update: proposed<\/span> Onboard xAI private inference/);
  assert.match(rowOf(html, "evals-post"), />Site update: declined<\/span> No change to the tracing guidance\./);
  assert.match(rowOf(html, "skills-scanner"), /data-decision="approve"[^>]*>Approved: the next daily run carries it out\.<span[^>]*> Add it\.<\/span>/);
  assert.doesNotMatch(rowOf(html, "chat-injection"), /Site update/);
});

test("the Latest section lists the newest day's items as headlines, by kind, at the top", () => {
  assert.deepEqual(latestDay(MIXED), { day: "2026-11-21", items: MIXED.filter((f) => f.date === "2026-11-21") });
  const html = feedPage("", MIXED);
  const latest = html.slice(html.indexOf("data-latest="), html.indexOf("</section>", html.indexOf("data-latest=")));
  assert.match(html, /data-latest="2026-11-21"/);
  assert.match(latest, /<span class="display[^"]*">Latest<\/span><span[^>]*>21 November 2026 · 2 items<\/span>/);
  // In the chips' order: the product update before the tool; each a link to its row below.
  assert.deepEqual([...latest.matchAll(/data-latest-item="([^"]+)"/g)].map((m) => m[1]), ["claude-tracing", "skills-scanner"]);
  assert.match(latest, /data-kind="tool"[\s\S]*?<a href="#skills-scanner"[^>]*>Tencent ships a scanner for MCP servers and agent skills<\/a><span[^>]*>Tencent<\/span>/);
  assert.ok(html.indexOf("data-latest=") < html.indexOf("Week of"), "above the weeks");
  // A filtered feed is about the filter: no Latest, no panel.
  assert.doesNotMatch(feedPage("kind=research", MIXED), /data-latest=|data-proposed-updates/);
  assert.doesNotMatch(feedPage("", []), /data-latest=/, "an empty feed has no latest day");
});

test("the Proposed site updates panel lists every proposed update and how to approve it", () => {
  const html = feedPage("", MIXED);
  const panel = html.slice(html.indexOf("data-proposed-updates"), html.indexOf("</section>", html.indexOf("data-proposed-updates")));
  assert.match(panel, /Proposed site updates<\/span><span[^>]*>2<\/span>/);
  assert.deepEqual([...panel.matchAll(/data-proposed="([^"]+)"/g)].map((m) => m[1]), ["skills-scanner", "private-inference"], "proposed only, newest first");
  assert.match(panel, /<code[^>]*>data\/feed\/decisions\.yaml<\/code>/);
  assert.match(panel, /or ask for it in the session/);
  assert.match(panel, /data-approve-line="true">- \{ id: private-inference, decision: approve \}<\/code>/);
  assert.equal([...panel.matchAll(/data-approve-line/g)].length, 1, "one already approved needs no line");
  assert.match(panel, />Onboard a product<\/span> · <code[^>]*>toolXaiPrivate<\/code> · Onboard xAI private inference/);
  assert.match(panel, /data-decision="approve"/, "an approved one says so");
  assert.ok(html.indexOf("data-proposed-updates") < html.indexOf("Week of"));
  assert.doesNotMatch(feedPage(), /data-proposed-updates/, "nothing proposed, no panel");
});

test("the kind chips narrow the feed and count each kind; the incident filters narrow incidents only, and say so", () => {
  const html = feedPage("", MIXED);
  const kinds = html.slice(html.indexOf('aria-label="Kind"'), html.indexOf("</div>", html.indexOf('aria-label="Kind"')));
  assert.match(kinds, /aria-pressed="true"[^>]*>All <span[^>]*>12</);
  const chips = [...kinds.matchAll(/data-kind-chip="([^"]+)"[^>]*>([^<]+) <span[^>]*>(\d+)</g)].map((m) => [m[1], m[2], Number(m[3])]);
  assert.deepEqual(chips, [["incident", "Incidents", 8], ["productUpdate", "Product updates", 1], ["tool", "Tools", 1], ["launch", "Launches", 1], ["research", "Research", 1]]);
  for (const [kind, want] of [["tool", ["skills-scanner"]], ["incident", ids(FIXTURE)], ["research", ["evals-post"]]] as const) assert.deepEqual(listed(feedPage(`kind=${kind}`, MIXED)), want, kind);
  // An incident filter shows incidents only, whatever kind was asked for, and says so.
  assert.deepEqual(listed(feedPage("category=identity", MIXED)), ids(FIXTURE.filter((f) => f.category === "identity")));
  assert.deepEqual(listed(feedPage(`kind=tool&pattern=${MCP}`, MIXED)), ids(feedForPattern(MCP, FIXTURE)));
  assert.match(feedPage("evidence=exploited", MIXED), /data-incidents-only="true">: with one on, the feed shows incidents and nothing else\./);
  assert.match(html, /The incident pattern, pattern and evidence filters narrow incidents only\./);
  assert.match(feedPage("category=identity", MIXED), /data-kind-chip="incident"[^>]*aria-pressed="true"/);
  // The incident filters count incidents only.
  assert.match(html, new RegExp(`<option value="${MCP}">[^<]+\\(6\\)`));
});

test("each incident filter narrows the feed, from the address, and together they narrow further", () => {
  const cases: [string, string[]][] = [
    ["category=identity", ids(FIXTURE.filter((f) => f.category === "identity"))],
    [`pattern=${CHAT}`, ["chat-injection"]],
    [`pattern=${MCP}`, ids(FIXTURE.filter((f) => f.patterns.includes(MCP)))],
    ["evidence=exploited", ["mcp-tokens", "agent-intrusion"]],
    [`category=identity&pattern=${MCP}&evidence=confirmed`, ["mcp-follow-up", "oldest-mcp"]],
    [`incident=${MITTWALD}`, ["mcp-tokens", "mcp-follow-up"]],
    // An unknown value is ignored rather than emptying the page.
    ["kind=news&category=bias&pattern=archNope&evidence=rumoured", ids(FIXTURE)],
  ];
  for (const [query, want] of cases) assert.deepEqual(listed(feedPage(query)), want, query);
  // The chips count what the other filters leave, and say which is on.
  const html = feedPage(`pattern=${MCP}`);
  assert.match(html, /aria-pressed="true"[^>]*>All <span[^>]*>6</);
  // One chip per incident pattern, in order, each with its count.
  assert.match(html, new RegExp(`>${nameOf("identity")} <span[^>]*>3<`));
  const chips = [...html.matchAll(/<div [^>]*role="group" aria-label="Incident pattern">([\s\S]*?)<\/div>/g)][0][1];
  assert.deepEqual([...chips.matchAll(/<button [^>]*title="[^"]*"[^>]*><span[^>]*><\/span>([^<]+) </g)].map((m) => m[1]), dataset.incidentPatterns.map((p) => nameOf(p.id)));
  assert.match(html, new RegExp(`<option value="${MCP}" selected="">[^<]+\\(6\\)`));
  assert.match(feedPage("evidence=reported"), /<option value="reported" selected="">Single report \(1\)/);
  assert.match(feedPage(`incident=${MITTWALD}`), /Showing the reports told step by step in the deep dive/);
  // An incident pattern chosen says what it is, and leads to its page.
  assert.ok(feedPage("category=identity").includes(`href="${incidentPatternHref("identity")}"`));
  assert.match(feedPage("category=identity"), /About this incident pattern →/);
});

test("the feed says so when nothing matches, and when it is empty", () => {
  const html = feedPage("category=breakout&evidence=exploited");
  assert.deepEqual(listed(html), []);
  assert.match(html, /Nothing matches these filters\./);
  assert.match(html, /Clear them/);
  const empty = feedPage("", []);
  assert.match(empty, /Nothing in the feed yet\./);
  assert.match(empty, /<span>0 items<\/span>/);
});

test("the page is built with its newest days and loads older months as the reader goes", () => {
  const index = feedIndexOf(MIXED);
  assert.deepEqual(index.months, [{ month: "2026-11", count: 10 }, { month: "2026-10", count: 2 }]);
  assert.deepEqual(index.kinds, { incident: 8, productUpdate: 1, tool: 1, launch: 1, research: 1 });
  assert.equal(index.total, 12);
  assert.deepEqual(ids(index.proposed), ["skills-scanner", "private-inference"]);
  // Seven days back from the newest item; everything from then on is in hand.
  const { from, items } = initialWindow(MIXED);
  assert.equal(from, "2026-11-15");
  assert.deepEqual(ids(items), ids(MIXED.filter((f) => f.date >= "2026-11-15")));
  // How far back the page has the whole feed, and which month it loads next.
  assert.deepEqual(coverage(index, from, new Set()), { from: "2026-11-15", next: "2026-11" });
  assert.deepEqual(coverage(index, from, new Set(["2026-11"])), { from: "2026-11-01", next: "2026-10" });
  assert.deepEqual(coverage(index, from, new Set(["2026-11", "2026-10"])), { from: "", next: null });
  assert.deepEqual(coverage(index, "2026-11-01", new Set()), { from: "2026-11-01", next: "2026-10" }, "a window that starts on the first needs nothing more of its month");
  assert.deepEqual(coverage(index, "", new Set()), { from: "", next: null }, "an empty feed is whole");
  // As built: the newest days, the whole feed's counts, every proposed update, and a way to the older months.
  const html = render("/feed", "", <IncidentFeed initial={items} from={from} index={index} />);
  assert.deepEqual(listed(html), ids(items));
  assert.match(html, /<span>12 items<\/span>/);
  assert.match(html, /data-kind-chip="incident"[^>]*>Incidents <span[^>]*>8</);
  assert.match(html, /data-proposed="private-inference"/, "the panel lists what is not loaded yet");
  assert.match(html, /data-feed-more="2026-11"[\s\S]*?Loaded back to 15 November 2026\.[\s\S]*?Load Nov 2026 →/);
  assert.doesNotMatch(feedPage("", MIXED), /data-feed-more/, "the whole feed has nothing more to load");
});

test("the feed counts and marks what is new since the reader's last visit", () => {
  const before = visitOf(FIXTURE.filter((f) => !["mcp-tokens", "chat-injection"].includes(f.id)), Date.UTC(2026, 10, 19, 9));
  const html = feedPage("", FIXTURE, before);
  assert.match(html, /data-feed-new="2"[^>]*>2 new since your last visit<span[^>]*> \(19 Nov 2026\)/);
  const marked = [...html.matchAll(/<li id="([^"]+)"[\s\S]*?<\/li>/g)].filter((m) => m[0].includes("data-new")).map((m) => m[1]);
  assert.deepEqual(marked, ["mcp-tokens", "chat-injection"]);
  assert.match(html, /data-new="true">New</);
  // Nothing new, and no visit on record: the line says so, or stays quiet.
  assert.match(feedPage("", FIXTURE, visitOf(FIXTURE, Date.UTC(2026, 10, 21))), />Nothing new since your last visit</);
  assert.doesNotMatch(feedPage("", FIXTURE, null), /since your last visit|data-new/);
  assert.doesNotMatch(feedPage(), /since your last visit|data-new/, "without storage, the page marks nothing");
});

test("a visit is remembered by the items it saw, and a reload within the hour is the same visit", () => {
  const visit = visitOf(FIXTURE, 1_000);
  assert.deepEqual(visit.seen, ids(FIXTURE));
  assert.equal(visit.from, "2026-09-21", "sixty days before the newest item");
  // Only what was loaded is remembered, so an older month not yet loaded is never new next time.
  const partial = visitOf(FIXTURE.filter((f) => f.date >= "2026-11-14"), 1_000, "2026-11-14");
  assert.equal(partial.from, "2026-11-14");
  assert.deepEqual([...newSince(FIXTURE, partial)], [], "the older items were not loaded, so they are not new");
  // An item found late, filed under an older day, is still new; one older than what was remembered is not.
  const late = { ...FIXTURE[0], id: "late-find", date: "2026-11-01" };
  const ancient = { ...FIXTURE[0], id: "ancient", date: "2026-08-01" };
  assert.deepEqual([...newSince([late, ancient, ...FIXTURE], visit)], ["late-find"]);
  assert.deepEqual([...newSince(FIXTURE, null)], []);
  const earlier = visitOf(FIXTURE.slice(1), 0);
  assert.equal(previousVisit(null, 5), null);
  assert.equal(previousVisit({ last: visit, before: earlier }, 1_000 + VISIT_MS + 1), visit, "after an hour, the last visit");
  assert.equal(previousVisit({ last: visit, before: earlier }, 1_000 + 60_000), earlier, "within the hour, the one before");
});

test("a pattern's Incidents tab lists its five newest incidents, then all of them in the feed", () => {
  const arch = archetypeById.get(MCP)!;
  const html = render(`/patterns/${arch.slug}`, "tab=incidents", <PatternIncidents archetype={arch} feed={MIXED} />);
  const mine = feedForPattern(MCP, MIXED);
  assert.equal(mine.length, 6, "incidents only: the tool on the same pattern is not one");
  assert.match(html, /In the feed/);
  const linked = [...html.matchAll(/href="\/feed\?pattern=archRemoteMcpServer#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(linked, ids(mine.slice(0, FEED_ON_PATTERN)));
  assert.ok(html.indexOf("In the feed") > html.indexOf(`href="/incidents/${MITTWALD}"`), "after the pattern's deep dives");
  assert.ok(html.includes(`href="${feedHref({ pattern: MCP })}"`) && html.includes("All 6 in the feed →"));
  assert.equal(feedHref({ pattern: MCP }), "/feed?pattern=archRemoteMcpServer");
  // As the page is built: the newest five and the count, not the feed.
  const built = render(`/patterns/${arch.slug}`, "tab=incidents", <PatternIncidents archetype={arch} feed={mine.slice(0, FEED_ON_PATTERN)} total={mine.length} />);
  assert.ok(built.includes("All 6 in the feed →"));
  // The deep dives are titled so, each labelled with its incident pattern.
  assert.match(html, /<p class="eyebrow">Deep dives<\/p>/);
  const dives = dataset.incidents.filter((i) => i.archetype === MCP);
  for (const d of dives) {
    const row = html.slice(html.indexOf(`data-deep-dive="${d.id}"`), html.indexOf("</li>", html.indexOf(`data-deep-dive="${d.id}"`)));
    assert.ok(row.includes(`data-incident-pattern="${d.category}"`) && row.includes(nameOf(d.category)), d.id);
  }
  // A pattern no incident names shows no feed section.
  const quiet = archetypeById.get("archTrainingPipeline")!;
  assert.doesNotMatch(render("/patterns/x", "", <PatternIncidents archetype={quiet} feed={FIXTURE} />), /In the feed/);
});

test("a deep dive links to the feed items that point to it", () => {
  const many = render(`/incidents/${MITTWALD}`, "", <IncidentWalkthrough id={MITTWALD} feed={FIXTURE} />);
  assert.equal(feedForIncident(MITTWALD, FIXTURE).length, 2);
  assert.match(many, new RegExp(`In the feed: <a [^>]*href="/feed\\?incident=${MITTWALD}">2 reports</a>`));
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
  assert.equal(first.title, FIXTURE[0].title);
  assert.ok(first.text.includes("session tokens"));
  assert.match(first.hint!, new RegExp(`^${incidentPatternById.get("identity")!.name} · 20 Nov 2026`));
  assert.equal(entries.find((e) => e.href === "/feed#skills-scanner")!.hint, "Tool · 21 Nov 2026");
  assert.equal(buildIndex([]).filter((e) => e.kind === "Daily feed").length, 0, "until the titles arrive, search finds the rest");
});

test("a page that shows a few items reads the same given only those as given the whole feed", () => {
  const today = "2026-11-25";
  const whole = render("/incidents", "", <IncidentPatternsIndex feed={MIXED} today={today} />);
  const built = render("/incidents", "", <IncidentPatternsIndex cards={incidentPatternCards(MIXED, today)} total={MIXED.length} today={today} />);
  // Where each lands is the dataset's when built (the whole feed's), the fixture's when given one; what the feed adds is the same.
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
});

test("the shipped feed is newest first and stays out of the dataset every page loads", () => {
  assert.ok(!("feed" in dataset), "dataset.json carries no feed");
  assert.deepEqual(ids(feedForCategory("identity", FIXTURE)), ["mcp-tokens", "mcp-follow-up", "oldest-mcp"]);
  const dates = feedItems.map((f) => f.date);
  assert.deepEqual(dates, [...dates].sort().reverse(), "the shipped feed is newest first");
  for (const f of feedItems) assert.ok(FEED_KINDS.some((k) => k.id === f.kind), `${f.id} has a kind`);
  assert.equal(dataset.meta.counts.feed, feedItems.length);
  for (const p of dataset.incidentPatterns) assert.equal(p.feedCount, feedForCategory(p.id, feedItems).length, p.id);
});
