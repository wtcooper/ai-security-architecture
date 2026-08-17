/**
 * The render model: the fully-resolved, geometry-carrying JSON both renderers consume — the
 * standalone HTML viewer and any embedded React Flow component. Producers (this engine, or
 * an app exporting its own diagrams) resolve everything here so viewers need no registries:
 * pin titles and codes are inline, chip numbers are assigned, frames have rects, and every
 * pin has coordinates (block pins relative to their block, edge pins as offsets from the
 * edge midpoint so they can travel with a re-routed arrow).
 */
import {
  chipSpots, frameRect, itemCells, layoutArchetype, tagSpots, tagWidth,
} from "./layout.mjs";
import { validateArchetype } from "./validate.mjs";

/** Validate + lay out + resolve. Throws with every error listed if the input is invalid. */
export function buildRenderModel(arch) {
  const errors = validateArchetype(arch);
  if (errors.length) {
    throw new Error(`architecture ${arch?.id ?? "?"} is invalid:\n  - ${errors.join("\n  - ")}`);
  }
  const layout = layoutArchetype(arch);
  const riskById = new Map((arch.riskLegend ?? []).map((r) => [r.id, r]));
  const capById = new Map((arch.capabilityLegend ?? []).map((c) => [c.id, c]));

  // Chip numbers: first-appearance order of capability pins, deduplicated — the same rule
  // that derives the legend, so the drawing and the rail can never disagree.
  const capOrder = [];
  for (const pin of arch.pins?.capabilities ?? []) {
    if (!capOrder.includes(pin.capability)) capOrder.push(pin.capability);
  }
  const capNumber = new Map(capOrder.map((id, i) => [id, i + 1]));

  const blocks = arch.blocks.map((b) => {
    const rect = layout.blocks[b.id];
    const cells = itemCells(b, rect);
    return {
      id: b.id,
      kind: b.kind,
      title: b.title,
      icon: b.icon,
      layer: b.layer,
      note: b.note,
      ...rect,
      items: (b.items ?? []).map((item, i) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        note: item.note,
        // Cell rect relative to the block, so a dragged block carries its items for free.
        x: cells[i].x - rect.x,
        y: cells[i].y - rect.y,
        w: cells[i].w,
        h: cells[i].h,
      })),
    };
  });

  const edges = arch.edges.map((e) => {
    const geo = layout.edges.find((g) => g.from === e.from && g.to === e.to);
    return {
      id: `${e.from}->${e.to}`,
      from: e.from,
      to: e.to,
      path: e.path,
      bidir: Boolean(e.bidir),
      label: e.label,
      note: e.note,
      d: geo.d,
      midX: geo.midX,
      midY: geo.midY,
      horizontal: geo.horizontal,
    };
  });

  const frames = (arch.frames ?? []).map((f) => ({
    label: f.label,
    note: f.note,
    labelPos: f.labelPos ?? "top",
    members: f.members,
    ...frameRect(f.members.map((id) => layout.blocks[id])),
  }));

  // --- Pins, grouped by target then flattened with coordinates -----------------------
  const edgeGeoOf = (ref) => {
    const found =
      layout.edges.find((g) => `${g.from}->${g.to}` === ref) ??
      layout.edges.find((g) => `${g.to}->${g.from}` === ref);
    return found
      ? { key: `${found.from}->${found.to}`, midX: found.midX, midY: found.midY, horizontal: found.horizontal }
      : undefined;
  };

  const blockPins = [];
  const edgePins = [];

  const chipGroups = new Map();
  for (const pin of arch.pins?.capabilities ?? []) {
    (chipGroups.get(pin.at) ?? chipGroups.set(pin.at, []).get(pin.at)).push(pin);
  }
  for (const [at, pins] of chipGroups) {
    const blockRect = layout.blocks[at];
    const geo = blockRect ? undefined : edgeGeoOf(at);
    const spots = chipSpots(pins.length, blockRect, geo);
    pins.forEach((pin, i) => {
      const cap = capById.get(pin.capability);
      const base = {
        kind: "chip",
        n: capNumber.get(pin.capability),
        title: cap.title,
        note: pin.note ?? cap.note,
      };
      if (blockRect) {
        blockPins.push({ ...base, parent: at, x: spots[i].x - blockRect.x, y: spots[i].y - blockRect.y });
      } else {
        edgePins.push({ ...base, edge: geo.key, dx: spots[i].x - geo.midX, dy: spots[i].y - geo.midY });
      }
    });
  }

  const tagGroups = new Map();
  for (const pin of arch.pins?.risks ?? []) {
    (tagGroups.get(pin.at) ?? tagGroups.set(pin.at, []).get(pin.at)).push(pin);
  }
  for (const [at, pins] of tagGroups) {
    const blockRect = layout.blocks[at];
    const geo = blockRect ? undefined : edgeGeoOf(at);
    const codes = pins.map((p) => riskById.get(p.risk).code);
    const { rects } = tagSpots(codes.map(tagWidth), blockRect, geo);
    pins.forEach((pin, i) => {
      const risk = riskById.get(pin.risk);
      const base = {
        kind: "tag",
        code: risk.code,
        w: rects[i].w,
        title: risk.title,
        note: pin.note ?? risk.note,
      };
      if (blockRect) {
        blockPins.push({ ...base, parent: at, x: rects[i].x - blockRect.x, y: rects[i].y - blockRect.y });
      } else {
        edgePins.push({ ...base, edge: geo.key, dx: rects[i].x - geo.midX, dy: rects[i].y - geo.midY });
      }
    });
  }

  return {
    id: arch.id,
    title: arch.title,
    summary: arch.summary,
    width: layout.width,
    height: layout.height,
    blocks,
    edges,
    frames,
    blockPins,
    edgePins,
    scenarios: (arch.scenarios ?? []).map((s) => ({
      title: s.title,
      steps: s.steps.map((st) => ({ follow: st.follow, note: st.note })),
    })),
    legend: {
      capabilities: capOrder.map((id) => ({ n: capNumber.get(id), title: capById.get(id).title, note: capById.get(id).note })),
      risks: (arch.riskLegend ?? []).map((r) => ({ code: r.code, title: r.title, note: r.note })),
    },
  };
}
