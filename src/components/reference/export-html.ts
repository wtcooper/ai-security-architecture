/**
 * Export a reference architecture as a standalone interactive HTML file — the same viewer
 * the ref-arch-diagram skill renders (public/viewer-template.html is a copy of the skill's
 * template). The app resolves everything the viewer needs into a self-contained "render
 * model": rects and path strings from the build layout, pin titles and codes from the
 * risk/capability registries, frames from RF_CONFIG. Block pins are relative to their
 * block, edge pins are offsets from the edge midpoint — the two conventions that let the
 * viewer keep pins riding blocks and arrows when the reader drags them.
 */
import { bandFor } from "@/lib/bands";
import { capabilityById, componentById, riskById, riskCode } from "@/lib/data";
import { chipSpots, itemCells, tagSpots } from "@/lib/flow-layout";
import type { ArchBlock, Archetype } from "@/lib/types";

import { tagWidth } from "./flow-style";
import { frameRect, RF_CONFIG } from "./rf-config";

/** The viewer's `layer` (tab colour) from the block's CoSAI anchor — blockTab's rules. */
function layerOf(block: ArchBlock): "app" | "model" | "data" | undefined {
  if (block.kind === "external") return "data";
  if (block.kind === "governance") return undefined;
  const id = block.cosaiComponent ?? block.items?.find((i) => i.cosaiComponent)?.cosaiComponent;
  const component = id ? componentById.get(id) : undefined;
  if (!component) return undefined;
  const band = bandFor(component.id, component.category, component.subcategory);
  if (band === "application") return "app";
  if (band === "dataInfrastructure") return "data";
  return "model";
}

export function buildViewerModel(archetype: Archetype) {
  const { layout } = archetype;
  const rects = layout.blocks;
  const capNumber = new Map(archetype.capabilities.map((id, i) => [id, i + 1]));

  const blocks = archetype.blocks.map((b) => {
    const rect = rects[b.id];
    const cells = itemCells(b, rect);
    return {
      id: b.id,
      kind: b.kind,
      title: b.title,
      icon: b.icon,
      layer: layerOf(b),
      note: b.note,
      ...rect,
      items: (b.items ?? []).map((item, i) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        note: item.note,
        x: cells[i].x - rect.x,
        y: cells[i].y - rect.y,
        w: cells[i].w,
        h: cells[i].h,
      })),
    };
  });

  const edges = archetype.edges.map((e) => {
    const geo = layout.edges.find((g) => g.from === e.from && g.to === e.to)!;
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

  const cfg = RF_CONFIG[archetype.id];
  const frames = cfg
    ? [{
        label: cfg.frameLabel,
        note: cfg.frameNote,
        labelPos: cfg.labelPos ?? "top",
        members: cfg.members,
        ...frameRect(cfg.members.map((id) => rects[id])),
      }]
    : [];

  const edgeGeoOf = (ref: string) => {
    const found =
      layout.edges.find((g) => `${g.from}->${g.to}` === ref) ??
      layout.edges.find((g) => `${g.to}->${g.from}` === ref);
    return found
      ? { key: `${found.from}->${found.to}`, midX: found.midX, midY: found.midY, horizontal: found.horizontal }
      : undefined;
  };

  type Pin = Record<string, unknown>;
  const blockPins: Pin[] = [];
  const edgePins: Pin[] = [];

  const chipGroups = new Map<string, { capability: string; note?: string }[]>();
  for (const pin of archetype.pins.capabilities) {
    if (!chipGroups.has(pin.at)) chipGroups.set(pin.at, []);
    chipGroups.get(pin.at)!.push(pin);
  }
  for (const [at, pins] of chipGroups) {
    const blockRect = rects[at];
    const geo = blockRect ? undefined : edgeGeoOf(at);
    const spots = chipSpots(pins.length, blockRect, geo);
    pins.forEach((pin, i) => {
      const spot = spots[i];
      if (!spot) return;
      const base = {
        kind: "chip",
        n: capNumber.get(pin.capability) ?? 0,
        title: capabilityById.get(pin.capability)?.title ?? pin.capability,
        note: pin.note,
      };
      if (blockRect) {
        blockPins.push({ ...base, parent: at, x: spot.x - blockRect.x, y: spot.y - blockRect.y });
      } else if (geo) {
        edgePins.push({ ...base, edge: geo.key, dx: spot.x - geo.midX, dy: spot.y - geo.midY });
      }
    });
  }

  const tagGroups = new Map<string, { risk: string; note?: string }[]>();
  for (const pin of archetype.pins.risks) {
    if (!tagGroups.has(pin.at)) tagGroups.set(pin.at, []);
    tagGroups.get(pin.at)!.push(pin);
  }
  for (const [at, pins] of tagGroups) {
    const blockRect = rects[at];
    const geo = blockRect ? undefined : edgeGeoOf(at);
    const codes = pins.map((p) => riskCode(p.risk));
    const { rects: tagRects } = tagSpots(codes.map(tagWidth), blockRect, geo);
    pins.forEach((pin, i) => {
      const r = tagRects[i];
      if (!r) return;
      const base = {
        kind: "tag",
        code: codes[i],
        w: r.w,
        title: riskById.get(pin.risk)?.title ?? pin.risk,
        note: pin.note,
      };
      if (blockRect) {
        blockPins.push({ ...base, parent: at, x: r.x - blockRect.x, y: r.y - blockRect.y });
      } else if (geo) {
        edgePins.push({ ...base, edge: geo.key, dx: r.x - geo.midX, dy: r.y - geo.midY });
      }
    });
  }

  return {
    id: archetype.id,
    title: archetype.title,
    summary: archetype.summary?.[0] ?? "",
    width: layout.width,
    height: layout.height,
    blocks,
    edges,
    frames,
    blockPins,
    edgePins,
    scenarios: (archetype.scenarios ?? []).map((s) => ({
      title: s.title,
      steps: s.steps.map((st) => ({ follow: st.follow, note: st.note })),
    })),
    legend: {
      capabilities: archetype.capabilities.map((id, i) => ({
        n: i + 1,
        title: capabilityById.get(id)?.title ?? id,
      })),
      risks: archetype.risks.map((id) => ({
        code: riskCode(id),
        title: riskById.get(id)?.title ?? id,
      })),
    },
  };
}

/** Fetch the viewer template, embed the model, and hand the reader a downloadable file. */
export async function downloadArchetypeHtml(archetype: Archetype): Promise<void> {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const template = await (await fetch(`${base}/viewer-template.html`)).text();
  const model = buildViewerModel(archetype);
  const embedded = JSON.stringify(model).replace(/</g, "\\u003c");
  const html = template
    .replaceAll("__TITLE__", archetype.title.replace(/[<>&]/g, ""))
    .replace("__ARCH_JSON__", embedded);

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${archetype.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
