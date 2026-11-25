#!/usr/bin/env node
/**
 * Print what the daily run needs before it searches: today's date, the window, this week's log,
 * the newest item of each kind, what the window already holds, the owner's decisions waiting to
 * be carried out, the security tools on file and the products a feed item may name.
 *
 *   node daily-index.mjs             the index
 *   node daily-index.mjs --urls      every source address already cited, of every kind (for de-duplication)
 *   node daily-index.mjs --products  the tooling ids a feed item may name, with the product and its pattern
 *
 * Reads src/data/generated/ (dataset.json, feed.json, security-tools.json) and
 * data/feed/decisions.yaml, so run `npm run data` first.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
let dataset, items, tools;
try {
  dataset = read("src/data/generated/dataset.json");
  items = read("src/data/generated/feed.json");
  tools = read("src/data/generated/security-tools.json");
} catch {
  console.error("Run this from the repository root, after `npm run data`.");
  process.exit(1);
}

const KINDS = ["incident", "productUpdate", "tool", "launch", "research"];
const feed = [...items].sort((a, b) => b.date.localeCompare(a.date));

if (process.argv.includes("--urls")) {
  const urls = new Set(feed.flatMap((f) => f.sources.map((s) => s.url)));
  for (const i of dataset.incidents) for (const s of [...(i.sources ?? []), ...(i.steps ?? []).flatMap((st) => st.sources ?? []), ...(i.alsoSeen ?? []).flatMap((r) => r.sources ?? [])]) urls.add(s.url);
  for (const t of tools) urls.add(t.url);
  console.log([...urls].sort().join("\n"));
  process.exit(0);
}

const arch = new Map(dataset.archetypes.map((a) => [a.id, a.title]));
if (process.argv.includes("--products")) {
  const vendor = new Map(dataset.vendors.map((v) => [v.id, v.name]));
  for (const t of [...dataset.tools].sort((a, b) => a.id.localeCompare(b.id))) console.log(`${t.id.padEnd(36)} ${t.name} (${vendor.get(t.vendor) ?? t.vendor}) · ${arch.get(t.architecture) ?? t.architecture}`);
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const shift = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const monday = shift(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
const from = shift(today, -7);
const logDir = join(root, "docs/research/daily");
const logs = existsSync(logDir) ? readdirSync(logDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort() : [];

console.log(`Today (UTC): ${today}`);
console.log(`Window: ${from} to ${today} (the last seven days); anything already in the feed is skipped`);
console.log(`This week's log: docs/research/daily/${monday}.md${logs.includes(`${monday}.md`) ? " (exists: append today's section)" : " (new: start it)"}`);
console.log(`Feed: ${feed.length} items; security tools on file: ${tools.length}`);

console.log("\nNEWEST OF EACH KIND");
for (const k of KINDS) {
  const f = feed.find((x) => x.kind === k);
  console.log(`  ${k.padEnd(14)} ${f ? `${f.date}  ${f.id}` : "none yet"}`);
}

const inWindow = feed.filter((f) => f.date >= from);
console.log(`\nALREADY IN THE WINDOW (${inWindow.length})  (date · kind · id · title)`);
for (const f of inWindow) console.log(`  ${f.date}  ${f.kind.padEnd(14)} ${f.id.padEnd(40)} ${f.title}`);

// The owner's answers: decisions.yaml is joined onto each item by the build.
const waiting = feed.filter((f) => f.update?.status === "proposed");
const approved = waiting.filter((f) => f.decision?.decision === "approve");
const declined = waiting.filter((f) => f.decision?.decision === "decline");
const open = waiting.filter((f) => !f.decision);
const line = (f) => `  ${f.date}  ${f.id.padEnd(40)} ${f.update.action.padEnd(16)} ${f.update.target}${f.decision?.note ? `  (owner: ${f.decision.note})` : ""}`;
console.log(`\nAPPROVED, TO CARRY OUT (${approved.length}): at most one onboard or control change this run, the oldest first`);
for (const f of [...approved].reverse()) console.log(line(f));
console.log(`\nDECLINED, TO MARK (${declined.length}): set update.status to declined and remove the line from decisions.yaml`);
for (const f of declined) console.log(line(f));
console.log(`\nPROPOSED, NOT YET DECIDED (${open.length}): the /feed/ panel lists them; leave them`);
for (const f of open) console.log(line(f));

// A security tool added on the same day as others counts against the three a run.
const added = tools.filter((t) => t.feed && feed.find((f) => f.id === t.feed)?.date >= from);
console.log(`\nSECURITY TOOLS (${tools.length}); announced in the window: ${added.map((t) => t.id).join(", ") || "none"}`);
for (const t of tools) console.log(`  ${t.id.padEnd(36)} ${t.name} (${t.by}, ${t.kind}, ${t.status}) · ${t.controls.join(", ")}`);

console.log("\nIds a feed item may name: products `--products`; controls in data/overlay/mitigations.yaml and specializations.yaml;");
console.log("patterns `node .claude/skills/incident-research/scripts/pattern-map.mjs`. Incident lane: `incident-index.mjs`.");
