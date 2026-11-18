import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import {
  ADOPTION_STATUSES,
  CLOUD_ROLES,
  HOSTING_COMPARE,
  HOSTING_KINDS,
  SETTING_AREAS,
  SETTING_VIAS,
  checkCommandProblem,
  type Archetype,
  type CloudImplementation,
  type CloudPlatform,
  type ProductSetting,
  type ProductStatusEntry,
  type Tool,
} from "../../src/lib/types";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * One product's (or one cloud's) settings, checked to the rubric in data/tooling/BASELINE.md:
 * every row names where it lives, how it is set, its baseline value and why, and the page that
 * documents it; every control it claims must exist, and — when `pinned` is given — be pinned
 * on the drawing the row is shown on, so the Control column never names a chip that is not there.
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
    // A bare `true` or `1` in YAML is not text, and a page shows a non-text value as nothing: quote it.
    for (const key of ["name", "where", "recommended", "why", "default", "requires"] as const) {
      const value = (s as unknown as Record<string, unknown>)[key];
      if (value !== undefined && typeof value !== "string") ctx.fail(`${at}: ${key} must be text; write "${String(value)}" in quotes`);
    }
    if (s.verified && !ISO_DAY.test(s.verified)) ctx.fail(`${at}: verified must be YYYY-MM-DD`);
    if (s.url && !/^https:\/\//.test(s.url)) ctx.fail(`${at}: url must be https`);
    if (!SETTING_AREAS.includes(s.area)) ctx.fail(`${at}: area must be one of ${SETTING_AREAS.join(", ")}`);
    if (s.builtWith !== undefined && (typeof s.builtWith !== "string" || !s.builtWith.trim() || s.builtWith.length > 40)) ctx.fail(`${at}: builtWith names a framework or server in 1 to 40 characters`);
    if (s.check) {
      // A check reads and never changes: this catalogue does not tell an organisation how to deploy.
      const problem = checkCommandProblem(String(s.check.command ?? ""));
      if (problem) ctx.fail(`${at}: check.command ${problem}`);
      if (!String(s.check.expect ?? "").trim()) ctx.fail(`${at}: check needs expect: what a passing result looks like`);
      if (!/^https:\/\//.test(s.check.url ?? "")) ctx.fail(`${at}: check needs the https address of the command's reference page`);
      if (s.setVia?.length === 1 && s.setVia[0] === "code") ctx.fail(`${at}: a control built in your own code has no vendor command to check it`);
    }
    if (!s.setVia?.length) ctx.fail(`${at}: needs setVia`);
    for (const v of s.setVia ?? []) if (!SETTING_VIAS.includes(v)) ctx.fail(`${at}: setVia ${v} is not one of ${SETTING_VIAS.join(", ")}`);
    if (!Array.isArray(s.mitigations)) ctx.fail(`${at}: mitigations must be a list (empty when it serves an area, not a pinned control)`);
    for (const id of s.mitigations ?? []) {
      if (!ctx.mitigationIds.has(id)) ctx.fail(`${at}: unknown control ${id}`);
      else if (ctx.pinned && !ctx.pinned.has(id)) ctx.fail(`${at}: ${id} is not pinned on the drawing this setting is shown on`);
    }
  }
}

