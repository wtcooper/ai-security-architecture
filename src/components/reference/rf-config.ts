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

export const RF_CONFIG: Record<string, RfFrameConfig> = {
  archPersonalAgent: {
    frameLabel: "Sandbox",
    frameNote:
      "MicroVM-class boundary: daemon, memory and local tools run whole inside, with their own filesystem and network. The AI gateway is the general-purpose exit; the one other opening is a read-only pull from the private package registry (target state).",
    members: ["bridges", "toolPlane", "harness", "memory"],
    hide: [],
  },
  archCodingAgent: {
    frameLabel: "Vendor application",
    frameNote:
      "The CLI or desktop GUI the vendor ships: the harness and its tool surface live inside the application, and tool capabilities and connectors are built in and configured there.",
    members: ["client", "toolPlane"],
    hide: [],
    labelPos: "bottom",
  },
};

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
