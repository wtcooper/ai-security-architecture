/**
 * The incident feed: data/feed/<YYYY-MM>.yaml, one file per month, each an `items:` list of
 * short reports (data/feed/README.md has the format). Every rule is checked here and every
 * problem names the file and the item, so a bad entry is found without reading the whole
 * month. The folder may be missing or empty: the feed is then empty and the pages say so.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import { categoryById, evidenceById, FEED_EVIDENCE, INCIDENT_CATEGORIES, INCIDENT_PERSPECTIVES } from "../../src/lib/incident-categories";
import type { FeedItem, IncidentSource } from "../../src/lib/types";

/** Field limits, as the format sets them. */
export const FEED_LIMITS = { title: 120, summary: 420, patterns: 3, sources: 3 } as const;

/** The keys an item may carry. Anything else is a typo or retired grammar, and fails. */
const ITEM_KEYS = new Set(["id", "date", "title", "summary", "category", "perspective", "evidence", "patterns", "incident", "cves", "sources"]);
const SOURCE_KEYS = new Set(["title", "url", "publisher", "date"]);

/** What an item is checked against. */
export interface FeedContext {
  patternIds: Set<string>;
  incidentIds: Set<string>;
}

/** One feed file: its name in data/feed/ and its parsed YAML. */
export interface FeedFile {
  file: string;
  doc: unknown;
}

/** Characters as a reader counts them, not UTF-16 units. */
const len = (s: string) => [...s].length;

/** A scalar as text: folded YAML loses its line breaks and trailing newline; a date stays a day. */
const str = (v: unknown): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim() : typeof v === "number" ? String(v) : v instanceof Date ? v.toISOString().slice(0, 10) : "";

/** "YYYY-MM-DD" and a real day of the calendar. */
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const isMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
const isHttps = (s: string) => {
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
};
const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** The reader's words are pattern, control and risk; "archetype" stays in ids and data keys. */
const RETIRED = /\barchetypes?\b/i;

/**
 * Every item of every file, checked and newest first (ties keep file order), and everything
 * wrong with them. A problem reads `feed/<file> item <id>: <what is wrong>`.
 */
