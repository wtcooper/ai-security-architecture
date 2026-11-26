/**
 * What daily-index.mjs, feed-lint.mjs and verify-brief.mjs share: reading the feed's YAML as it
 * stands now or at a git revision, the run's diff against origin/main, ISO weeks, the limits the
 * format sets, and the text checks. Plain Node with the repository's own `yaml` package; nothing
 * here writes a file. Run the scripts from the repository root.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export const root = process.cwd();
if (!existsSync(join(root, "data/feed"))) {
  console.error("Run this from the repository root (the folder that holds data/feed/).");
  process.exit(2);
}

/** The six kinds, in the order the digest and the page list them. */
export const KINDS = ["incident", "productUpdate", "tool", "launch", "guidance", "research"];
export const KIND_LABEL = { incident: "Incident", productUpdate: "Product update", tool: "Tool", launch: "Launch", guidance: "Guidance", research: "Research" };
export const WEIGHTS = ["headline", "notable", "brief"];
export const STATUSES = ["applied", "proposed", "declined", "watch"];
/** The format's ceilings (FEED-V3). Text is written well under them, not to them. */
export const LIMITS = { title: 90, summary: 280, why: 160, updateNote: 200, fitNote: 160, storyTitle: 90, dayOverview: 400, weekOverview: 600, toolWhat: 160 };
/** At most this many headlines on one day. */
export const HEADLINES_PER_DAY = 3;
/** At most this many new security tools a run. */
export const TOOLS_PER_RUN = 3;
/** The site's address for links in the digest (deploy.yml sets NEXT_PUBLIC_BASE_PATH=/ai-security-architecture). */
export const SITE = "https://wtcooper.github.io/ai-security-architecture";
export const feedLink = (id) => `${SITE}/feed/#${id}`;

/** Characters as a reader counts them. */
export const len = (s) => [...(s ?? "")].length;
/** A scalar as text: folded YAML loses its line breaks; a day stays a day. */
export const str = (v) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim() : typeof v === "number" || typeof v === "boolean" ? String(v) : v instanceof Date ? v.toISOString().slice(0, 10) : "";
const isRecord = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** A value with every string's whitespace collapsed and keys sorted, so re-wrapping a summary is not a change. */
export function canon(v) {
  if (typeof v === "string") return str(v);
  if (v instanceof Date) return str(v);
  if (Array.isArray(v)) return v.map(canon);
  if (isRecord(v)) return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
}
export const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

// --- Git --------------------------------------------------------------------------------------

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });

export function refExists(ref) {
  try {
    git("rev-parse", "--verify", "--quiet", `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
}
/** The revision the run is measured against: origin/main unless --base says otherwise. */
export function baseRef(argv) {
  const i = argv.indexOf("--base");
  const ref = i >= 0 ? argv[i + 1] : "origin/main";
  if (!refExists(ref)) {
    console.error(`No revision "${ref}". Run \`git fetch origin main\`, or pass --base <ref> (for example --base HEAD).`);
    process.exit(2);
  }
  return ref;
}
export const shortSha = (ref) => git("rev-parse", "--short", ref).trim();
/**
 * Whether the working branch contains `base`. If it does not (main moved on since the run
 * started, and was not pulled), the diff shows other people's work reversed, as if this run had
 * undone it: the run must pull first.
 */
export function containsBase(base) {
  try {
    git("merge-base", "--is-ancestor", base, "HEAD");
    return true;
  } catch {
    return false;
  }
}
export const behindMessage = (base) =>
  `HEAD does not contain ${base} (${shortSha(base)}): main has moved on, so the diff would show others' work reversed. Commit your draft locally, then \`git pull --rebase origin main\`, and run this again.`;

