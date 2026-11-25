import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { checkFeed, FEED_LIMITS, loadFeed, type FeedContext } from "./lib/feed";
import { IncidentFeed } from "../src/components/incidents/IncidentFeed";
import { IncidentList } from "../src/components/incidents/IncidentList";
import { IncidentWalkthrough } from "../src/components/incidents/IncidentWalkthrough";
import { byWeek, weekOf } from "../src/components/incidents/model";
import { FEED_ON_PATTERN, PatternIncidents } from "../src/components/patterns/PatternPanels";
import { buildIndex } from "../src/components/shell/SearchPalette";
import { archetypeById, dataset, feedForCategory, feedForIncident, feedForPattern } from "../src/lib/data";
import { feedHref, patternHref } from "../src/lib/routes";
import type { FeedItem } from "../src/lib/types";

/*
 * The feed's data is written elsewhere and may not exist yet, so every fixture lives here and
 * the shipped pages are checked against it. Nothing in this file writes to data/feed/.
 */

const ctx: FeedContext = {
  patternIds: new Set(dataset.archetypes.map((a) => a.id)),
  incidentIds: new Set(dataset.incidents.map((i) => i.id)),
};

const MCP = "archRemoteMcpServer";
const CHAT = "archChatAgent";
const MITTWALD = "mittwald-mcp-server";
const LITELLM = "litellm-release-hijack";

