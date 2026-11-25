/**
 * The feed: data/feed/<YYYY-MM>.yaml, one file per month, each an `items:` list of short items
 * of five kinds (incidents, product updates, tools, launches and research; data/feed/README.md
 * has the format), and data/feed/decisions.yaml, the owner's answers to the site updates items
 * propose. Every rule is checked here and every problem names the file and the item, so a bad
 * entry is found without reading the whole month. The folder may be missing or empty: the feed
 * is then empty and the pages say so.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import {
  evidenceById,
  FEED_DECISIONS,
  FEED_EVIDENCE,
  FEED_FITS,
  FEED_KINDS,
  FEED_UPDATE_ACTIONS,
  FEED_UPDATE_STATUSES,
  INCIDENT_PERSPECTIVES,
  kindById,
  updateActionById,
} from "../../src/lib/feed-vocabulary";
import type { FeedDecision, FeedItem, FeedUpdate, IncidentSource } from "../../src/lib/types";
import { categoryProblem } from "./incident-patterns";

/** Field limits, as the format sets them. */
export const FEED_LIMITS = { title: 120, summary: 420, why: 200, vendor: 80, fitNote: 160, patterns: 3, sources: 3, updateNote: 200, decisionNote: 200 } as const;

/** The file in data/feed/ that holds the owner's decisions, not a month of items. */
export const DECISIONS_FILE = "decisions.yaml";

/** The keys an item may carry. Anything else is a typo or retired grammar, and fails. */
const ITEM_KEYS = new Set([
  "id", "kind", "date", "title", "summary", "why", "vendor", "products", "controls",
  "category", "perspective", "evidence", "fit", "fitNote", "patterns", "incident", "cves", "update", "sources",
]);
/** The keys only an incident carries: how the chain started, how well it is established, its deep dive. */
const INCIDENT_ONLY = ["category", "perspective", "evidence", "fit", "fitNote", "incident"] as const;
const SOURCE_KEYS = new Set(["title", "url", "publisher", "date"]);
const UPDATE_KEYS = new Set(["action", "status", "target", "note"]);
const DECISION_KEYS = new Set(["id", "decision", "note"]);

