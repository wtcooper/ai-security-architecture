#!/usr/bin/env node
/**
 * The verifier's brief, and the gate that reads its findings. From `git diff` against origin/main
 * it prints every new or changed feed item, story, day and week overview, tooling row, security
 * tool, catalogue entry, decision and incident file, each with its sources and the feed-lint
 * checks the verifier must rule on, highest stakes first: headline and notable items, then
 * tooling and control changes, then incident files, then stories and overviews, then briefs.
 *
 *   node verify-brief.mjs                         the brief (Markdown) on stdout
 *   node verify-brief.mjs --out <file>            the brief, written to <file> for the verifier
 *   node verify-brief.mjs --json                  the entries as JSON
 *   node verify-brief.mjs --part 2/3              one of three parts, for three verifiers started together
 *   node verify-brief.mjs --only <ref,ref>        only these entries: a re-check after a fix
 *   node verify-brief.mjs --audit [--sample 10] [--seed N] [--week <Monday>]
 *                                                 Monday's self-audit: a random sample of last week's items
 *   node verify-brief.mjs --gate <a.json[,b.json]>
 *                                                 the gate: exit 0 only when every entry in the diff has a
 *                                                 verdict, every blocking finding is resolved, nothing marked
 *                                                 dropped is still there, and nothing changed after its check
 *                                                 without a recorded finding; prints the table for the log
 *   --base <ref> --today <YYYY-MM-DD> --standalone <id,id> (as feed-lint) --force (brief despite lint errors)
 *
 * The brief carries no reasoning from the run, only what the diff holds: the verifier is given this
 * and references/verification.md, and nothing else.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { stringify } from "yaml";

import { lint } from "./feed-lint.mjs";
import {
  baseRef, canon, changedPaths, dayMonth, isDay, isoWeek, len, LIMITS, loadDecisions, loadFeed, loadOverviews, loadStories, mondayOf,
  names, otherChangedPaths, same, shift, shortSha, str, textAt, todayArg, yamlAt,
} from "./lib.mjs";

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const base = baseRef(argv);
const today = todayArg(argv);
const standalone = new Set((opt("--standalone") ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const nm = names();
const hashOf = (v) => createHash("sha256").update(JSON.stringify(canon(v))).digest("hex").slice(0, 10);
const isRecord = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** Priority: lower is checked first. A brief item left unchecked is dropped, so briefs come last. */
const P = { headline: 0, notable: 1, tooling: 2, control: 2, tool: 2, decision: 2, incidentFile: 3, story: 4, overview: 4, brief: 5, other: 6 };

// --- Names ------------------------------------------------------------------------------------
const productName = (id) => {
  const p = nm.product.get(id);
  return p ? `${id} (${p.name}, ${p.vendor}; on ${p.pattern} "${nm.pattern.get(p.pattern) ?? "?"}")` : `${id}${nm.ok ? " (NOT a product on the site)" : ""}`;
};
const patternName = (id) => `${id} (${nm.pattern.get(id) ?? (nm.ok ? "NOT a pattern" : "?")})`;
const controlName = (id) => `${id} (${nm.control.get(id) ?? (nm.ok ? "NOT in the catalogue" : "?")})`;
const list = (ids, fn) => (Array.isArray(ids) && ids.length ? ids.map((x) => fn(str(x))).join("; ") : "none");

/** Every https address in a value, with the title and publisher beside it where there are any. */
function sourcesIn(v, out = []) {
  if (Array.isArray(v)) v.forEach((x) => sourcesIn(x, out));
  else if (isRecord(v)) {
    if (typeof v.url === "string") out.push({ title: str(v.title), url: v.url, publisher: str(v.publisher), date: str(v.date) });
    for (const [k, x] of Object.entries(v)) if (k !== "url") sourcesIn(x, out);
  }
  return out.filter((s, i, a) => a.findIndex((t) => t.url === s.url) === i);
}
const sourceLines = (sources) =>
  sources.length ? sources.map((s, i) => `  ${i + 1}. ${[s.title, s.publisher, s.date].filter(Boolean).join(" · ") || "(no title)"}\n     ${s.url}`) : ["  (none: every claim here has nothing to stand on)"];
