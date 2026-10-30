import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import {
  ADOPTION_STATUSES,
  SETTING_AREAS,
  SETTING_VIAS,
  type Archetype,
  type CloudPlatform,
  type ProductSetting,
  type ProductStatusEntry,
  type Tool,
} from "../../src/lib/types";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * One product's (or one cloud's) settings, checked to the rubric in data/tooling/BASELINE.md:
 * every row names where it lives, how it is set, its baseline value and why, and the page that
 * documents it; every capability it claims must exist, and — when `pinned` is given — be pinned
 * on the drawing the row is shown on, so the Capability column never names a chip that is not there.
 */
export function checkSettings(
  where: string,
  settings: ProductSetting[] | undefined,
  ctx: { mitigationIds: Set<string>; pinned?: Set<string>; fail: (msg: string) => void },
) {
  const seen = new Set<string>();
  for (const s of settings ?? []) {
    const at = `${where} setting ${s.id}`;
    if (!/^[a-z][A-Za-z0-9]*$/.test(s.id ?? "")) ctx.fail(`${at}: id must be camelCase`);
    if (seen.has(s.id)) ctx.fail(`${at}: duplicate id`);
    seen.add(s.id);
    for (const key of ["name", "where", "recommended", "why", "url", "verified"] as const) {
      if (!String(s[key] ?? "").trim()) ctx.fail(`${at}: needs ${key}`);
    }
    if (s.verified && !ISO_DAY.test(s.verified)) ctx.fail(`${at}: verified must be YYYY-MM-DD`);
    if (s.url && !/^https:\/\//.test(s.url)) ctx.fail(`${at}: url must be https`);
    if (!SETTING_AREAS.includes(s.area)) ctx.fail(`${at}: area must be one of ${SETTING_AREAS.join(", ")}`);
    if (!s.setVia?.length) ctx.fail(`${at}: needs setVia`);
    for (const v of s.setVia ?? []) if (!SETTING_VIAS.includes(v)) ctx.fail(`${at}: setVia ${v} is not one of ${SETTING_VIAS.join(", ")}`);
    if (!Array.isArray(s.mitigations)) ctx.fail(`${at}: mitigations must be a list (empty when it serves an area, not a pinned capability)`);
    for (const id of s.mitigations ?? []) {
      if (!ctx.mitigationIds.has(id)) ctx.fail(`${at}: unknown capability ${id}`);
      else if (ctx.pinned && !ctx.pinned.has(id)) ctx.fail(`${at}: ${id} is not pinned on the drawing this setting is shown on`);
    }
  }
}

/** The three clouds under data/clouds/, each with its settings and its first-party implementations. */
export async function loadClouds(
  root: string,
  ctx: { archetypes: Archetype[]; mitigationIds: Set<string>; fail: (msg: string) => void },
): Promise<CloudPlatform[]> {
  const dir = join(root, "data", "clouds");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".yaml")).sort();
  } catch {
    return [];
  }
  const archById = new Map(ctx.archetypes.map((a) => [a.id, a]));
  const clouds: CloudPlatform[] = [];
  for (const file of files) {
    const cloud = parse(await readFile(join(dir, file), "utf8")) as CloudPlatform;
    const where = `clouds/${file}`;
    if (!/^cloud[A-Z]/.test(cloud.id ?? "")) ctx.fail(`${where}: id must match ^cloud[A-Z]`);
    if (!cloud.name?.trim() || !cloud.short?.trim()) ctx.fail(`${where}: needs a name and a short name`);
    cloud.settings ??= [];
    cloud.implementations ??= [];
    checkSettings(where, cloud.settings, { mitigationIds: ctx.mitigationIds, fail: ctx.fail });
    const settingById = new Map(cloud.settings.map((s) => [s.id, s]));
    const used = new Set<string>();
    const implemented = new Set<string>();
    for (const impl of cloud.implementations) {
      const at = `${where} ${impl.architecture}`;
      const arch = archById.get(impl.architecture);
      if (!arch) {
        ctx.fail(`${at}: unknown architecture`);
        continue;
      }
      if (arch.surface !== "surfaceCloud") ctx.fail(`${at}: cloud implementations are for first-party cloud architectures`);
      if (implemented.has(arch.id)) ctx.fail(`${at}: implemented twice`);
      implemented.add(arch.id);
      if (!impl.asOf?.trim()) ctx.fail(`${at}: needs asOf`);
      if (!impl.reference?.length) ctx.fail(`${at}: needs the cloud's own reference architecture`);
      for (const r of impl.reference ?? []) if (!r.title?.trim() || !r.url?.trim()) ctx.fail(`${at}: a reference needs a title and a url`);
      // Every component drawn is bound to a service or marked as built; governance call-outs and
      // actors are not components.
      const blocks = arch.blocks.filter((b) => b.kind !== "governance" && b.kind !== "actor" && b.kind !== "origin");
      const bound = new Set<string>();
      for (const b of impl.bindings ?? []) {
        if (!arch.blocks.some((x) => x.id === b.block)) ctx.fail(`${at}: binding for unknown block ${b.block}`);
        if (bound.has(b.block)) ctx.fail(`${at}: block ${b.block} bound twice`);
        bound.add(b.block);
        if (!b.service?.trim()) ctx.fail(`${at} ${b.block}: needs a service`);
      }
      for (const b of blocks) if (!bound.has(b.id)) ctx.fail(`${at}: block ${b.id} (${b.title}) has no binding — name the service or mark it build: true`);
      const pinned = new Set(arch.mitigations);
      for (const id of impl.settings ?? []) {
        const s = settingById.get(id);
        if (!s) {
          ctx.fail(`${at}: unknown setting ${id}`);
          continue;
        }
        used.add(id);
        const off = s.mitigations.filter((c) => !pinned.has(c));
        if (s.mitigations.length && off.length === s.mitigations.length)
          ctx.fail(`${at}: setting ${id} delivers nothing pinned here (${off.join(", ")})`);
      }
      // Every pinned capability has at least one row: a cloud setting or a line of our own code.
      const delivered = new Set((impl.settings ?? []).flatMap((id) => settingById.get(id)?.mitigations ?? []));
      for (const id of arch.mitigations) if (!delivered.has(id)) ctx.fail(`${at}: pinned capability ${id} has no setting or code row`);
    }
    for (const s of cloud.settings) if (!used.has(s.id)) ctx.fail(`${where}: setting ${s.id} is used by no implementation`);
    clouds.push(cloud);
  }
  return clouds;
}