/** What an item is checked against. */
export interface FeedContext {
  patternIds: Set<string>;
  /** The deep dives (data/incidents/). */
  incidentIds: Set<string>;
  /** The incident pattern ids (data/incident-patterns/): the only categories there are. */
  categoryIds: Set<string>;
  /** The products on the site: tooling ids (data/tooling/). */
  productIds: Set<string>;
  /** The control catalogue: MITRE mitigations and cap-* specialisations. */
  controlIds: Set<string>;
  /** Whether a path from the repository root exists; an applied update that names a file must name one that does. */
  exists?: (path: string) => boolean;
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
export const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const isMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export const isHttps = (s: string) => {
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
 * The known id a near miss meant: the same letters and digits once case, separators and the
 * registry's `tool` prefix are set aside ("claude-code" for toolClaudeCode).
 */
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^tool/, "");
function suggest(id: string, known: Set<string>): string | undefined {
  const want = squash(id);
  return want ? [...known].find((k) => squash(k) === want) : undefined;
}

/** A target that names a file rather than an id. */
const isPath = (target: string) => target.includes("/") || /\.ya?ml$/.test(target);

/**
 * Every item of every file, checked and newest first (ties keep file order), and everything
 * wrong with them. A problem reads `feed/<file> item <id>: <what is wrong>`. `fileOf` says which
 * file each item came from, for the checks the build makes once it has read the security tools.
 */
export function checkFeed(files: FeedFile[], ctx: FeedContext): { feed: FeedItem[]; problems: string[]; fileOf: Map<string, string> } {
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

      // An item written before kinds existed is an incident, so the old files stay valid.
      const kind = raw.kind == null ? "incident" : str(raw.kind);
      if (!kindById.has(kind)) p(`kind "${kind}" is not one of ${FEED_KINDS.map((k) => k.id).join(", ")}`);
      const incidentKind = kind === "incident";

      const date = str(raw.date);
      if (!isDay(date)) p(`date "${date}" must be a real day, YYYY-MM-DD (the day it came to light)`);
      else if (monthOk && !date.startsWith(`${month}-`)) p(`date ${date} is outside ${month}: an item goes in the file of its own month`);

      const title = str(raw.title);
      if (!title) p("needs a title");
      else if (len(title) > FEED_LIMITS.title) p(`title is ${len(title)} characters; at most ${FEED_LIMITS.title}`);
      const summary = str(raw.summary);
      if (!summary) p("needs a summary");
      else if (len(summary) > FEED_LIMITS.summary) p(`summary is ${len(summary)} characters; at most ${FEED_LIMITS.summary}`);

      // Why it matters: one line every kind but an incident carries, since what happened is not itself the point.
      const why = raw.why == null ? undefined : str(raw.why);
      if (why === undefined || why === "") {
        if (!incidentKind && kindById.has(kind)) p(`a ${kind} needs a why: why it matters for security, in one line`);
      } else if (len(why) > FEED_LIMITS.why) p(`why is ${len(why)} characters; at most ${FEED_LIMITS.why}`);
      for (const [field, value] of [["title", title], ["summary", summary], ["why", why ?? ""]] as const) {
        if (RETIRED.test(value)) p(`${field} says "archetype"; the reader's word is pattern`);
      }

      const vendor = raw.vendor == null ? undefined : str(raw.vendor);
      if (vendor !== undefined && !vendor) p("vendor, when given, names who announced it");
      if (vendor && len(vendor) > FEED_LIMITS.vendor) p(`vendor is ${len(vendor)} characters; at most ${FEED_LIMITS.vendor}`);

      const idList = (field: "products" | "controls", known: Set<string>, what: string): string[] | undefined => {
        if (raw[field] == null) return undefined;
        if (!Array.isArray(raw[field])) {
          p(`${field} must be a list of ${what}`);
          return undefined;
        }
        const ids = (raw[field] as unknown[]).map(str);
        for (const x of ids) {
          if (known.has(x)) continue;
          const near = suggest(x, known);
          p(`${field}: "${x}" is not ${what}${near ? `; did you mean ${near}?` : ""}`);
        }
        if (new Set(ids).size < ids.length) p(`${field} names one twice`);
        return ids;
      };
      const products = idList("products", ctx.productIds, "a product on the site (a tooling id in data/tooling/)");
      const controls = idList("controls", ctx.controlIds, "a control in the catalogue (a MITRE mitigation or a cap-* specialisation)");

      // The fields that say how an attack started and how well it is established belong to incidents.
      if (!incidentKind) {
        const misplaced = INCIDENT_ONLY.filter((k) => raw[k] != null);
        if (misplaced.length) p(`${misplaced.join(", ")} ${misplaced.length === 1 ? "is" : "are"} for incidents only; a ${kind} leaves ${misplaced.length === 1 ? "it" : "them"} out`);
      }
      const category = incidentKind ? str(raw.category) : "";
      if (incidentKind) {
        const badCategory = categoryProblem(category, [...ctx.categoryIds]);
        if (badCategory) p(badCategory);
      }
      const perspective = incidentKind ? str(raw.perspective) : "";
      if (incidentKind && !(INCIDENT_PERSPECTIVES as readonly string[]).includes(perspective)) p(`perspective "${perspective}" is not one of ${INCIDENT_PERSPECTIVES.join(", ")}`);
      const evidence = incidentKind ? str(raw.evidence) : "";
      if (incidentKind && !evidenceById.has(evidence)) p(`evidence "${evidence}" is not one of ${FEED_EVIDENCE.map((e) => e.id).join(", ")}`);

      // A loose fit says why, so the run that weighs a new incident pattern can read the mechanism.
      const fit = !incidentKind || raw.fit == null ? undefined : str(raw.fit);
      const fitNote = !incidentKind || raw.fitNote == null ? undefined : str(raw.fitNote);
      if (fit !== undefined && !(FEED_FITS as readonly string[]).includes(fit)) p(`fit "${fit}" is not one of ${FEED_FITS.join(", ")}; leave it out when the item fits its incident pattern`);
      if (fit === "loose" && !fitNote) p("fit: loose needs a fitNote: what about it the incident pattern does not cover");
      if (fitNote !== undefined && fit !== "loose") p("fitNote goes with fit: loose");
      if (fitNote && len(fitNote) > FEED_LIMITS.fitNote) p(`fitNote is ${len(fitNote)} characters; at most ${FEED_LIMITS.fitNote}`);
      if (fitNote && RETIRED.test(fitNote)) p(`fitNote says "archetype"; the reader's word is pattern`);

      let patterns: string[] = [];
      if (raw.patterns != null && !Array.isArray(raw.patterns)) p("patterns must be a list of pattern ids ([] when none fits)");
      else {
        patterns = ((raw.patterns as unknown[] | undefined) ?? []).map(str);
        if (patterns.length > FEED_LIMITS.patterns) p(`names ${patterns.length} patterns; at most ${FEED_LIMITS.patterns}`);
        for (const pid of patterns) if (!ctx.patternIds.has(pid)) p(`pattern "${pid}" does not exist`);
        if (new Set(patterns).size < patterns.length) p("names a pattern twice");
      }

      const incident = !incidentKind || raw.incident == null ? undefined : str(raw.incident);
      if (incident !== undefined && !ctx.incidentIds.has(incident)) p(`incident "${incident}" is not a deep dive (data/incidents/)`);

      let cves: string[] | undefined;
      if (raw.cves != null) {
        if (!Array.isArray(raw.cves)) p("cves must be a list");
        else {
          cves = raw.cves.map(str);
          for (const c of cves) if (!/^CVE-\d{4}-\d{4,}$/.test(c)) p(`"${c}" is not a CVE identifier (CVE-YYYY-NNNN)`);
        }
      }

      const update = raw.update == null ? undefined : checkUpdate(raw.update, ctx, p);

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
        kind: (kindById.has(kind) ? kind : "incident") as FeedItem["kind"],
        date,
        title,
        summary,
        ...(why ? { why } : {}),
        ...(vendor ? { vendor } : {}),
        ...(products?.length ? { products } : {}),
        ...(controls?.length ? { controls } : {}),
        ...(incidentKind
          ? {
              category: category as FeedItem["category"],
              perspective: perspective as FeedItem["perspective"],
              evidence: evidence as FeedItem["evidence"],
            }
          : {}),
        ...(fit === "loose" ? { fit: "loose" as const } : {}),
        ...(fit === "loose" && fitNote ? { fitNote } : {}),
        patterns,
        ...(incident ? { incident } : {}),
        ...(cves?.length ? { cves } : {}),
        ...(update ? { update } : {}),
        sources,
      };
      out.push({ item, order: out.length });
    });
  }

  const feed = out.sort((a, b) => b.item.date.localeCompare(a.item.date) || a.order - b.order).map((x) => x.item);
  return { feed, problems, fileOf: seen };
}

