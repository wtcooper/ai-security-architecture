import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { checkSecurityTools, loadSecurityTools, SECURITY_TOOL_LIMITS, type SecurityToolContext } from "./lib/security-tools";
import { ControlDetail } from "../src/components/controls/ControlDetail";
import { controlName, dataset, mitigationById } from "../src/lib/data";
import { securityToolsFor, withSecurityTools, RSS_ITEMS } from "../src/lib/feed";
import { feedIndex, feedItems } from "../src/lib/feed-server";
import { feedRss, rfc822, xmlEscape } from "../src/lib/rss";
import { GET as feedXml } from "../src/app/feed.xml/route";
import type { FeedItem, SecurityTool } from "../src/lib/types";

/*
 * The parts of the daily that are not the feed page: the security tools and the control pages
 * that list them, the RSS feed, and the rule that keeps the feed out of the JavaScript every page
 * loads. Every fixture lives here; nothing in this file writes to data/.
 */

const ROOT = process.cwd();
const TRACING = "cap-agent-tracing";
const INTEGRITY = "cap-mcp-tool-integrity";
const ctx: SecurityToolContext = { controlIds: new Set(dataset.mitigations.map((m) => m.id)), feedIds: new Set(["tencent-ai-infra-guard-mcp-skills"]) };

const tool = (over: Record<string, unknown> = {}) => ({
  id: "tencent-ai-infra-guard",
  name: "AI-Infra-Guard",
  by: "Tencent",
  kind: "open",
  url: "https://github.com/Tencent/AI-Infra-Guard",
  what: "Scans MCP servers and agent skills for poisoned tools and risky permissions before they are installed.",
  controls: [INTEGRITY, "cap-agent-tool-registry"],
  status: "ga",
  released: "2026-11-10",
  feed: "tencent-ai-infra-guard-mcp-skills",
  ...over,
});
const problemsOf = (doc: unknown, file = "tencent-ai-infra-guard.yaml") => checkSecurityTools([{ file, doc }], ctx).problems;
function rejects(over: Record<string, unknown>, pattern: RegExp, file?: string) {
  const problems = problemsOf(tool(over), file);
  assert.ok(
    problems.some((p) => p.startsWith(`security-tools/${file ?? "tencent-ai-infra-guard.yaml"} tool `) && pattern.test(p)),
    `expected a problem matching ${pattern} for ${JSON.stringify(over)}; got ${JSON.stringify(problems)}`,
  );
}

// --- Security tools (data/security-tools/) ------------------------------------------------------------

test("a well-formed security tool passes, named after its file", () => {
  const { tools, problems } = checkSecurityTools([{ file: "tencent-ai-infra-guard.yaml", doc: tool() }], ctx);
  assert.deepEqual(problems, []);
  assert.equal(tools[0].name, "AI-Infra-Guard");
  assert.deepEqual(problemsOf(tool({ feed: undefined, status: "preview", kind: "commercial" })), [], "the feed item is optional");
});

test("a security tool's controls must exist, one to four; its feed item, if given, must exist", () => {
  rejects({ controls: ["cap-nope"] }, /control "cap-nope" is not in the catalogue/);
  rejects({ controls: [] }, /names 0 controls; 1 to 4/);
  rejects({ controls: [TRACING, INTEGRITY, "D3-DI", "D3-AMED", "D3-APA"] }, /names 5 controls; 1 to 4/);
  rejects({ controls: TRACING }, /controls must be a list/);
  rejects({ controls: [TRACING, TRACING] }, /names a control twice/);
  rejects({ feed: "no-such-item" }, /feed "no-such-item" is not an item in the feed \(data\/feed\/\)/);
});

test("every other rule names the file and the tool", () => {
  rejects({ kind: "freemium" }, /kind "freemium" is not one of open, commercial/);
  rejects({ status: "alpha" }, /status "alpha" is not one of ga, preview, beta/);
  rejects({ url: "http://example.org" }, /must be an https:\/\/ address/);
  rejects({ what: "x".repeat(SECURITY_TOOL_LIMITS.what + 1) }, /what is 161 characters; at most 160/);
  rejects({ what: "" }, /needs a what/);
  rejects({ name: "" }, /needs a name/);
  rejects({ by: undefined }, /needs by: the vendor or project/);
  rejects({ released: "November" }, /released "November" must be a real day/);
  rejects({ licence: "MIT" }, /unknown field\(s\) licence/);
  rejects({ id: "Not_Kebab" }, /must be kebab-case/);
  rejects({}, /name the file after its id: tencent-ai-infra-guard.yaml/, "aig.yaml");
  const twice = checkSecurityTools(
    [
      { file: "tencent-ai-infra-guard.yaml", doc: tool() },
      { file: "copy/tencent-ai-infra-guard.yaml", doc: tool() },
    ],
    ctx,
  ).problems;
  assert.ok(twice.some((p) => /duplicate id: also security-tools\/tencent-ai-infra-guard.yaml/.test(p)), twice.join("\n"));
});

