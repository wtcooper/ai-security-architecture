/**
 * The feed: data/feed/<YYYY-MM>.yaml, one file per month, each an `items:` list of short items
 * of six kinds (incidents, product updates, tools, launches, guidance and research; data/feed/README.md
 * has the format); data/feed/stories.yaml, the stories items are grouped under;
 * data/feed/overviews.yaml, each day's and week's major events; and data/feed/decisions.yaml, the
 * owner's answers to the site updates items propose. Every rule is checked here and every problem
 * names the file and the item (or story, day or week), so a bad entry is found without reading the
 * whole month. The folder may be missing or empty: the feed is then empty and the pages say so.
 *
 * An item's `update` (the change to the site it implies) and the owner's decision on it are
 * review material: they are checked here and read by scripts/review-queue.mjs, and `publicFeed`
 * strips them before the build writes anything the site serves.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import { isoWeek, weekOf } from "../../src/lib/feed";
import {
  evidenceById,
  FEED_EVIDENCE,
  FEED_FITS,
  FEED_KINDS,
  FEED_WEIGHTS,
  HEADLINES_PER_DAY,
  INCIDENT_PERSPECTIVES,
  kindById,
  weightById,
} from "../../src/lib/feed-vocabulary";
import type { FeedItem, FeedOverviews, FeedStory, IncidentSource } from "../../src/lib/types";
import { categoryProblem } from "./incident-patterns";

/**
 * The change to the site an item implies, by what it changes. The daily run applies a product's
 * settings row and a security tool by itself; the rest wait for the owner (data/feed/decisions.yaml).
 */
export const FEED_UPDATE_ACTIONS = [
  { id: "settings", label: "Product settings", blurb: "A new or changed setting in a product already on the site." },
  { id: "toolOption", label: "Security tool", blurb: "A security tool listed under a control it delivers (data/security-tools/)." },
  { id: "onboard", label: "Onboard a product", blurb: "A new AI product that fits an existing pattern." },
  { id: "newControl", label: "New control", blurb: "A control the catalogue lacks." },
  { id: "newPattern", label: "New pattern", blurb: "A new kind of AI system." },
  { id: "controlGuidance", label: "Control guidance", blurb: "A change to a control's recommended practice." },
] as const;
export type FeedUpdateAction = (typeof FEED_UPDATE_ACTIONS)[number]["id"];
export const updateActionById = new Map<string, (typeof FEED_UPDATE_ACTIONS)[number]>(FEED_UPDATE_ACTIONS.map((a) => [a.id, a]));

/** Where an implied change stands: made, waiting for the owner, turned down, or to be checked again later (the note says when). */
export const FEED_UPDATE_STATUSES = ["applied", "proposed", "declined", "watch"] as const;
export type FeedUpdateStatus = (typeof FEED_UPDATE_STATUSES)[number];

/** The owner's answer to a proposed change, in data/feed/decisions.yaml. */
export const FEED_DECISIONS = ["approve", "decline"] as const;
export type FeedDecisionValue = (typeof FEED_DECISIONS)[number];

/** The change to the site an item implies, and where it stands. */
export interface FeedUpdate {
  action: FeedUpdateAction;
  status: FeedUpdateStatus;
  /** The file it changes ("data/tooling/anthropic/claude-code.yaml") or the id it names. */
  target: string;
  /** At most 200 characters: what changes (for `watch`, when to look again). */
  note: string;
}

/** The owner's answer to a proposed change (data/feed/decisions.yaml). */
export interface FeedDecision {
  /** The feed item whose `update` it answers. */
  id: string;
  decision: FeedDecisionValue;
  /** At most 200 characters. */
  note?: string;
}

/** An item as the loader reads it: what the site shows, and the review material it never does. */
export type LoadedFeedItem = FeedItem & { update?: FeedUpdate; decision?: Omit<FeedDecision, "id"> };

/** Field limits, as the format sets them. */
export const FEED_LIMITS = {
  title: 90,
  summary: 280,
  why: 160,
  vendor: 80,
  fitNote: 160,
  patterns: 3,
  sources: 3,
  updateNote: 200,
  decisionNote: 200,
  storyTitle: 90,
  dayOverview: 400,
  weekOverview: 600,
} as const;