const show = (v) => (v === undefined ? "(absent)" : typeof v === "string" ? `"${str(v)}"` : JSON.stringify(canon(v)));
const yamlBlock = (v) => ["```yaml", stringify(v, { lineWidth: 110 }).trimEnd(), "```"];

// --- Entries ----------------------------------------------------------------------------------
function itemEntry(f, status, { old, checks = [] } = {}) {
  const raw = { ...f };
  delete raw.file;
  const weight = str(f.weight) || "(no weight)";
  const story = str(f.story);
  const stories = loadStoriesCached();
  const lines = [
    `${f.kind} · ${weight} · date ${f.date} · added ${str(f.added) || "(none)"} · ${story ? `story ${story} "${stories.get(story)?.title ?? "NOT in stories.yaml"}"` : "no story (stands alone)"}`,
    `file: ${f.file}`,
    `title (${len(str(f.title))}/${LIMITS.title}): ${str(f.title)}`,
    `summary (${len(str(f.summary))}/${LIMITS.summary}): ${str(f.summary)}`,
    `why (${len(str(f.why))}/${LIMITS.why}): ${str(f.why) || "(none)"}`,
  ];
  if (f.vendor) lines.push(`vendor: ${str(f.vendor)}`);
  lines.push(`products: ${list(f.products, productName)}`, `controls: ${list(f.controls, controlName)}`, `patterns: ${list(f.patterns, patternName)}`);
  if (f.kind === "incident") {
    const cat = str(f.category);
    lines.push(
      `incident pattern: ${cat} (${nm.incidentPattern.get(cat) ?? "?"}) · perspective ${str(f.perspective)} · evidence ${str(f.evidence)}${f.fit ? ` · fit ${str(f.fit)}: ${str(f.fitNote)}` : ""}`,
      `deep dive: ${f.incident ? `${str(f.incident)} (${nm.deepDive.get(str(f.incident)) ?? "?"})` : "none"}${f.cves?.length ? ` · CVEs ${f.cves.join(", ")}` : ""}`,
    );
  }
  if (f.update) lines.push(`update: ${str(f.update.action)} · ${str(f.update.status)} · target ${str(f.update.target)} · note: ${str(f.update.note)}`);
  if (old) {
    const changes = [...new Set([...Object.keys(old), ...Object.keys(f)])].filter((k) => k !== "file" && !same(old[k], f[k]));
    lines.push("changed (was → now): check the new values", ...changes.map((k) => `  ${k}: ${show(old[k])} → ${show(f[k])}`));
    if (old.file !== f.file) lines.push(`  moved from ${old.file}`);
  }
  lines.push("sources:", ...sourceLines(Array.isArray(f.sources) ? f.sources : []));
  const w = str(f.weight);
  return { ref: `item:${f.id}`, type: "item", status, file: f.file, priority: w === "headline" ? P.headline : w === "notable" ? P.notable : P.brief, hash: hashOf(raw), label: str(f.title), lines, checks };
}

let storiesCache;
const loadStoriesCached = () => (storiesCache ??= loadStories(null));

