/**
 * The pattern standard, measured. For every pattern this scores the boundary drawing and the
 * authored content against docs/PATTERN-STANDARD.md and prints one row each, then the
 * findings. `npm run drawing:audit` to read it; scripts/drawing.test.tsx asserts the same
 * numbers, so the standard cannot quietly slip.
 *
 *   npm run drawing:audit              every pattern
 *   npm run drawing:audit -- <slug>    one pattern, with every finding spelled out
 */
import { boundaryLayout, labelRect, ownedControls, summaryOf, wrap, type Rect, type ViewLine, type ViewSpec } from "../src/components/drawing/layout";
import { crossingsOf } from "../src/components/drawing/crossings";
import { dataset } from "../src/lib/data";
import type { Archetype } from "../src/lib/types";

/** The limits a drawing must meet. Changing one changes the standard: update the document too. */
export const STANDARD = {
  /** A drawing fits a 1366px laptop at no less than this scale (the page gives it 1292px). */
  maxWidth: 1440,
  /** The expanded drawing fits a 1080p screen without scrolling. */
  maxHeight: 1080,
  /** Characters of authored one-liner a box can show without cutting it short. */
  summaryMax: 78,
  /** A gloss may widen its boundary by at most this much: a few words beside the name, not a sentence. */
  glossStretch: 64,
};

export interface Finding {
  rule: string;
  detail: string;
}

