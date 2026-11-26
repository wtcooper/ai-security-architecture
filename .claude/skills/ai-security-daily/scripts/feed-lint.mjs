#!/usr/bin/env node
/**
 * The deterministic checks the daily run passes before the verifier starts. It reads the YAML
 * itself (no build needed) and compares the working tree with origin/main, so it sees exactly
 * what the run is about to publish.
 *
 *   node feed-lint.mjs                    the run's new and changed items, stories, overviews and tools
 *   node feed-lint.mjs --all              every item in the feed (an audit; old items predate some rules)
 *   node feed-lint.mjs --json             the same, as JSON
 *   --base <ref>                          compare with <ref> instead of origin/main
 *   --today <YYYY-MM-DD>                  the run's day (default: today, UTC)
 *   --standalone <id,id>                  product updates the run judged to stand alone (a default flips, or
 *                                         a new way for code to run or data to leave); the verifier checks it
 *
 * Three levels:
 *   ERROR  fix it, then lint again. The verifier starts only when there are none. Exit code 1.
 *   CHECK  a judgement the verifier must make; verify-brief.mjs prints each under its entry.
 *   NOTE   writing advice (text near its ceiling, an incident with no why); fix where it helps.
 *
 * The errors: duplicate source pages across the feed, a title too close to another, single-setting
 * product updates for one product in one week without their roll-up story, more than three
 * headlines on a day, no overview for today or this week, a tool whose first release is outside
 * the window, text over its limit, a missing or unknown kind, weight or status, a lead (Hacker
 * News, a newsletter) cited as the source, an update marked applied with no change behind it, and
 * more than three new security tools.
 */
import { pathToFileURL } from "node:url";

import {
  baseRef, behindMessage, changedPaths, COMMON_NAMES, containsBase, HEADLINES_PER_DAY, isDay, isLeadHost, isoWeek, isRunningPage, KINDS, len, LIMITS,
  loadFeed, loadOverviews, loadSecurityTools, loadStories, mondayOf, names, namesIn, otherChangedPaths, pageKey, rollupId, same,
  shift, shortSha, STATUSES, str, titleLikeness, todayArg, TOOLS_PER_RUN, WEIGHTS, windowOf,
} from "./lib.mjs";

/** Titles at or above this likeness are the same story told twice; between this and CLOSE, the verifier looks. */
const TOO_CLOSE = 0.5;
const CLOSE = 0.35;
/** A distinctive name shared with an item this many days apart may mark a follow-up. */
const FOLLOW_UP_DAYS = 30;