test("no security-tools folder is no tools, and the loader reads only YAML", async () => {
  const root = mkdtempSync(join(tmpdir(), "tools-"));
  try {
    const fails: string[] = [];
    assert.deepEqual(await loadSecurityTools(root, ctx, (m) => fails.push(m)), []);
    mkdirSync(join(root, "data", "security-tools"), { recursive: true });
    writeFileSync(join(root, "data", "security-tools", "notes.md"), "# notes\n");
    writeFileSync(join(root, "data", "security-tools", "x.yml"), "id: x\n");
    writeFileSync(join(root, "data", "security-tools", "tencent-ai-infra-guard.yaml"), JSON.stringify(tool()));
    const tools = await loadSecurityTools(root, ctx, (m) => fails.push(m));
    assert.deepEqual(tools.map((t) => t.id), ["tencent-ai-infra-guard"]);
    assert.deepEqual(fails, ["security-tools/x.yml: a security tool file ends in .yaml"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const TOOLS: SecurityTool[] = checkSecurityTools(
  [
    { file: "tencent-ai-infra-guard.yaml", doc: tool() },
    { file: "trace-kit.yaml", doc: tool({ id: "trace-kit", name: "TraceKit", by: "Example Labs", kind: "commercial", status: "beta", url: "https://example.org/tracekit", what: "Collects agent traces.", controls: [TRACING], feed: undefined }) },
  ],
  ctx,
).tools;

test("a control's page lists the security tools that deliver it: name, by, open or commercial, status, what and link", () => {
  const html = renderToStaticMarkup(<ControlDetail mitigation={mitigationById.get(INTEGRITY)!} securityTools={TOOLS} />);
  assert.match(html, /<p class="eyebrow">Tools that deliver it<\/p>/);
  const rows = [...html.matchAll(/data-security-tool="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(rows, ["tencent-ai-infra-guard"], "only the tools mapped to this control");
  const row = html.slice(html.indexOf('data-security-tool="tencent-ai-infra-guard"'), html.indexOf("</li>", html.indexOf('data-security-tool="tencent-ai-infra-guard"')));
  assert.match(row, /<a href="https:\/\/github.com\/Tencent\/AI-Infra-Guard"[^>]*>AI-Infra-Guard<span[^>]*>↗<\/span><\/a>/);
  assert.match(row, />by Tencent</);
  assert.match(row, />Open source</);
  assert.match(row, />Generally available</);
  assert.ok(row.includes(tool().what), "what it does");
  assert.match(row, /href="\/feed#tencent-ai-infra-guard-mcp-skills"[^>]*>In the feed →/);
  const other = renderToStaticMarkup(<ControlDetail mitigation={mitigationById.get(TRACING)!} securityTools={TOOLS} />);
  assert.match(other, /data-security-tool="trace-kit"[\s\S]*?>Commercial<[\s\S]*?>Beta</);
  assert.doesNotMatch(other, /In the feed →/, "no feed item, no link");
  assert.doesNotMatch(renderToStaticMarkup(<ControlDetail mitigation={mitigationById.get("D3-DI")!} securityTools={TOOLS} />), /Tools that deliver it/, "none mapped, no section");
  assert.deepEqual(securityToolsFor(TRACING, TOOLS).map((t) => t.id), ["trace-kit"]);
  assert.equal(controlName(INTEGRITY), "Tool and MCP Server Integrity");
});

test("the feed item that announced a tool carries it, as its row shows it", () => {
  const item = { id: "tencent-ai-infra-guard-mcp-skills", kind: "tool", date: "2026-11-10", title: "t", summary: "s", why: "w", patterns: [], sources: [] } as unknown as FeedItem;
  const [withTool, without] = withSecurityTools([item, { ...item, id: "other" }], TOOLS);
  assert.deepEqual(withTool.securityTools, [{ id: "tencent-ai-infra-guard", name: "AI-Infra-Guard", by: "Tencent", kind: "open", status: "ga", url: "https://github.com/Tencent/AI-Infra-Guard" }]);
  assert.equal(without.securityTools, undefined);
});

// --- RSS (/feed.xml) ---------------------------------------------------------------------------------

/** What an XML parser would refuse: a stray < or &, a tag closed out of order, more or less than one root. */
function xmlProblems(xml: string): string[] {
  const problems: string[] = [];
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) problems.push("no XML declaration");
  const token = /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[A-Za-z_][\w:.-]*\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>|<|&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;
  const badAmp = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/;
  const stack: string[] = [];
  let roots = 0;
  for (const m of xml.matchAll(token)) {
    const [t, close, name, attrs, selfClose] = m;
    if (t === "<") problems.push(`a stray < at ${m.index}`);
    else if (t.startsWith("&")) problems.push(`a bare & at ${m.index}`);
    else if (!name) continue;
    else if (badAmp.test(attrs ?? "")) problems.push(`a bare & in <${name}>`);
    else if (close) {
      const open = stack.pop();
      if (open !== name) problems.push(`</${name}> closes <${open}>`);
    } else {
      if (!stack.length) roots += 1;
      if (!selfClose) stack.push(name);
    }
  }
  if (stack.length) problems.push(`unclosed: ${stack.join(", ")}`);
  if (roots !== 1) problems.push(`${roots} root elements`);
  return problems;
}

const RSS_FIXTURE: FeedItem[] = Array.from({ length: RSS_ITEMS + 5 }, (_, i) => ({
  id: `item-${i}`,
  kind: i % 2 ? "research" : "incident",
  weight: i % 3 ? "notable" : "brief",
  date: `2026-11-${String(28 - Math.floor(i / 4)).padStart(2, "0")}`,
  added: "2026-11-28",
  title: `Item ${i}: <script> & "quotes" in a title`,
  summary: "A summary with an ampersand & a tag <b>.",
  ...(i % 2 ? { why: "Why it matters, with 'quotes'.", vendor: "Example & Co" } : { category: "identity", perspective: "target", evidence: "confirmed" }),
  patterns: [],
  sources: [{ title: "The source", url: `https://example.org/a?b=${i}&c=d`, publisher: "Example" }],
})) as FeedItem[];

test("the RSS feed is valid XML with the newest 100 items: title, link to the item on /feed/, date, summary, why it matters and the source", () => {
  assert.deepEqual(xmlProblems('<?xml version="1.0" encoding="UTF-8"?>\n<a><b>x &amp; y</b></a>'), [], "the checker passes good XML");
  assert.ok(xmlProblems('<?xml version="1.0" encoding="UTF-8"?>\n<a><b>x & y</a></b>').length >= 2, "and fails bad XML");
  const xml = feedRss(RSS_FIXTURE, "https://example.org/site");
  assert.deepEqual(xmlProblems(xml), []);
  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /<channel>\s*<title>Daily feed · AI Security Architecture<\/title>/, "the channel is named as the page is");
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  assert.equal(items.length, RSS_ITEMS);
  const first = items[0];
  assert.match(first, /<title>Item 0: &lt;script&gt; &amp; &quot;quotes&quot; in a title<\/title>/);
  assert.match(first, /<link>https:\/\/example.org\/site\/feed\/#item-0<\/link>/);
  assert.match(first, /<pubDate>Sat, 28 Nov 2026 00:00:00 GMT<\/pubDate>/);
  assert.match(first, /<description>&lt;p&gt;A summary with an ampersand &amp;amp; a tag &amp;lt;b&amp;gt;\.&lt;\/p&gt;/);
  assert.match(first, /<source url="https:\/\/example.org\/a\?b=0&amp;c=d">Example<\/source>/);
  assert.match(items[1], /Why it matters:&lt;\/strong&gt; Why it matters, with &amp;apos;quotes&amp;apos;\./);
  assert.match(items[1], /<category>Research<\/category>/);
  assert.equal(rfc822("2026-11-24"), "Tue, 24 Nov 2026 00:00:00 GMT");
  assert.equal(xmlEscape(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;");
  assert.deepEqual(xmlProblems(feedRss([], "https://example.org")), [], "an empty feed is a valid feed");
});

test("/feed.xml is a static route that writes the shipped feed, and the build leaves it at out/feed.xml", async () => {
  const route = await import("../src/app/feed.xml/route");
  assert.equal(route.dynamic, "force-static", "rendered once at build time, as a static export needs");
  const res = feedXml();
  assert.match(res.headers.get("Content-Type") ?? "", /^application\/rss\+xml/);
  const xml = await res.text();
  assert.deepEqual(xmlProblems(xml), []);
  assert.equal([...xml.matchAll(/<item>/g)].length, Math.min(RSS_ITEMS, feedItems.length));
  if (feedItems[0]) assert.ok(xml.includes(`/feed/#${feedItems[0].id}</link>`), "the newest item first");
  const built = join(ROOT, "out", "feed.xml");
  if (existsSync(built)) assert.deepEqual(xmlProblems(readFileSync(built, "utf8")), [], "out/feed.xml");
});

// --- Scale: the feed is not in the JavaScript every page loads ------------------------------------------

const SRC = join(ROOT, "src");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const resolveImport = (from: string, spec: string): string | null => {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
};
const importsOf = (file: string) =>
  file.endsWith(".json") ? [] : [...readFileSync(file, "utf8").matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/g)].map((m) => resolveImport(file, m[1])).filter((f): f is string => Boolean(f));
const FEED_DATA = [join(SRC, "lib", "feed-server.ts"), join(SRC, "data", "generated", "feed.json"), join(SRC, "data", "generated", "security-tools.json")];

test("no client component reaches the feed's data: the import graph from every \"use client\" file", () => {
  const clients = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && /^\s*["']use client["']/.test(readFileSync(f, "utf8")));
  assert.ok(clients.length > 20, "the client components are found");
  const seen = new Set<string>();
  const paths = new Map<string, string>();
  const queue = clients.map((c) => [c, relative(ROOT, c)] as const);
  while (queue.length) {
    const [file, path] = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    paths.set(file, path);
    for (const next of importsOf(file)) queue.push([next, `${path} -> ${relative(ROOT, next)}`]);
  }
  for (const f of FEED_DATA) assert.ok(!seen.has(f), `a client component reaches ${relative(ROOT, f)}: ${paths.get(f)}`);
  assert.ok(seen.has(join(SRC, "data", "generated", "dataset.json")), "the walk does follow imports into the dataset");
  // Only the files under src/app/ read it: they hand each component the few items it shows.
  const readers = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && importsOf(f).includes(FEED_DATA[0])).map((f) => relative(SRC, f)).sort();
  assert.ok(readers.length > 0 && readers.every((f) => f.startsWith("app/")), readers.join(", "));
});

test("the build writes the feed apart: one file per month, an index, the titles, and nothing in dataset.json", () => {
  const dir = join(ROOT, "public", "data", "feed");
  assert.ok(existsSync(join(dir, "index.json")), "run npm run data");
  const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
  assert.deepEqual(index, JSON.parse(JSON.stringify(feedIndex)), "the index the page is built with");
  for (const { month, count } of index.months) {
    const items = JSON.parse(readFileSync(join(dir, `${month}.json`), "utf8")) as FeedItem[];
    assert.equal(items.length, count, month);
    assert.ok(items.every((f) => f.date.startsWith(`${month}-`)), month);
  }
  const titles = JSON.parse(readFileSync(join(dir, "titles.json"), "utf8"));
  assert.equal(titles.length, feedItems.length);
  const raw = readFileSync(join(SRC, "data", "generated", "dataset.json"), "utf8");
  const dataset = JSON.parse(raw);
  assert.ok(!("feed" in dataset), "dataset.json has no feed");
  assert.ok(dataset.incidentPatterns.every((p: object) => !("feed" in p)), "nor do its incident patterns list their items: they count them");
  for (const f of feedItems) assert.ok(!raw.includes(serialised(f)), `${f.id} is not in dataset.json`);
});

/** How the build writes an item, as far as its kind: what would show if the feed crept back into a bundle. */
const serialised = (f: FeedItem) => `{"id":${JSON.stringify(f.id)},"kind":${JSON.stringify(f.kind)},"weight":${JSON.stringify(f.weight)},"date":${JSON.stringify(f.date)}`;

const OUT = join(ROOT, "out");
test("in the built site no JavaScript chunk carries a feed item, and the months and feed.xml are served", { skip: !existsSync(join(OUT, "_next")) && "no out/: npm run build first" }, () => {
  const chunks = walk(join(OUT, "_next")).filter((f) => f.endsWith(".js"));
  assert.ok(chunks.length > 0);
  const text = chunks.map((f) => [f, readFileSync(f, "utf8")] as const);
  // The needle is the item as the build serialises it; a feed file loaded at run time never is a chunk.
  if (feedItems[0]) assert.ok(readFileSync(join(OUT, "data", "feed", `${feedIndex.months[0].month}.json`), "utf8").includes(serialised(feedItems[0])), "the needle finds an item where it is");
  for (const f of feedItems) {
    const needle = serialised(f);
    const hit = text.find(([, js]) => js.includes(needle));
    assert.ok(!hit, `${f.id} is in ${hit && relative(OUT, hit[0])}: the feed has crept back into the bundle (rebuild if out/ is stale)`);
  }
  assert.ok(existsSync(join(OUT, "data", "feed", "index.json")), "out/data/feed/index.json");
  for (const { month } of feedIndex.months) assert.ok(existsSync(join(OUT, "data", "feed", `${month}.json`)), month);
  assert.ok(existsSync(join(OUT, "feed.xml")), "out/feed.xml");
  // Every page names the feed for a feed reader: the home page and the feed itself, say.
  for (const page of ["index.html", join("feed", "index.html")]) {
    const link = readFileSync(join(OUT, page), "utf8").match(/<link rel="alternate" type="application\/rss\+xml"[^>]*>/)?.[0] ?? "";
    assert.match(link, /href="[^"]*\/feed\.xml"/, page);
    assert.match(link, /title="Daily feed · AI Security Architecture"/, page);
  }
});

// --- Review material stays in the repository ------------------------------------------------------------

/** The words of the review: what the proposed-updates panel, the "Site update" lines and the approve lines said. */
const REVIEW_WORDS = /Proposed site updates|Site update|decisions\.yaml|data-proposed|data-approve-line|data-decision|data-site-update|decision: approve/;

test("no source file of the site speaks of proposals, site updates, approving or decisions.yaml", () => {
  const sources = walk(SRC).filter((f) => /\.(ts|tsx|css)$/.test(f) && !f.startsWith(join(SRC, "data")));
  assert.ok(sources.length > 50);
  for (const f of sources) assert.doesNotMatch(readFileSync(f, "utf8"), /Proposed site update|Site update|site update|decisions\.yaml|data-approve-line|proposedUpdates|FEED_DECISIONS/, relative(ROOT, f));
});

test("the generated feed files carry no item's site update and no decision", () => {
  const dir = join(ROOT, "public", "data", "feed");
  assert.ok(existsSync(join(dir, "index.json")), "run npm run data");
  for (const f of feedItems) assert.ok(!("update" in f) && !("decision" in f), `${f.id} in feed.json`);
  const files = [join(SRC, "data", "generated", "feed.json"), ...readdirSync(dir).map((n) => join(dir, n))];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /"update":|"decision":/, relative(ROOT, file));
    assert.doesNotMatch(text, REVIEW_WORDS, relative(ROOT, file));
  }
});

test("no built page and no feed.xml shows a proposal, a site update or an approve line", { skip: !existsSync(join(OUT, "_next")) && "no out/: npm run build first" }, async () => {
  // The notes the updates carry in the YAML, as the loader reads them: none may reach a reader.
  const { loadFeed } = await import("./lib/feed");
  const loaded = await loadFeed(
    ROOT,
    {
      patternIds: new Set(dataset.archetypes.map((a) => a.id)),
      incidentIds: new Set(dataset.incidents.map((i) => i.id)),
      categoryIds: new Set(dataset.incidentPatterns.map((p) => p.id)),
      productIds: new Set(dataset.tools.map((t) => t.id)),
      controlIds: new Set(dataset.mitigations.map((m) => m.id)),
    },
    () => {},
  );
  const notes = loaded.feed.flatMap((f) => (f.update ? [f.update.note] : [])).filter((n) => n.length >= 24);
  const html = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  const pages = walk(OUT).filter((f) => /\.(html|txt|xml|json|rsc)$/.test(f));
  assert.ok(pages.some((f) => f.endsWith(join("feed", "index.html"))) && pages.some((f) => f.endsWith("feed.xml")), "the feed and feed.xml are built");
  for (const file of pages) {
    const text = readFileSync(file, "utf8");
    const where = relative(OUT, file);
    assert.doesNotMatch(text, REVIEW_WORDS, where);
    for (const note of notes) assert.ok(!text.includes(note) && !text.includes(html(note)) && !text.includes(JSON.stringify(note).slice(1, -1)), `${where} carries an update note: ${note.slice(0, 60)}`);
  }
});