const inside = (r: Rect, x: number, y: number, m = 0) => x > r.x + m && x < r.x + r.w - m && y > r.y + m && y < r.y + r.h - m;
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const segs = (l: ViewLine) => l.pts.slice(1).map((q, i) => ({ p: l.pts[i], q }));
/** Does an axis-aligned segment pass through the inside of a rectangle? */
const through = (p: [number, number], q: [number, number], r: Rect, m = 3) => {
  const x1 = Math.min(p[0], q[0]), x2 = Math.max(p[0], q[0]), y1 = Math.min(p[1], q[1]), y2 = Math.max(p[1], q[1]);
  return x1 < r.x + r.w - m && x2 > r.x + m && y1 < r.y + r.h - m && y2 > r.y + m;
};
export function audit(a: Archetype): { spec: ViewSpec; findings: Finding[]; open: Finding[]; stats: Record<string, number> } {
  const spec = boundaryLayout(a);
  const findings: Finding[] = [];
  const add = (rule: string, detail: string) => findings.push({ rule, detail });
  const block = new Map(a.blocks.map((b) => [b.id, b]));
  const box = new Map(spec.boxes.map((b) => [b.id, b]));
  const zoneOf = (id: string) => block.get(id)?.zone ?? "";
  const kidsOf = (id: string) => a.blocks.filter((b) => b.parent === id);
  const ancestors = (id: string) => {
    const out = new Set<string>();
    for (let p = block.get(id)?.parent; p; p = block.get(p)?.parent) out.add(p);
    return out;
  };

  // L1 size
  if (spec.width > STANDARD.maxWidth) add("L1 width", `${Math.round(spec.width)}px wide (limit ${STANDARD.maxWidth})`);
  if (spec.height > STANDARD.maxHeight) add("L1 height", `${Math.round(spec.height)}px tall (limit ${STANDARD.maxHeight})`);

  // L2 no arrow through a boundary neither of its ends is in
  for (const l of spec.lines) {
    const [from, to] = l.key.split("->");
    for (const b of spec.boundaries) {
      if (b.tone === "control" || b.zone === zoneOf(from) || b.zone === zoneOf(to)) continue;
      if (segs(l).some((s) => through(s.p, s.q, b))) add("L2 foreign boundary", `${l.key} runs through ${b.title}`);
    }
  }

  // L3 no arrow through a container it has no end in
  for (const l of spec.lines) {
    const [from, to] = l.key.split("->");
    const home = new Set([from, to, ...ancestors(from), ...ancestors(to)]);
    for (const c of spec.boxes.filter((b) => b.tone === "container")) {
      if (home.has(c.id)) continue;
      if (segs(l).some((s) => through(s.p, s.q, c))) add("L3 foreign container", `${l.key} runs through ${block.get(c.id)?.title}`);
    }
  }

  // L4 words: no label over a box, another label, or another arrow
  const rects = spec.lines.map((l) => ({ l, r: labelRect(l) })).filter((x): x is { l: ViewLine; r: Rect } => Boolean(x.r));
  for (const { l, r } of rects) {
    if (r.x < 2 || r.x + r.w > spec.width - 2 || r.y < 2 || r.y + r.h > spec.height - 2) add("L4 label off the drawing", `"${l.label!.lines.join(" ")}" runs past the edge`);
    for (const b of spec.boxes) {
      if (b.tone === "container") {
        if (overlap(r, { x: b.x, y: b.y, w: b.w, h: (b.header ?? 52) - 8 }) > 12) add("L4 label on box", `"${l.label!.lines.join(" ")}" over the heading of ${block.get(b.id)?.title}`);
      } else if (overlap(r, b) > 12) add("L4 label on box", `"${l.label!.lines.join(" ")}" over ${block.get(b.id)?.title}`);
    }
    for (const o of spec.lines) {
      if (o.key === l.key) continue;
      const shrunk = { x: r.x + 3, y: r.y + 2, w: r.w - 6, h: r.h - 4 };
      if (segs(o).some((s) => through(s.p, s.q, shrunk, 0))) add("L4 label on arrow", `"${l.label!.lines.join(" ")}" is crossed by ${o.key}`);
    }
  }
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++)
      if (overlap(rects[i].r, rects[j].r) > 12) add("L4 labels collide", `"${rects[i].l.label!.lines.join(" ")}" and "${rects[j].l.label!.lines.join(" ")}"`);
  for (const l of spec.lines) if (a.edges.find((e) => `${e.from}->${e.to}` === l.key)?.label && !l.label) add("L4 label missing", l.key);

  // L5 text is never cut short
  for (const b of spec.boxes) {
    const bl = block.get(b.id)!;
    const title = wrap(bl.title, b.w - 22, 13.2, 2);
    if (title.at(-1)?.endsWith("…")) add("L5 title cut", bl.title);
    const sub = summaryOf(bl);
    if (!sub) continue;
    const room = b.tone === "container" ? b.lines : b.tone === "governance" ? 3 : Math.max(1, b.lines - (title.length - 1));
    if (wrap(sub, b.w - 24, 10.5, room).at(-1)?.endsWith("…")) add("L5 one-liner cut", `${bl.title}: "${sub}"`);
  }
  for (const l of spec.lines) if (l.label?.lines.at(-1)?.endsWith("…")) add("L5 label cut", l.key);
  // ...including when the pattern is drawn as one cloud and each box shows the service that plays it.
  for (const cloud of dataset.clouds) {
    const impl = cloud.implementations.find((i) => i.architecture === a.id);
    for (const binding of impl?.bindings ?? []) {
      const b = box.get(binding.block);
      if (!b) continue;
      const title = wrap(block.get(b.id)!.title, b.w - 22, 13.2, 2);
      const room = b.tone === "container" ? b.lines : b.tone === "governance" ? 3 : Math.max(1, b.lines - (title.length - 1) - (binding.build ? 1 : 0));
      if (wrap(binding.service, b.w - 24, 10.5, room).at(-1)?.endsWith("…")) add("L5 service cut", `${cloud.short}: ${block.get(b.id)!.title} is "${binding.service}"`);
    }
  }

  // L6 no wasted space: a container is no more than its contents need, a boundary has no empty top row
  for (const c of spec.boxes.filter((b) => b.tone === "container")) {
    const kids = kidsOf(c.id).map((k) => box.get(k.id)!).filter(Boolean);
    if (!kids.length) continue;
    const used = Math.max(...kids.map((k) => k.y + k.h)) - c.y;
    if (c.h - used > 70) add("L6 empty container", `${block.get(c.id)?.title} has ${Math.round(c.h - used)}px of empty space under its contents`);
  }
  for (const b of spec.boundaries) {
    if (b.tone !== "ours" && b.tone !== "vendor") continue;
    const members = spec.boxes.filter((x) => zoneOf(x.id) === b.zone && !block.get(x.id)?.parent);
    if (!members.length) continue;
    const gapTop = Math.min(...members.map((m) => m.y)) - b.y;
    const gapBottom = b.y + b.h - Math.max(...members.map((m) => m.y + m.h));
    if (gapTop > 110) add("L6 empty band", `${b.title} has ${Math.round(gapTop)}px empty above its first box`);
    if (gapBottom > 110) add("L6 empty band", `${b.title} has ${Math.round(gapBottom)}px empty below its last box`);
  }

  // L7 arrows are simple: few bends, and a box is entered from outside it
  for (const l of spec.lines) if (l.pts.length - 2 > 4) add("L7 bends", `${l.key} turns ${l.pts.length - 2} times`);
  for (const l of spec.lines) {
    const [from, to] = l.key.split("->");
    for (const b of spec.boxes) {
      if (b.tone === "container" || b.tone === "governance" || b.id === from || b.id === to) continue;
      if (segs(l).some((s) => through(s.p, s.q, b))) add("L7 through a box", `${l.key} runs through ${block.get(b.id)?.title}`);
    }
  }

  // C1 every box has an authored one-liner that fits
  for (const b of a.blocks) {
    if (!b.summary) add("C1 one-liner", `${b.title} (${b.id}) has no authored summary`);
    else if (b.summary.length > STANDARD.summaryMax) add("C1 one-liner", `${b.title}: ${b.summary.length} characters (limit ${STANDARD.summaryMax})`);
  }
  // C2 every boundary we or a vendor run says what it is on this pattern
  for (const z of a.zones ?? []) if (["endpoint", "cloud", "vendor"].includes(z.owner) && a.blocks.some((b) => b.zone === z.id) && !z.gloss) add("C2 gloss", `${z.title ?? z.id} has no gloss`);
  for (const b of spec.boundaries) if ((b.stretched ?? 0) > STANDARD.glossStretch && b.gloss) add("C2 gloss", `"${b.gloss}" is too long for ${b.title}: it widens the boundary by ${Math.round(b.stretched!)}px`);
  // C3 every boundary crossing is authored
  for (const c of crossingsOf(a)) if (!c.authored) add("C3 crossing", `${c.key} is derived, not authored`);

  // Open questions: gaps in the pattern itself that only its author can settle. Reported, not failed.
  const open: Finding[] = [];
  const ask = (rule: string, detail: string) => open.push({ rule, detail });
  const owner = new Map((a.zones ?? []).map((z) => [z.id, z.owner]));
  const plane = a.blocks.filter((b) => owner.get(b.zone ?? "") === "governance");
  const owned = new Set(plane.flatMap((b) => ownedControls(a, b)));
  for (const b of plane) if (!ownedControls(a, b).length) ask("C5 empty control-plane box", `${b.title} owns no control this pattern pins`);
  if (plane.length) for (const id of a.mitigations) if (!owned.has(id)) ask("C5 control with no owner", `${id} is pinned but no control-plane box owns it`);
  for (const b of a.blocks) if (!b.note?.trim()) ask("C6 note", `block ${b.title} (${b.id}) has no note`);
  for (const e of a.edges) if (!e.note?.trim()) ask("C6 note", `flow ${e.from}->${e.to} has no note`);
  for (const w of [a.walkthrough, ...(a.scenarios ?? [])]) for (const [i, st] of (w?.steps ?? []).entries()) if (!st.note?.trim()) ask("C6 note", `walk "${w!.title}" step ${i + 1} (${st.follow}) has no note`);
  if ((a.scenarios ?? []).length < 2) ask("C7 walks", `${(a.scenarios ?? []).length} scenario walks (the standard asks for two)`);
  const products = dataset.tools.filter((t) => t.architecture === a.id);
  if (!products.length) ask("C9 tools", "no product is catalogued for this pattern");
  for (const t of products) if (!(t.settings ?? []).length) ask("C9 tools", `${t.name} has no settings catalogued`);
  if (a.surface === "surfaceCloud" && !dataset.clouds.some((c) => c.implementations.some((i) => i.architecture === a.id))) ask("C9 tools", "not mapped onto any cloud");

  let cross = 0;
  const all = spec.lines.flatMap((l) => segs(l).map((s) => ({ ...s, key: l.key })));
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) {
      const s = all[i], t = all[j];
      if (s.key === t.key) continue;
      const sh = s.p[1] === s.q[1], th = t.p[1] === t.q[1];
      if (sh === th) continue;
      const h = sh ? s : t, v = sh ? t : s;
      const x = v.p[0], y = h.p[1];
      if (x > Math.min(h.p[0], h.q[0]) + 1 && x < Math.max(h.p[0], h.q[0]) - 1 && y > Math.min(v.p[1], v.q[1]) + 1 && y < Math.max(v.p[1], v.q[1]) - 1) cross++;
    }
  return { spec, findings, open, stats: { width: Math.round(spec.width), height: Math.round(spec.height), boxes: spec.boxes.length, arrows: spec.lines.length, crossings: cross } };
}

