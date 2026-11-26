#!/usr/bin/env node
/**
 * The owner's review queue, for a chat session: every feed item whose site update waits for the
 * owner (`update.status: proposed`) or is to be checked again later (`watch`), grouped by what it
 * would change, each with its id, date, target and note, and, for a proposal, the line that
 * approves it in data/feed/decisions.yaml (or the owner's answer, when there is one already).
 *
 * The site shows none of this: the updates stay in the repository (data/feed/<YYYY-MM>.yaml,
 * decisions.yaml and the run logs in docs/research/daily/). `npm run data` checks every rule;
 * this only reads, so it runs with plain Node and needs no build.
 *
 *   node scripts/review-queue.mjs            the queue of this repository
 *   node scripts/review-queue.mjs <root>     the queue of the repository at <root>
 *   npm run queue
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

/** What an update changes, in the order the queue lists them (scripts/lib/feed.ts has the same list). */
const ACTIONS = [
  ["settings", "Product settings"],
  ["toolOption", "Security tool"],
  ["onboard", "Onboard a product"],
  ["newControl", "New control"],
  ["newPattern", "New pattern"],
  ["controlGuidance", "Control guidance"],
];
const WAITING = ["proposed", "watch"];

/** A scalar as text: folded YAML loses its line breaks; a date stays a day. */
const str = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : typeof v === "number" ? String(v) : v instanceof Date ? v.toISOString().slice(0, 10) : "");

function read(file) {
  try {
    return parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`${file}: ${e.message.split("\n")[0]}`);
    process.exit(1);
  }
}

/** Every waiting update in data/feed/ under `root`, newest first, and the owner's answers. */
export function reviewQueue(root) {
  const dir = join(root, "data", "feed");
  if (!existsSync(dir)) return { waiting: [], newest: "" };
  const months = readdirSync(dir).filter((n) => /^\d{4}-\d{2}\.yaml$/.test(n)).sort();
  const decisionsFile = join(dir, "decisions.yaml");
  const decisions = new Map();
  if (existsSync(decisionsFile)) {
    const doc = read(decisionsFile);
    for (const d of Array.isArray(doc) ? doc : []) if (d && typeof d === "object") decisions.set(str(d.id), { decision: str(d.decision), note: str(d.note) });
  }
  const waiting = [];
  let newest = "";
  for (const file of months) {
    const doc = read(join(dir, file));
    for (const item of Array.isArray(doc?.items) ? doc.items : []) {
      if (!item || typeof item !== "object") continue;
      const date = str(item.date);
      if (date > newest) newest = date;
      const u = item.update;
      if (!u || typeof u !== "object" || !WAITING.includes(str(u.status))) continue;
      const id = str(item.id);
      waiting.push({ id, date, file, title: str(item.title), action: str(u.action), status: str(u.status), target: str(u.target), note: str(u.note), decision: decisions.get(id) });
    }
  }
  waiting.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return { waiting, newest };
}

/** The queue as text, grouped by action: proposals first, then what is watched. */
export function formatQueue({ waiting, newest }) {
  const proposed = waiting.filter((w) => w.status === "proposed").length;
  const watched = waiting.length - proposed;
  if (!waiting.length) return `Nothing waiting: no item in data/feed/ has a proposed or watched site update${newest ? ` (newest item ${newest})` : ""}.\n`;
  const lines = [
    `Review queue: ${proposed} ${proposed === 1 ? "proposal" : "proposals"} waiting, ${watched} to watch${newest ? ` (newest item ${newest})` : ""}`,
    "",
  ];
  const known = new Set(ACTIONS.map(([id]) => id));
  const groups = [...ACTIONS, ...[...new Set(waiting.map((w) => w.action))].filter((a) => !known.has(a)).map((a) => [a, a])];
  for (const [action, label] of groups) {
    const mine = waiting.filter((w) => w.action === action).sort((a, b) => WAITING.indexOf(a.status) - WAITING.indexOf(b.status));
    if (!mine.length) continue;
    lines.push(`${label} (${mine.length})`);
    for (const w of mine) {
      lines.push(`  ${w.status.padEnd(8)}  ${w.date}  ${w.id}`);
      if (w.title) lines.push(`            ${w.title}`);
      lines.push(`            target:  ${w.target}`);
      lines.push(`            note:    ${w.note}`);
      if (w.status === "proposed") {
        if (w.decision?.decision === "approve") lines.push(`            decided: approved${w.decision.note ? ` (${w.decision.note})` : ""}; the next daily run carries it out`);
        else if (w.decision?.decision === "decline") lines.push(`            decided: declined${w.decision.note ? ` (${w.decision.note})` : ""}; the next daily run marks it declined`);
        else lines.push(`            approve: - { id: ${w.id}, decision: approve }`);
      }
    }
    lines.push("");
  }
  lines.push(
    "To approve a proposal, add its line to data/feed/decisions.yaml (decision: decline to turn it down), or say so in the session.",
    "The next daily run carries out one approved change and rechecks what is watched when its note says.",
    "",
  );
  return lines.join("\n");
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) process.stdout.write(formatQueue(reviewQueue(resolve(process.argv[2] ?? process.cwd()))));