/** The files in data/feed/ that are not a month of items. */
export const DECISIONS_FILE = "decisions.yaml";
export const STORIES_FILE = "stories.yaml";
export const OVERVIEWS_FILE = "overviews.yaml";

/** The keys an item may carry. Anything else is a typo or retired grammar, and fails. */
const ITEM_KEYS = new Set([
  "id", "kind", "weight", "date", "added", "title", "summary", "why", "vendor", "products", "controls", "story",
  "category", "perspective", "evidence", "fit", "fitNote", "patterns", "incident", "cves", "update", "sources",
]);
/** The keys only an incident carries: how the chain started, how well it is established, its deep dive. */
const INCIDENT_ONLY = ["category", "perspective", "evidence", "fit", "fitNote", "incident"] as const;
const SOURCE_KEYS = new Set(["title", "url", "publisher", "date"]);
const UPDATE_KEYS = new Set(["action", "status", "target", "note"]);
const DECISION_KEYS = new Set(["id", "decision", "note"]);
const STORY_KEYS = new Set(["id", "title", "incident"]);

/** A settings roll-up's story id: one product's single-setting updates in one ISO week. */
const SETTINGS_STORY = /^settings-([A-Za-z0-9]+)-(\d{4})-w(\d{2})$/;

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
  /** The stories (data/feed/stories.yaml), checked: the only stories an item may name. */
  stories?: FeedStory[];
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
const isKebab = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

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

/** "a, b and c". */
const listOf = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/**
 * Every item of every file, checked and newest first (ties keep file order), and everything
 * wrong with them. A problem reads `feed/<file> item <id>: <what is wrong>`. `fileOf` says which
 * file each item came from, for the checks the build makes once it has read the security tools.
 */
