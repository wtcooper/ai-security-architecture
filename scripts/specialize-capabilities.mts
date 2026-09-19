/**
 * One-off, idempotent: re-point pins, block lists, guidance items, the enforcement vocabulary,
 * tool rows and the shipped org example from a MITRE parent to the authored specialisation that
 * restores the retired capability they were migrated from. Reads the pre-cleanup revisions from
 * git so it can run again without depending on the current file state. `--write` applies.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { Document, isAlias, isMap, isSeq, isScalar, parse, parseDocument, type Node, type Scalar } from "yaml";
import { migrateToolControls, type LegacyToolControl } from "./lib/capability-migration";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
/** The last revision whose pin notes still carry "migrated from <legacy>; verify <target>". */
const NOTED = "ee000cd";
/** The last revision with the home-grown capability ids in block lists and guidance. */
const LEGACY = "1347179";
const SUFFIX = /\s*Functional requirement migrated from (\w+); verify ([\w.-]+) at this boundary\.(?:\s*Requirement is attached to the enforcing component\.)?/g;

type Spec = { id: string; parent: string; legacy: string[] };
const specs = (parse(await readFile("data/overlay/specializations.yaml", "utf8")).specializations as Spec[]);
const rules = parse(await readFile("data/migrations/capabilities-v1.yaml", "utf8")).mappings as Record<string, { targets: string[] }>;
const byLegacy = new Map<string, Spec>();
for (const s of specs) for (const l of s.legacy) byLegacy.set(l, s);
/** Where a legacy capability was migrated onto exactly the specialisation's parent, it lands on the specialisation. */
const retarget = (legacy: string, target: string) => { const s = byLegacy.get(legacy); return s && s.parent === target ? s.id : target; };
const targetsOf = (legacy: string) => (rules[legacy]?.targets ?? []).map((t) => retarget(legacy, t));
const git = (rev: string, path: string) => { try { return execFileSync("git", ["show", `${rev}:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
async function* files(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) { if (e.name !== "archive") yield* files(p); } else if (p.endsWith(".yaml")) yield p; }
}
const lineStart = (src: string, offset: number) => src.lastIndexOf("\n", offset - 1) + 1;
const trimmedEnd = (src: string, end: number) => { let e = end; while (e > 0 && /\s/.test(src[e - 1])) e--; return e; };
const indentAt = (src: string, offset: number) => src.slice(lineStart(src, offset), offset).match(/^\s*/)![0];
const emitItems = (items: unknown[], indent: string, width = 110) => {
  const doc = new Document(items);
  const walk = (n: unknown) => { if (isSeq(n)) n.items.forEach(walk); else if (isMap(n)) for (const p of n.items) { if (isScalar(p.value) && typeof p.value.value === "string" && p.value.value.length > 60 && isScalar(p.key) && p.key.value === "note") (p.value as Scalar).type = "BLOCK_FOLDED"; walk(p.value); } };
  walk(doc.contents);
  return doc.toString({ lineWidth: width - indent.length, indentSeq: false }).trimEnd().split("\n").map((l) => indent + l).join("\n");
};
const applyEdits = (src: string, edits: [number, number, string][]) => { for (const [s, e, r] of edits.sort((a, b) => b[0] - a[0])) src = src.slice(0, s) + r + src.slice(e); return src; };
const report: string[] = [];
async function save(path: string, before: string, after: string) {
  if (before === after) return;
  const check = parseDocument(after); if (check.errors.length) throw new Error(`${path}: ${check.errors[0].message}`);
  if (WRITE) await writeFile(path, after);
  report.push(path);
}

// --- Architectures: pins and block lists ------------------------------------------------------------
for await (const path of files("data/reference/architectures")) {
  const src = await readFile(path, "utf8");
  const noted = git(NOTED, path); const legacy = git(LEGACY, path);
  if (!noted) continue;
  const doc = parseDocument(src); const notedDoc = parse(noted) as { pins?: { mitigations?: { mitigation: string; at: string; note?: string }[] } };
  const edits: [number, number, string][] = [];
  const pinsSeq = (doc.getIn(["pins", "mitigations"]) as unknown) as Node | undefined;
  const notedPins = notedDoc.pins?.mitigations ?? [];
  if (isSeq(pinsSeq)) {
    // Already re-pointed: the split pins no longer line up with the noted revision.
    if (pinsSeq.items.length === notedPins.length) pinsSeq.items.forEach((item, i) => {
      if (!isMap(item)) return;
      const pin = notedPins[i];
      const segments: { text: string; legacy?: string }[] = [];
      let last = 0; const note = pin.note ?? "";
      for (const m of note.matchAll(SUFFIX)) { segments.push({ text: note.slice(last, m.index).trim(), legacy: m[1] }); last = m.index! + m[0].length; }
      if (note.slice(last).trim()) segments.push({ text: note.slice(last).trim() });
      if (!segments.some((s) => s.legacy)) return;
      const groups = new Map<string, string[]>();
      for (const s of segments) { const id = s.legacy ? retarget(s.legacy, pin.mitigation) : pin.mitigation; const list = groups.get(id) ?? []; if (s.text && !list.includes(s.text)) list.push(s.text); groups.set(id, list); }
      if (groups.size === 1 && groups.has(pin.mitigation)) return;
      const replacement = [...groups].map(([id, texts]) => ({ mitigation: id, at: pin.at, ...(texts.length ? { note: texts.join(" ") } : {}) }));
      const [start, , end] = item.range!;
      edits.push([lineStart(src, start), trimmedEnd(src, end), emitItems(replacement, indentAt(src, lineStart(src, start) + src.slice(lineStart(src, start)).search(/\S/)))]);
    });
  }
  // Block-level and item-level lists came from `capabilities: [...]` in the legacy revision.
  if (legacy) {
    const legacyDoc = parse(legacy) as { blocks?: { id: string; capabilities?: string[]; items?: { label?: string; capabilities?: string[] }[] }[] };
    const blocks = doc.get("blocks") as unknown as Node;
    if (isSeq(blocks)) for (const block of blocks.items) {
      if (!isMap(block)) continue;
      const old = legacyDoc.blocks?.find((b) => b.id === block.get("id"));
      const rewrite = (map: typeof block, oldList?: string[]) => {
        const seq = map.get("mitigations", true) as unknown as Node | undefined;
        if (!oldList || !isSeq(seq) || !seq.range) return;
        const ids = [...new Set(oldList.flatMap(targetsOf))];
        const current = seq.items.map((s) => String((s as Scalar).value));
        if (ids.join() === current.join()) return;
        edits.push([seq.range[0], seq.range[1], `[ ${ids.join(", ")} ]`]);
      };
      rewrite(block, old?.capabilities);
      const items = block.get("items") as unknown as Node | undefined;
      if (isSeq(items)) items.items.forEach((it, i) => { if (isMap(it)) rewrite(it, old?.items?.[i]?.capabilities); });
    }
  }
  await save(path, src, applyEdits(src, edits));
}

// --- Guidance --------------------------------------------------------------------------------------
for await (const path of files("data/reference/guidance")) {
  const src = await readFile(path, "utf8"); const legacy = git(LEGACY, path); if (!legacy) continue;
  const doc = parseDocument(src); const legacyDoc = parse(legacy) as { items?: { capabilities?: string[] }[] };
  const items = doc.get("items") as unknown as Node; const edits: [number, number, string][] = [];
  if (isSeq(items)) items.items.forEach((it, i) => {
    if (!isMap(it)) return;
    const seq = it.get("mitigations", true) as unknown as Node | undefined; const old = legacyDoc.items?.[i]?.capabilities;
    if (!old || !isSeq(seq) || !seq.range) return;
    const ids = [...new Set(old.flatMap(targetsOf))];
    if (ids.join() === seq.items.map((s) => String((s as Scalar).value)).join()) return;
    edits.push([seq.range[0], seq.range[1], `[${ids.join(", ")}]`]);
  });
  await save(path, src, applyEdits(src, edits));
}

// --- Enforcement vocabulary: a specialisation is enforced where its parent is --------------------------
{
  const path = "data/reference/vocabulary.yaml"; const src = await readFile(path, "utf8");
  const doc = parseDocument(src); const enf = doc.get("mitigationEnforcement") as unknown as Node;
  const edits: [number, number, string][] = [];
  if (isMap(enf)) {
    const inline = enf.get("inline") as unknown as Node;
    const known = new Set<string>();
    if (isMap(inline)) for (const p of inline.items) known.add(String((p.key as Scalar).value));
    for (const list of ["embedded", "management"]) { const seq = enf.get(list) as unknown as Node; if (isSeq(seq)) for (const s of seq.items) known.add(String((s as Scalar).value)); }
    for (const s of specs) {
      if (known.has(s.id)) continue;
      const parentPair = isMap(inline) ? inline.items.find((p) => String((p.key as Scalar).value) === s.parent) : undefined;
      if (parentPair && isSeq(parentPair.value)) {
        const [, , end] = (parentPair.value as Node).range!;
        const comps = (parentPair.value as unknown as { items: Scalar[] }).items.map((c) => `      - ${c.value}`).join("\n");
        edits.push([trimmedEnd(src, end), trimmedEnd(src, end), `\n    ${s.id}:\n${comps}`]);
        continue;
      }
      for (const list of ["embedded", "management"]) {
        const seq = enf.get(list) as unknown as Node;
        if (isSeq(seq) && seq.items.some((x) => String((x as Scalar).value) === s.parent)) { const [, , end] = seq.range!; edits.push([trimmedEnd(src, end), trimmedEnd(src, end), `\n    - ${s.id}`]); }
      }
    }
  }
  await save(path, src, applyEdits(src, edits));
}

// --- Tool rows: split back into the original rows where they now have a home of their own ----------
// Rows are rebuilt on the document tree and the file re-emitted: the migration's shared-step anchors
// live inside rows that may split, so text surgery would leave aliases dangling.
for await (const path of files("data/tooling")) {
  const src = await readFile(path, "utf8"); const doc = parseDocument(src); let dirty = false;
  // Resolve every alias against the anchors as they stand before any node is touched.
  const anchors = new Map<string, Node>();
  const collect = (n: Node | null) => { if (!n) return; if ("anchor" in n && (n as { anchor?: string }).anchor) anchors.set((n as { anchor: string }).anchor, n); if (isSeq(n)) n.items.forEach((i) => collect(i as Node)); else if (isMap(n)) for (const p of n.items) collect(p.value as Node); };
  collect(doc.contents as Node);
  const expand = (n: Node | null): Node | null => {
    // Anchored content may itself alias earlier anchors, so expand the clone too.
    if (isAlias(n)) return expand((anchors.get(n.source) as Node & { clone(): Node }).clone() as Node);
    if (isSeq(n)) n.items = n.items.map((i) => expand(i as Node));
    else if (isMap(n)) for (const p of n.items) p.value = expand(p.value as Node);
    if (n && "anchor" in n) delete (n as { anchor?: string }).anchor;
    return n;
  };
  const walk = (n: Node | null) => {
    if (isSeq(n)) {
      if (n.items.some((it) => isMap(it) && it.has("mitigation") && it.has("coverage"))) {
        n.items = n.items.flatMap((item) => {
          if (!isMap(item) || !item.has("migration")) return [item];
          const target = String(item.get("mitigation"));
          const originals = ((item.get("migration") as unknown as { toJSON(): { original?: LegacyToolControl[] } }).toJSON().original ?? []);
          if (!originals.length) return [item];
          const groups = new Map<string, LegacyToolControl[]>();
          for (const o of originals) { const id = retarget(o.capability, target); groups.set(id, [...(groups.get(id) ?? []), o]); }
          if (groups.size === 1 && groups.has(target)) return [item];
          dirty = true;
          const rows = [...groups].flatMap(([id, rows]) => rows.length === 1
            ? [{ mitigation: id, ...(({ capability, ...rest }) => { void capability; return rest; })(rows[0]), migration: { from: [rows[0].capability], reviewRequired: false, original: rows } }]
            : migrateToolControls(rows, Object.fromEntries(rows.map((r) => [r.capability, { targets: [id], reviewRequired: true, reason: "merged" }]))).map(({ capability, ...rest }) => ({ mitigation: capability, ...rest })));
          return rows.map((r) => doc.createNode(r) as Node);
        });
        return;
      }
      n.items.forEach((i) => walk(i as Node));
    } else if (isMap(n)) for (const p of n.items) if (!(isScalar(p.key) && p.key.value === "migration")) walk(p.value as Node);
  };
  // Expand first so the rows read below are alias-free; a file with nothing to split is left untouched.
  doc.contents = expand(doc.contents as Node) as typeof doc.contents;
  walk(doc.contents as Node);
  if (!dirty) continue;
  const fold = (n: Node | null) => { if (isSeq(n)) n.items.forEach((i) => fold(i as Node)); else if (isMap(n)) for (const p of n.items) { if (isScalar(p.value) && typeof p.value.value === "string" && p.value.value.length > 90) (p.value as Scalar).type = "BLOCK_FOLDED"; fold(p.value as Node); } };
  fold(doc.contents as Node);
  await save(path, src, doc.toString({ lineWidth: 110 }));
}

// --- Org example: regenerate from the archived originals -----------------------------------------------
{
  type Original = { capability: string; status: "enabled" | "inProgress" | "gap"; technology?: string; note?: string; evidence?: string };
  const merge = (records: Original[]) => ({
    status: records.every((r) => r.status === "gap") ? "gap" : records.every((r) => r.status === "enabled") ? "enabled" : "inProgress",
    ...(records.some((r) => r.note) ? { note: [...new Set(records.map((r) => r.note).filter(Boolean))].join(" ") } : {}),
    ...(records.some((r) => r.evidence) ? { evidence: [...new Set(records.map((r) => r.evidence).filter(Boolean))].join(" · ") } : {}),
  });
  const legacyTitles = new Map<string, string>(((parse(git(LEGACY, "data/overlay/capabilities.yaml")!) as { capabilities: { id: string; title: string }[] }).capabilities).map((c) => [c.id, c.title]));
  const mitigations = parse(await readFile("data/overlay/mitigations.yaml", "utf8")).mitigations as { id: string; title: string; surfaces: Record<string, { applies: boolean }> }[];
  const specDocs = parse(await readFile("data/overlay/specializations.yaml", "utf8")).specializations as (Spec & { title: string; surfaces?: Record<string, { applies: boolean }> })[];
  const applies = (id: string, surface: string) => { const s = specDocs.find((x) => x.id === id); const parent = mitigations.find((m) => m.id === (s?.parent ?? id))!; return (s?.surfaces?.[surface] ?? parent.surfaces[surface])?.applies === true; };
  // Org titles are the organisation's own names, never the catalogue's, so the grid keeps them out of taxonomy cells.
  const catalogueTitle = (id: string) => specDocs.find((s) => s.id === id)?.title ?? mitigations.find((m) => m.id === id)?.title ?? id;
  const titleOf = (id: string, records: Original[]) => records.find((r) => r.technology)?.technology
    ?? `Example ${(legacyTitles.get(records[0].capability) ?? catalogueTitle(id)).toLowerCase()}`;
  const orgId = (id: string) => `EX-${id.replace(/^cap-/, "").replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`;
  const enterprise = parse(await readFile("data/org/example/archive/mitigations.yaml", "utf8")).mitigations as Record<string, Record<string, { migration?: { original?: Original[] } }>>;
  const entries = new Map<string, { id: string; title: string; capability: string; surfaces: Record<string, ReturnType<typeof merge>> }>();
  const ensure = (id: string, records: Original[]) => { let e = entries.get(id); if (!e) { e = { id: orgId(id), title: titleOf(id, records), capability: id, surfaces: {} }; entries.set(id, e); } return e; };
  for (const [target, surfaces] of Object.entries(enterprise)) for (const [surface, record] of Object.entries(surfaces)) {
    const groups = new Map<string, Original[]>();
    for (const o of record.migration?.original ?? []) { const id = retarget(o.capability, target); groups.set(id, [...(groups.get(id) ?? []), o]); }
    for (const [id, records] of groups) if (applies(id, surface)) ensure(id, records).surfaces[surface] = merge(records);
  }
  const archiveTools = parse(await readFile("data/org/example/archive/tooling-status.yaml", "utf8")).tools as { tool: string; available?: boolean; note?: string; controls?: Record<string, { migration?: { original?: Original[] } }> }[];
  const tools = archiveTools.map((t) => {
    const capabilities: Record<string, ReturnType<typeof merge>> = {};
    for (const [target, record] of Object.entries(t.controls ?? {})) {
      const groups = new Map<string, Original[]>();
      for (const o of record.migration?.original ?? []) { const id = retarget(o.capability, target); groups.set(id, [...(groups.get(id) ?? []), o]); }
      for (const [id, records] of groups) capabilities[ensure(id, records).id] = merge(records);
    }
    return { tool: t.tool, available: t.available, note: t.note, capabilities };
  });
  const header = "# Illustrative organization data, not a deployment claim about a real company.\n# One entry per capability the organisation has assessed: a MITRE id or an authored specialisation.\n# Regenerated by scripts/specialize-capabilities.mts from the pre-migration records in archive/.\n";
  const capabilitiesYaml = header + new Document({ organisation: { name: "Example Corp", shortName: "EX" }, capabilities: [...entries.values()].sort((a, b) => a.id.localeCompare(b.id)) }).toString({ lineWidth: 110 });
  const toolsYaml = "# Per-tool assessments reference organization capability IDs, never MITRE or CoSAI IDs directly.\n# Regenerated by scripts/specialize-capabilities.mts from the pre-migration records in archive/.\n" + new Document({ tools }).toString({ lineWidth: 110 });
  await save("data/org/example/capabilities.yaml", await readFile("data/org/example/capabilities.yaml", "utf8"), capabilitiesYaml);
  await save("data/org/example/tooling-status.yaml", await readFile("data/org/example/tooling-status.yaml", "utf8"), toolsYaml);
}

console.log(`${WRITE ? "Updated" : "Would update"} ${report.length} files${report.length ? ":\n  " + report.join("\n  ") : ""}`);