export function lint({ base, today, all = false, standalone = new Set() }) {
  const out = { errors: [], checks: [], notes: [] };
  const add = (level, ref, rule, msg) => out[level].push({ ref, rule, msg });
  const { from } = windowOf(today);

  const now = loadFeed(null);
  const then = loadFeed(base);
  const stories = loadStories(null);
  const storiesThen = loadStories(base);
  const overviews = loadOverviews(null);
  const overviewsThen = loadOverviews(base);
  const tools = loadSecurityTools(null);
  const toolsThen = loadSecurityTools(base);
  const changed = new Set(changedPaths(base));
  if (!all && !containsBase(base)) add("errors", "files", "base", behindMessage(base));
  const nm = names();

  // New: not on main yet, or filed today (`added`), even if an earlier run today already pushed it.
  const fresh = (f) => !then.byId.has(f.id);
  const isNew = (f) => fresh(f) || f.added === today;
  const scoped = now.items.filter((f) => all || isNew(f) || !same({ ...f, file: 0 }, { ...then.byId.get(f.id), file: 0 }));
  const inScope = new Set(scoped.map((f) => f.id));
  const newItems = scoped.filter(isNew);

  // --- Each item ------------------------------------------------------------------------------
  for (const f of scoped) {
    const ref = `item:${f.id}`;
    if (!KINDS.includes(f.kind)) add("errors", ref, "kind", `kind "${f.kind}" is not one of ${KINDS.join(", ")}`);
    const weight = str(f.weight);
    if (!weight) add("errors", ref, "weight", "needs a weight: headline, notable or brief");
    else if (!WEIGHTS.includes(weight)) add("errors", ref, "weight", `weight "${weight}" is not one of ${WEIGHTS.join(", ")}`);

    // added: the day the run filed it. Today for a new item; never changed afterwards; never before `date`.
    const filed = str(f.added);
    const filedBefore = str(then.byId.get(f.id)?.added);
    if (!filed) add("errors", ref, "added", `needs added: the day the run filed it (${today}, UTC, for a new item)`);
    else if (!isDay(filed)) add("errors", ref, "added", `added "${filed}" is not a day, YYYY-MM-DD`);
    else {
      if (!all && fresh(f) && filed !== today) add("errors", ref, "added", `a new item is added ${today} (today, UTC), not ${filed}`);
      if (!all && filedBefore && filedBefore !== filed) add("errors", ref, "added", `added changed from ${filedBefore} to ${filed}: an existing item's added never changes`);
      if (filed > today) add("errors", ref, "added", `added ${filed} is after today (${today})`);
      if (isDay(f.date) && filed < f.date) add("errors", ref, "added", `added ${filed} is before its date ${f.date}: an item is filed on or after the day it came to light`);
    }

    for (const [field, limit] of [["title", LIMITS.title], ["summary", LIMITS.summary], ["why", LIMITS.why], ["fitNote", LIMITS.fitNote]]) {
      const n = len(str(f[field]));
      if (n > limit) add("errors", ref, "length", `${field} is ${n} characters; at most ${limit}`);
      else if (n > 0.9 * limit) add("notes", ref, "length", `${field} is ${n} of ${limit} characters: a ceiling, not a target; cut it`);
    }
    if (f.kind !== "incident" && !str(f.why)) add("errors", ref, "why", `a ${f.kind} needs a why`);
    if (f.kind === "incident" && !str(f.why)) add("notes", ref, "why", "an incident with no why: give it one line on what a defender should check or do");

    const u = f.update;
    if (u) {
      const status = str(u.status);
      if (!STATUSES.includes(status)) add("errors", ref, "update", `update.status "${status}" is not one of ${STATUSES.join(", ")}`);
      if (len(str(u.note)) > LIMITS.updateNote) add("errors", ref, "length", `update.note is ${len(str(u.note))} characters; at most ${LIMITS.updateNote}`);
      if (status === "watch" && !/\d{4}-\d{2}-\d{2}|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(str(u.note)))
        add("errors", ref, "update", "a watch item's note says when to look again (a date)");
      // Applied means the change is in this run's diff (or was already on main).
      const wasApplied = str(then.byId.get(f.id)?.update?.status) === "applied";
      if (!all && status === "applied" && !wasApplied) {
        const target = str(u.target);
        if (str(u.action) === "toolOption") {
          const file = `data/security-tools/${target}.yaml`;
          if (!tools.has(target)) add("errors", ref, "applied", `update says applied, but ${file} does not exist (a toolOption target is the tool's id)`);
          else if (!changed.has(file)) add("errors", ref, "applied", `update says applied, but ${file} has no change in this run`);
        } else if (target.includes("/") && !changed.has(target)) add("errors", ref, "applied", `update says applied, but ${target} has no change in this run`);
      }
    }

    // Sources: the primary first, never a lead.
    const sources = Array.isArray(f.sources) ? f.sources : [];
    if (!sources.length) add("errors", ref, "sources", "needs one to three sources, the primary first");
    sources.forEach((s, i) => {
      if (!isLeadHost(str(s.url))) return;
      if (i === 0) add("errors", ref, "lead", `the primary source is a lead, not a source (${str(s.url)}); cite the vendor, project, agency or standards body`);
      else add("checks", ref, "lead", `cites a lead (${str(s.url)}); keep it only if it adds something the primary does not`);
    });

    if (isDay(f.date) && f.date > today) add("errors", ref, "date", `date ${f.date} is after today (${today})`);
    else if (!all && fresh(f) && isDay(f.date) && f.date < from && f.kind !== "tool")
      add("checks", ref, "late", `dated ${f.date}, before the window (${from}): a late find; confirm nobody filed it, and the log marks it late`);

    // Stories: the one named exists, and a settings roll-up holds one product's updates from one week.
    const story = str(f.story);
    if (story) {
      if (!stories.has(story)) add("errors", ref, "story", `story "${story}" is not in data/feed/stories.yaml`);
      const m = /^settings-(.+)-(\d{4})-w(\d{2})$/.exec(story);
      if (m) {
        const products = (f.products ?? []).map(str);
        if (f.kind !== "productUpdate") add("errors", ref, "story", `a settings roll-up holds product updates; this is a ${f.kind}`);
        if (!products.some((p) => squash(p) === squash(m[1]))) add("errors", ref, "story", `roll-up ${story} is for ${m[1]}, but the item's products are [${products.join(", ")}]`);
        if (isDay(f.date) && isoWeek(f.date).label !== `${m[2]}-w${m[3]}`) add("errors", ref, "story", `roll-up ${story} is week ${m[2]}-w${m[3]}, but the item is dated ${f.date} (${isoWeek(f.date).label})`);
      }
    } else if (f.kind === "productUpdate") {
      add("checks", ref, "standalone", standalone.has(f.id)
        ? "filed standalone by the run's judgement: confirm a default flips or it opens a new way for code to run or data to leave"
        : `no story: it stands alone only if a default flips or it opens a new way for code to run or data to leave; otherwise it joins ${rollupId(str(f.products?.[0]) || "<toolId>", isDay(f.date) ? f.date : today)}`);
    }

    // Tools: new means a first release inside the window.
    if (f.kind === "tool") {
      const tool = [...tools.values()].find((t) => str(t.feed) === f.id) ?? (str(u?.action) === "toolOption" ? tools.get(str(u?.target)) : undefined);
      if (tool) {
        const r = tool.released;
        if (!isDay(r)) add("errors", ref, "released", `${tool.file}: released "${r}" is not a day`);
        else if (!all && isNew(f) && (r < from || r > today)) add("errors", ref, "released", `${tool.file}: first released ${r}, outside the window (${from} to ${today}): not new; file nothing (or research, if it is one)`);
        else if (r > f.date || r < shift(f.date, -7)) add("errors", ref, "released", `${tool.file}: first released ${r}, not in the seven days before the item's date ${f.date}`);
        add("checks", ref, "first-release", `released ${r}: confirm it is the first release in the registry or repository (not a Show HN or blog date), and that the tool is maintained and documented`);
      } else add("checks", ref, "first-release", "no security-tools file records its first release: confirm the first release in the registry or repository is inside the window");
      if (/\b(prototype|proof[- ]of[- ]concept|research artifact|not maintained|unmaintained|experimental|alpha)\b/i.test(`${str(f.summary)} ${str(f.why)} ${str(tool?.what)}`))
        add("checks", ref, "prototype", "the text calls it a prototype, alpha or unmaintained: that is research, not a tool");
    }
    if ((f.kind === "research" || f.kind === "guidance") && /\b(campaigns?|intrusions?|threat actors?|APT\d*|Storm-\d+|Typhoon|Sleet|Chollima|Panda|ransomware|in the wild)\b/.test(`${str(f.title)} ${str(f.summary)}`))
      add("checks", ref, "campaign", "reads like campaign threat intelligence: that goes to the incident lane (an incident item, or an also-seen entry), not research or guidance");
  }

  // --- Across the feed ------------------------------------------------------------------------
  // The same page cited by two items: one event filed twice, or two events merged.
  const byPage = new Map();
  for (const f of now.items) (f.sources ?? []).forEach((s, i) => {
    const k = pageKey(str(s.url), { entry: true }); // two anchors on one reference page are two entries
    if (!byPage.has(k)) byPage.set(k, []);
    byPage.get(k).push({ f, primary: i === 0, url: str(s.url) });
  });
  for (const [, cites] of byPage) {
    for (const mine of cites.filter((c) => inScope.has(c.f.id))) {
      // A pair inside the scope is reported once, on the first of the two.
      const others = cites.filter((c) => c.f.id !== mine.f.id && !(inScope.has(c.f.id) && c.f.id < mine.f.id));
      if (!others.length) continue;
      const sameStory = (c) => str(c.f.story) && str(c.f.story) === str(mine.f.story);
      const ids = (cs) => [...new Set(cs.map((c) => c.f.id))].join(", ");
      const twice = others.filter((c) => mine.primary && c.primary && !sameStory(c) && !isRunningPage(mine.url));
      if (twice.length)
        add("errors", `item:${mine.f.id}`, "duplicate-source", `its primary (${mine.url}) is also the primary of ${ids(twice)}: one event filed twice, or one post holding two events. Merge them, put them in one story, or cite each event's own page`);
      const rest = others.filter((c) => !twice.includes(c));
      if (rest.length)
        add("checks", `item:${mine.f.id}`, "duplicate-source", `cites the same page as ${ids(rest)} (${mine.url})${isRunningPage(mine.url) ? ", a running page: confirm each item cites its own entry" : rest.every(sameStory) ? ", in the same story: confirm each tells its own event" : ""}`);
    }
  }

  // Titles too close to another: the same story twice, or a follow-up outside its story.
  for (const f of scoped)
    for (const g of now.items) {
      if (g.id === f.id || (inScope.has(g.id) && g.id < f.id)) continue; // a pair inside the scope is reported once
      const s = titleLikeness(f.title, g.title);
      const sameStory = str(f.story) && str(f.story) === str(g.story);
      if (sameStory) {
        // A story's items share its words; only a near-copy is worth a look.
        if (s >= TOO_CLOSE) add("checks", `item:${f.id}`, "close-title", `title is close to ${g.id}'s (${s.toFixed(2)}), in the same story: confirm they are different events`);
      } else if (s >= TOO_CLOSE) add("errors", `item:${f.id}`, "close-title", `title is too close to ${g.id}'s (${s.toFixed(2)}): "${str(g.title)}". The same event twice, or a follow-up for a story`);
      else if (s >= CLOSE) add("checks", `item:${f.id}`, "close-title", `title is near ${g.id}'s (${s.toFixed(2)}): "${str(g.title)}". Confirm they are different events`);
    }

  // Follow-ups: an item that continues another (same deep dive, or a distinctive shared name) belongs in one story with it.
  const publishers = new Set();
  for (const f of now.items) {
    for (const w of str(f.vendor).split(/\s+/)) publishers.add(w.toLowerCase());
    for (const s of f.sources ?? []) for (const w of str(s.publisher).split(/[\s(),]+/)) publishers.add(w.toLowerCase());
  }
  for (const [, p] of nm.product) for (const w of `${p.name} ${p.vendor}`.split(/\s+/)) publishers.add(w.toLowerCase());
  const nameCount = new Map();
  const namesOf = new Map(now.items.map((f) => [f.id, namesIn(`${str(f.title)} ${str(f.summary)}`).filter((n) => !COMMON_NAMES.has(n) && !publishers.has(n.toLowerCase()))]));
  for (const [, ns] of namesOf) for (const n of ns) nameCount.set(n, (nameCount.get(n) ?? 0) + 1);
  const days = (a, b) => Math.abs(new Date(`${a}T00:00:00Z`) - new Date(`${b}T00:00:00Z`)) / 86400000;
  for (const f of scoped) {
    if (!isDay(f.date)) continue;
    const near = now.items.filter((g) => g.id !== f.id && isDay(g.date) && days(f.date, g.date) <= FOLLOW_UP_DAYS && !(str(f.story) && str(f.story) === str(g.story)));
    const byIncident = near.filter((g) => str(f.incident) && str(g.incident) === str(f.incident));
    if (byIncident.length) add("checks", `item:${f.id}`, "follow-up", `tells the same deep dive (${str(f.incident)}) as ${byIncident.map((g) => g.id).join(", ")} with no story in common: a follow-up belongs in one story with them`);
    const mine = (namesOf.get(f.id) ?? []).filter((n) => (nameCount.get(n) ?? 0) <= 20);
    const byName = near.filter((g) => !byIncident.includes(g) && (namesOf.get(g.id) ?? []).some((n) => mine.includes(n)));
    if (byName.length) {
      const shared = [...new Set(byName.flatMap((g) => (namesOf.get(g.id) ?? []).filter((n) => mine.includes(n))))];
      add("checks", `item:${f.id}`, "follow-up", `shares ${shared.join(", ")} with ${byName.slice(0, 6).map((g) => g.id).join(", ")}${byName.length > 6 ? ` and ${byName.length - 6} more` : ""}, none in a story with it: if it continues them, give them one story`);
    }
  }

  // Headlines: at most three a day, the day being the run that filed them (`added`; `date` for an item without one).
  const filedOn = (f) => str(f.added) || f.date;
  const daysTouched = new Set((all ? now.items : scoped).map(filedOn));
  for (const d of daysTouched) {
    const onDay = now.items.filter((f) => filedOn(f) === d);
    const headlines = onDay.filter((f) => str(f.weight) === "headline");
    if (headlines.length > HEADLINES_PER_DAY) add("errors", `day:${d}`, "headlines", `${headlines.length} headlines filed on ${d} (${headlines.map((f) => f.id).join(", ")}); at most ${HEADLINES_PER_DAY}`);
    const notables = onDay.filter((f) => str(f.weight) === "notable");
    if (notables.length > 6) add("notes", `day:${d}`, "notables", `${notables.length} notables filed on ${d}: is each worth reading this week, or a brief?`);
  }

  // Single-setting product updates: one product, one ISO week, more than one without a story.
  const weeks = new Set((all ? now.items : scoped).filter((f) => isDay(f.date)).map((f) => isoWeek(f.date).label));
  const groups = new Map();
  for (const f of now.items) {
    if (f.kind !== "productUpdate" || str(f.story) || standalone.has(f.id) || !isDay(f.date) || !weeks.has(isoWeek(f.date).label)) continue;
    for (const p of (f.products ?? []).map(str)) {
      const k = `${p} ${isoWeek(f.date).label}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(f);
    }
  }
  for (const [k, list] of groups) {
    if (list.length < 2 || !list.some((f) => inScope.has(f.id))) continue;
    const [product, week] = k.split(" ");
    add("errors", `item:${list.find((f) => inScope.has(f.id)).id}`, "roll-up",
      `${list.length} product updates for ${product} in ${week} with no story (${list.map((f) => f.id).join(", ")}): roll the single-setting ones into ${`settings-${product}-${week}`}; one that stands alone (a default flips, or a new way for code to run or data to leave) is named with --standalone`);
  }

  // Overviews: today's (keyed by added: what this run filed) and this week's (the Monday of the items' date)
  // whenever the run adds items; every day items were filed on should have one.
  const monday = mondayOf(today);
  if (newItems.length || all) {
    if (!overviews.days.has(today)) add("errors", `day:${today}`, "overview", `no overview for today (${today}) in data/feed/overviews.yaml`);
    if (!overviews.weeks.has(monday)) add("errors", `week:${monday}`, "overview", `no overview for this week (week: ${monday}) in data/feed/overviews.yaml`);
  }
  for (const d of new Set((all ? now.items : newItems).map((f) => str(f.added)).filter(Boolean)))
    if (isDay(d) && !overviews.days.has(d) && d !== today) add("checks", `day:${d}`, "overview", `items filed on ${d} and no overview for that day: write one, or say why the page's fallback will do`);
  for (const f of newItems)
    if (isDay(f.date) && mondayOf(f.date) !== monday && !overviews.weeks.has(mondayOf(f.date)))
      add("checks", `week:${mondayOf(f.date)}`, "overview", `items dated in the week of ${mondayOf(f.date)} and no overview for it: write one, or say why the fallback will do`);
  for (const [d, text] of overviews.days)
    if ((all || overviewsThen.days.get(d) !== text) && len(text) > LIMITS.dayOverview) add("errors", `day:${d}`, "length", `day overview is ${len(text)} characters; at most ${LIMITS.dayOverview}`);
  for (const [w, text] of overviews.weeks) {
    if ((all || overviewsThen.weeks.get(w) !== text) && len(text) > LIMITS.weekOverview) add("errors", `week:${w}`, "length", `week overview is ${len(text)} characters; at most ${LIMITS.weekOverview}`);
    if (isDay(w) && mondayOf(w) !== w) add("errors", `week:${w}`, "overview", `week ${w} is not a Monday`);
  }

  // Stories: titles within their limit, roll-ups named for their product and week.
  for (const [id, s] of stories) {
    if (!all && same(s, storiesThen.get(id))) continue;
    const ref = `story:${id}`;
    if (!s.title) add("errors", ref, "story", "needs a title");
    else if (len(s.title) > LIMITS.storyTitle) add("errors", ref, "length", `title is ${len(s.title)} characters; at most ${LIMITS.storyTitle}`);
    const members = now.items.filter((f) => str(f.story) === id);
    if (!members.length) add("notes", ref, "story", "no item names this story");
    const m = /^settings-(.+)-(\d{4})-w(\d{2})$/.exec(id);
    if (m && !/settings, week of /.test(s.title)) add("checks", ref, "story", `a roll-up's title reads "<Product> settings, week of <Monday>"; this one is "${s.title}"`);
  }

  // Security tools: at most three new a run; each within its limits.
  const newTools = [...tools.keys()].filter((id) => !toolsThen.has(id));
  if (!all && newTools.length > TOOLS_PER_RUN) add("errors", "tools", "tool-cap", `${newTools.length} new security tools (${newTools.join(", ")}); at most ${TOOLS_PER_RUN} a run, the rest are proposed`);
  for (const [id, t] of tools) {
    if (!all && same(t, toolsThen.get(id))) continue;
    const ref = t.file;
    if (len(str(t.what)) > LIMITS.toolWhat) add("errors", ref, "length", `what is ${len(str(t.what))} characters; at most ${LIMITS.toolWhat}`);
    if (!isDay(t.released)) add("errors", ref, "released", `released "${t.released}" is not a day`);
    else if (!all && !toolsThen.has(id) && (t.released < from || t.released > today)) add("errors", ref, "released", `first released ${t.released}, outside the window (${from} to ${today})`);
    if (str(t.feed) && !now.byId.has(str(t.feed))) add("errors", ref, "tool", `feed: ${str(t.feed)} is not an item in the feed`);
  }

  if (!all) {
    const others = otherChangedPaths(base);
    if (others.length) add("notes", "files", "scope", `changes outside data/ and the log, which the run does not commit: ${others.join(", ")}`);
  }
  return { ...out, scope: { all, base, today, from, items: scoped.length, added: newItems.length, newTools: newTools.length } };
}

const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^tool/, "");

// --- Command line --------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const all = argv.includes("--all");
  const base = baseRef(argv);
  const today = todayArg(argv);
  const si = argv.indexOf("--standalone");
  const standalone = new Set(si >= 0 ? (argv[si + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : []);
  const r = lint({ base, today, all, standalone });
  if (argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const s = r.scope;
    console.log(`feed-lint: ${all ? `all ${s.items} items` : `${s.added} new and ${s.items - s.added} changed items, ${s.newTools} new security tools`} against ${base} (${shortSha(base)}); today ${today}, window ${s.from} to ${today}`);
    const block = (title, list, hint) => {
      console.log(`\n${title} (${list.length})${list.length ? `: ${hint}` : ""}`);
      for (const x of list) console.log(`  ${x.ref.padEnd(44)} ${x.rule.padEnd(16)} ${x.msg}`);
    };
    block("ERRORS", r.errors, "fix each and lint again; the verifier starts only when there are none");
    block("CHECKS", r.checks, "the verifier rules on each (verify-brief.mjs prints them under their entries)");
    block("NOTES", r.notes, "writing; fix where it helps");
    if (!all && !s.items && !s.newTools) console.log("\nNothing new or changed in the feed against the base.");
  }
  process.exit(r.errors.length ? 1 : 0);
}