export function checkFeed(files: FeedFile[], ctx: FeedContext): { feed: LoadedFeedItem[]; problems: string[]; fileOf: Map<string, string> } {
  const problems: string[] = [];
  const seen = new Map<string, string>();
  const out: { item: LoadedFeedItem; order: number }[] = [];
  const storyById = new Map((ctx.stories ?? []).map((s) => [s.id, s]));
  /** Each day's headlines so far, for the rule of at most three. */
  const headlinesOn = new Map<string, string[]>();

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
      else if (!isKebab(id)) p(`id "${id}" must be kebab-case (lower-case letters, digits and hyphens)`);
      if (id && seen.has(id)) p(`duplicate id: also an item in feed/${seen.get(id)}`);
      else if (id) seen.set(id, file);

      // An item written before kinds existed is an incident, so the old files stay valid.
      const kind = raw.kind == null ? "incident" : str(raw.kind);
      if (!kindById.has(kind)) p(`kind "${kind}" is not one of ${FEED_KINDS.map((k) => k.id).join(", ")}`);
      const incidentKind = kind === "incident";

      // How much it weighs: every item says, so a section can rank it and fold the briefs.
      const weight = str(raw.weight);
      if (!weight) p(`needs a weight: ${listOf(FEED_WEIGHTS.map((w) => w.id)).replace(/ and /, " or ")}`);
      else if (!weightById.has(weight)) p(`weight "${weight}" is not one of ${FEED_WEIGHTS.map((w) => w.id).join(", ")}`);

      const date = str(raw.date);
      if (!isDay(date)) p(`date "${date}" must be a real day, YYYY-MM-DD (the day it came to light)`);
      else if (monthOk && !date.startsWith(`${month}-`)) p(`date ${date} is outside ${month}: an item goes in the file of its own month`);

      // The day the run filed it, apart from the day it came to light: Latest and "new since your last visit" go by it.
      const added = str(raw.added);
      if (!added) p("needs added: the day the run filed it, YYYY-MM-DD");
      else if (!isDay(added)) p(`added "${added}" must be a real day, YYYY-MM-DD (the day the run filed it)`);

      if (weight === "headline" && isDay(date)) {
        const others = headlinesOn.get(date) ?? [];
        if (others.length >= HEADLINES_PER_DAY) p(`is headline number ${others.length + 1} on ${date}; at most ${HEADLINES_PER_DAY} a day (already: ${listOf(others)}). Make it notable`);
        headlinesOn.set(date, [...others, id || `#${i + 1}`]);
      }

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

      // The story it is shown under: one in stories.yaml, and a settings roll-up holds only what its id says.
      const story = raw.story == null ? undefined : str(raw.story);
      if (story !== undefined) {
        if (!story) p("story, when given, names a story in feed/stories.yaml");
        else if (!storyById.has(story)) p(`story "${story}" is not a story in feed/${STORIES_FILE}`);
        else {
          const rollUp = story.match(SETTINGS_STORY);
          if (rollUp && isDay(date)) {
            const [, tool, year, week] = rollUp;
            const at = isoWeek(date);
            const wrong: string[] = [];
            if (kind !== "productUpdate") wrong.push(`it is a ${kind}, not a product update`);
            if (!products?.includes(tool)) wrong.push(`it does not name ${tool} in products`);
            if (at.year !== Number(year) || at.week !== Number(week)) wrong.push(`${date} is in ${at.year} week ${String(at.week).padStart(2, "0")}`);
            if (wrong.length) p(`story ${story} rolls up ${tool}'s settings in ${year} week ${week}, but ${listOf(wrong)}`);
          }
        }
      }

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

      const item: LoadedFeedItem = {
        id,
        kind: (kindById.has(kind) ? kind : "incident") as FeedItem["kind"],
        weight: (weightById.has(weight) ? weight : "brief") as FeedItem["weight"],
        date,
        added,
        title,
        summary,
        ...(why ? { why } : {}),
        ...(vendor ? { vendor } : {}),
        ...(products?.length ? { products } : {}),
        ...(controls?.length ? { controls } : {}),
        ...(story && storyById.has(story) ? { story } : {}),
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
  const statusOk = (FEED_UPDATE_STATUSES as readonly string[]).includes(status);
  if (!updateActionById.has(action)) p(`update: action "${action}" is not one of ${FEED_UPDATE_ACTIONS.map((a) => a.id).join(", ")}`);
  if (!statusOk) p(`update: status "${status}" is not one of ${FEED_UPDATE_STATUSES.join(", ")}`);
  if (!target) p("update needs a target: the file it changes or the id it names");
  if (!note) p(status === "watch" ? "update needs a note: what to look for, and when to check again" : "update needs a note: what changes, in one line");
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
  return updateActionById.has(action) && statusOk ? { action: action as FeedUpdateAction, status: status as FeedUpdateStatus, target, note } : undefined;
}

/**
 * data/feed/decisions.yaml: a list of `{ id, decision, note? }`, the owner's answer to the update
 * an item proposes. Each must name an item that proposes one, once. A problem reads
 * `feed/decisions.yaml entry <id>: <what is wrong>`.
 */
export function checkDecisions(doc: unknown, feed: LoadedFeedItem[]): { decisions: FeedDecision[]; problems: string[] } {
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
    if (id && (FEED_DECISIONS as readonly string[]).includes(decision)) decisions.push({ id, decision: decision as FeedDecisionValue, ...(note ? { note } : {}) });
  });
  return { decisions, problems };
}

/**
 * data/feed/stories.yaml: `stories:`, a list of `{ id, title, incident? }`. Ids are unique; a
 * title is at most 90 characters; `incident`, if given, is a deep dive; a settings roll-up
 * (`settings-<toolId>-<YYYY>-w<NN>`) names a product on the site and a real ISO week. A problem
 * reads `feed/stories.yaml story <id>: <what is wrong>`.
 */
