/**
 * A pattern drawn for one platform. A hosted pattern has one drawing, shared by every platform it
 * is mapped onto; where a platform's own documentation shows another shape, its mapping (and a
 * hosting option on top of it) records the changes, and the platform's drawing is the pattern
 * with those changes applied to a copy, before layout:
 *
 *   insert    a box on an existing arrow, which becomes from->box->to
 *   move      a box drawn in another zone (a component that runs outside your network)
 *   drop      an arrow that does not exist there
 *   reroute   a flow that starts, or ends, at another box
 *   rename    an arrow that carries something else there
 *   add       an arrow the pattern does not draw, between boxes it has or an earlier change inserts
 *
 * Pins and walk steps follow what they were on: a rerouted arrow takes its pins and its steps
 * along, an inserted box leaves them on its first leg and splits a step into legs that share the
 * step's number, and a step on a dropped arrow is listed with a note and not drawn. An added arrow
 * carries no pins and no step: the pattern's walks are the pattern's.
 *
 * Pure and deterministic, like the layout: the build checks a platform's changes with it, and the
 * pages, the drawing audit and the tests draw with it.
 */
import { SHAPE_KINDS, type Archetype, type ArchBlock, type ArchEdge, type DrawnShape, type Scenario, type ScenarioStep, type ShapeAdd, type ShapeChange, type ShapeInsert, type ShapeKind, type ShapeMove } from "./types";
import { crossingsOf, standIn } from "../components/drawing/crossings";

const keyOf = (e: { from: string; to: string }) => `${e.from}->${e.to}`;
const reverse = (k: string) => k.split("->").reverse().join("->");
/** "from->to" as its two ends, or null when it is not one. */
const endsOf = (k: unknown): [string, string] | null => {
  if (typeof k !== "string") return null;
  const parts = k.split("->");
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
};

const CAMEL = /^[a-z][A-Za-z0-9]*$/;
const HTTPS = /^https:\/\//;
/** Text a change puts on the drawing, held to what the drawing has room for. */
export const SHAPE_LIMITS = { title: 40, summary: 78, label: 60, why: 380, via: 200 };
const TRUST = new Set(["user", "endpoint", "cloud", "vendor"]);
const PLACED_KEYS = { insert: ["id", "title", "summary", "on", "zone", "kind", "labels", "parent", "col", "row"], move: ["block", "zone", "col", "row", "call"], reroute: ["from", "to"], rename: ["at", "label"], add: ["from", "to", "label", "crossing"] } as const;

/** How many sentences a short text runs to. */
const sentences = (s: string) => s.trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter(Boolean).length;

/** The kind of one change, or null when it names none or several. */
export const shapeKindOf = (c: ShapeChange): ShapeKind | null => {
  const kinds = SHAPE_KINDS.filter((k) => k in (c as object));
  return kinds.length === 1 ? kinds[0] : null;
};

export interface ShapeResult {
  /** The copy as drawn there; the pattern itself when there are no changes. */
  archetype: Archetype;
  /** What is wrong with the changes, for the build to report. Empty when they apply cleanly. */
  problems: string[];
}

/**
 * The pattern with a platform's changes applied, in order. `where.key` names the drawing (it is
 * its layout's cache key) and `where.on` how a note names the platform ("on AWS").
 */