/** Records inside a YAML document that differ: list elements are matched by their id, mitigation, n, date, week, title or name. */
const ID_KEYS = ["id", "mitigation", "n", "date", "week", "title", "name"];
/** Lists that are part of their record (its sources, its evidence, a control row's steps), not records of their own. */
const FIELD_LISTS = new Set(["sources", "evidence", "body", "links", "urls", "references"]);
function idKey(a, b, field) {
  if (FIELD_LISTS.has(field)) return null;
  const key = idKeyOf(a, b);
  return field === "steps" && key !== "n" ? null : key; // a deep dive's numbered steps are records; a control row's steps are not
}
function idKeyOf(a, b) {
  const xs = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
  if (!xs.length || !(Array.isArray(a) || a == null) || !(Array.isArray(b) || b == null) || !xs.every(isRecord)) return null;
  return ID_KEYS.find((k) => [a, b].every((arr) => !arr || (arr.every((x) => x[k] != null) && new Set(arr.map((x) => str(x[k]))).size === arr.length))) ?? null;
}
function diffList(a, b, path, key, emit) {
  const A = new Map((a ?? []).map((x) => [str(x[key]), x]));
  const B = new Map((b ?? []).map((x) => [str(x[key]), x]));
  for (const [k, x] of B) {
    const p = [...path, k];
    if (!A.has(k)) emit({ status: "new", path: p, value: x });
    else if (!same(A.get(k), x)) {
      const own = diffRecord(A.get(k), x, p, emit);
      if (own.length) emit({ status: "changed", path: p, value: x, changes: own });
    }
  }
  for (const [k, x] of A) if (!B.has(k)) emit({ status: "removed", path: [...path, k], value: x });
}
function diffRecord(a, b, path, emit) {
  const own = [];
  for (const k of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    const x = a?.[k], y = b?.[k];
    if (same(x, y)) continue;
    const key = idKey(x, y, k);
    if (key) diffList(x, y, [...path, k], key, emit);
    else own.push({ field: k, old: x, new: y });
  }
  return own;
}
/** A record without its lists of sub-records (a product without its rows), which the brief lists apart. */
const ownView = (v) =>
  isRecord(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Array.isArray(x) && idKey(x, undefined, k) ? `(${x.length} entries, each listed apart when it changed)` : x])) : v;