export function checkStories(doc: unknown, ctx: Pick<FeedContext, "incidentIds" | "productIds">): { stories: FeedStory[]; problems: string[] } {
  const problems: string[] = [];
  const stories: FeedStory[] = [];
  if (doc == null) return { stories, problems };
  if (!isRecord(doc) || (doc.stories != null && !Array.isArray(doc.stories))) {
    problems.push(`feed/${STORIES_FILE}: needs a stories: list, each "- id: <story id>, title: ..."`);
    return { stories, problems };
  }
  const extra = Object.keys(doc).filter((k) => k !== "stories");
  if (extra.length) problems.push(`feed/${STORIES_FILE}: unknown top-level key(s) ${extra.join(", ")}; it holds stories: only`);
  const seen = new Set<string>();
  ((doc.stories ?? []) as unknown[]).forEach((raw, i) => {
    const id = isRecord(raw) ? str(raw.id) : "";
    const p = (msg: string) => problems.push(`feed/${STORIES_FILE} story ${id || `#${i + 1}`}: ${msg}`);
    if (!isRecord(raw)) {
      p("is not a mapping of id, title and incident");
      return;
    }
    const unknown = Object.keys(raw).filter((k) => !STORY_KEYS.has(k));
    if (unknown.length) p(`unknown field(s) ${unknown.join(", ")}`);
    const rollUp = id.match(SETTINGS_STORY);
    if (!id) p("needs an id");
    else if (rollUp) {
      const [, tool, year, week] = rollUp;
      if (!ctx.productIds.has(tool)) {
        const near = suggest(tool, ctx.productIds);
        p(`a settings roll-up names "${tool}", which is not a product on the site (a tooling id in data/tooling/)${near ? `; did you mean ${near}?` : ""}`);
      }
      const lastWeek = isoWeek(`${year}-12-28`).week;
      if (Number(week) < 1 || Number(week) > lastWeek) p(`week ${week} is not an ISO week of ${year} (1 to ${lastWeek})`);
    } else if (id.startsWith("settings-")) p(`a settings roll-up's id is settings-<toolId>-<YYYY>-w<NN>, as settings-toolClaudeCode-2026-w48`);
    else if (!isKebab(id)) p(`id "${id}" must be kebab-case (lower-case letters, digits and hyphens)`);
    if (id && seen.has(id)) p("duplicate id; each story is listed once");
    seen.add(id);
    const title = str(raw.title);
    if (!title) p("needs a title");
    else if (len(title) > FEED_LIMITS.storyTitle) p(`title is ${len(title)} characters; at most ${FEED_LIMITS.storyTitle}`);
    if (RETIRED.test(title)) p(`title says "archetype"; the reader's word is pattern`);
    const incident = raw.incident == null ? undefined : str(raw.incident);
    if (incident !== undefined && !ctx.incidentIds.has(incident)) p(`incident "${incident}" is not a deep dive (data/incidents/)`);
    if (id && title) stories.push({ id, title, ...(incident ? { incident } : {}) });
  });
  return { stories, problems };
}

/**
 * data/feed/overviews.yaml: `days:` (`{ date, overview }`, at most 400 characters) and `weeks:`
 * (`{ week, overview }`, the Monday the ISO week starts on, at most 600). Each day and week once,
 * and, when `on` is given, each a day the run filed items on (their `added`: Latest is that day's
 * items) or a week items are dated in (the weeks group by `date`). A problem reads
 * `feed/overviews.yaml day <date>: …` or `… week <monday>: …`.
 */
export function checkOverviews(doc: unknown, on?: { added: Set<string>; dates: Set<string> }): { overviews: FeedOverviews; problems: string[] } {
  const problems: string[] = [];
  const overviews: FeedOverviews = { days: [], weeks: [] };
  if (doc == null) return { overviews, problems };
  if (!isRecord(doc)) {
    problems.push(`feed/${OVERVIEWS_FILE}: needs days: and weeks: lists`);
    return { overviews, problems };
  }
  const extra = Object.keys(doc).filter((k) => k !== "days" && k !== "weeks");
  if (extra.length) problems.push(`feed/${OVERVIEWS_FILE}: unknown top-level key(s) ${extra.join(", ")}; it holds days: and weeks: only`);
  const itemDays = on?.added;
  const itemWeeks = on ? new Set([...on.dates].map(weekOf)) : undefined;

  const read = (list: "days" | "weeks", key: "date" | "week", limit: number) => {
    const raw = doc[list];
    if (raw == null) return;
    if (!Array.isArray(raw)) {
      problems.push(`feed/${OVERVIEWS_FILE}: ${list} must be a list`);
      return;
    }
    const seen = new Set<string>();
    raw.forEach((entry, i) => {
      const when = isRecord(entry) ? str(entry[key]) : "";
      const p = (msg: string) => problems.push(`feed/${OVERVIEWS_FILE} ${key === "date" ? "day" : "week"} ${when || `#${i + 1}`}: ${msg}`);
      if (!isRecord(entry)) {
        p(`is not a mapping of ${key} and overview`);
        return;
      }
      const unknown = Object.keys(entry).filter((k) => k !== key && k !== "overview");
      if (unknown.length) p(`unknown field(s) ${unknown.join(", ")}`);
      let ok = isDay(when);
      if (!ok) p(`${key} "${when}" must be a real day, YYYY-MM-DD${key === "week" ? " (the Monday the week starts on)" : ""}`);
      else if (key === "week" && weekOf(when) !== when) {
        p(`${when} is not a Monday; a week is named by the Monday it starts on (${weekOf(when)})`);
        ok = false;
      }
      if (when && seen.has(when)) p(`listed twice; keep one overview per ${key === "date" ? "day" : "week"}`);
      seen.add(when);
      if (ok && key === "date" && itemDays && !itemDays.has(when)) p("no item was added this day; a day's overview belongs to a day the run filed items on");
      if (ok && key === "week" && itemWeeks && !itemWeeks.has(when)) p("no item is dated this week; an overview belongs to a week that has items");
      const overview = str(entry.overview);
      if (!overview) p("needs an overview");
      else if (len(overview) > limit) p(`overview is ${len(overview)} characters; at most ${limit}`);
      if (RETIRED.test(overview)) p(`overview says "archetype"; the reader's word is pattern`);
      if (ok && overview) {
        if (key === "date") overviews.days.push({ date: when, overview });
        else overviews.weeks.push({ week: when, overview });
      }
    });
  };
  read("days", "date", FEED_LIMITS.dayOverview);
  read("weeks", "week", FEED_LIMITS.weekOverview);
  return { overviews, problems };
}

/** The items as the site has them: without the change each implies, or the owner's answer to it. */
export const publicFeed = (items: LoadedFeedItem[]): FeedItem[] =>
  items.map((f) => {
    const { update: _update, decision: _decision, ...rest } = f;
    void _update;
    void _decision;
    return rest;
  });

/**
 * Read data/feed/ (no folder, or no files, is an empty feed) and check it; problems go to `fail`.
 * The stories first (an item names one), then every month file, the decisions (each joined to its
 * item) and the overviews.
 */
export async function loadFeed(
  root: string,
  ctx: FeedContext,
  fail: (msg: string) => void,
): Promise<{ feed: LoadedFeedItem[]; decisions: FeedDecision[]; stories: FeedStory[]; overviews: FeedOverviews; fileOf: Map<string, string> }> {
  const dir = join(root, "data", "feed");
  const empty = { feed: [], decisions: [], stories: [], overviews: { days: [], weeks: [] }, fileOf: new Map<string, string>() };
  if (!existsSync(dir)) return empty;
  const names = (await readdir(dir)).sort();
  for (const f of names.filter((n) => n.endsWith(".yml"))) fail(`feed/${f}: a feed file ends in .yaml`);
  const files: FeedFile[] = [];
  const special: Record<string, unknown> = {};
  for (const file of names.filter((n) => n.endsWith(".yaml"))) {
    try {
      const doc = parse(await readFile(join(dir, file), "utf8"));
      if (file === DECISIONS_FILE || file === STORIES_FILE || file === OVERVIEWS_FILE) special[file] = doc;
      else files.push({ file, doc });
    } catch (e) {
      fail(`feed/${file}: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  const { stories, problems: storyProblems } = checkStories(special[STORIES_FILE], ctx);
  storyProblems.forEach(fail);
  const { feed, problems, fileOf } = checkFeed(files, { exists: (path) => existsSync(join(root, path)), ...ctx, stories });
  problems.forEach(fail);
  const { decisions, problems: decided } = checkDecisions(special[DECISIONS_FILE] ?? null, feed);
  decided.forEach(fail);
  const { overviews, problems: overviewProblems } = checkOverviews(special[OVERVIEWS_FILE], { added: new Set(feed.map((f) => f.added)), dates: new Set(feed.map((f) => f.date)) });
  overviewProblems.forEach(fail);
  const decisionOf = new Map(decisions.map((d) => [d.id, d]));
  return {
    feed: feed.map((f) => {
      const d = decisionOf.get(f.id);
      return d ? { ...f, decision: { decision: d.decision, ...(d.note ? { note: d.note } : {}) } } : f;
    }),
    decisions,
    stories,
    overviews,
    fileOf,
  };
}
