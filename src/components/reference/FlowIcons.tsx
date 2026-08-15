/**
 * The line-icon vocabulary for block internals, in the spirit of F5's diagrams. Every glyph is
 * hand-drawn strokes in a 24x24 box so the set stays visually uniform; ICON_NAMES in
 * flow-layout.ts is the authoritative list the build validates against.
 */
import type { JSX } from "react";

const GLYPHS: Record<string, JSX.Element> = {
  person: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M 5 21 C 5 15.5 19 15.5 19 21" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M 3 20.5 C 3 15.5 15 15.5 15 20.5" />
      <circle cx="16.5" cy="8" r="2.6" />
      <path d="M 15.8 13.6 C 19.5 14 21 16.6 21 19" />
    </>
  ),
  agent: (
    <>
      <rect x="6" y="8" width="12" height="9" rx="2" />
      <path d="M 12 8 V 4.5 M 10 4.5 H 14" />
      <circle cx="9.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <path d="M 9.5 20 V 17 M 14.5 20 V 17" />
    </>
  ),
  model: (
    <>
      <path d="M 9.5 4.5 C 6.5 4.5 5.5 7 6 9 C 4 10 4 13.5 6 14.5 C 5.5 17.5 7.5 19.5 10 19 C 10.8 20.2 13.2 20.2 14 19 C 16.5 19.5 18.5 17.5 18 14.5 C 20 13.5 20 10 18 9 C 18.5 7 17.5 4.5 14.5 4.5 C 13.4 3.6 10.6 3.6 9.5 4.5 Z" />
      <path d="M 12 4 V 20 M 8.6 9 H 12 M 12 13 H 15.4" />
    </>
  ),
  chat: (
    <>
      <path d="M 4 6 H 20 V 16 H 10 L 6 19.5 V 16 H 4 Z" />
      <path d="M 8 10 H 16 M 8 12.8 H 13" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M 12 7 V 12 L 15.5 14" />
    </>
  ),
  folder: (
    <>
      <path d="M 3.5 6 H 9.5 L 11.5 8.5 H 20.5 V 18.5 H 3.5 Z" />
    </>
  ),
  db: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" />
      <path d="M 5 6 V 18 C 5 19.5 8 20.8 12 20.8 C 16 20.8 19 19.5 19 18 V 6" />
      <path d="M 5 12 C 5 13.5 8 14.8 12 14.8 C 16 14.8 19 13.5 19 12" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="9" r="4" />
      <path d="M 11 12 L 19 20 M 16 17 L 18.5 14.5 M 13.5 14.5 L 15.5 12.5" />
    </>
  ),
  shield: (
    <>
      <path d="M 12 3.5 L 19 6 V 12 C 19 16.5 16 19.5 12 21 C 8 19.5 5 16.5 5 12 V 6 Z" />
      <path d="M 8.8 12 L 11 14.2 L 15.4 9.5" />
    </>
  ),
  plug: (
    <>
      <path d="M 9 3.5 V 8 M 15 3.5 V 8" />
      <path d="M 6.5 8 H 17.5 V 11 C 17.5 14 15.5 16 12 16 C 8.5 16 6.5 14 6.5 11 Z" />
      <path d="M 12 16 V 20.5" />
    </>
  ),
  code: (
    <>
      <path d="M 8.5 7 L 3.5 12 L 8.5 17 M 15.5 7 L 20.5 12 L 15.5 17" />
      <path d="M 13.4 5 L 10.6 19" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M 3.8 12 H 20.2 M 12 3.8 C 8 8 8 16 12 20.2 C 16 16 16 8 12 3.8" />
    </>
  ),
  doc: (
    <>
      <path d="M 6 3.5 H 14.5 L 18 7 V 20.5 H 6 Z" />
      <path d="M 14.5 3.5 V 7 H 18 M 9 11 H 15 M 9 14 H 15 M 9 17 H 12.5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M 12 4 V 6.5 M 12 17.5 V 20 M 4 12 H 6.5 M 17.5 12 H 20 M 6.3 6.3 L 8.1 8.1 M 15.9 15.9 L 17.7 17.7 M 17.7 6.3 L 15.9 8.1 M 8.1 15.9 L 6.3 17.7" />
    </>
  ),
  phone: (
    <>
      <rect x="7.5" y="3.5" width="9" height="17" rx="2" />
      <path d="M 10.5 18 H 13.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M 15 15 L 20.5 20.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="6" width="17" height="12.5" rx="1.5" />
      <path d="M 4 7 L 12 13 L 20 7" />
    </>
  ),
  scale: (
    <>
      <path d="M 12 4.5 V 19.5 M 8.5 19.5 H 15.5 M 5 7.5 H 19" />
      <path d="M 6.5 7.5 L 4 13 C 4 14.6 9 14.6 9 13 L 6.5 7.5 M 17.5 7.5 L 15 13 C 15 14.6 20 14.6 20 13 L 17.5 7.5" />
    </>
  ),
  eye: (
    <>
      <path d="M 3 12 C 6 6.5 18 6.5 21 12 C 18 17.5 6 17.5 3 12 Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  stop: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <rect x="8.8" y="8.8" width="6.4" height="6.4" rx="0.8" />
    </>
  ),
};

export function FlowIcon({
  name,
  x,
  y,
  size,
  color = "var(--ink-2)",
}: {
  name: string;
  /** Centre of the icon. */
  x: number;
  y: number;
  size: number;
  color?: string;
}) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;
  const s = size / 24;
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}
      fill="none"
      stroke={color}
      strokeWidth={1.5 / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color }}
    >
      {glyph}
    </g>
  );
}