export function applyShape(base: Archetype, changes: ShapeChange[], where: { key: string; on: string }): ShapeResult {
  const problems: string[] = [];
  if (!changes?.length) return { archetype: base, problems };
  const blocks: ArchBlock[] = base.blocks.map((b) => ({ ...b }));
  const edges: ArchEdge[] = base.edges.map((e) => ({ ...e }));
  const risks = base.pins.risks.map((p) => ({ ...p }));
  const mitigations = base.pins.mitigations.map((p) => ({ ...p }));
  const ownerOf = new Map((base.zones ?? []).map((z) => [z.id, z.owner as string]));
  /** The crossings added arrows author by what they pass through; their kind is derived once every change is in. */
  const viaOnly = new Set<object>();
  const drawn: DrawnShape = {
    key: where.key,
    on: where.on,
    boxes: {},
    arrows: {},
    follows: Object.fromEntries(base.edges.map((e) => [keyOf(e), [keyOf(e)]])),
    missing: {},
  };

  const blockOf = (id: string | undefined) => (id === undefined ? undefined : blocks.find((b) => b.id === id));
  const edgeAt = (k: string) => edges.findIndex((e) => keyOf(e) === k);
  /** An arrow as the pattern authors it; a reply direction is named so the author can fix it. */
  const arrow = (at: string, k: unknown, what: string): number => {
    const ends = endsOf(k);
    if (!ends) {
      problems.push(`${at}: ${what} must be an arrow written "from->to"`);
      return -1;
    }
    const i = edgeAt(k as string);
    if (i < 0) problems.push(`${at}: ${what} "${k}" is not an arrow of ${base.id}${edgeAt(reverse(k as string)) >= 0 ? ` (it is drawn as ${reverse(k as string)})` : ""}`);
    return i;
  };
  const pinsAt = (k: string) => [...risks.filter((p) => p.at === k).map((p) => p.risk), ...mitigations.filter((p) => p.at === k).map((p) => p.mitigation)];
  const movePins = (k: string, to: string) => {
    for (const p of [...risks, ...mitigations]) if (p.at === k) p.at = to;
  };
  /** One drawn arrow replaced by others, wherever one of the pattern's own arrows is drawn through it. */
  const redraw = (k: string, by: string[]) => {
    for (const [own, keys] of Object.entries(drawn.follows)) drawn.follows[own] = keys.flatMap((x) => (x === k ? by : [x]));
  };
  const zoneOk = (at: string, zone: unknown) => {
    const owner = typeof zone === "string" ? ownerOf.get(zone) : undefined;
    if (!owner) problems.push(`${at}: zone "${zone}" is not a zone of ${base.id}`);
    else if (owner === "governance" || owner === "user") problems.push(`${at}: a box cannot be drawn in the ${owner} zone`);
    return Boolean(owner && owner !== "governance" && owner !== "user");
  };
  const textOk = (at: string, value: unknown, what: string, max: number, optional = false) => {
    if (value === undefined && optional) return;
    if (typeof value !== "string" || !value.trim()) problems.push(`${at}: needs ${what}`);
    else if (value.length > max) problems.push(`${at}: ${what} is ${value.length} characters; keep it to ${max}`);
  };

  // --- Where a box goes: a cell of the grid it is drawn on -------------------------------------
  const colOf = (b: ArchBlock) => b.cell?.col ?? b.col;
  const rowOf = (b: ArchBlock) => b.cell?.row ?? b.row;
  const spanOf = (b: ArchBlock) => (b.cell ? b.cell.rowSpan ?? 1 : b.rowSpan ?? 1);
  const isPerson = (b: ArchBlock) => b.kind === "actor" || b.kind === "origin" || ownerOf.get(b.zone ?? "") === "user";
  /** Which boundary a top-level box of the trust row stands in: people stand outside every one. */
  const standOf = (b: ArchBlock) => (isPerson(b) ? "@people" : b.zone ?? "");
  const inTrustRow = (b: ArchBlock) => !b.parent && TRUST.has(ownerOf.get(b.zone ?? "") ?? "cloud");
  const descendants = (id: string): ArchBlock[] => blocks.filter((b) => b.parent === id).flatMap((b) => [b, ...descendants(b.id)]);
  const topOf = (b: ArchBlock): ArchBlock => {
    let x = b;
    for (let p = blockOf(x.parent); p; p = blockOf(p.parent)) x = p;
    return x;
  };
  /** A cell is free when no sibling holds it and, in the trust row, its column is already this zone's or nobody's. */
  const free = (parent: string | undefined, zone: string, col: number, row: number, self: string) => {
    const siblings = blocks.filter((b) => b.parent === parent && b.id !== self);
    if (siblings.some((b) => colOf(b) === col && row >= rowOf(b) && row < rowOf(b) + spanOf(b))) return false;
    if (parent || !TRUST.has(ownerOf.get(zone) ?? "")) return true;
    // One column belongs to one boundary, or two outlines would overlap.
    return siblings.filter((b) => inTrustRow(b) && colOf(b) === col).every((b) => standOf(b) === zone);
  };
  const settle = (at: string, b: ArchBlock, tries: [number, number][], explicit: boolean) => {
    const cell = tries.find(([c, r]) => free(b.parent, b.zone ?? "", c, r, b.id));
    if (!cell) {
      problems.push(explicit ? `${at}: cell ${tries[0][0]},${tries[0][1]} is taken, or its column belongs to another boundary` : `${at}: no free cell beside its neighbours; give col and row`);
      return;
    }
    delete b.cell;
    [b.col, b.row] = cell;
  };
  /**
   * Cells to try in a band outside the trust row (the external band places what it holds by
   * what reaches it, so a cell there only breaks ties): the band's own column, from `row` down.
   */
  const bandCells = (zone: string, self: string, row: number): [number, number][] => {
    const cols = blocks.filter((b) => !b.parent && b.zone === zone && b.id !== self).map(colOf);
    const col = cols.length ? Math.max(...cols) : Math.max(0, ...blocks.filter((b) => !b.parent && b.id !== self).map(colOf)) + 1;
    return Array.from({ length: 12 }, (_, n): [number, number] => [col, row + n]);
  };
  const number = (v: unknown) => typeof v === "number" && Number.isFinite(v);

  changes.forEach((c, i) => {
    const at = `shape change ${i + 1}`;
    if (!c || typeof c !== "object") {
      problems.push(`${at}: is not a change`);
      return;
    }
    const kind = shapeKindOf(c);
    if (!kind) {
      problems.push(`${at}: names exactly one of ${SHAPE_KINDS.join(", ")}`);
      return;
    }
    const extra = Object.keys(c).filter((k) => !(SHAPE_KINDS as readonly string[]).includes(k) && !["why", "url", "pins"].includes(k));
    if (extra.length) problems.push(`${at}: unknown field ${extra.join(", ")}`);
    const why = typeof c.why === "string" ? c.why.trim() : "";
    textOk(at, c.why, "why: one or two plain sentences", SHAPE_LIMITS.why);
    if (why && sentences(why) > 2) problems.push(`${at}: why is ${sentences(why)} sentences; it is one or two`);
    if (!HTTPS.test(c.url ?? "")) problems.push(`${at}: needs url, the https page that says so`);
    if (c.pins !== undefined && !["insert", "drop", "reroute"].includes(kind)) problems.push(`${at}: pins says where an arrow's pins go, so it belongs on an insert, a drop or a reroute`);
    const body = (c as unknown as Record<string, unknown>)[kind];
    if (kind !== "drop") {
      if (!body || typeof body !== "object") {
        problems.push(`${at}: ${kind} needs its fields`);
        return;
      }
      const unknown = Object.keys(body).filter((k) => !(PLACED_KEYS[kind] as readonly string[]).includes(k));
      if (unknown.length) problems.push(`${at}: ${kind} has unknown field ${unknown.join(", ")}`);
    }

    if (kind === "insert") {
      const ins = body as ShapeInsert;
      const where = `${at} (insert ${ins.id})`;
      if (!CAMEL.test(ins.id ?? "")) problems.push(`${where}: id must be camelCase`);
      else if (blockOf(ins.id) || ownerOf.has(ins.id)) problems.push(`${where}: id ${ins.id} is already used on ${base.id}; an inserted box is new`);
      textOk(where, ins.title, "a title", SHAPE_LIMITS.title);
      textOk(where, ins.summary, "a one-liner", SHAPE_LIMITS.summary, true);
      if (ins.kind !== undefined && !["service", "provider", "external"].includes(ins.kind)) problems.push(`${where}: kind is service, provider or external`);
      if (ins.labels !== undefined && (!Array.isArray(ins.labels) || !ins.labels.length || ins.labels.length > 2 || ins.labels.some((l) => typeof l !== "string" || !l.trim() || l.length > SHAPE_LIMITS.label)))
        problems.push(`${where}: labels are the two legs' labels, from->${ins.id} then ${ins.id}->to, each 1 to ${SHAPE_LIMITS.label} characters`);
      const e = arrow(where, ins.on, "on");
      if (e < 0 || !CAMEL.test(ins.id ?? "") || blockOf(ins.id)) return;
      const edge = edges[e];
      const f = blockOf(edge.from)!;
      const t = blockOf(edge.to)!;
      const zone = ins.zone ?? f.zone ?? "";
      if (!zoneOk(where, zone)) return;
      // Inside what holds both ends, else beside whichever end shares its zone.
      const inZone = (p?: string) => !p || blockOf(p)?.zone === zone;
      const parents: (string | undefined)[] = [];
      if (f.parent === t.parent) parents.push(f.parent);
      if (f.zone === zone) parents.push(f.parent);
      if (t.zone === zone) parents.push(t.parent);
      const parent = ins.parent ?? parents.find(inZone);
      if (ins.parent !== undefined) {
        const p = blockOf(ins.parent);
        if (!p) problems.push(`${where}: parent ${ins.parent} is not a box of ${base.id}`);
        else if (p.zone !== zone) problems.push(`${where}: parent ${ins.parent} is in ${p.zone}, not ${zone}`);
      }
      const box: ArchBlock = { id: ins.id, kind: ins.kind ?? "service", title: ins.title, zone, parent, col: 0, row: 0, note: why };
      if (ins.summary) box.summary = ins.summary;
      blocks.push(box);
      // Its cell: between the two ends where both are on the grid it is drawn on, else beside the one that is.
      const onGrid = (b: ArchBlock) => {
        let x: ArchBlock | undefined = b;
        while (x && x.parent !== parent) x = blockOf(x.parent);
        return x && (parent || inTrustRow(x)) && x.id !== box.id ? x : undefined;
      };
      const af = onGrid(f);
      const at2 = onGrid(t);
      const explicit = number(ins.col) && number(ins.row);
      let tries: [number, number][];
      if (explicit) tries = [[ins.col!, ins.row!]];
      else if (af && at2 && af !== at2) {
        const [cf, rf, ct, rt] = [colOf(af), rowOf(af), colOf(at2), rowOf(at2)];
        const dir = Math.sign(ct - cf);
        // On a diagonal arrow a corner of the two ends' cells adds no column or row, so it is tried first.
        const corners: [number, number][] = cf !== ct && rf !== rt ? [[ct, rf], [cf, rt]] : [];
        tries = cf !== ct ? [...corners, [(cf + ct) / 2, rf], [(cf + ct) / 2, rt], [cf + dir / 2, rf], [ct - dir / 2, rt]] : [[cf, (rf + rt) / 2], [cf + 0.5, rf], [cf - 0.5, rf]];
      } else if (af || at2) {
        const a = (af ?? at2)!;
        const side = af ? 0.5 : -0.5;
        tries = [[colOf(a) + side, rowOf(a)], [colOf(a) - side, rowOf(a)], [colOf(a), rowOf(a) + 0.5]];
      } else {
        const sibs = blocks.filter((b) => b.parent === parent && b.id !== box.id);
        tries = [[sibs.length ? Math.max(...sibs.map(colOf)) + 1 : 0, rowOf(topOf(f))]];
      }
      // Outside the trust row (the external band) a cell only breaks ties between what it holds.
      const inGrid = TRUST.has(ownerOf.get(zone) ?? "") || Boolean(parent);
      settle(where, box, inGrid || explicit ? tries : bandCells(zone, box.id, rowOf(topOf(f))), explicit);

      // The two legs. Outside content stays dashed on the leg that reaches outside.
      const k1 = `${edge.from}->${ins.id}`;
      const k2 = `${ins.id}->${edge.to}`;
      const outside = (a: string, b: string) => [a, b].some((id) => ownerOf.get(blockOf(id)?.zone ?? "") === "external");
      const reach = [outside(edge.from, ins.id), outside(ins.id, edge.to)];
      const pathOf = (n: 0 | 1) => (edge.path === "external" && reach.some(Boolean) ? (reach[n] ? "external" : "primary") : edge.path);
      const crosses = (a: string, b: string) => standOf(blockOf(a)!) !== standOf(blockOf(b)!);
      const crossingLeg = edge.crossing ? [crosses(edge.from, ins.id), crosses(ins.id, edge.to)].indexOf(true) : -1;
      const leg = (from: string, to: string, n: 0 | 1): ArchEdge => {
        const out: ArchEdge = { from, to, path: pathOf(n) };
        if (edge.bidir) out.bidir = true;
        if (edge.outbound) out.outbound = true;
        const label = ins.labels?.[n] ?? (n === 0 ? edge.label : undefined);
        if (label) out.label = label;
        if (edge.note) out.note = edge.note;
        if (crossingLeg === n) out.crossing = edge.crossing;
        return out;
      };
      edges.splice(e, 1, leg(edge.from, ins.id, 0), leg(ins.id, edge.to, 1));
      if (c.pins !== undefined && !pinsAt(ins.on).length) problems.push(`${where}: pins names ${c.pins}, but ${ins.on} carries no pins`);
      movePins(ins.on, c.pins ?? k1);
      redraw(ins.on, [k1, k2]);
      delete drawn.arrows[ins.on];
      drawn.boxes[ins.id] = why;
      drawn.arrows[k1] = why;
      drawn.arrows[k2] = why;
      return;
    }

    if (kind === "move") {
      const mv = body as ShapeMove;
      const where = `${at} (move ${mv.block})`;
      const b = blockOf(mv.block);
      if (!b) {
        problems.push(`${where}: ${mv.block} is not a box of ${base.id}`);
        return;
      }
      if (b.kind === "governance" || isPerson(b)) {
        problems.push(`${where}: only a component is moved; ${b.title} is ${b.kind === "governance" ? "a control-plane box" : "a person or caller"}`);
        return;
      }
      if (!zoneOk(where, mv.zone)) return;
      if (mv.zone === b.zone) {
        problems.push(`${where}: ${b.title} is already in ${mv.zone}`);
        return;
      }
      textOk(where, mv.call, "call: the label of the arrow from the box that held it", SHAPE_LIMITS.label, true);
      const held = blockOf(b.parent);
      for (const x of [b, ...descendants(b.id)]) x.zone = mv.zone;
      const top = topOf(b);
      const explicit = number(mv.col) && number(mv.row);
      if (held && held.zone !== mv.zone) {
        // It stands outside what held it now, so it is called rather than held.
        b.parent = undefined;
        if (mv.call) {
          if (held.kind === "boundary") problems.push(`${where}: ${held.title} only holds; it does not call ${b.title}`);
          const k = `${held.id}->${b.id}`;
          if (edgeAt(k) >= 0 || edgeAt(reverse(k)) >= 0) problems.push(`${where}: ${k} is already an arrow`);
          else {
            edges.push({ from: held.id, to: b.id, path: "primary", outbound: true, label: mv.call, note: why });
            drawn.arrows[k] = why;
          }
        }
      } else if (mv.call !== undefined) problems.push(`${where}: call is for a box that was drawn inside another`);
      if (!b.parent && TRUST.has(ownerOf.get(mv.zone) ?? "")) {
        const row = rowOf(top);
        const own = new Set([b.id, ...descendants(b.id).map((x) => x.id)]);
        const cols = [...new Set(blocks.filter((x) => inTrustRow(x) && x.zone === mv.zone && !isPerson(x) && !own.has(x.id)).map(colOf))].sort((p, q) => p - q);
        if (explicit) settle(where, b, [[mv.col!, mv.row!]], true);
        else if (!cols.length) problems.push(`${where}: nothing else stands in ${mv.zone} to place ${b.title} beside; give col and row`);
        else settle(where, b, [...[...cols].reverse().map((cl): [number, number] => [cl, row]), [cols[cols.length - 1] + 0.5, row], ...[...cols].reverse().map((cl): [number, number] => [cl, row + 1])], false);
      } else if (!b.parent) {
        settle(where, b, explicit ? [[mv.col!, mv.row!]] : bandCells(mv.zone, b.id, rowOf(top)), explicit);
      }
      drawn.boxes[b.id] = why;
      return;
    }

    if (kind === "drop") {
      const k = (c as { drop: string }).drop;
      const where = `${at} (drop ${k})`;
      const e = arrow(where, k, "drop");
      if (e < 0) return;
      const carried = pinsAt(k);
      if (carried.length && c.pins === undefined) problems.push(`${where}: the arrow carries ${carried.join(", ")}; say where they are drawn instead with pins: a box or an arrow`);
      else if (c.pins !== undefined && !carried.length) problems.push(`${where}: pins names ${c.pins}, but the arrow carries no pins`);
      else if (c.pins !== undefined) movePins(k, c.pins);
      edges.splice(e, 1);
      redraw(k, []);
      delete drawn.arrows[k];
      for (const [own, keys] of Object.entries(drawn.follows)) if (!keys.length && !drawn.missing[own]) drawn.missing[own] = why;
      return;
    }

    if (kind === "reroute") {
      const r = body as { from: string; to: string };
      const where = `${at} (reroute ${r.from})`;
      const e = arrow(where, r.from, "from");
      const next = endsOf(r.to);
      if (!next) problems.push(`${where}: to must be an arrow written "from->to"`);
      if (e < 0 || !next) return;
      const [a, b] = endsOf(r.from)!;
      const [x, y] = next;
      for (const id of next) if (!blockOf(id)) problems.push(`${where}: ${id} is not a box of ${base.id}`);
      if (x === y) problems.push(`${where}: ${r.to} loops back on itself`);
      if (edgeAt(r.to) >= 0 || edgeAt(reverse(r.to)) >= 0) problems.push(`${where}: ${r.to} is already an arrow`);
      if ((a === x) === (b === y)) problems.push(`${where}: ${r.to} keeps one end of ${r.from} and moves the other`);
      // Its routing hint and authored crossing were for the arrow it was.
      const moved: ArchEdge = { ...edges[e], from: x, to: y };
      delete moved.route;
      delete moved.crossing;
      edges[e] = moved;
      if (c.pins !== undefined && !pinsAt(r.from).length) problems.push(`${where}: pins names ${c.pins}, but ${r.from} carries no pins`);
      movePins(r.from, c.pins ?? r.to);
      redraw(r.from, [r.to]);
      delete drawn.arrows[r.from];
      drawn.arrows[r.to] = why;
      return;
    }

    if (kind === "add") {
      const ad = body as ShapeAdd;
      const k = `${ad.from}->${ad.to}`;
      const where = `${at} (add ${k})`;
      const before = problems.length;
      textOk(where, ad.label, "a label", SHAPE_LIMITS.label);
      const f = blockOf(ad.from);
      const t = blockOf(ad.to);
      for (const [id, b] of [[ad.from, f], [ad.to, t]] as const) if (!b) problems.push(`${where}: ${id} is not a box of ${base.id}, nor one an earlier change inserts`);
      if (!f || !t) return;
      if (f.id === t.id) problems.push(`${where}: ${k} loops back on itself`);
      for (const b of [f, t]) {
        if (b.kind === "governance" || ownerOf.get(b.zone ?? "") === "governance") problems.push(`${where}: ${b.title} is a control-plane box, which no arrow reaches`);
        else if (b.kind === "boundary") problems.push(`${where}: ${b.title} only holds; an arrow goes to what it holds`);
      }
      const [outer, inner] = descendants(f.id).includes(t) ? [f, t] : descendants(t.id).includes(f) ? [t, f] : [];
      if (outer) problems.push(`${where}: ${inner!.title} is drawn inside ${outer.title}, which already shows that one holds the other`);
      if (edgeAt(k) >= 0) problems.push(`${where}: ${k} is already an arrow`);
      else if (edgeAt(reverse(k)) >= 0) problems.push(`${where}: ${k} is already drawn as ${reverse(k)}`);
      // A flow across a trust boundary says what it passes through on our side, as a pattern's own does.
      const crosses = standIn(f, ownerOf) !== standIn(t, ownerOf);
      if (ad.crossing === undefined) {
        if (crosses) problems.push(`${where}: ${f.title} and ${t.title} stand in different trust zones; say what the arrow passes through on our side with crossing: { via }`);
      } else if (!ad.crossing || typeof ad.crossing !== "object" || Object.keys(ad.crossing).some((x) => x !== "via")) {
        problems.push(`${where}: crossing is { via }: what the arrow passes through on our side`);
      } else {
        textOk(where, ad.crossing.via, "crossing.via: what the arrow passes through on our side", SHAPE_LIMITS.via);
        if (!crosses) problems.push(`${where}: crossing is for an arrow across a trust boundary, and ${f.title} and ${t.title} stand in one`);
      }
      if (problems.length > before) return;
      // Dashed where it reaches outside, and called rather than answered, as the pattern draws such a flow.
      const outside = (b: ArchBlock) => ownerOf.get(b.zone ?? "") === "external";
      const edge: ArchEdge = { from: f.id, to: t.id, path: outside(f) || outside(t) ? "external" : "primary", label: ad.label, note: why };
      if (outside(t) && !outside(f)) edge.outbound = true;
      if (ad.crossing) {
        edge.crossing = { kind: "direct", via: ad.crossing.via };
        viaOnly.add(edge.crossing);
      }
      edges.push(edge);
      drawn.arrows[k] = why;
      return;
    }

    // rename
    const r = body as { at: string; label: string };
    const where = `${at} (rename ${r.at})`;
    textOk(where, r.label, "a label", SHAPE_LIMITS.label);
    const e = arrow(where, r.at, "at");
    if (e < 0) return;
    edges[e] = { ...edges[e], label: r.label };
    drawn.arrows[r.at] = why;
  });

  // An added arrow's crossing (or the leg of it an insert split off that crosses) takes the kind its
  // ends give it, exactly as a pattern's derived crossing would (components/drawing/crossings.ts).
  if (viaOnly.size) {
    const bare = edges.map((e) => (e.crossing && viaOnly.has(e.crossing) ? { ...e, crossing: undefined } : e));
    const derived = new Map(crossingsOf({ ...base, blocks, edges: bare, pins: { risks, mitigations } }).map((x) => [x.key, x.kind]));
    edges.forEach((e, n) => {
      if (e.crossing && viaOnly.has(e.crossing)) edges[n] = { ...e, crossing: { kind: derived.get(keyOf(e)) ?? "direct", via: e.crossing.via } };
    });
  }

  // Every pin still has a place, stored under the direction the arrow is drawn in.
  const edgeKeys = new Set(edges.map(keyOf));
  const replies = new Set(edges.filter((e) => e.bidir || e.outbound).map((e) => reverse(keyOf(e))));
  for (const p of [...risks, ...mitigations]) {
    if (blockOf(p.at) || edgeKeys.has(p.at)) continue;
    if (replies.has(p.at)) p.at = reverse(p.at);
    else problems.push(`${"risk" in p ? `risk ${p.risk}` : `control ${p.mitigation}`} is pinned on ${p.at}, which is not on this drawing`);
  }
  // No two boxes share a cell, and in the trust row no column holds two boundaries.
  const rows = (x: ArchBlock) => Array.from({ length: spanOf(x) }, (_, n) => rowOf(x) + n);
  const clashes = new Set<string>();
  for (const id of Object.keys(drawn.boxes)) {
    const b = blockOf(id)!;
    for (const o of blocks) {
      if (o.id === id || o.parent !== b.parent) continue;
      const pair = [id, o.id].sort().join(" and ");
      if (colOf(o) === colOf(b) && rows(o).some((r) => rows(b).includes(r))) clashes.add(`${pair} share cell ${colOf(b)},${rowOf(b)}`);
      if (!b.parent && inTrustRow(b) && inTrustRow(o) && colOf(o) === colOf(b) && standOf(o) !== standOf(b)) clashes.add(`${pair} stand in column ${colOf(b)} in two boundaries`);
    }
  }
  problems.push(...clashes);

  return { archetype: { ...base, blocks, edges, pins: { risks, mitigations }, drawn }, problems };
}

