/**
 * The incident patterns: data/incident-patterns/<NN>-<slug>.yaml, one file each. They are the
 * source of truth for `category`: every deep dive and feed item must name one by its id. Every
 * rule of the format is checked here and every problem names the file and the field, so a bad
 * entry is found without reading the rest. `id`, `slug`, `order`, `name`, `short` and `since`
 * are required; every other field is checked when present. What a page derives (deep dives,
 * feed items, the patterns it lands on) is never written in the file.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import type { IncidentPatternAuthored, IncidentPatternContrast, IncidentPatternStop } from "../../src/lib/types";

/** Field limits, in characters, as the format sets them. */
export const INCIDENT_PATTERN_LIMITS = { name: 60, short: 140, overview: 700, step: 160, sign: 140, how: 160, why: 160 } as const;

/** How many entries a list may hold, when it is present. */
export const INCIDENT_PATTERN_COUNTS = {
  howItWorks: [3, 5],
  signs: [2, 4],
  stops: [2, 6],
  notSameAs: [1, 3],
} as const;

/** The keys a file may carry. Anything else is a typo, or derived data that is never written. */
const KEYS = new Set(["id", "slug", "order", "name", "short", "since", "overview", "howItWorks", "signs", "stops", "risks", "owasp", "atlas", "notSameAs"]);
const STOP_KEYS = new Set(["control", "how"]);
const CONTRAST_KEYS = new Set(["pattern", "why"]);

/** Addresses under /incidents/ that are not incident patterns. */
const RESERVED_SLUGS = new Set(["feed"]);

/** What a file is checked against. */
export interface IncidentPatternContext {
  /** The control catalogue: MITRE mitigations, D3FEND techniques and cap-* specialisations. */
  controlIds: Set<string>;
  riskIds: Set<string>;
  /** OWASP ids as the threat models write them: LLM01:2026, ASI01, MCP01:2025. */
  owaspIds: Set<string>;
  /** ATLAS technique ids in the vendored release. */
  atlasIds: Set<string>;
  /** The deep dives (data/incidents/): their ids share /incidents/<id>/ with the slugs. */
  deepDiveIds: Set<string>;
}

/** One file: its name in data/incident-patterns/ and its parsed YAML. */
export interface IncidentPatternFile {
  file: string;
  doc: unknown;
}

const len = (s: string) => [...s].length;
/** A scalar as text: folded YAML loses its line breaks and trailing newline; a date stays a day. */
const str = (v: unknown): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim() : typeof v === "number" ? String(v) : v instanceof Date ? v.toISOString().slice(0, 10) : "";
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const RETIRED = /\barchetypes?\b/i;

/**
 * An OWASP id as the threat models write it. "LLM01" and "MCP01" are read as the one edition the
 * site carries (LLM01:2026, MCP01:2025), so a short id is not a reason to fail.
 */
function owaspId(raw: string, known: Set<string>): string | null {
  if (known.has(raw)) return raw;
  const editions = [...known].filter((id) => id.startsWith(`${raw}:`));
  return editions.length === 1 ? editions[0] : null;
}

/**
 * Every incident pattern, by `order`, and everything wrong with them. A problem reads
 * `incident-patterns/<file>: <field>: <what is wrong>`.
 */