/** A valid item; each test breaks one field of it. */
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
const problemsOf = (items: unknown[], file = "2026-11.yaml") => checkFeed([{ file, doc: { items } }], ctx).problems;
/** One problem, for the test item, naming the file and the item. */
function rejects(over: Record<string, unknown>, pattern: RegExp, file = "2026-11.yaml") {
  const problems = problemsOf([item(over)], file);
  assert.ok(
    problems.some((p) => p.startsWith(`feed/${file} item ${String(over.id ?? "test-item")}: `) && pattern.test(p)),
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

test("the loader rejects a category, evidence or perspective that is not on its list", () => {
  rejects({ category: "bias" }, /category "bias" is not one of promptInjection, supplyChain, identity, exposed, breakout, aiAttacker/);
  rejects({ evidence: "rumoured" }, /evidence "rumoured" is not one of exploited, confirmed, demonstrated, reported/);
  rejects({ evidence: undefined }, /evidence/);
  rejects({ perspective: "victim" }, /perspective "victim" is not one of target, weapon/);
});

test("the loader rejects an unknown pattern, more than three, and an incident not in the catalogue", () => {
  rejects({ patterns: ["archNope"] }, /pattern "archNope" does not exist/);
  rejects({ patterns: [MCP, CHAT, "archAgentWorkflow", "archActionAgent"] }, /names 4 patterns; at most 3/);
  rejects({ patterns: [MCP, MCP] }, /names a pattern twice/);
  rejects({ patterns: MCP }, /patterns must be a list/);
  rejects({ incident: "no-such-incident" }, /incident "no-such-incident" is not in the catalogue/);
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

test("no feed files at all is an empty feed, and the build reads only YAML", async () => {
  const root = mkdtempSync(join(tmpdir(), "feed-"));
  try {
    const fails: string[] = [];
    assert.deepEqual(await loadFeed(root, ctx, (m) => fails.push(m)), [], "no data/feed folder");
    mkdirSync(join(root, "data", "feed"), { recursive: true });
    writeFileSync(join(root, "data", "feed", "README.md"), "# The feed\n");
    assert.deepEqual(await loadFeed(root, ctx, (m) => fails.push(m)), [], "only a README");
    assert.equal(fails.length, 0, fails.join("\n"));
    writeFileSync(join(root, "data", "feed", "2026-11.yaml"), "items:\n  - id: broken\n    date: 2026-10-01\n");
    await loadFeed(root, ctx, (m) => fails.push(m));
    assert.ok(fails.some((f) => f.startsWith("feed/2026-11.yaml item broken: date 2026-10-01 is outside 2026-11")), fails.join("\n"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- The pages, read with a fixture feed --------------------------------------------------------

/** Eight reports over four weeks; checked by the loader like any feed file. */
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
const feedPage = (query = "", items: FeedItem[] = FIXTURE) => render("/incidents/feed", query, <IncidentFeed items={items} />);
/** The reports listed, in order: each row's anchor. */
const listed = (html: string) => [...html.matchAll(/<li id="([^"]+)"/g)].map((m) => m[1]);

test("weeks run Monday to Sunday", () => {
  assert.equal(weekOf("2026-11-16"), "2026-11-16");
  assert.equal(weekOf("2026-11-20"), "2026-11-16");
  assert.equal(weekOf("2026-11-22"), "2026-11-16");
  assert.equal(weekOf("2026-11-15"), "2026-11-09");
  assert.equal(weekOf("2027-01-01"), "2026-12-28");
  assert.deepEqual(byWeek(FIXTURE).map((w) => w.week), ["2026-11-16", "2026-11-09", "2026-11-02", "2026-10-26"]);
});

test("the feed page lists every report newest first, under the week each came to light", () => {
  const html = feedPage();
  assert.deepEqual(listed(html), ids(FIXTURE));
  const weeks = [...html.matchAll(/<h2 [^>]*>Week of ([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(weeks, ["16 November 2026", "9 November 2026", "2 November 2026", "26 October 2026"]);
  // Each report sits under its own week's heading.
  const sections = html.split(/<h2 /).slice(1);
  assert.deepEqual(sections.map(listed), [["mcp-tokens", "package-hijack", "chat-injection"], ["open-gateway", "mcp-follow-up"], ["agent-intrusion"], ["sandbox-escape", "oldest-mcp"]]);
  assert.match(html, /Every AI security incident we track, newest first; the ones that teach something new are told step by step in the catalogue\./);
});

test("a report shows its date, attack type, evidence, story, patterns, walk-through and sources", () => {
  const html = feedPage();
  const row = html.slice(html.indexOf('<li id="chat-injection"'), html.indexOf('<li id="open-gateway"'));
  assert.match(row, /<time dateTime="2026-11-16"[^>]*>16 Nov<\/time>/);
  assert.match(row, />Prompt injection</);
  assert.match(row, />Demonstrated</);
  assert.ok(row.includes(item().title.replace(/'/g, "&#x27;")), "the title");
  assert.ok(row.includes(item().summary), "the summary");
  assert.match(row, /Replays on/);
  for (const id of [MCP, CHAT]) assert.ok(row.includes(`href="${patternHref(id, { tab: "incidents" })}"`), `links ${id}`);
  assert.ok(row.includes(archetypeById.get(CHAT)!.title), "names the pattern");
  assert.doesNotMatch(row, /Step by step/, "no walk-through without an incident");
  assert.match(row, /href="https:\/\/example.org\/notice"[^>]*>Example, 7 Nov 2026 ↗/);

  const told = html.slice(html.indexOf('<li id="mcp-tokens"'), html.indexOf('<li id="package-hijack"'));
  assert.match(told, new RegExp(`href="/incidents/${MITTWALD}"[^>]*>Step by step →`));
  assert.match(told, />In the wild</);
  const none = html.slice(html.indexOf('<li id="open-gateway"'), html.indexOf('<li id="mcp-follow-up"'));
  assert.doesNotMatch(none, /Replays on/, "no pattern, no line");
  assert.match(none, />Single report</);
});

test("each filter narrows the feed, from the address, and together they narrow further", () => {
  const cases: [string, string[]][] = [
    ["category=identity", ids(FIXTURE.filter((f) => f.category === "identity"))],
    [`pattern=${CHAT}`, ["chat-injection"]],
    [`pattern=${MCP}`, ids(FIXTURE.filter((f) => f.patterns.includes(MCP)))],
    ["evidence=exploited", ["mcp-tokens", "agent-intrusion"]],
    [`category=identity&pattern=${MCP}&evidence=confirmed`, ["mcp-follow-up", "oldest-mcp"]],
    [`incident=${MITTWALD}`, ["mcp-tokens", "mcp-follow-up"]],
    // An unknown value is ignored rather than emptying the page.
    ["category=bias&pattern=archNope&evidence=rumoured", ids(FIXTURE)],
  ];
  for (const [query, want] of cases) assert.deepEqual(listed(feedPage(query)), want, query);
  // The chips count what the other filters leave, and say which is on.
  const html = feedPage(`pattern=${MCP}`);
  assert.match(html, /aria-pressed="true"[^>]*>All <span[^>]*>6</);
  assert.match(html, />Identity &amp; credentials <span[^>]*>3</);
  assert.match(html, new RegExp(`<option value="${MCP}" selected="">[^<]+\\(6\\)`));
  assert.match(feedPage("evidence=reported"), /<option value="reported" selected="">Single report \(1\)/);
  assert.match(feedPage(`incident=${MITTWALD}`), /Showing the reports told step by step in/);
});

test("the feed says so when nothing matches, and when it is empty", () => {
  const html = feedPage("category=breakout&evidence=exploited");
  assert.deepEqual(listed(html), []);
  assert.match(html, /No report matches these filters\./);
  assert.match(html, /Clear them/);
  const empty = feedPage("", []);
  assert.match(empty, /Nothing in the feed yet\./);
  assert.match(empty, /Feed <span[^>]*>0</);
});

test("the switch under the heading shows on both pages, with each view's count", () => {
  const catalogue = render("/incidents", "", <IncidentList />);
  const feed = feedPage();
  for (const [html, on] of [[catalogue, "Catalogue"], [feed, "Feed"]] as const) {
    assert.match(html, /<nav aria-label="Incidents views"/);
    assert.match(html, new RegExp(`<a [^>]*href="/incidents">Catalogue <span[^>]*>${dataset.incidents.length}<`));
    assert.match(html, /<a [^>]*href="\/incidents\/feed">Feed <span[^>]*>\d+</);
    assert.match(html, new RegExp(`aria-current="page"[^>]*>${on} <`), `${on} is the page shown`);
    assert.equal(html.match(/aria-current="page"/g)?.length, 1);
  }
  assert.match(feed, new RegExp(`>Feed <span[^>]*>${FIXTURE.length}<`));
});

test("a pattern's Incidents tab lists its five newest feed reports, then all of them in the feed", () => {
  const arch = archetypeById.get(MCP)!;
  const html = render(`/patterns/${arch.slug}`, "tab=incidents", <PatternIncidents archetype={arch} feed={FIXTURE} />);
  const mine = feedForPattern(MCP, FIXTURE);
  assert.equal(mine.length, 6);
  assert.match(html, /In the feed/);
  const linked = [...html.matchAll(/href="\/incidents\/feed\?pattern=archRemoteMcpServer#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(linked, ids(mine.slice(0, FEED_ON_PATTERN)));
  assert.ok(html.indexOf("In the feed") > html.indexOf(`href="/incidents/${MITTWALD}"`), "after the catalogue's own incidents");
  assert.ok(html.includes(`href="${feedHref({ pattern: MCP })}"`) && html.includes("All 6 in the feed →"));
  assert.equal(feedHref({ pattern: MCP }), "/incidents/feed?pattern=archRemoteMcpServer");
  // A pattern no report names shows no feed section.
  const quiet = archetypeById.get("archTrainingPipeline")!;
  assert.doesNotMatch(render("/patterns/x", "", <PatternIncidents archetype={quiet} feed={FIXTURE} />), /In the feed/);
});

test("a catalogue incident links to the feed reports that point to it", () => {
  const many = render(`/incidents/${MITTWALD}`, "", <IncidentWalkthrough id={MITTWALD} feed={FIXTURE} />);
  assert.equal(feedForIncident(MITTWALD, FIXTURE).length, 2);
  assert.match(many, new RegExp(`In the feed: <a [^>]*href="/incidents/feed\\?incident=${MITTWALD}">2 reports</a>`));
  const one = render(`/incidents/${LITELLM}`, "", <IncidentWalkthrough id={LITELLM} feed={FIXTURE} />);
  assert.match(one, /In the feed: <a [^>]*href="\/incidents\/feed#sandbox-escape">1 report<\/a>/);
  const none = render("/incidents/x", "", <IncidentWalkthrough id="mckinsey-lilli" feed={FIXTURE} />);
  assert.doesNotMatch(none, /In the feed/);
});

test("site search finds a feed report by its title and lands on it in the feed", () => {
  const entries = buildIndex(FIXTURE).filter((e) => e.kind === "Feed");
  assert.equal(entries.length, FIXTURE.length);
  const first = entries.find((e) => e.href === "/incidents/feed#mcp-tokens")!;
  assert.equal(first.title, FIXTURE[0].title);
  assert.ok(first.text.includes("session tokens"));
  assert.equal(buildIndex([]).filter((e) => e.kind === "Feed").length, 0);
});

test("the accessors read the shipped feed, which is empty until data/feed/ has files", () => {
  assert.ok(Array.isArray(dataset.feed));
  assert.deepEqual(ids(feedForCategory("identity", FIXTURE)), ["mcp-tokens", "mcp-follow-up", "oldest-mcp"]);
  const dates = dataset.feed.map((f) => f.date);
  assert.deepEqual(dates, [...dates].sort().reverse(), "the shipped feed is newest first");
});