/**
 * A walk as drawn on a platform's copy of the pattern: a step follows its arrow wherever that is
 * drawn, a step on an arrow split by an inserted box becomes legs that share its number, and a
 * step on an arrow that is not drawn there is kept with a note and not drawn. The pattern's own
 * walk comes back unchanged.
 */
const walksDrawn = new WeakMap<Scenario, Map<string, Scenario>>();
export function walkOn(archetype: Archetype, walk: Scenario): Scenario {
  const d = archetype.drawn;
  if (!d) return walk;
  let byKey = walksDrawn.get(walk);
  if (!byKey) {
    byKey = new Map();
    walksDrawn.set(walk, byKey);
  }
  const hit = byKey.get(d.key);
  if (hit) return hit;
  const steps: ScenarioStep[] = [];
  walk.steps.forEach((s, i) => {
    const n = i + 1;
    const forward = Object.prototype.hasOwnProperty.call(d.follows, s.follow);
    const own = forward ? s.follow : reverse(s.follow);
    const keys = d.follows[own];
    if (!keys) steps.push({ ...s, n });
    else if (!keys.length) steps.push({ ...s, n, skipped: `Not drawn ${d.on}: ${d.missing[own] ?? "the arrow does not exist there."}` });
    else (forward ? keys : [...keys].reverse().map(reverse)).forEach((leg, j) => steps.push(j ? { follow: leg, n, continues: true } : { ...s, follow: leg, n }));
  });
  const out: Scenario = { ...walk, steps };
  byKey.set(d.key, out);
  return out;
}