export function checkIncidentPatterns(files: IncidentPatternFile[], ctx: IncidentPatternContext): { patterns: IncidentPatternAuthored[]; problems: string[] } {
  const problems: string[] = [];
  const out: { pattern: IncidentPatternAuthored; file: string; contrasts: IncidentPatternContrast[] }[] = [];
  const ids = new Map<string, string>();
  const slugs = new Map<string, string>();
  const orders = new Map<number, string>();

  for (const { file, doc } of files) {
    const where = `incident-patterns/${file}`;
    const p = (field: string, msg: string) => problems.push(`${where}: ${field}: ${msg}`);
    if (!isRecord(doc)) {
      problems.push(`${where}: is not a mapping of fields`);
      continue;
    }
    const unknown = Object.keys(doc).filter((k) => !KEYS.has(k));
    if (unknown.length) problems.push(`${where}: unknown field(s) ${unknown.join(", ")}; deep dives, feed items and landings are derived, not written`);

    const id = str(doc.id);
    if (!id) p("id", "required");
    else if (!/^[a-z][a-zA-Z0-9]*$/.test(id)) p("id", `"${id}" must be camelCase (the key feed items and deep dives carry in category)`);
    else if (ids.has(id)) p("id", `"${id}" is also the id of incident-patterns/${ids.get(id)}`);
    else ids.set(id, file);

    const slug = str(doc.slug);
    if (!slug) p("slug", "required");
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) p("slug", `"${slug}" must be kebab-case (lower-case letters, digits and hyphens)`);
    else {
      if (slugs.has(slug)) p("slug", `"${slug}" is also the slug of incident-patterns/${slugs.get(slug)}`);
      else slugs.set(slug, file);
      if (ctx.deepDiveIds.has(slug)) p("slug", `"${slug}" is the id of a deep dive (data/incidents/); both live at /incidents/<id>/, so choose another`);
      if (RESERVED_SLUGS.has(slug)) p("slug", `"${slug}" is the old address of the feed; choose another`);
      if (!new RegExp(`^\\d{2}-${slug}\\.yaml$`).test(file)) p("slug", `the file is named <NN>-<slug>.yaml, so ${file} should be NN-${slug}.yaml`);
    }

    const order = typeof doc.order === "number" ? doc.order : NaN;
    if (doc.order == null) p("order", "required");
    else if (!Number.isInteger(order) || order < 1) p("order", `${String(doc.order)} must be a whole number from 1`);
    else if (orders.has(order)) p("order", `${order} is also the order of incident-patterns/${orders.get(order)}`);
    else orders.set(order, file);

    const text = (field: string, max: number, required: boolean): string | undefined => {
      const raw = doc[field];
      if (raw == null) {
        if (required) p(field, "required");
        return undefined;
      }
      const value = str(raw);
      if (!value) p(field, required ? "required" : "is empty; leave it out instead");
      else if (len(value) > max) p(field, `${len(value)} characters; at most ${max}`);
      if (RETIRED.test(value)) p(field, `says "archetype"; the reader's word is pattern`);
      return value || undefined;
    };
    const name = text("name", INCIDENT_PATTERN_LIMITS.name, true);
    const short = text("short", INCIDENT_PATTERN_LIMITS.short, true);
    const overview = text("overview", INCIDENT_PATTERN_LIMITS.overview, false);

    const since = str(doc.since);
    if (doc.since == null) p("since", "required");
    else if (!isDay(since)) p("since", `"${since}" must be a real day, YYYY-MM-DD (when the incident pattern was added)`);

    /** A list of strings, its count and each entry's length checked. */
    const lines = (field: "howItWorks" | "signs", max: number): string[] | undefined => {
      const raw = doc[field];
      if (raw == null) return undefined;
      if (!Array.isArray(raw)) {
        p(field, "must be a list");
        return undefined;
      }
      const [lo, hi] = INCIDENT_PATTERN_COUNTS[field];
      if (raw.length < lo || raw.length > hi) p(field, `has ${raw.length}; ${lo} to ${hi}`);
      return raw.map((v, i) => {
        const value = str(v);
        if (!value) p(`${field} ${i + 1}`, "is empty");
        else if (len(value) > max) p(`${field} ${i + 1}`, `${len(value)} characters; at most ${max}`);
        if (RETIRED.test(value)) p(`${field} ${i + 1}`, `says "archetype"; the reader's word is pattern`);
        return value;
      });
    };
    const howItWorks = lines("howItWorks", INCIDENT_PATTERN_LIMITS.step);
    const signs = lines("signs", INCIDENT_PATTERN_LIMITS.sign);

    let stops: IncidentPatternStop[] | undefined;
    if (doc.stops != null) {
      if (!Array.isArray(doc.stops)) p("stops", "must be a list of control and how");
      else {
        const [lo, hi] = INCIDENT_PATTERN_COUNTS.stops;
        if (doc.stops.length < lo || doc.stops.length > hi) p("stops", `has ${doc.stops.length}; ${lo} to ${hi} controls`);
        stops = [];
        doc.stops.forEach((s, i) => {
          const at = `stops ${i + 1}`;
          if (!isRecord(s)) {
            p(at, "is not a mapping of control and how");
            return;
          }
          const extra = Object.keys(s).filter((k) => !STOP_KEYS.has(k));
          if (extra.length) p(at, `unknown field(s) ${extra.join(", ")}`);
          const control = str(s.control);
          const how = str(s.how);
          if (!control) p(at, "needs a control");
          else if (!ctx.controlIds.has(control)) p(at, `control "${control}" is not in the control catalogue (data/mitre, cap-*)`);
          if (stops!.some((x) => x.control === control)) p(at, `names ${control} twice`);
          if (!how) p(at, `needs a how: where ${control || "it"} bites`);
          else if (len(how) > INCIDENT_PATTERN_LIMITS.how) p(at, `how is ${len(how)} characters; at most ${INCIDENT_PATTERN_LIMITS.how}`);
          if (RETIRED.test(how)) p(at, `how says "archetype"; the reader's word is pattern`);
          stops!.push({ control, how });
        });
      }
    }

    /** A list of ids, each checked to exist; `known` may rewrite an id to its full form. */
    const idList = (field: "risks" | "owasp" | "atlas", known: (v: string) => string | null, what: string): string[] | undefined => {
      const raw = doc[field];
      if (raw == null) return undefined;
      if (!Array.isArray(raw)) {
        p(field, "must be a list");
        return undefined;
      }
      const found: string[] = [];
      for (const v of raw) {
        const value = str(v);
        const resolved = known(value);
        if (!resolved) p(field, `"${value}" ${what}`);
        else if (found.includes(resolved)) p(field, `names ${resolved} twice`);
        else found.push(resolved);
      }
      return found;
    };
    const risks = idList("risks", (v) => (ctx.riskIds.has(v) ? v : null), "is not a risk (data/cosai/risks.yaml or the authored risks)");
    const owasp = idList("owasp", (v) => owaspId(v, ctx.owaspIds), "is not an OWASP id as the threat models write them (LLM01:2026, ASI01, MCP01:2025)");
    const atlas = idList("atlas", (v) => (ctx.atlasIds.has(v) ? v : null), "is not an ATLAS technique in the vendored release");

    const contrasts: IncidentPatternContrast[] = [];
    if (doc.notSameAs != null) {
      if (!Array.isArray(doc.notSameAs)) p("notSameAs", "must be a list of pattern and why");
      else {
        const [lo, hi] = INCIDENT_PATTERN_COUNTS.notSameAs;
        if (doc.notSameAs.length < lo || doc.notSameAs.length > hi) p("notSameAs", `has ${doc.notSameAs.length}; ${lo} to ${hi}`);
        doc.notSameAs.forEach((c, i) => {
          const at = `notSameAs ${i + 1}`;
          if (!isRecord(c)) {
            p(at, "is not a mapping of pattern and why");
            return;
          }
          const extra = Object.keys(c).filter((k) => !CONTRAST_KEYS.has(k));
          if (extra.length) p(at, `unknown field(s) ${extra.join(", ")}`);
          const pattern = str(c.pattern);
          const why = str(c.why);
          if (!pattern) p(at, "needs a pattern: the id of the nearest incident pattern");
          else if (pattern === id) p(at, `names ${pattern}, this incident pattern itself`);
          if (contrasts.some((x) => x.pattern === pattern)) p(at, `names ${pattern} twice`);
          if (!why) p(at, "needs a why: the line between the two");
          else if (len(why) > INCIDENT_PATTERN_LIMITS.why) p(at, `why is ${len(why)} characters; at most ${INCIDENT_PATTERN_LIMITS.why}`);
          if (RETIRED.test(why)) p(at, `why says "archetype"; the reader's word is pattern`);
          contrasts.push({ pattern, why });
        });
      }
    }

    out.push({
      file,
      contrasts,
      pattern: {
        id,
        slug,
        order,
        name: name ?? "",
        short: short ?? "",
        since,
        ...(overview ? { overview } : {}),
        ...(howItWorks ? { howItWorks } : {}),
        ...(signs ? { signs } : {}),
        ...(stops ? { stops } : {}),
        ...(risks ? { risks } : {}),
        ...(owasp ? { owasp } : {}),
        ...(atlas ? { atlas } : {}),
        ...(doc.notSameAs != null ? { notSameAs: contrasts } : {}),
      },
    });
  }

  // A contrast names another incident pattern, so it is checked once every file is read.
  for (const { file, contrasts } of out) {
    contrasts.forEach((c, i) => {
      if (c.pattern && !ids.has(c.pattern)) problems.push(`incident-patterns/${file}: notSameAs ${i + 1}: pattern "${c.pattern}" is not an incident pattern id (${[...ids.keys()].join(", ")})`);
    });
  }

  const patterns = out.map((x) => x.pattern).sort((a, b) => a.order - b.order);
  return { patterns, problems };
}

