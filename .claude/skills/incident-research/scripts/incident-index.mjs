#!/usr/bin/env node
/**
 * Print what the incident patterns, the deep dives and the feed already hold, so a run knows
 * where to start, what it must not file twice and what it may write: every incident pattern with
 * its deep dives and feed items, every deep dive with its date, pattern and incident pattern,
 * every "also seen" entry, every feed item, every source address, the newest feed date (where
 * the daily run's window starts), the next free file numbers, where a first deep dive is still
 * missing, and the loose items of the last 60 days (the trigger for a new incident pattern).
 *
 *   node incident-index.mjs           the index
 *   node incident-index.mjs --urls    only the source addresses already cited (for de-duplication)
 *
 * The feed holds five kinds of item; this index lists the incidents, and `--urls` the sources of
 * every kind, so a daily run never files the same page twice under two kinds.
 *
 * Reads src/data/generated/dataset.json and feed.json (both written by `npm run data`, never
 * committed), so run `npm run data` first.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let dataset;
let items;
try {
  dataset = JSON.parse(readFileSync(join(root, "src/data/generated/dataset.json"), "utf8"));
  items = JSON.parse(readFileSync(join(root, "src/data/generated/feed.json"), "utf8"));
} catch {
  console.error("Run this from the repository root, after `npm run data`.");
  process.exit(1);
}
const incidents = [...dataset.incidents].sort((a, b) => b.date.localeCompare(a.date));
// Every item, of every kind; an item written before kinds existed is an incident.
const all = [...items].sort((a, b) => b.date.localeCompare(a.date));
const feed = all.filter((f) => (f.kind ?? "incident") === "incident");
const patterns = [...(dataset.incidentPatterns ?? [])].sort((a, b) => a.order - b.order);
const urls = new Set();
for (const i of incidents) {
  for (const s of i.sources ?? []) urls.add(s.url);
  for (const st of i.steps ?? []) for (const s of st.sources ?? []) urls.add(s.url);
  for (const r of i.alsoSeen ?? []) for (const s of r.sources ?? []) urls.add(s.url);
}
for (const f of all) for (const s of f.sources ?? []) urls.add(s.url);
if (process.argv.includes("--urls")) {
  console.log([...urls].sort().join("\n"));
  process.exit(0);
}
const arch = new Map(dataset.archetypes.map((a) => [a.id, a.title]));
const numbered = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => /^\d+-.*\.yaml$/.test(f)) : []);
const nextOf = (files) => String(Math.max(0, ...files.map((f) => Number(f.split("-")[0]))) + 1).padStart(2, "0");
const next = nextOf(numbered(join(root, "data/incidents")));
const nextPattern = nextOf(numbered(join(root, "data/incident-patterns")));
const dir = join(root, "docs/research/daily");
const logs = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort() : [];
const today = new Date().toISOString().slice(0, 10);
const monday = (() => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
})();
const daysBefore = (n) => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

console.log(`Today (UTC): ${today}`);
console.log(`This week's log: docs/research/daily/${monday}.md${logs.includes(`${monday}.md`) ? " (exists: append today's section)" : " (new: start it)"}`);
console.log(`Last log on record: ${logs.length ? logs.at(-1).replace(".md", "") : "none"}`);
console.log(`Newest feed incident: ${feed[0] ? `${feed[0].date} (${feed[0].id})` : "none yet"}; newest item of any kind: ${all[0] ? `${all[0].date} (${all[0].id}, ${all[0].kind ?? "incident"})` : "none; the feed is empty"}`);
console.log(`Newest deep dive: ${incidents[0]?.date ?? "none"}`);
console.log(`Feed items: ${all.length}, of which ${feed.length} incidents, in data/feed/<YYYY-MM>.yaml`);
console.log(`Next deep dive file: data/incidents/${next}-<id>.yaml`);
console.log(`Next incident pattern file: data/incident-patterns/${nextPattern}-<slug>.yaml (order ${patterns.length + 1})`);
console.log(`Sources already cited: ${urls.size}\n`);

console.log("INCIDENT PATTERNS  (order · id · slug · deep dives · feed items · name)");
if (!patterns.length) console.log("  none yet: every category will fail until data/incident-patterns/ has files");
for (const p of patterns) {
  console.log(`  ${String(p.order).padStart(2)}  ${p.id.padEnd(18)} ${p.slug.padEnd(28)} ${String(p.deepDives?.length ?? 0).padStart(3)} ${String(p.feedCount ?? 0).padStart(4)}  ${p.name}`);
  console.log(`      ${p.short}`);
}

console.log("\nDEEP DIVES  (date · id · incident pattern · pattern)");
for (const i of incidents) {
  console.log(`  ${i.date}  ${i.id.padEnd(34)} ${i.category.padEnd(18)} ${arch.get(i.archetype) ?? i.archetype}`);
  console.log(`           ${i.title}`);
  for (const r of i.alsoSeen ?? []) console.log(`           also seen: ${r.title}`);
}
console.log("\nFEED INCIDENTS  (date · id · incident pattern · evidence · weight · story · deep dive)");
if (!feed.length) console.log("  none yet");
for (const f of feed) {
  console.log(`  ${f.date}  ${f.id.padEnd(34)} ${(f.category + (f.fit === "loose" ? " (loose)" : "")).padEnd(26)} ${f.evidence.padEnd(13)} ${(f.weight ?? "-").padEnd(9)} ${(f.story ?? "-").padEnd(20)} ${f.incident ?? ""}`);
}
// A follow-up joins its thread's story: items that tell one deep dive but share no story are the first place to look.
const byDeepDive = new Map();
for (const f of feed.filter((x) => x.incident && x.date > daysBefore(30))) byDeepDive.set(f.incident, [...(byDeepDive.get(f.incident) ?? []), f]);
const unstoried = [...byDeepDive].filter(([, fs]) => fs.length > 1 && new Set(fs.map((f) => f.story ?? f.id)).size > 1);
if (unstoried.length) {
  console.log("\nFOLLOW-UPS IN THE LAST 30 DAYS WITH NO SHARED STORY  (deep dive · items): give each thread one story");
  for (const [dd, fs] of unstoried) console.log(`  ${dd.padEnd(34)} ${fs.map((f) => f.id).join(", ")}`);
}
const told = new Set(feed.map((f) => f.incident).filter(Boolean));
const untold = incidents.filter((i) => !told.has(i.id)).map((i) => i.id);
if (feed.length && untold.length) console.log(`Deep dives no feed item points to: ${untold.join(" · ")}`);

// Where a first exemplar is still missing: a feed item that would be the first earns a deep dive.
const noDeepDive = patterns.filter((p) => !incidents.some((i) => i.category === p.id)).map((p) => p.id);
console.log(`\nIncident patterns with no deep dive yet: ${noDeepDive.join(" · ") || "none"}`);
const unused = dataset.archetypes.filter((a) => !incidents.some((i) => i.archetype === a.id)).map((a) => a.title);
console.log(`Patterns with no deep dive yet: ${unused.join(" · ") || "none"}`);

// The trigger for a new incident pattern: three or more loose items in 60 days that share a mechanism.
const since = daysBefore(60);
const loose = feed.filter((f) => f.fit === "loose" && f.date > since);
console.log(`\nLOOSE ITEMS SINCE ${since}  (filed under · date · id · why the fit is loose)`);
if (!loose.length) console.log("  none");
for (const p of patterns) {
  const mine = loose.filter((f) => f.category === p.id);
  if (!mine.length) continue;
  console.log(`  ${p.id} (${mine.length})`);
  for (const f of mine) console.log(`    ${f.date}  ${f.id.padEnd(34)} ${f.fitNote ?? ""}`);
}
if (loose.length >= 3) console.log("  Three or more: read them together and check the new-incident-pattern test in SKILL.md.");