/** One change as How it works lists it: where on the drawing, and why it is drawn so. */
export interface ShapeLine {
  /** The box id or arrow key it draws. */
  key: string;
  kind: ShapeKind;
  /** "Knative activator, between Application front end and Agent harness". */
  where: string;
  why: string;
  url: string;
}

/** A platform's changes in the reader's words, titled from the pattern (and from the boxes earlier changes insert). */
export function describeShape(base: Archetype, changes: ShapeChange[], zoneTitle?: (zoneId: string) => string | undefined): ShapeLine[] {
  const titles = new Map(base.blocks.map((b) => [b.id, b.title]));
  const zones = new Map((base.zones ?? []).map((z) => [z.id, z.title ?? z.owner]));
  const t = (id: string) => titles.get(id) ?? id;
  const flow = (k: string) => {
    const [a, b] = k.split("->");
    return `${t(a)} → ${t(b)}`;
  };
  return changes.flatMap((c): ShapeLine[] => {
    const kind = shapeKindOf(c);
    if (!kind) return [];
    const line = (key: string, where: string): ShapeLine[] => [{ key, kind, where, why: c.why, url: c.url }];
    if ("insert" in c) {
      const [a, b] = c.insert.on.split("->");
      titles.set(c.insert.id, c.insert.title);
      return line(c.insert.id, `${c.insert.title}, between ${t(a)} and ${t(b)}`);
    }
    if ("move" in c) return line(c.move.block, `${t(c.move.block)}, in ${zoneTitle?.(c.move.zone) ?? zones.get(c.move.zone) ?? c.move.zone}`);
    if ("drop" in c) return line(c.drop, `${flow(c.drop)}, not drawn`);
    if ("reroute" in c) {
      const [a, b] = c.reroute.from.split("->");
      const [x, y] = c.reroute.to.split("->");
      const how = b === y ? `drawn from ${t(x)}` : a === x ? `drawn to ${t(y)}` : `drawn as ${flow(c.reroute.to)}`;
      return line(c.reroute.to, `${flow(c.reroute.from)}, ${how}`);
    }
    if ("add" in c) {
      const k = `${c.add.from}->${c.add.to}`;
      return line(k, `${flow(k)}, added`);
    }
    return line(c.rename.at, `${flow(c.rename.at)}, labelled “${c.rename.label}”`);
  });
}