/** Every path under data/ that differs between `base` and the working tree, untracked files included. */
export function changedPaths(base) {
  const tracked = git("diff", "--name-only", base, "--", "data").split("\n").filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard", "--", "data").split("\n").filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}
/** Paths outside data/ and the log that differ from `base`: a daily run should change none. */
export function otherChangedPaths(base) {
  const tracked = git("diff", "--name-only", base).split("\n").filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
  return [...new Set([...tracked, ...untracked])].filter((p) => !p.startsWith("data/") && !p.startsWith("docs/research/daily/") && !p.startsWith("node_modules")).sort();
}

/** A file's text now (`ref` null) or at a revision; null when it does not exist there. */
export function textAt(ref, path) {
  if (ref == null) return existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null;
  try {
    return git("show", `${ref}:${path}`);
  } catch {
    return null;
  }
}
export function yamlAt(ref, path) {
  const text = textAt(ref, path);
  if (text == null) return null;
  try {
    return parse(text);
  } catch (e) {
    throw new Error(`${path}${ref ? ` at ${ref}` : ""} is not valid YAML: ${e.message.split("\n")[0]}`);
  }
}
/** The names of the files in a folder, now or at a revision. */
export function filesAt(ref, dir) {
  if (ref == null) return existsSync(join(root, dir)) ? readdirSync(join(root, dir)).sort() : [];
  try {
    return git("ls-tree", "--name-only", `${ref}:${dir}`).split("\n").filter(Boolean).sort();
  } catch {
    return [];
  }
}

// --- The feed's files --------------------------------------------------------------------------

/** Every item of every month file, with the file it is in; `kind` defaults to incident. */
export function loadFeed(ref) {
  const items = [];
  for (const file of filesAt(ref, "data/feed").filter((f) => /^\d{4}-\d{2}\.yaml$/.test(f))) {
    const doc = yamlAt(ref, `data/feed/${file}`);
    for (const raw of doc?.items ?? []) {
      if (!isRecord(raw)) continue;
      items.push({ ...raw, id: str(raw.id), kind: raw.kind == null ? "incident" : str(raw.kind), date: str(raw.date), file: `data/feed/${file}` });
    }
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
  return { items, byId: new Map(items.map((f) => [f.id, f])) };
}
/** data/feed/stories.yaml: `stories: [{ id, title, incident? }]`. */
export function loadStories(ref) {
  const doc = yamlAt(ref, "data/feed/stories.yaml");
  const list = (Array.isArray(doc) ? doc : doc?.stories) ?? [];
  return new Map(list.filter(isRecord).map((s) => [str(s.id), { ...s, id: str(s.id), title: str(s.title) }]));
}
/** data/feed/overviews.yaml: `days: [{ date, overview }]`, `weeks: [{ week, overview }]` (week = its Monday). */
export function loadOverviews(ref) {
  const doc = yamlAt(ref, "data/feed/overviews.yaml") ?? {};
  const days = new Map((doc.days ?? []).filter(isRecord).map((d) => [str(d.date), str(d.overview)]));
  const weeks = new Map((doc.weeks ?? []).filter(isRecord).map((w) => [str(w.week), str(w.overview)]));
  return { days, weeks };
}
export function loadDecisions(ref) {
  const doc = yamlAt(ref, "data/feed/decisions.yaml");
  return new Map((Array.isArray(doc) ? doc : []).filter(isRecord).map((d) => [str(d.id), { id: str(d.id), decision: str(d.decision), note: str(d.note) }]));
}
/** data/security-tools/<id>.yaml, by id. */
export function loadSecurityTools(ref) {
  const out = new Map();
  for (const file of filesAt(ref, "data/security-tools").filter((f) => f.endsWith(".yaml"))) {
    const t = yamlAt(ref, `data/security-tools/${file}`);
    if (isRecord(t)) out.set(str(t.id) || file.replace(/\.yaml$/, ""), { ...t, id: str(t.id), released: str(t.released), file: `data/security-tools/${file}` });
  }
  return out;
}

/** Names for ids, from the compiled dataset when `npm run data` has run; ids alone otherwise. */
export function names() {
  const path = join(root, "src/data/generated/dataset.json");
  const empty = { ok: false, product: new Map(), pattern: new Map(), control: new Map(), incidentPattern: new Map(), deepDive: new Map() };
  if (!existsSync(path)) return empty;
  try {
    const d = JSON.parse(readFileSync(path, "utf8"));
    const vendor = new Map((d.vendors ?? []).map((v) => [v.id, v.name]));
    const pattern = new Map((d.archetypes ?? []).map((a) => [a.id, a.title]));
    return {
      ok: true,
      product: new Map((d.tools ?? []).map((t) => [t.id, { name: t.name, vendor: vendor.get(t.vendor) ?? t.vendor, pattern: t.architecture, file: `data/tooling/${t.vendor}/` }])),
      pattern,
      control: new Map([...(d.mitigations ?? []), ...(d.specializations ?? [])].map((m) => [m.id, m.title])),
      incidentPattern: new Map((d.incidentPatterns ?? []).map((p) => [p.id, p.name])),
      deepDive: new Map((d.incidents ?? []).map((i) => [i.id, i.title])),
    };
  } catch {
    return empty;
  }
}

// --- Days and weeks ----------------------------------------------------------------------------

export function todayArg(argv) {
  const i = argv.indexOf("--today");
  const day = i >= 0 ? argv[i + 1] : new Date().toISOString().slice(0, 10);
  if (!isDay(day)) {
    console.error(`--today needs a day, YYYY-MM-DD (got "${day}")`);
    process.exit(2);
  }
  return day;
}
export const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "") && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
export function shift(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** The Monday of the ISO week a day falls in. */
export const mondayOf = (day) => shift(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));
/** ISO year and week number: 2026-11-26 is 2026-w48. */
export function isoWeek(day) {
  const thursday = new Date(`${shift(mondayOf(day), 3)}T00:00:00Z`); // a week's Thursday decides its year
  const year = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4)); // always in week 1
  const firstThursday = new Date(Date.UTC(year, 0, 4 - ((jan4.getUTCDay() + 6) % 7) + 3));
  const week = 1 + Math.round((thursday - firstThursday) / (7 * 86400000));
  return { year, week, label: `${year}-w${String(week).padStart(2, "0")}` };
}
/** The window: the last seven days to today. */
export const windowOf = (today) => ({ from: shift(today, -7), to: today });
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const longDay = (day) => {
  const d = new Date(`${day}T00:00:00Z`);
  return `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const dayMonth = (day) => {
  const d = new Date(`${day}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
/** The roll-up story a single-setting product update joins: settings-<toolId>-<YYYY>-w<NN>. */
export const rollupId = (productId, day) => `settings-${productId}-${isoWeek(day).label}`;

// --- Text --------------------------------------------------------------------------------------

/**
 * A source address reduced to what makes it the same page: no scheme, www, tracking or trailing
 * slash. With `entry`, the fragment stays, so two anchors on one reference page are two entries.
 */
export function pageKey(url, { entry = false } = {}) {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (/^utm_|^(ref|source|fbclid|gclid)$/i.test(k)) u.searchParams.delete(k);
    const q = u.searchParams.toString();
    const hash = entry && u.hash.length > 1 ? u.hash.toLowerCase() : "";
    return `${u.host.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}${q ? `?${q}` : ""}`.toLowerCase() + hash;
  } catch {
    return String(url).toLowerCase();
  }
}
/** A page that lists many entries (a changelog, release notes): two items may cite it, each for its own entry. */
export const isRunningPage = (url) => /change-?log|release-?notes|\/releases\b|what-?s-?new|\/news\b|\/updates?\b|history/i.test(pageKey(url));
/** Hosts that are leads, never sources. */
export const LEAD_HOSTS = /(^|\.)(news\.ycombinator\.com|tldr\.tech|tldrsec\.com|reddit\.com|news\.google\.com|x\.com|twitter\.com|t\.co|lobste\.rs)$/i;
export const isLeadHost = (url) => {
  try {
    return LEAD_HOSTS.test(new URL(url).host);
  } catch {
    return false;
  }
};

