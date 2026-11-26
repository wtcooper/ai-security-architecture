#!/usr/bin/env node
/**
 * What the daily run needs before it searches, and the skeleton of its digest after it pushes.
 * Reads the YAML in data/ directly (no build needed), and names from the compiled dataset when
 * `npm run data` has run.
 *
 *   node daily-index.mjs                 the index: today, the window, the base commit, the log, what the
 *                                        window holds, stories to join, overviews, decisions to act on,
 *                                        watch items due, security tools, and whether today is audit day
 *   node daily-index.mjs --urls          every source address already cited, of every kind (for de-duplication)
 *   node daily-index.mjs --products      the tooling ids a feed item may name, with the product and its pattern
 *   node daily-index.mjs --digest --base <sha>
 *                                        the digest's skeleton for what changed since <sha> (the base this run
 *                                        started from): the overview, headlines and notables with links, what
 *                                        went on the site, and the proposals waiting, numbered
 *   --today <YYYY-MM-DD>                 the run's day (default: today, UTC)
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  baseRef, changedPaths, containsBase, feedLink, filesAt, isDay, isoWeek, KIND_LABEL, KINDS, loadDecisions, loadFeed, loadOverviews, loadSecurityTools,
  loadStories, longDay, mondayOf, names, refExists, root, same, shift, shortSha, str, todayArg, windowOf, yamlAt,
} from "./lib.mjs";

const argv = process.argv.slice(2);
const today = todayArg(argv);
const feed = loadFeed(null);
const nm = names();

/** Every https address anywhere in a value. */
const urlsIn = (v, out = new Set()) => {
  if (Array.isArray(v)) v.forEach((x) => urlsIn(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) k === "url" && typeof x === "string" ? out.add(x) : urlsIn(x, out);
  return out;
};

if (argv.includes("--urls")) {
  const urls = new Set();
  for (const f of feed.items) urlsIn(f.sources, urls);
  for (const file of filesAt(null, "data/incidents").filter((f) => f.endsWith(".yaml"))) urlsIn(yamlAt(null, `data/incidents/${file}`), urls);
  for (const [, t] of loadSecurityTools(null)) if (t.url) urls.add(str(t.url));
  console.log([...urls].sort().join("\n"));
  process.exit(0);
}

if (argv.includes("--products")) {
  if (!nm.ok) {
    console.error("Run `npm run data` first: the product list comes from the compiled dataset.");
    process.exit(1);
  }
  for (const [id, p] of [...nm.product].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`${id.padEnd(36)} ${p.name} (${p.vendor}) · ${p.pattern} ${nm.pattern.get(p.pattern) ?? ""}`);
  process.exit(0);
}

const ACTION = { settings: "Settings row", toolOption: "Security tool", onboard: "Onboard", newControl: "New control", newPattern: "New pattern", controlGuidance: "Control guidance" };
const decisions = loadDecisions(null);
/** Proposals the owner has not answered, newest first: the digest numbers them in this order. */
const waiting = () => feed.items.filter((f) => str(f.update?.status) === "proposed" && !decisions.has(f.id)).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

if (argv.includes("--digest")) {
  if (!argv.includes("--base")) {
    console.error("--digest needs --base <sha>: the commit this run started from (daily-index prints it at the start).");
    process.exit(2);
  }
  const base = baseRef(argv);
  const then = loadFeed(base);
  const stories = loadStories(null);
  const added = feed.items.filter((f) => !then.byId.has(f.id));
  const changed = feed.items.filter((f) => then.byId.has(f.id) && !same({ ...f, file: 0 }, { ...then.byId.get(f.id), file: 0 }));
  const overview = loadOverviews(null).days.get(today);
  const out = [`AI security daily · ${longDay(today)}`, "", overview || "(No overview for today: nothing new was published.)", ""];
  const line = (f) => {
    const s = str(f.story);
    return `- ${KIND_LABEL[f.kind] ?? f.kind}: ${str(f.title)}${s && stories.get(s) ? ` (${stories.get(s).title})` : ""} ${feedLink(f.id)}`;
  };
  const byKind = (a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || b.date.localeCompare(a.date);
  for (const [label, w] of [["Headlines", "headline"], ["Notable", "notable"]]) {
    const list = added.filter((f) => str(f.weight) === w).sort(byKind);
    if (list.length) out.push(label, ...list.map(line), "");
  }
  const briefs = added.filter((f) => !["headline", "notable"].includes(str(f.weight)));
  if (briefs.length) out.push(`And ${briefs.length} brief${briefs.length === 1 ? "" : "s"} on the site.`, "");

  out.push("On the site");
  const site = [];
  for (const f of [...added, ...changed]) {
    const u = f.update;
    if (str(u?.status) !== "applied" || str(then.byId.get(f.id)?.update?.status) === "applied") continue;
    site.push(`- ${ACTION[str(u.action)] ?? str(u.action)}: ${str(u.note)} (${str(u.target)})`);
  }
  const paths = changedPaths(base);
  const toolsThen = loadSecurityTools(base);
  for (const [id, t] of loadSecurityTools(null)) if (!toolsThen.has(id) && !site.some((s) => s.includes(`(${id})`))) site.push(`- Security tool: ${str(t.name)} under ${(t.controls ?? []).join(", ")} (${id})`);
  for (const p of paths.filter((p) => /^data\/incidents\/.+\.yaml$/.test(p))) site.push(`- ${yamlAt(base, p) ? "Deep dive updated" : "New deep dive"}: ${str(yamlAt(null, p)?.title) || p} (${p})`);
  for (const p of paths.filter((p) => /^data\/incident-patterns\/.+\.yaml$/.test(p) && !yamlAt(base, p))) site.push(`- New incident pattern: ${str(yamlAt(null, p)?.name) || p} (${p})`);
  const decThen = loadDecisions(base);
  for (const [id, d] of decisions) if (!same(d, decThen.get(id))) site.push(`- Your decision carried out: ${d.decision} ${id}${d.note ? ` (${d.note})` : ""}`);
  if (changed.length) site.push(`- Corrected: ${changed.map((f) => f.id).join(", ")} (say what changed in a line each)`);
  out.push(...(site.length ? site : ["- No change to the site beyond the feed."]), "");

  const queue = waiting();
  out.push("Waiting for you");
  if (queue.length) queue.forEach((f, i) => out.push(`${i + 1}. ${ACTION[str(f.update.action)] ?? str(f.update.action)}: ${str(f.update.note) || str(f.update.target)} (${f.id})`));
  else out.push("- Nothing.");
  out.push("", "Problems", "- (The run fills this in: lint or verification failures, items dropped and why, pages that would not load. \"None.\" if none.)", "");
  out.push("To act on a proposal, reply in this session: approve 2, decline 3.");
  console.log(out.join("\n"));
  process.exit(0);
}

// --- The index --------------------------------------------------------------------------------
const { from } = windowOf(today);
const monday = mondayOf(today);
const logDir = join(root, "docs/research/daily");
const logs = existsSync(logDir) ? readdirSync(logDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort() : [];
let baseLine;
if (!refExists("origin/main")) baseLine = "origin/main is missing: run `git pull --ff-only origin main` first";
else {
  const sha = shortSha("origin/main");
  baseLine = `${sha} (origin/main): keep it; the digest is built with --base ${sha}${containsBase("origin/main") ? "" : ". HEAD is BEHIND it: pull before drafting"}`;
}

console.log(`Today (UTC): ${longDay(today)} (${today}), ISO week ${isoWeek(today).label}, Monday ${monday}`);
console.log(`Window: ${from} to ${today} (the last seven days); anything already in the feed is skipped`);
console.log(`Base commit for this run: ${baseLine}`);
console.log(`This week's log: docs/research/daily/${monday}.md${logs.includes(`${monday}.md`) ? " (exists: append today's section)" : " (new: start it)"}`);
console.log(`Feed: ${feed.items.length} items; names ${nm.ok ? "from the compiled dataset" : "unavailable (run `npm run data`)"}`);
if (new Date(`${today}T00:00:00Z`).getUTCDay() === 1)
  console.log(`\nMONDAY: run the weekly self-audit first (node .claude/skills/ai-security-daily/scripts/verify-brief.mjs --audit), on the items of ${shift(monday, -7)} to ${shift(monday, -1)}`);

console.log("\nNEWEST OF EACH KIND");
for (const k of KINDS) {
  const f = feed.items.find((x) => x.kind === k);
  console.log(`  ${k.padEnd(14)} ${f ? `${f.date}  ${f.id}` : "none yet"}`);
}

const inWindow = feed.items.filter((f) => f.date >= from);
console.log(`\nALREADY IN THE WINDOW (${inWindow.length})  (date · kind · weight · story · id · title)`);
for (const f of inWindow) console.log(`  ${f.date}  ${f.kind.padEnd(14)} ${(str(f.weight) || "-").padEnd(9)} ${(str(f.story) || "-").padEnd(30)} ${f.id.padEnd(40)} ${str(f.title)}`);
const headlines = new Map();
for (const f of inWindow) if (str(f.weight) === "headline") headlines.set(f.date, (headlines.get(f.date) ?? 0) + 1);
if (headlines.size) console.log(`  headlines per day: ${[...headlines].map(([d, n]) => `${d} ${n}`).join(", ")} (at most 3)`);

const stories = loadStories(null);
const recent = [...stories.values()].map((s) => ({ s, items: feed.items.filter((f) => str(f.story) === s.id) })).filter(({ items }) => items.some((f) => f.date >= shift(today, -30)));
console.log(`\nSTORIES WITH ITEMS IN THE LAST 30 DAYS (${recent.length}): a follow-up joins its story; a single setting joins its product's roll-up for the week`);
for (const { s, items } of recent) console.log(`  ${s.id.padEnd(40)} ${String(items.length).padStart(3)} items, newest ${items[0]?.date ?? "-"}  ${s.title}`);

const ov = loadOverviews(null);
console.log(`\nOVERVIEWS: today (${today}) ${ov.days.has(today) ? "written: update it" : "MISSING: write it"}; this week (${monday}) ${ov.weeks.has(monday) ? "written: update it" : "MISSING: write it"}`);

const proposed = feed.items.filter((f) => str(f.update?.status) === "proposed");
const approved = proposed.filter((f) => decisions.get(f.id)?.decision === "approve").sort((a, b) => a.date.localeCompare(b.date));
const declined = proposed.filter((f) => decisions.get(f.id)?.decision === "decline");
const line = (f) => `  ${f.date}  ${f.id.padEnd(40)} ${str(f.update.action).padEnd(16)} ${str(f.update.target)}${decisions.get(f.id)?.note ? `  (owner: ${decisions.get(f.id).note})` : ""}`;
console.log(`\nAPPROVED, NOT YET CARRIED OUT (${approved.length}): at most one onboard or control change a run, the oldest first`);
for (const f of approved) console.log(line(f));
console.log(`\nDECLINED, NOT YET MARKED (${declined.length}): set update.status to declined; keep the decision line as the record`);
for (const f of declined) console.log(line(f));
const watch = feed.items.filter((f) => str(f.update?.status) === "watch");
const dueOf = (f) => (str(f.update.note).match(/\d{4}-\d{2}-\d{2}/) ?? [])[0];
const due = watch.filter((f) => !dueOf(f) || dueOf(f) <= today);
console.log(`\nWATCH ITEMS DUE (${due.length} of ${watch.length}): recheck each; then applied, proposed, declined, or watch with a new date`);
for (const f of due) console.log(`  ${(dueOf(f) ?? "no date").padEnd(10)}  ${f.id.padEnd(40)} ${str(f.update.action).padEnd(16)} ${str(f.update.note)}`);
console.log(`\nPROPOSED, WAITING FOR THE OWNER: ${waiting().length} (\`npm run queue\` lists them; the digest numbers them)`);

const tools = loadSecurityTools(null);
const fresh = [...tools.values()].filter((t) => isDay(t.released) && t.released >= from);
console.log(`\nSECURITY TOOLS (${tools.size}); first released in the window: ${fresh.map((t) => t.id).join(", ") || "none"}`);
for (const [, t] of tools) console.log(`  ${t.id.padEnd(36)} ${str(t.name)} (${str(t.by)}, ${str(t.kind)}, ${str(t.status)}, released ${t.released}) · ${(t.controls ?? []).join(", ")}`);

console.log("\nIds a feed item may name: products `--products`; controls in data/overlay/mitigations.yaml and specializations.yaml;");
console.log("patterns `node .claude/skills/incident-research/scripts/pattern-map.mjs`. Incident lane: `incident-index.mjs`.");