if (process.argv[1]?.endsWith("drawing-audit.ts")) {
  const only = process.argv[2];
  const rules = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "C1", "C2", "C3"];
  console.log(`${"pattern".padEnd(36)} ${"w×h".padEnd(10)} box arr  x  ${rules.join("  ")}  open`);
  let total = 0;
  let asked = 0;
  for (const a of dataset.archetypes) {
    if (only && a.slug !== only) continue;
    const { findings, open, stats } = audit(a);
    asked += open.length;
    const count = (r: string) => findings.filter((f) => f.rule.startsWith(r)).length;
    total += findings.length;
    console.log(
      `${a.slug.padEnd(36)} ${`${stats.width}×${stats.height}`.padEnd(10)} ${String(stats.boxes).padStart(3)} ${String(stats.arrows).padStart(3)} ${String(stats.crossings).padStart(2)}  ${rules.map((r) => String(count(r) || "·").padStart(2)).join("  ")}  ${String(open.length || "·").padStart(4)}`,
    );
    if (only) for (const f of findings) console.log(`   ${f.rule.padEnd(22)} ${f.detail}`);
    if (only) for (const f of open) console.log(`   open: ${f.rule.padEnd(28)} ${f.detail}`);
  }
  console.log(`\n${total} findings, ${asked} open questions`);
}