const STOP = new Set(
  "a an the of to in on for and or with by from its it is as at into via over after new now can their this that be are was were has have than more not no up out off one two lets adds gets".split(" "),
);
const words = (t) =>
  str(t)
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9.]+/)
    .map((w) => w.replace(/\.+$/, "").replace(/(?<=[a-z]{3})s$/, ""))
    .filter((w) => w && !STOP.has(w));
/** How alike two titles are: shared words over all words (Jaccard), stop words set aside. */
export function titleLikeness(a, b) {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / (A.size + B.size - shared);
}
/** Distinctive names in a text (ARTEX, CyberStrikeAI, Storm-0940): an inner capital or a digit, four characters or more. */
export const namesIn = (t) => [...new Set(str(t).match(/\b(?:[A-Z][A-Za-z]*[A-Z][A-Za-z0-9]*|[A-Z][a-z]+-\d+|[A-Z]{4,})\b/g) ?? [])].filter((w) => w.length >= 4);
/** Names too common in this field to mark a follow-up. */
export const COMMON_NAMES = new Set(
  "README APIs OAuth IMDSv2 IMDSv1 URLs IDs GenAI OpenTelemetry HTTP HTTPS HTML JSON YAML SaaS IdP IdPs SDKs CVEs LLMs GPUs MCPs HIPAA FERPA CMEK ZDR SSO SAML SCIM RBAC SIEM VPCs CISA NIST OWASP MITRE ATLAS NCSC CERT GDPR EU-US DevOps DevSecOps PowerShell JavaScript TypeScript GitHub GitLab LinkedIn YouTube WhatsApp ChatGPT OpenAI DeepSeek PyPI npm macOS iOS".split(" "),
);
