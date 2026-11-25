/**
 * Security tools: data/security-tools/<id>.yaml, one open-source or commercial tool that protects
 * AI systems per file, listed under the catalogue controls it helps deliver. Each control's page
 * shows them as "Tools that deliver it", and the feed item that announced a tool shows it. Every
 * rule is checked here and every problem names the file and the tool. The folder may be missing
 * or empty: no control then lists a tool.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import { SECURITY_TOOL_KINDS, SECURITY_TOOL_STATUSES } from "../../src/lib/feed-vocabulary";
import type { SecurityTool } from "../../src/lib/types";
import { isDay, isHttps } from "./feed";

export const SECURITY_TOOL_LIMITS = { name: 80, by: 80, what: 160, controls: 4 } as const;

const KEYS = new Set(["id", "name", "by", "kind", "url", "what", "controls", "status", "released", "feed"]);

/** What a security tool is checked against. */
export interface SecurityToolContext {
  /** The control catalogue: MITRE mitigations and cap-* specialisations. */
  controlIds: Set<string>;
  /** The feed's item ids: the item that announced a tool must be one. */
  feedIds: Set<string>;
}

export interface SecurityToolFile {
  file: string;
  doc: unknown;
}

const len = (s: string) => [...s].length;
const str = (v: unknown): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim() : typeof v === "number" ? String(v) : v instanceof Date ? v.toISOString().slice(0, 10) : "";
const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const RETIRED = /\barchetypes?\b/i;

/** Every tool, by name, and everything wrong with them. A problem reads `security-tools/<file> tool <id>: <what is wrong>`. */
export function checkSecurityTools(files: SecurityToolFile[], ctx: SecurityToolContext): { tools: SecurityTool[]; problems: string[] } {
  const problems: string[] = [];
  const tools: SecurityTool[] = [];
  const seen = new Map<string, string>();

  for (const { file, doc } of files) {
    const id = isRecord(doc) ? str(doc.id) : "";
    const p = (msg: string) => problems.push(`security-tools/${file} tool ${id || "(no id)"}: ${msg}`);
    if (!isRecord(doc)) {
      p("is not a mapping of fields");
      continue;
    }
    const unknown = Object.keys(doc).filter((k) => !KEYS.has(k));
    if (unknown.length) p(`unknown field(s) ${unknown.join(", ")}`);

    if (!id) p("needs an id");
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) p(`id "${id}" must be kebab-case (lower-case letters, digits and hyphens)`);
    else if (file !== `${id}.yaml`) p(`name the file after its id: ${id}.yaml`);
    if (id && seen.has(id)) p(`duplicate id: also security-tools/${seen.get(id)}`);
    else if (id) seen.set(id, file);

    const name = str(doc.name);
    if (!name) p("needs a name");
    else if (len(name) > SECURITY_TOOL_LIMITS.name) p(`name is ${len(name)} characters; at most ${SECURITY_TOOL_LIMITS.name}`);
    const by = str(doc.by);
    if (!by) p("needs by: the vendor or project");
    else if (len(by) > SECURITY_TOOL_LIMITS.by) p(`by is ${len(by)} characters; at most ${SECURITY_TOOL_LIMITS.by}`);

    const kind = str(doc.kind);
    if (!SECURITY_TOOL_KINDS.some((k) => k.id === kind)) p(`kind "${kind}" is not one of ${SECURITY_TOOL_KINDS.map((k) => k.id).join(", ")}`);
    const url = str(doc.url);
    if (!isHttps(url)) p(`url "${url}" must be an https:// address: its own page or repository`);

    const what = str(doc.what);
    if (!what) p("needs a what: what it does, in one line");
    else if (len(what) > SECURITY_TOOL_LIMITS.what) p(`what is ${len(what)} characters; at most ${SECURITY_TOOL_LIMITS.what}`);
    if (RETIRED.test(what)) p(`what says "archetype"; the reader's word is pattern`);

    let controls: string[] = [];
    if (!Array.isArray(doc.controls)) p(`controls must be a list of 1 to ${SECURITY_TOOL_LIMITS.controls} catalogue controls it helps deliver`);
    else {
      controls = doc.controls.map(str);
      if (controls.length < 1 || controls.length > SECURITY_TOOL_LIMITS.controls) p(`names ${controls.length} controls; 1 to ${SECURITY_TOOL_LIMITS.controls}`);
      for (const c of controls) if (!ctx.controlIds.has(c)) p(`control "${c}" is not in the catalogue (a MITRE mitigation or a cap-* specialisation)`);
      if (new Set(controls).size < controls.length) p("names a control twice");
    }

    const status = str(doc.status);
    if (!SECURITY_TOOL_STATUSES.some((s) => s.id === status)) p(`status "${status}" is not one of ${SECURITY_TOOL_STATUSES.map((s) => s.id).join(", ")}`);
    const released = str(doc.released);
    if (!isDay(released)) p(`released "${released}" must be a real day, YYYY-MM-DD`);

    const feed = doc.feed == null ? undefined : str(doc.feed);
    if (feed !== undefined && !ctx.feedIds.has(feed)) p(`feed "${feed}" is not an item in the feed (data/feed/)`);

    tools.push({
      id,
      name,
      by,
      kind: kind as SecurityTool["kind"],
      url,
      what,
      controls,
      status: status as SecurityTool["status"],
      released,
      ...(feed ? { feed } : {}),
    });
  }
  return { tools: tools.sort((a, b) => a.name.localeCompare(b.name)), problems };
}

/** Read data/security-tools/ (no folder is no tools) and check it; problems go to `fail`. */
export async function loadSecurityTools(root: string, ctx: SecurityToolContext, fail: (msg: string) => void): Promise<SecurityTool[]> {
  const dir = join(root, "data", "security-tools");
  if (!existsSync(dir)) return [];
  const names = (await readdir(dir)).sort();
  for (const f of names.filter((n) => n.endsWith(".yml"))) fail(`security-tools/${f}: a security tool file ends in .yaml`);
  const files: SecurityToolFile[] = [];
  for (const file of names.filter((n) => n.endsWith(".yaml"))) {
    try {
      files.push({ file, doc: parse(await readFile(join(dir, file), "utf8")) });
    } catch (e) {
      fail(`security-tools/${file}: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  const { tools, problems } = checkSecurityTools(files, ctx);
  problems.forEach(fail);
  return tools;
}