function recordEntries(file, old, now) {
  const out = [];
  const emit = (r) => out.push(r);
  if (old == null && now != null) emit({ status: "new", path: [], value: now });
  else if (now == null && old != null) emit({ status: "removed", path: [], value: old });
  else if (Array.isArray(old) && Array.isArray(now)) {
    const key = idKey(old, now);
    if (key) diffList(old, now, [], key, emit);
    else if (!same(old, now)) emit({ status: "changed", path: [], value: now, changes: [{ field: "(whole file)", old, new: now }] });
  } else if (isRecord(old) && isRecord(now)) {
    const own = diffRecord(old, now, [], emit);
    if (own.length) emit({ status: "changed", path: [], value: now, changes: own });
  }
  return out.map((r) => {
    // A key that is a title can hold commas or slashes; a ref must survive `--only a,b`.
    const seg = (k) => { const s = String(k).replace(/[,/#]/g, ";"); return [...s].length > 60 ? `${[...s].slice(0, 57).join("")}...` : s; };
    const ref = r.path.length ? `${file}#${r.path.map(seg).join("/")}` : file;
    const kind = file.startsWith("data/tooling/") ? "tooling" : file.startsWith("data/security-tools/") ? "tool" : file.startsWith("data/overlay/") ? "control"
      : file.startsWith("data/incidents/") || file.startsWith("data/incident-patterns/") ? "incidentFile" : "other";
    const where = file.startsWith("data/tooling/") && r.path[0] === "tools" ? `${r.path.slice(2).join(" ") || "product"} of ${productName(r.path[1])}` : "";
    // A changed record shows (and is hashed on) its own fields: its rows and steps are entries of their own.
    const shown = r.status === "changed" ? ownView(r.value) : r.value;
    const lines = [`${r.status} ${r.path.length ? "entry" : "file"}${where ? `: ${where}` : ""}`, `file: ${file}`];
    if (r.status === "new" && !r.path.length && textAt(null, file)) lines.push("```yaml", textAt(null, file).trimEnd(), "```");
    else lines.push(...yamlBlock(shown));
    if (r.changes) lines.push("changed (was → now): check the new values", ...r.changes.map((c) => `  ${c.field}: ${show(c.old)} → ${show(c.new)}`));
    if (r.status === "removed") lines.push("removed: confirm the removal is right (the setting is retired, the entry was wrong) and that the file's header says why");
    lines.push("sources:", ...sourceLines(sourcesIn(shown)));
    return { ref, type: "record", status: r.status, file, priority: r.status === "removed" ? P.other : P[kind], hash: hashOf(shown), label: str(r.value?.name ?? r.value?.title ?? r.value?.id ?? r.path.at(-1) ?? file), lines, checks: [] };
  });
}

function storyEntry(s, status, feed) {
  const members = feed.items.filter((f) => str(f.story) === s.id);
  const lines = [
    `title (${len(s.title)}/${LIMITS.storyTitle}): ${s.title}`,
    `deep dive: ${s.incident ? `${str(s.incident)} (${nm.deepDive.get(str(s.incident)) ?? "?"})` : "none"}`,
    `items (${members.length}), newest first: check each belongs to this story, and that no follow-up of it is left outside`,
    ...members.map((f) => `  - ${f.date} · ${f.kind} · ${str(f.weight) || "?"} · ${f.id}: ${str(f.title)}`),
  ];
  return { ref: `story:${s.id}`, type: "story", status, file: "data/feed/stories.yaml", priority: P.story, hash: hashOf(s), label: s.title, lines, checks: [] };
}
const rank = (f) => ((i) => (i < 0 ? 3 : i))(["headline", "notable", "brief"].indexOf(str(f.weight)));
function overviewEntry(kind, key, text, status, feed, added) {
  // A day overview is keyed by `added` (what that day's run filed); a week overview by the Monday of `date`.
  const inScope = kind === "day" ? feed.items.filter((f) => str(f.added) === key) : feed.items.filter((f) => isDay(f.date) && mondayOf(f.date) === key);
  const line = (f) => `  - ${str(f.weight) || "?"} · ${f.kind} · ${f.date} · ${f.id}${added.includes(f) ? " (new today)" : ""}: ${str(f.title)}`;
  const limit = kind === "day" ? LIMITS.dayOverview : LIMITS.weekOverview;
  const lines = [
    `${kind === "day" ? "day" : `week of ${dayMonth(key)} (${isoWeek(key).label})`} overview (${len(text)}/${limit}): ${text}`,
    `Its sources are the items below. Check every claim is in one of them, as it stands now, the most important come first, and no inference is stated as fact.`,
    `items ${kind === "day" ? `filed on ${key} (added)` : "dated in the week"} (${inScope.length}):`,
    ...[...inScope].sort((a, b) => rank(a) - rank(b)).map(line),
  ];
  return { ref: `${kind}:${key}`, type: "overview", status, file: "data/feed/overviews.yaml", priority: P.overview, hash: hashOf(text), label: `${kind} ${key}`, lines, checks: [] };
}

/** Every entry the diff holds, highest stakes first. */
function diffEntries() {
  const now = loadFeed(null);
  const then = loadFeed(base);
  const lintResult = lint({ base, today, standalone });
  const checksOf = new Map();
  for (const c of lintResult.checks) {
    if (!checksOf.has(c.ref)) checksOf.set(c.ref, []);
    checksOf.get(c.ref).push(`${c.rule}: ${c.msg}`);
  }
  const entries = [];
  // New: not on main yet, or filed today (`added` is today), even if an earlier push today carried it.
  const added = now.items.filter((f) => !then.byId.has(f.id) || str(f.added) === today);
  for (const f of now.items) {
    const old = then.byId.get(f.id);
    const strip = (x) => ({ ...x, file: 0 });
    if (!old || added.includes(f)) entries.push(itemEntry(f, "new", { old: old && !same(strip(old), strip(f)) ? old : undefined, checks: checksOf.get(`item:${f.id}`) }));
    else if (!same(strip(old), strip(f))) entries.push(itemEntry(f, "changed", { old, checks: checksOf.get(`item:${f.id}`) }));
  }
  for (const f of then.items) if (!now.byId.has(f.id)) entries.push({ ref: `item:${f.id}`, type: "item", status: "removed", file: f.file, priority: P.other, hash: hashOf(null), label: str(f.title), lines: [`removed from the feed: ${f.kind} · ${f.date} · ${str(f.title)}`, "confirm the removal is right (a duplicate, or filed in error) and that the log says why"], checks: [] });

  const st = loadStories(null), stThen = loadStories(base);
  for (const [id, s] of st) if (!same(s, stThen.get(id))) entries.push(storyEntry(s, stThen.has(id) ? "changed" : "new", now));
  const ov = loadOverviews(null), ovThen = loadOverviews(base);
  for (const [d, text] of ov.days) if (ovThen.days.get(d) !== text) entries.push(overviewEntry("day", d, text, ovThen.days.has(d) ? "changed" : "new", now, added));
  for (const [w, text] of ov.weeks) if (ovThen.weeks.get(w) !== text) entries.push(overviewEntry("week", w, text, ovThen.weeks.has(w) ? "changed" : "new", now, added));
  const dec = loadDecisions(null), decThen = loadDecisions(base);
  for (const [id, d] of dec)
    if (!same(d, decThen.get(id))) {
      const f = now.byId.get(id);
      entries.push({
        ref: `decision:${id}`, type: "decision", status: decThen.has(id) ? "changed" : "new", file: "data/feed/decisions.yaml", priority: P.decision, hash: hashOf(d), label: id,
        lines: [`decision: ${d.decision}${d.note ? ` · note: ${d.note}` : ""}`, f?.update ? `the item's update now: ${str(f.update.action)} · ${str(f.update.status)} · target ${str(f.update.target)} · ${str(f.update.note)}` : "the item has no update", "check the change carried out is the one the item proposed, and that its status matches the decision (approve → applied, decline → declined)"],
        checks: [],
      });
    }

  const special = /^data\/feed\/(\d{4}-\d{2}|stories|overviews|decisions)\.yaml$/;
  for (const file of changedPaths(base).filter((p) => p.endsWith(".yaml") && !special.test(p))) {
    let old, cur;
    try {
      old = yamlAt(base, file);
      cur = yamlAt(null, file);
    } catch (e) {
      entries.push({ ref: file, type: "record", status: "broken", file, priority: P.headline, hash: "", label: file, lines: [String(e.message)], checks: [] });
      continue;
    }
    entries.push(...recordEntries(file, old, cur));
  }
  // Lint checks on stories, overviews and files go under their entry; one with no entry goes in the general list.
  const general = [];
  for (const c of lintResult.checks) {
    if (c.ref.startsWith("item:")) continue;
    const e = entries.find((x) => x.ref === c.ref);
    if (e) e.checks.push(`${c.rule}: ${c.msg}`);
    else general.push(`${c.ref} · ${c.rule}: ${c.msg}`);
  }
  entries.sort((a, b) => a.priority - b.priority || a.ref.localeCompare(b.ref));
  return { entries, lintResult, general };
}

/** Monday's self-audit: a random sample of the previous ISO week's items, as they stand now. */
function auditEntries() {
  const now = loadFeed(null);
  const monday = opt("--week") ?? shift(mondayOf(today), -7);
  const sunday = shift(monday, 6);
  const pool = now.items.filter((f) => f.date >= monday && f.date <= sunday).sort((a, b) => a.id.localeCompare(b.id));
  const n = Number(opt("--sample") ?? 10);
  let seed = Number(opt("--seed") ?? today.replace(/-/g, ""));
  const seedUsed = seed;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed / 2147483648);
  const picked = [];
  const left = [...pool];
  while (picked.length < n && left.length) picked.push(left.splice(Math.floor(rand() * left.length), 1)[0]);
  const checks = lint({ base, today, all: true }).checks;
  const entries = picked.map((f) => {
    const e = itemEntry(f, "audit", { checks: checks.filter((c) => c.ref === `item:${f.id}`).map((c) => `${c.rule}: ${c.msg}`) });
    if (f.update?.status === "applied") e.lines.push(`applied change: ${str(f.update.action)} → ${str(f.update.target)}. Check the row or file it names as well.`);
    return e;
  });
  return { entries, monday, sunday, pool: pool.length, seed: seedUsed };
}

// --- The gate ---------------------------------------------------------------------------------
function gate(paths) {
  const results = new Map();
  let independent = true;
  for (const p of paths) {
    let doc;
    try {
      const text = readFileSync(p, "utf8");
      // The verifier's reply as saved: bare JSON, or JSON in a ```json block with prose around it.
      const block = /```json\s*\n([\s\S]*?)\n```/.exec(text);
      doc = JSON.parse(block ? block[1] : text);
    } catch (e) {
      console.error(`${p}: not readable JSON (${e.message}). The verification did not complete.`);
      process.exit(1);
    }
    if (doc.verifier && doc.verifier !== "independent") independent = false;
    for (const r of Array.isArray(doc) ? doc : doc.results ?? []) {
      const prior = results.get(r.ref);
      results.set(r.ref, prior ? { ...r, findings: [...(prior.findings ?? []), ...(r.findings ?? [])] } : r);
    }
  }
  const { entries, lintResult } = diffEntries();
  const fails = lintResult.errors.map((e) => `${e.ref}: feed-lint error (${e.rule}): ${e.msg}`);
  const rows = [];
  const fixedIn = (r) => (r.findings ?? []).some((f) => /^fixed/i.test(str(f.resolution)));
  for (const e of entries) {
    const r = results.get(e.ref);
    if (!r) {
      fails.push(`${e.ref}: not verified. Verify it (--only ${e.ref}), or take it out of the diff`);
      continue;
    }
    if (str(r.verdict) === "drop") fails.push(`${e.ref}: the verifier said drop, and it is still in the diff`);
    for (const f of r.findings ?? []) {
      const res = str(f.resolution);
      const blocking = str(f.severity) !== "suggestion";
      if (blocking && !res) fails.push(`${e.ref}: unresolved finding (${str(f.check)}${f.field ? `, ${str(f.field)}` : ""}): ${str(f.issue)}`);
      else if (/^dropped/i.test(res)) fails.push(`${e.ref}: finding resolved as dropped, but the entry is still in the diff`);
      else if (blocking && !/^fixed/i.test(res)) fails.push(`${e.ref}: a blocking finding is resolved only as "${res}"; fix it or drop the entry`);
      else if (blocking && r.hash && r.hash === e.hash && !/^fixed (in|elsewhere)/i.test(res))
        fails.push(`${e.ref}: a finding is marked fixed, but the entry has not changed since it was verified (${str(f.issue)})`);
    }
    if (r.hash && r.hash !== e.hash && !fixedIn(r)) fails.push(`${e.ref}: changed after it was verified (hash ${r.hash} → ${e.hash}) with no fix recorded; record the change as a finding with its resolution, or verify it again`);
  }
  for (const [ref, r] of results) {
    const inDiff = entries.some((e) => e.ref === ref);
    for (const f of r.findings ?? []) rows.push(`| ${ref} | ${str(f.by) === "run" ? "run" : "verifier"} | ${str(f.severity) || "blocking"} · ${str(f.check)}${f.field ? ` (${str(f.field)})` : ""}: ${str(f.issue).replace(/\|/g, "/")} | ${(str(f.resolution) || (!inDiff ? "dropped" : str(f.severity) === "suggestion" ? "(no word)" : "UNRESOLVED")).replace(/\|/g, "/")} |`);
    if (!(r.findings ?? []).length) rows.push(`| ${ref} | verifier | none | ${str(r.verdict) || "pass"} |`);
  }
  console.log(`Gate against ${base} (${shortSha(base)}): ${entries.length} entries in the diff, ${results.size} verified${independent ? "" : " (by the run's own separate pass: NOT independent)"}.`);
  if (fails.length) {
    console.log(`\nFAIL (${fails.length}): nothing is committed until each is fixed or its entry is taken out of the diff`);
    for (const f of fails) console.log(`  ${f}`);
  } else console.log("\nPASS: every entry in the diff was verified and every finding is resolved.");
  console.log("\nFor the log (### Verification):\n\n| Entry | By | Finding | Resolution |\n| --- | --- | --- | --- |");
  for (const r of rows) console.log(r);
  process.exit(fails.length ? 1 : 0);
}

// --- Output -----------------------------------------------------------------------------------
function render(entries, heading, intro) {
  const out = [heading, "", ...intro, ""];
  for (const e of entries) {
    out.push(`## ${e.ref}`, `status: ${e.status} · hash: ${e.hash}`, ...e.lines);
    if (e.checks?.length) out.push("lint checks to rule on (each needs a word in your result):", ...e.checks.map((c) => `  - ${c}`));
    out.push("");
  }
  return out.join("\n");
}

if (argv.includes("--gate")) gate(opt("--gate").split(","));

let entries, heading, intro;
if (argv.includes("--audit")) {
  const a = auditEntries();
  entries = a.entries;
  heading = `# Weekly self-audit: ${a.entries.length} of the ${a.pool} items dated ${a.monday} to ${a.sunday} (seed ${a.seed})`;
  intro = [
    "These items are already on the site. Check each exactly as a new one, against its sources as they read today; a source that changed since is a finding only if the item is now wrong.",
    "Copy each entry's ref and hash into your result.",
  ];
} else {
  const d = diffEntries();
  entries = d.entries;
  if (d.lintResult.errors.length && !argv.includes("--force")) {
    console.error(`feed-lint reports ${d.lintResult.errors.length} errors. Fix them first (node .claude/skills/ai-security-daily/scripts/feed-lint.mjs); the verifier sees only lint-clean work.`);
    process.exit(1);
  }
  heading = `# Verification brief: ${today}, against ${base} (${shortSha(base)})`;
  intro = [];
  if (d.general.length && !opt("--only")) intro.push("General lint checks to rule on (put each in `general` in your result):", ...d.general.map((c) => `  - ${c}`), "");
  const others = otherChangedPaths(base);
  if (others.length) intro.push(`Not in this brief (outside data/; the run does not commit them): ${others.join(", ")}.`, "");
}
// --only takes refs separated by commas, or several --only flags; a ref never holds a comma.
const only = argv.flatMap((a, i) => (argv[i - 1] === "--only" ? a.split(",") : []));
if (only.length) {
  const want = new Set(only.map((s) => s.trim()));
  const missing = [...want].filter((r) => !entries.some((e) => e.ref === r));
  if (missing.length) console.error(`Not in the brief: ${missing.join(", ")}`);
  entries = entries.filter((e) => want.has(e.ref));
  heading += " · recheck";
}
const part = opt("--part");
if (part) {
  const [i, n] = part.split("/").map(Number);
  entries = entries.filter((_, k) => k % n === i - 1);
  heading += ` · part ${i} of ${n}`;
}
if (!argv.includes("--audit")) {
  const counts = {};
  for (const e of entries) counts[e.type] = (counts[e.type] ?? 0) + 1;
  intro.unshift(
    `${entries.length} entries (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}), highest stakes first: headline and notable items, tooling and control changes, incident files, stories and overviews, then briefs.`,
    "Each entry has its ref and hash (copy both into your result), what it says, its sources, and the lint checks you must rule on.",
    "",
  );
}
if (argv.includes("--json")) console.log(JSON.stringify({ base, today, entries }, null, 2));
else {
  const text = render(entries, heading, intro);
  if (opt("--out")) {
    writeFileSync(opt("--out"), text + "\n");
    console.log(`${entries.length} entries written to ${opt("--out")}`);
  } else console.log(text);
}