/** The organisation's product section of data/status.yaml: every key a tool or cloud, every setting one it lists. */
export async function loadProductStatus(root: string, tools: Tool[], clouds: CloudPlatform[]): Promise<Record<string, ProductStatusEntry>> {
  const doc = parse(await readFile(join(root, "data/status.yaml"), "utf8")) as { products?: Record<string, ProductStatusEntry> | null };
  const settingsOf = new Map<string, Set<string>>([
    ...tools.map((t) => [t.id, new Set((t.settings ?? []).map((s) => s.id))] as const),
    ...clouds.map((c) => [c.id, new Set(c.settings.map((s) => s.id))] as const),
  ]);
  const check = (ok: unknown, msg: string) => { if (!ok) throw new Error(`status.yaml: ${msg}`); };
  const out: Record<string, ProductStatusEntry> = {};
  for (const [id, entry] of Object.entries(doc?.products ?? {})) {
    const known = settingsOf.get(id);
    check(known, `unknown product ${id} — use a tool id from data/tooling/ or a cloud id from data/clouds/`);
    check(entry && typeof entry === "object", `${id} needs a status, a note or settings`);
    const extra = Object.keys(entry).filter((k) => !["status", "note", "settings"].includes(k));
    check(!extra.length, `${id} has unknown field ${extra.join(", ")}`);
    check(entry.status === undefined || ADOPTION_STATUSES.includes(entry.status), `${id} status must be one of ${ADOPTION_STATUSES.join(", ")}`);
    for (const [sid, s] of Object.entries(entry.settings ?? {})) {
      check(known!.has(sid), `${id} has no setting ${sid}`);
      check(s?.status === undefined || ADOPTION_STATUSES.includes(s.status), `${id}.${sid} status must be one of ${ADOPTION_STATUSES.join(", ")}`);
    }
    out[id] = entry;
  }
  return out;
}