/**
 * An item's `update`: what change to the site it implies, and where that stands. An applied
 * change must point at something real: a file that exists, or an id of the kind its action names.
 */
function checkUpdate(raw: unknown, ctx: FeedContext, p: (msg: string) => void): FeedUpdate | undefined {
  if (!isRecord(raw)) {
    p("update must be a mapping of action, status, target and note");
    return undefined;
  }
  const extra = Object.keys(raw).filter((k) => !UPDATE_KEYS.has(k));
  if (extra.length) p(`update: unknown field(s) ${extra.join(", ")}`);
  const action = str(raw.action);
  const status = str(raw.status);
  const target = str(raw.target);
  const note = str(raw.note);
  if (!updateActionById.has(action)) p(`update: action "${action}" is not one of ${FEED_UPDATE_ACTIONS.map((a) => a.id).join(", ")}`);
  if (!FEED_UPDATE_STATUSES.some((s) => s.id === status)) p(`update: status "${status}" is not one of ${FEED_UPDATE_STATUSES.map((s) => s.id).join(", ")}`);
  if (!target) p("update needs a target: the file it changes or the id it names");
  if (!note) p("update needs a note: what changes, in one line");
  else if (len(note) > FEED_LIMITS.updateNote) p(`update: note is ${len(note)} characters; at most ${FEED_LIMITS.updateNote}`);
  if (RETIRED.test(note)) p(`update: note says "archetype"; the reader's word is pattern`);

  if (status === "applied" && target) {
    if (isPath(target)) {
      if (ctx.exists && !ctx.exists(target)) p(`update: applied, but its target ${target} does not exist`);
    } else {
      const known: Record<string, [Set<string>, string] | undefined> = {
        settings: [ctx.productIds, "a product on the site"],
        onboard: [ctx.productIds, "a product on the site"],
        newControl: [ctx.controlIds, "a control in the catalogue"],
        controlGuidance: [ctx.controlIds, "a control in the catalogue"],
        newPattern: [ctx.patternIds, "a pattern"],
      };
      const want = known[action];
      if (want && !want[0].has(target)) p(`update: applied, but its target "${target}" is not ${want[1]}`);
    }
  }
  return updateActionById.has(action) && FEED_UPDATE_STATUSES.some((s) => s.id === status)
    ? { action: action as FeedUpdate["action"], status: status as FeedUpdate["status"], target, note }
    : undefined;
}