/** Read data/incident-patterns/ (no folder is no incident patterns) and check it; problems go to `fail`. */
export async function loadIncidentPatterns(root: string, ctx: IncidentPatternContext, fail: (msg: string) => void): Promise<IncidentPatternAuthored[]> {
  const dir = join(root, "data", "incident-patterns");
  if (!existsSync(dir)) return [];
  const names = (await readdir(dir)).sort();
  for (const f of names.filter((n) => n.endsWith(".yml"))) fail(`incident-patterns/${f}: an incident pattern file ends in .yaml`);
  const files: IncidentPatternFile[] = [];
  for (const file of names.filter((n) => n.endsWith(".yaml"))) {
    try {
      files.push({ file, doc: parse(await readFile(join(dir, file), "utf8")) });
    } catch (e) {
      fail(`incident-patterns/${file}: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  const { patterns, problems } = checkIncidentPatterns(files, ctx);
  problems.forEach(fail);
  return patterns;
}

/**
 * Whether a `category` names an incident pattern, and what to say when it does not: the problem
 * text the feed and the deep dives share.
 */
export const categoryProblem = (category: string, ids: string[]): string | null =>
  ids.includes(category) ? null : `category "${category}" is not an incident pattern (data/incident-patterns/): one of ${ids.join(", ") || "none, since there are no incident pattern files"}`;