/** The platforms under data/clouds/ (three clouds and the organisation's own data centre), each with its settings and its implementations. */
export async function loadClouds(
  root: string,
  ctx: {
    archetypes: Archetype[];
    mitigationIds: Set<string>;
    fail: (msg: string) => void;
    toolIds?: Set<string>;
    /** Products that are a service of one platform: their settings count towards that platform's coverage. */
    services?: { id: string; platform: string; architecture: string; mitigations: string[] }[];
  },
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
    if (cloud.selfManaged !== undefined && typeof cloud.selfManaged !== "boolean") ctx.fail(`${where}: selfManaged must be true or false`);
    if (cloud.boundary !== undefined && (!cloud.boundary.trim() || cloud.boundary.length > 26)) ctx.fail(`${where}: boundary is the title drawn on the organisation's own boundary: 1 to 26 characters`);
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
        const extra = Object.keys(b).filter((k) => !["block", "service", "note", "build", "builtWith", "url", "verified"].includes(k));
        // A comma inside an unquoted service splits it into a stray key: quote the value.
        if (extra.length) ctx.fail(`${at} ${b.block}: unknown field "${extra.join('", "')}" — quote a service or note that contains a comma`);
        if (b.builtWith !== undefined && (typeof b.builtWith !== "string" || !b.builtWith.trim() || b.builtWith.length > 40)) ctx.fail(`${at} ${b.block}: builtWith names a framework or server in 1 to 40 characters`);
        // The platform names where the box runs; the framework is recorded beside it, not inside the name.
        if (/\((Strands|ADK|Microsoft Agent Framework|LangGraph)\)\s*$/.test(b.service ?? "")) ctx.fail(`${at} ${b.block}: name the framework in builtWith, not in brackets after the service`);
      }
      for (const b of blocks) if (!bound.has(b.id)) ctx.fail(`${at}: block ${b.id} (${b.title}) has no binding — name the service or mark it build: true`);
      // What the mapping was checked against. `sources` is authored as block id -> vendor page, so a
      // re-verification rewrites one small map; it is folded onto the bindings here.
      const authored = impl as CloudImplementation & { sources?: Record<string, string> };
      if (impl.verified && !ISO_DAY.test(impl.verified)) ctx.fail(`${at}: verified must be YYYY-MM-DD`);
      for (const [block, url] of Object.entries(authored.sources ?? {})) {
        const binding = impl.bindings.find((b) => b.block === block);
        if (!binding) ctx.fail(`${at}: sources names ${block}, which has no binding`);
        else if (!/^https:\/\//.test(url ?? "")) ctx.fail(`${at}: source for ${block} must be an https address`);
        else binding.url ??= url;
      }
      delete authored.sources;
      if (impl.verified) for (const b of impl.bindings) if (b.url) b.verified = impl.verified;
      // A difference names a real flow or box of the pattern; the drawing marks it there.
      const edgeKeys = new Set(arch.edges.flatMap((e) => [`${e.from}->${e.to}`, `${e.to}->${e.from}`]));
      for (const d of impl.differences ?? []) {
        if (!arch.blocks.some((x) => x.id === d.at) && !edgeKeys.has(d.at)) ctx.fail(`${at}: difference at "${d.at}" is neither a block nor a flow of ${arch.id}`);
        const text = d.text?.trim() ?? "";
        if (!text) ctx.fail(`${at}: difference at ${d.at} needs text`);
        else if (text.length > 380) ctx.fail(`${at}: difference at ${d.at} is ${text.length} characters; keep it to 380`);
        if (d.url && !/^https:\/\//.test(d.url)) ctx.fail(`${at}: difference at ${d.at}: url must be https`);
      }
      for (const n of impl.alsoNeeded ?? []) {
        if (!n.service?.trim() || !n.why?.trim()) ctx.fail(`${at}: an also-needed service needs a name and a reason`);
        if (!CLOUD_ROLES.includes(n.role)) ctx.fail(`${at}: also-needed ${n.service}: role must be one of ${CLOUD_ROLES.join(", ")}`);
        if (n.url && !/^https:\/\//.test(n.url)) ctx.fail(`${at}: also-needed ${n.service}: url must be https`);
      }
      for (const q of impl.quickstart ?? []) if (!q.title?.trim() || !/^https:\/\//.test(q.url ?? "")) ctx.fail(`${at}: a quickstart needs a title and an https address`);
      // Hosting options: the same rows for each, one of them the mapping itself.
      const options = impl.hosting ?? [];
      if (options.length) {
        if (options.filter((o) => o.mapped).length !== 1) ctx.fail(`${at}: exactly one hosting option is mapped: true, the one the components and settings describe`);
        const ids = new Set<string>();
        for (const o of options) {
          const oat = `${at} hosting ${o.id}`;
          if (!/^[a-z][A-Za-z0-9]*$/.test(o.id ?? "") || ids.has(o.id)) ctx.fail(`${oat}: id must be camelCase and unique`);
          ids.add(o.id);
          if (!HOSTING_KINDS.includes(o.kind)) ctx.fail(`${oat}: kind must be one of ${HOSTING_KINDS.join(", ")}`);
          if (!o.name?.trim()) ctx.fail(`${oat}: needs a name`);
          if (o.url && !/^https:\/\//.test(o.url)) ctx.fail(`${oat}: url must be https`);
          for (const [key, label] of HOSTING_COMPARE) {
            const text = String(o.compare?.[key] ?? "").trim();
            if (!text) ctx.fail(`${oat}: compare needs "${key}" (${label}); every option answers the same rows`);
            else if (text.length > 190) ctx.fail(`${oat}: compare.${key} is ${text.length} characters; keep it to 190`);
          }
          const unknownRows = Object.keys(o.compare ?? {}).filter((k) => !HOSTING_COMPARE.some(([key]) => key === k));
          if (unknownRows.length) ctx.fail(`${oat}: unknown compare row ${unknownRows.join(", ")}`);
          for (const u of o.sources ?? []) if (!/^https:\/\//.test(u)) ctx.fail(`${oat}: a source must be an https address`);
          if (o.kind === "managed") {
            // The vendor runs it there. A managed agent is drawn as another pattern, which the option names.
            if (o.pattern && !archById.has(o.pattern)) ctx.fail(`${oat}: unknown pattern ${o.pattern}`);
            if (o.mapped || o.bindings?.length || o.addSettings?.length) ctx.fail(`${oat}: on a managed option the vendor runs it, so it is not a variant of this pattern and has no components or settings here`);
            if (o.tool && ctx.toolIds && !ctx.toolIds.has(o.tool)) ctx.fail(`${oat}: unknown tool ${o.tool}`);
            for (const x of o.offers ?? []) if (!x.name?.trim() || !x.what?.trim()) ctx.fail(`${oat}: each offer needs a name and what it is`);
            continue;
          }
          if (o.mapped) {
            if (o.bindings?.length || o.addSettings?.length || o.dropSettings?.length) ctx.fail(`${oat}: the mapped option is the mapping itself; put its components and settings there`);
            continue;
          }
          // A variant states only what changes, and must still deliver every pinned control.
          const seenBlocks = new Set<string>();
          for (const b of o.bindings ?? []) {
            if (!impl.bindings.some((x) => x.block === b.block)) ctx.fail(`${oat}: binding for ${b.block}, which the mapping does not bind`);
            if (seenBlocks.has(b.block)) ctx.fail(`${oat}: block ${b.block} bound twice`);
            seenBlocks.add(b.block);
            if (!b.service?.trim()) ctx.fail(`${oat} ${b.block}: needs a service`);
            if (b.url && !/^https:\/\//.test(b.url)) ctx.fail(`${oat} ${b.block}: url must be https`);
          }
          for (const id of o.dropSettings ?? []) if (!(impl.settings ?? []).includes(id)) ctx.fail(`${oat}: drops ${id}, which the mapping does not list`);
          for (const id of o.addSettings ?? []) {
            if (!settingById.has(id)) ctx.fail(`${oat}: adds unknown setting ${id}`);
            used.add(id);
          }
          const dropped = new Set(o.dropSettings ?? []);
          const kept = [...(impl.settings ?? []).filter((id) => !dropped.has(id)), ...(o.addSettings ?? [])];
          const covered = new Set(kept.flatMap((id) => settingById.get(id)?.mitigations ?? []));
          for (const id of arch.mitigations) if (!covered.has(id)) ctx.fail(`${oat}: pinned control ${id} has no setting once the dropped ones are gone`);
          for (const d of o.differences ?? []) {
            if (!arch.blocks.some((x) => x.id === d.at) && !edgeKeys.has(d.at)) ctx.fail(`${oat}: difference at "${d.at}" is neither a block nor a flow of ${arch.id}`);
            if (!d.text?.trim() || d.text.length > 380) ctx.fail(`${oat}: difference at ${d.at} needs text of at most 380 characters`);
          }
          for (const n of o.alsoNeeded ?? []) {
            if (!n.service?.trim() || !n.why?.trim()) ctx.fail(`${oat}: an also-needed service needs a name and a reason`);
            if (!CLOUD_ROLES.includes(n.role)) ctx.fail(`${oat}: also-needed ${n.service}: role must be one of ${CLOUD_ROLES.join(", ")}`);
          }
        }
      }
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
      // Every pinned control has at least one row: a cloud setting or a line of our own code.
      // Where the pattern is a service of this platform, the service's own settings count too.
      const delivered = new Set((impl.settings ?? []).flatMap((id) => settingById.get(id)?.mitigations ?? []));
      for (const sv of ctx.services ?? []) if (sv.platform === cloud.id && sv.architecture === arch.id) for (const id of sv.mitigations) delivered.add(id);
      for (const id of arch.mitigations) if (!delivered.has(id)) ctx.fail(`${at}: pinned control ${id} has no setting or code row`);
    }
    for (const s of cloud.settings) if (!used.has(s.id)) ctx.fail(`${where}: setting ${s.id} is used by no implementation`);
    for (const n of cloud.notOffered ?? []) {
      const arch = archById.get(n.architecture);
      if (!arch || arch.surface !== "surfaceCloud") ctx.fail(`${where}: notOffered names ${n.architecture}, which is not a hosted pattern`);
      if (cloud.implementations.some((i) => i.architecture === n.architecture)) ctx.fail(`${where}: ${n.architecture} is both mapped and listed under notOffered`);
      if (!n.why?.trim()) ctx.fail(`${where}: notOffered ${n.architecture} needs a why`);
      if (n.instead && !archById.has(n.instead)) ctx.fail(`${where}: notOffered ${n.architecture}: unknown pattern ${n.instead}`);
    }
    clouds.push(cloud);
  }
  return clouds;
}

/** The organisation's products file (data/org/products.yaml): every key a tool or cloud, every setting one it lists. */
export async function loadProductStatus(root: string, tools: Tool[], clouds: CloudPlatform[]): Promise<Record<string, ProductStatusEntry>> {
  const doc = parse(await readFile(join(root, "data/org/products.yaml"), "utf8")) as { products?: Record<string, ProductStatusEntry> | null };
  return checkProductStatus(doc, tools, clouds);
}

/** The checks on the products section, apart from reading the file, so they can be run on any document. */
export function checkProductStatus(
  doc: { products?: Record<string, ProductStatusEntry> | null } | null,
  tools: Tool[],
  clouds: CloudPlatform[],
): Record<string, ProductStatusEntry> {
  const settingsOf = new Map<string, Set<string>>([
    ...tools.map((t) => [t.id, new Set((t.settings ?? []).map((s) => s.id))] as const),
    ...clouds.map((c) => [c.id, new Set(c.settings.map((s) => s.id))] as const),
  ]);
  const check = (ok: unknown, msg: string) => { if (!ok) throw new Error(`org/products.yaml: ${msg}`); };
  const out: Record<string, ProductStatusEntry> = {};
  for (const [id, entry] of Object.entries(doc?.products ?? {})) {
    const known = settingsOf.get(id);
    check(known, `unknown product ${id} — use a tool id from data/tooling/ or a cloud id from data/clouds/`);
    check(entry && typeof entry === "object", `${id} needs a status, a note or settings`);
    const extra = Object.keys(entry).filter((k) => !["status", "note", "settings", "components", "hosting"].includes(k));
    check(!extra.length, `${id} has unknown field ${extra.join(", ")}`);
    check(entry.status === undefined || ADOPTION_STATUSES.includes(entry.status), `${id} status must be one of ${ADOPTION_STATUSES.join(", ")}`);
    for (const [sid, s] of Object.entries(entry.settings ?? {})) {
      check(known!.has(sid), `${id} has no setting ${sid}`);
      check(s?.status === undefined || ADOPTION_STATUSES.includes(s.status), `${id}.${sid} status must be one of ${ADOPTION_STATUSES.join(", ")}`);
      check(s?.link === undefined || /^https:\/\//.test(s.link), `${id}.${sid} link must be an https address`);
    }
    // What the organisation runs for a component in place of the reference service.
    const cloud = clouds.find((c) => c.id === id);
    // Which ways of hosting it has approved.
    check(!entry.hosting || cloud, `${id} is a tool; hosting options are recorded on a cloud or on-premises entry`);
    for (const [optionId, h] of Object.entries(entry.hosting ?? {})) {
      check(cloud!.implementations.some((i) => i.hosting?.some((o) => o.id === optionId)), `${id}.hosting ${optionId}: no hosting option with that id on any pattern mapped onto ${id}`);
      check(h?.status === undefined || ADOPTION_STATUSES.includes(h.status), `${id}.hosting ${optionId} status must be one of ${ADOPTION_STATUSES.join(", ")}`);
    }
    check(!entry.components || cloud, `${id} is a tool; components are recorded on a cloud or on-premises entry`);
    for (const [key, choice] of Object.entries(entry.components ?? {})) {
      const [archId, blockId] = key.includes("/") ? key.split("/") : [null, key];
      const impls = cloud!.implementations.filter((i) => !archId || i.architecture === archId);
      check(impls.length, `${id}.components ${key}: ${archId} is not a pattern mapped onto ${id}`);
      check(impls.some((i) => i.bindings.some((b) => b.block === blockId)), `${id}.components ${key}: no component "${blockId}" ${archId ? `on ${archId}` : "on any pattern mapped onto it"}`);
      check(typeof choice?.uses === "string" && choice.uses.trim(), `${id}.components ${key} needs uses: what your organisation runs there`);
      check(choice.uses.length <= 60, `${id}.components ${key}: uses is ${choice.uses.length} characters; keep it to 60, it is printed inside the box`);
      check(choice.link === undefined || /^https:\/\//.test(choice.link), `${id}.components ${key} link must be an https address`);
      const unknown = Object.keys(choice).filter((k) => !["uses", "link", "note"].includes(k));
      check(!unknown.length, `${id}.components ${key} has unknown field ${unknown.join(", ")}`);
    }
    out[id] = entry;
  }
  return out;
}