/**
 * data/feed/decisions.yaml: a list of `{ id, decision, note? }`, the owner's answer to the update
 * an item proposes. Each must name an item that proposes one, once. A problem reads
 * `feed/decisions.yaml entry <id>: <what is wrong>`.
 */
export function checkDecisions(doc: unknown, feed: FeedItem[]): { decisions: FeedDecision[]; problems: string[] } {
  const problems: string[] = [];
  const decisions: FeedDecision[] = [];
  if (doc == null) return { decisions, problems };
  if (!Array.isArray(doc)) {
    problems.push(`feed/${DECISIONS_FILE}: needs a list of decisions, each "- id: <item id>, decision: approve | decline, note: ..."`);
    return { decisions, problems };
  }
  const byId = new Map(feed.map((f) => [f.id, f]));
  const seen = new Set<string>();
  doc.forEach((raw, i) => {
    const id = isRecord(raw) ? str(raw.id) : "";
    const p = (msg: string) => problems.push(`feed/${DECISIONS_FILE} entry ${id || `#${i + 1}`}: ${msg}`);
    if (!isRecord(raw)) {
      p("is not a mapping of id, decision and note");
      return;
    }
    const extra = Object.keys(raw).filter((k) => !DECISION_KEYS.has(k));
    if (extra.length) p(`unknown field(s) ${extra.join(", ")}`);
    const item = byId.get(id);
    if (!id) p("needs the id of the feed item it decides");
    else if (!item) p(`"${id}" is not an item in the feed`);
    else if (!item.update) p(`item ${id} proposes no site update to decide on`);
    if (id && seen.has(id)) p("decided twice; keep one line per item");
    seen.add(id);
    const decision = str(raw.decision);
    if (!(FEED_DECISIONS as readonly string[]).includes(decision)) p(`decision "${decision}" is not one of ${FEED_DECISIONS.join(", ")}`);
    const note = raw.note == null ? undefined : str(raw.note);
    if (note && len(note) > FEED_LIMITS.decisionNote) p(`note is ${len(note)} characters; at most ${FEED_LIMITS.decisionNote}`);
    if (id && (FEED_DECISIONS as readonly string[]).includes(decision)) decisions.push({ id, decision: decision as FeedDecision["decision"], ...(note ? { note } : {}) });
  });
  return { decisions, problems };
}

/**
 * Read data/feed/ (no folder, or no files, is an empty feed) and check it; problems go to `fail`.
 * Every month file and the decisions file, if there is one; each decision is joined to its item.
 */
export async function loadFeed(root: string, ctx: FeedContext, fail: (msg: string) => void): Promise<{ feed: FeedItem[]; decisions: FeedDecision[]; fileOf: Map<string, string> }> {
  const dir = join(root, "data", "feed");
  if (!existsSync(dir)) return { feed: [], decisions: [], fileOf: new Map() };
  const names = (await readdir(dir)).sort();
  for (const f of names.filter((n) => n.endsWith(".yml"))) fail(`feed/${f}: a feed file ends in .yaml`);
  const files: FeedFile[] = [];
  let decisionsDoc: unknown = null;
  for (const file of names.filter((n) => n.endsWith(".yaml"))) {
    try {
      const doc = parse(await readFile(join(dir, file), "utf8"));
      if (file === DECISIONS_FILE) decisionsDoc = doc;
      else files.push({ file, doc });
    } catch (e) {
      fail(`feed/${file}: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  const { feed, problems, fileOf } = checkFeed(files, { exists: (path) => existsSync(join(root, path)), ...ctx });
  problems.forEach(fail);
  const { decisions, problems: decided } = checkDecisions(decisionsDoc, feed);
  decided.forEach(fail);
  const decisionOf = new Map(decisions.map((d) => [d.id, d]));
  return {
    feed: feed.map((f) => {
      const d = decisionOf.get(f.id);
      return d ? { ...f, decision: { decision: d.decision, ...(d.note ? { note: d.note } : {}) } } : f;
    }),
    decisions,
    fileOf,
  };
}
