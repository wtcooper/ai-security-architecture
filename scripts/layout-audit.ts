/**
 * Layout audit: the drawing-quality signals the build reports but does not block on.
 * Usage: npm run layout:audit [-- archId ...]
 *
 * The build fails on collisions (an arrow through a block, a pin on a block, a pin on a pin or on
 * another arrow, two arrows sharing a line). This lists what a reviewer still has to judge —
 * see docs/LAYOUT-REVIEW.md for the criteria each line maps to.
 */
import { readFileSync } from "node:fs";
import { chipSpots, placeTags, TAG_W_EST } from "../src/lib/flow-layout";
import type { Archetype, Rect } from "../src/lib/types";

const dataset = JSON.parse(readFileSync("src/data/generated/dataset.json", "utf8")) as { archetypes: Archetype[] };
const only = process.argv.slice(2);

type Seg = { x0: number; y0: number; x1: number; y1: number; edge: string };
const H = (s: Seg) => Math.abs(s.y0 - s.y1) < 0.5;
const V = (s: Seg) => Math.abs(s.x0 - s.x1) < 0.5;
const len = (s: Seg) => Math.abs(s.x1 - s.x0) + Math.abs(s.y1 - s.y0);

for (const a of dataset.archetypes) {
  if (only.length && !only.some((o) => a.id.includes(o))) continue;
  const L = a.layout;
  const segs: Seg[] = [];
  let bends = 0;
  for (const e of L.edges) {
    const pts = [...e.d.matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)].map((m) => ({ x: +m[1], y: +m[2] }));
    bends += pts.length - 2;
    for (let i = 1; i < pts.length; i++) segs.push({ x0: pts[i - 1].x, y0: pts[i - 1].y, x1: pts[i].x, y1: pts[i].y, edge: `${e.from}->${e.to}` });
  }

  // C1 Crossings: a horizontal run through a vertical run of another arrow.
  const crossings = new Set<string>();
  for (const h of segs.filter(H)) {
    for (const v of segs.filter(V)) {
      if (h.edge === v.edge) continue;
      const x = v.x0;
      const y = h.y0;
      if (x > Math.min(h.x0, h.x1) + 3 && x < Math.max(h.x0, h.x1) - 3 && y > Math.min(v.y0, v.y1) + 3 && y < Math.max(v.y0, v.y1) - 3)
        crossings.add([h.edge, v.edge].sort().join(" × "));
    }
  }

  // C2 Close parallels: two arrows running side by side within 14px for over 80px read as a tangle.
  const close: string[] = [];
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const p = segs[i];
      const q = segs[j];
      if (p.edge === q.edge) continue;
      if (H(p) && H(q) && Math.abs(p.y0 - q.y0) < 14) {
        const shared = Math.min(Math.max(p.x0, p.x1), Math.max(q.x0, q.x1)) - Math.max(Math.min(p.x0, p.x1), Math.min(q.x0, q.x1));
        if (shared > 80) close.push(`${p.edge} ∥ ${q.edge} (${Math.round(Math.abs(p.y0 - q.y0))}px apart, ${Math.round(shared)}px)`);
      }
      if (V(p) && V(q) && Math.abs(p.x0 - q.x0) < 14) {
        const shared = Math.min(Math.max(p.y0, p.y1), Math.max(q.y0, q.y1)) - Math.max(Math.min(p.y0, p.y1), Math.min(q.y0, q.y1));
        if (shared > 80) close.push(`${p.edge} ∥ ${q.edge} (${Math.round(Math.abs(p.x0 - q.x0))}px apart, ${Math.round(shared)}px)`);
      }
    }
  }

  // C3 Hugging: an arrow running along a block border it does not start or end on, within 10px.
  const hug: string[] = [];
  const parents = new Map(a.blocks.map((b) => [b.id, b.parent]));
  const ancestors = (id: string) => {
    const out: string[] = [];
    for (let p = parents.get(id); p; p = parents.get(p)) out.push(p);
    return out;
  };
  for (const s of segs) {
    if (len(s) < 40) continue;
    const [from, to] = s.edge.split("->");
    const own = new Set([from, to, ...ancestors(from), ...ancestors(to)]);
    for (const [id, r] of Object.entries(L.blocks) as [string, Rect][]) {
      if (own.has(id)) continue;
      if (H(s)) {
        const overlap = Math.min(Math.max(s.x0, s.x1), r.x + r.w) - Math.max(Math.min(s.x0, s.x1), r.x);
        const gap = Math.min(Math.abs(s.y0 - r.y), Math.abs(s.y0 - (r.y + r.h)));
        if (overlap > 30 && gap < 10) hug.push(`${s.edge} runs ${Math.round(gap)}px from ${id}'s border`);
      } else if (V(s)) {
        const overlap = Math.min(Math.max(s.y0, s.y1), r.y + r.h) - Math.max(Math.min(s.y0, s.y1), r.y);
        const gap = Math.min(Math.abs(s.x0 - r.x), Math.abs(s.x0 - (r.x + r.w)));
        if (overlap > 30 && gap < 10) hug.push(`${s.edge} runs ${Math.round(gap)}px from ${id}'s border`);
      }
    }
  }

  // C4 Above the bands: a run above every block (along the band titles).
  const top = Math.min(...Object.values(L.blocks).map((r) => r.y));
  const above = segs.filter((s) => H(s) && s.y0 < top - 4).map((s) => s.edge);

  // C5 Band seams: an arrow running along the border between two bands reads as a third border.
  const seams = (L.bandSeams ?? []).flat();
  const seamHug = segs.filter((s) => V(s) && len(s) >= 30 && seams.some((x) => Math.abs(s.x0 - x) < 10)).map((s) => s.edge);

  // C6 Pins across a seam, and C7 risk tags far from their arrow.
  const chipAt = new Map<string, number>();
  for (const p of a.pins.mitigations) chipAt.set(p.at, (chipAt.get(p.at) ?? 0) + 1);
  const tagAt = new Map<string, number>();
  for (const p of a.pins.risks) tagAt.set(p.at, (tagAt.get(p.at) ?? 0) + 1);
  const edgeOf = (k: string) => L.edges.find((e) => `${e.from}->${e.to}` === k || `${e.to}->${e.from}` === k);
  const tags = placeTags([...tagAt].map(([at, n]) => ({ at, widths: Array(n).fill(TAG_W_EST) })), L);
  const pinRects: { at: string; kind: string; r: Rect }[] = [
    ...[...chipAt].flatMap(([at, n]) =>
      chipSpots(n, L.blocks[at], edgeOf(at), L.blockChipXs?.[at]).map((p) => ({ at, kind: "chip", r: { x: p.x - 10, y: p.y - 10, w: 20, h: 20 } })),
    ),
    ...[...tagAt.keys()].flatMap((at) => (tags.get(at)?.rects ?? []).map((r) => ({ at, kind: "tag", r }))),
  ];
  const govTop = L.govBand?.y ?? Infinity;
  const acrossSeam = pinRects.filter((p) => p.r.y < govTop && seams.some((x) => p.r.x < x && x < p.r.x + p.r.w)).map((p) => `${p.kind} at ${p.at}`);
  const farTags: string[] = [];
  const foreignTags: string[] = [];
  for (const at of tagAt.keys()) {
    const e = edgeOf(at);
    if (!e) continue;
    const own = segs.filter((s) => s.edge === `${e.from}->${e.to}`);
    const gap = (r: Rect) =>
      Math.min(...own.map((s) => Math.hypot(Math.max(Math.min(s.x0, s.x1) - (r.x + r.w), r.x - Math.max(s.x0, s.x1), 0), Math.max(Math.min(s.y0, s.y1) - (r.y + r.h), r.y - Math.max(s.y0, s.y1), 0))));
    const far = Math.max(...(tags.get(at)?.rects ?? []).map(gap));
    if (far > 34) farTags.push(`${at} (${Math.round(far)}px)`);
    // C9 nearer a foreign line than its own: it reads as that arrow's tag.
    const foreign = segs.filter((s) => s.edge !== `${e.from}->${e.to}`);
    const gapF = (r: Rect) =>
      Math.min(Infinity, ...foreign.map((s) => Math.hypot(Math.max(Math.min(s.x0, s.x1) - (r.x + r.w), r.x - Math.max(s.x0, s.x1), 0), Math.max(Math.min(s.y0, s.y1) - (r.y + r.h), r.y - Math.max(s.y0, s.y1), 0))));
    if ((tags.get(at)?.rects ?? []).some((r) => gapF(r) < gap(r))) foreignTags.push(at);
  }
  // C10 A block's chips split by an arrow: its row is not one run.
  const splitChips = Object.entries(L.blockChipXs ?? {})
    .filter(([, xs]) => xs.some((x, i) => i && x - xs[i - 1] > 24.5))
    .map(([id]) => id);

  // C11 An arrow meeting a side border within 20px of a corner, and C12 two straight arrows
  // through one block (in one side, out the opposite) offset by a few pixels — a jog.
  const nearCorner: string[] = [];
  const throughJog: string[] = [];
  const endsOf = L.edges.map((e) => {
    const pts = [...e.d.matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)].map((m) => ({ x: +m[1], y: +m[2] }));
    return { e, pts };
  });
  for (const { e, pts } of endsOf) {
    for (const [p, id] of [[pts[0], e.from], [pts[pts.length - 1], e.to]] as const) {
      const r = L.blocks[id];
      const kind = a.blocks.find((b) => b.id === id)?.kind;
      if (!r || kind === "actor" || kind === "origin") continue;
      const onSide = Math.abs(p.x - r.x) < 0.5 || Math.abs(p.x - (r.x + r.w)) < 0.5;
      if (onSide && (p.y - r.y < 20 || r.y + r.h - p.y < 20)) nearCorner.push(`${e.from}->${e.to} at ${id}`);
    }
  }
  const straight = endsOf.filter(({ pts }) => pts.length === 2);
  for (const p of straight) {
    for (const q of straight) {
      if (p === q) continue;
      const [a0, a1] = p.pts;
      const [b0, b1] = q.pts;
      const h = Math.abs(a0.y - a1.y) < 0.5 && Math.abs(b0.y - b1.y) < 0.5;
      const v = Math.abs(a0.x - a1.x) < 0.5 && Math.abs(b0.x - b1.x) < 0.5;
      const shared = [p.e.from, p.e.to].find((id) => id === q.e.from || id === q.e.to);
      if (!shared || !(h || v)) continue;
      const off = h ? Math.abs(a0.y - b0.y) : Math.abs(a0.x - b0.x);
      // Opposite sides of the shared block: one arrow's end on its left/top, the other's on its right/bottom.
      const r = L.blocks[shared];
      const side = (pt: { x: number; y: number }) => (h ? (Math.abs(pt.x - r.x) < 0.5 ? "a" : Math.abs(pt.x - (r.x + r.w)) < 0.5 ? "b" : "") : Math.abs(pt.y - r.y) < 12 ? "a" : Math.abs(pt.y - (r.y + r.h)) < 0.5 ? "b" : "");
      const sp = [a0, a1].map(side).find(Boolean);
      const sq = [b0, b1].map(side).find(Boolean);
      if (sp && sq && sp !== sq && off > 0.5 && off < 16) throughJog.push([`${p.e.from}->${p.e.to}`, `${q.e.from}->${q.e.to}`].sort().join(" / ") + ` (${off.toFixed(1)}px)`);
    }
  }

  // C8 Arrow ends on a title tab: the end stops at the tab's top edge instead of the border.
  const onTab: string[] = [];
  for (const e of L.edges) {
    const pts = [...e.d.matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)].map((m) => ({ x: +m[1], y: +m[2] }));
    for (const [p, id] of [[pts[0], e.from], [pts[pts.length - 1], e.to]] as const) {
      const r = L.blocks[id];
      const kind = a.blocks.find((b) => b.id === id)?.kind;
      if (kind === "actor" || kind === "origin") continue;
      if (r && Math.abs(p.y - (r.y - 11)) < 0.5 && p.x > r.x && p.x < r.x + r.w) onTab.push(`${e.from}->${e.to} at ${id}`);
    }
  }

  const tops = a.blocks.filter((b) => !b.parent && !(a.zones ?? []).some((z) => z.id === b.zone && z.owner === "governance"));
  const area = tops.reduce((n, b) => n + L.blocks[b.id].w * L.blocks[b.id].h, 0);
  const bandH = L.govBand ? L.govBand.y : L.height;
  const fill = Math.round((100 * area) / (L.width * bandH));

  console.log(`\n${a.id}  ${L.width}x${L.height}  fill ${fill}%  arrows ${L.edges.length}  bends ${bends}  crossings ${crossings.size}`);
  for (const c of crossings) console.log(`  C1 crossing      ${c}`);
  for (const c of [...new Set(close)]) console.log(`  C2 close lines   ${c}`);
  for (const h of [...new Set(hug)]) console.log(`  C3 hugging       ${h}`);
  for (const h of [...new Set(above)]) console.log(`  C4 above bands   ${h}`);
  for (const h of [...new Set(seamHug)]) console.log(`  C5 seam hugging  ${h}`);
  for (const h of [...new Set(acrossSeam)]) console.log(`  C6 pin on seam   ${h}`);
  for (const h of farTags) console.log(`  C7 far tags      ${h}`);
  for (const h of foreignTags) console.log(`  C9 foreign line  ${h}`);
  for (const h of splitChips) console.log(`  C10 split chips  ${h}`);
  for (const h of nearCorner) console.log(`  C11 near corner  ${h}`);
  for (const h of [...new Set(throughJog)]) console.log(`  C12 jog through  ${h}`);
  for (const h of onTab) console.log(`  C8 end on tab    ${h}`);
}