export function checkFeed(files: FeedFile[], ctx: FeedContext): { feed: FeedItem[]; problems: string[] } {
  const problems: string[] = [];
  const seen = new Map<string, string>();
  const out: { item: FeedItem; order: number }[] = [];

  for (const { file, doc } of files) {
    const month = file.replace(/\.yaml$/, "");
    const monthOk = file.endsWith(".yaml") && isMonth(month);
    if (!monthOk) problems.push(`feed/${file}: name the file after the month of its items, YYYY-MM.yaml`);
    if (!isRecord(doc) || (doc.items != null && !Array.isArray(doc.items))) {
      problems.push(`feed/${file}: needs an items: list`);
      continue;
    }
    const extra = Object.keys(doc).filter((k) => k !== "items");
    if (extra.length) problems.push(`feed/${file}: unknown top-level key(s) ${extra.join(", ")}; a feed file holds items: only`);
    const items = (doc.items ?? []) as unknown[];

    items.forEach((raw, i) => {
      const id = isRecord(raw) ? str(raw.id) : "";
      const where = `feed/${file} item ${id || `#${i + 1}`}`;
      const p = (msg: string) => problems.push(`${where}: ${msg}`);
      if (!isRecord(raw)) {
        p("is not a mapping of fields");
        return;
      }

      const unknown = Object.keys(raw).filter((k) => !ITEM_KEYS.has(k));
      if (unknown.length) p(`unknown field(s) ${unknown.join(", ")}`);

      if (!id) p("needs an id");
      else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) p(`id "${id}" must be kebab-case (lower-case letters, digits and hyphens)`);
      if (id && seen.has(id)) p(`duplicate id: also an item in feed/${seen.get(id)}`);
      else if (id) seen.set(id, file);

      const date = str(raw.date);
      if (!isDay(date)) p(`date "${date}" must be a real day, YYYY-MM-DD (the day it came to light)`);
      else if (monthOk && !date.startsWith(`${month}-`)) p(`date ${date} is outside ${month}: an item goes in the file of its own month`);

      const title = str(raw.title);
      if (!title) p("needs a title");
      else if (len(title) > FEED_LIMITS.title) p(`title is ${len(title)} characters; at most ${FEED_LIMITS.title}`);
      const summary = str(raw.summary);
      if (!summary) p("needs a summary");
      else if (len(summary) > FEED_LIMITS.summary) p(`summary is ${len(summary)} characters; at most ${FEED_LIMITS.summary}`);
      for (const [field, value] of [["title", title], ["summary", summary]] as const) {
        if (RETIRED.test(value)) p(`${field} says "archetype"; the reader's word is pattern`);
      }

      const category = str(raw.category);
      if (!categoryById.has(category)) p(`category "${category}" is not one of ${INCIDENT_CATEGORIES.map((c) => c.id).join(", ")}`);
      const perspective = str(raw.perspective);
      if (!(INCIDENT_PERSPECTIVES as readonly string[]).includes(perspective)) p(`perspective "${perspective}" is not one of ${INCIDENT_PERSPECTIVES.join(", ")}`);
      const evidence = str(raw.evidence);
      if (!evidenceById.has(evidence)) p(`evidence "${evidence}" is not one of ${FEED_EVIDENCE.map((e) => e.id).join(", ")}`);

      let patterns: string[] = [];
      if (raw.patterns != null && !Array.isArray(raw.patterns)) p("patterns must be a list of pattern ids ([] when none fits)");
      else {
        patterns = ((raw.patterns as unknown[] | undefined) ?? []).map(str);
        if (patterns.length > FEED_LIMITS.patterns) p(`names ${patterns.length} patterns; at most ${FEED_LIMITS.patterns}`);
        for (const pid of patterns) if (!ctx.patternIds.has(pid)) p(`pattern "${pid}" does not exist`);
        if (new Set(patterns).size < patterns.length) p("names a pattern twice");
      }

      const incident = raw.incident == null ? undefined : str(raw.incident);
      if (incident !== undefined && !ctx.incidentIds.has(incident)) p(`incident "${incident}" is not in the catalogue (data/incidents/)`);

      let cves: string[] | undefined;
      if (raw.cves != null) {
        if (!Array.isArray(raw.cves)) p("cves must be a list");
        else {
          cves = raw.cves.map(str);
          for (const c of cves) if (!/^CVE-\d{4}-\d{4,}$/.test(c)) p(`"${c}" is not a CVE identifier (CVE-YYYY-NNNN)`);
        }
      }

      const sources: IncidentSource[] = [];
      const rawSources = Array.isArray(raw.sources) ? raw.sources : [];
      if (rawSources.length < 1 || rawSources.length > FEED_LIMITS.sources) p(`needs 1 to ${FEED_LIMITS.sources} sources, the primary first; has ${rawSources.length}`);
      rawSources.forEach((s, j) => {
        const at = `source ${j + 1}`;
        if (!isRecord(s)) {
          p(`${at} is not a mapping of title, url, publisher and date`);
          return;
        }
        const extraKeys = Object.keys(s).filter((k) => !SOURCE_KEYS.has(k));
        if (extraKeys.length) p(`${at}: unknown field(s) ${extraKeys.join(", ")}`);
        const source: IncidentSource = { title: str(s.title), url: str(s.url) };
        if (!source.title) p(`${at} needs the page's own title`);
        if (!isHttps(source.url)) p(`${at}: url "${source.url}" must be an https:// address`);
        if (sources.some((x) => x.url === source.url)) p(`${at} repeats ${source.url}`);
        const publisher = str(s.publisher);
        if (!publisher) p(`${at} needs a publisher`);
        else source.publisher = publisher;
        if (s.date != null) {
          const sd = str(s.date);
          if (!isDay(sd) && !isMonth(sd)) p(`${at}: date "${sd}" must be YYYY-MM-DD (or YYYY-MM)`);
          else source.date = sd;
        }
        sources.push(source);
      });

      const item: FeedItem = {
        id,
        date,
        title,
        summary,
        category: category as FeedItem["category"],
        perspective: perspective as FeedItem["perspective"],
        evidence: evidence as FeedItem["evidence"],
        patterns,
        ...(incident ? { incident } : {}),
        ...(cves?.length ? { cves } : {}),
        sources,
      };
      out.push({ item, order: out.length });
    });
  }

  const feed = out.sort((a, b) => b.item.date.localeCompare(a.item.date) || a.order - b.order).map((x) => x.item);
  return { feed, problems };
}

/** Read data/feed/ (no folder, or no files, is an empty feed) and check it; problems go to `fail`. */
export async function loadFeed(root: string, ctx: FeedContext, fail: (msg: string) => void): Promise<FeedItem[]> {
  const dir = join(root, "data", "feed");
  if (!existsSync(dir)) return [];
  const names = (await readdir(dir)).sort();
  for (const f of names.filter((n) => n.endsWith(".yml"))) fail(`feed/${f}: a feed file ends in .yaml`);
  const files: FeedFile[] = [];
  for (const file of names.filter((n) => n.endsWith(".yaml"))) {
    try {
      files.push({ file, doc: parse(await readFile(join(dir, file), "utf8")) });
    } catch (e) {
      fail(`feed/${file}: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  const { feed, problems } = checkFeed(files, ctx);
  problems.forEach(fail);
  return feed;
}
