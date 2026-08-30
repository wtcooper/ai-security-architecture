/**
 * The containment layer: which blocks each architecture draws inside a labelled frame.
 * Shared by the React Flow renderer and the standalone-HTML exporter, so the frame a reader
 * drags on the site is the frame the exported file draws.
 */
export interface RfFrameConfig {
  frameLabel: string;
  frameNote: string;
  members: string[];
  hide: string[];
  /** Where the frame's label tab sits; "bottom" when edge pins crowd the top edge. */
  labelPos?: "top" | "bottom";
}

/**
 * Empty by design, not by neglect. Every architecture now declares ownership bands, and a
 * containment frame drawn inside a band reads as a second boundary of the same kind — so a
 * zoned drawing states its sandbox on the component and enforces it with the sandboxing
 * capability instead (data/ONTOLOGY.md §4a). The machinery below stays for any future
 * architecture that has a real boundary and no bands to carry it.
 */
export const RF_CONFIG: Record<string, RfFrameConfig> = {};

export const FRAME_PAD = 26;
export const FRAME_HEAD = 52;

/** The bounding rect of a frame around its member rects. */
export function frameRect(rects: { x: number; y: number; w: number; h: number }[]) {
  const x0 = Math.min(...rects.map((r) => r.x)) - FRAME_PAD;
  const y0 = Math.min(...rects.map((r) => r.y)) - FRAME_PAD - FRAME_HEAD;
  const x1 = Math.max(...rects.map((r) => r.x + r.w)) + FRAME_PAD;
  const y1 = Math.max(...rects.map((r) => r.y + r.h)) + FRAME_PAD;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
