"use client";

/**
 * The sequence view of a walk. The reference architecture answers "what is connected to what";
 * a round trip — a phone instructing a session that runs on the user's own laptop, by way of a
 * vendor relay — is a story about ordering, and an arrow on a static drawing cannot tell it.
 * This renders the walk's ordered steps as lifelines and numbered messages beneath the canvas,
 * so the drawing and the sequence read as one explanation of the same thing.
 *
 * It renders whichever walk the canvas is currently numbering. The numbers match, in both
 * directions, and neither appears until a reader selects a walk.
 *
 * Laid out in HTML rather than SVG so step notes wrap and stay selectable.
 */
import type { Archetype, Scenario } from "@/lib/types";

const HEAD_H = 58;
/**
 * Each lifeline needs room for its own name. A fixed canvas width divided by eight columns left
 * "Unsolicited senders" wrapping onto the first message line, so the width is derived from the
 * count instead and the container scrolls when it has to.
 */
const COL = 168;
const ROW_H = 44;
const PAD_X = 16;

const PATH_COLOR: Record<string, string> = {
  primary: "var(--mitigated)",
  external: "var(--band-data-rail)",
};

export function FlowSequence({
  archetype,
  walk,
  className,
}: {
  archetype: Archetype;
  walk: Scenario;
  className?: string;
}) {
  // Lifelines in first-appearance order — the order the story visits them.
  const lifelines: string[] = [];
  for (const st of walk.steps) {
    for (const part of st.follow.split("->")) if (!lifelines.includes(part)) lifelines.push(part);
  }
  // Block titles repeat across bands on purpose — "Tool services" is the same component
  // wherever it runs, and the band says whose it is. Two identical lifeline heads would be
  // unreadable, so a repeated title picks up its band as a second line.
  const bandOf = (id: string) => {
    const zoneId = archetype.blocks.find((b) => b.id === id)?.zone;
    return archetype.zones?.find((z) => z.id === zoneId)?.title;
  };
  const rawTitle = (id: string) => archetype.blocks.find((b) => b.id === id)?.title ?? id;
  const repeated = new Set(lifelines.map(rawTitle).filter((t, i, all) => all.indexOf(t) !== i));
  const titleOf = (id: string) => {
    const t = rawTitle(id);
    return repeated.has(t) && bandOf(id) ? `${t} · ${bandOf(id)}` : t;
  };
  const edgeOf = (from: string, to: string) =>
    archetype.edges.find((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from));

  const n = Math.max(lifelines.length, 1);
  const width = PAD_X * 2 + n * COL;
  const height = HEAD_H + walk.steps.length * ROW_H + 18;
  const xOf = (i: number) => PAD_X + (i + 0.5) * COL;

  return (
    <figure className={className}>
      {walk.moves && (
        <figcaption className="mb-2.5 px-1 text-[11.5px] leading-snug text-ink-3">{walk.moves}</figcaption>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img">
          <defs>
            {Object.entries(PATH_COLOR).map(([id, color]) => (
              <marker
                key={id}
                id={`seq-arrow-${id}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="9"
                markerHeight="9"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
              </marker>
            ))}
          </defs>

          {/* Lifelines */}
          {lifelines.map((id, i) => (
            <line
              key={`life-${id}`}
              x1={xOf(i)}
              x2={xOf(i)}
              y1={HEAD_H - 8}
              y2={height - 8}
              stroke="var(--line-strong)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Lifeline heads */}
          {lifelines.map((id, i) => {
            const [title, band] = titleOf(id).split(" · ");
            const x = xOf(i);
            return (
              <g key={`head-${id}`}>
                <rect
                  x={x - (COL - 14) / 2}
                  y={6}
                  width={COL - 14}
                  height={38}
                  rx={6}
                  fill="var(--paper)"
                  stroke="var(--line-strong)"
                  strokeWidth={1.2}
                />
                <text
                  x={x}
                  y={band ? 21 : 29}
                  textAnchor="middle"
                  fill="var(--ink)"
                  style={{ font: "600 11px var(--font-body), sans-serif" }}
                >
                  {title}
                </text>
                {band && (
                  <text
                    x={x}
                    y={35}
                    textAnchor="middle"
                    fill="var(--ink-3)"
                    style={{ font: "500 9.5px var(--font-mono-id), monospace", letterSpacing: "0.04em" }}
                  >
                    {band.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Messages: a solid arrow for a call, a dashed one for the return leg of a round trip */}
          {walk.steps.map((st, step) => {
            const [from, to] = st.follow.split("->");
            const edge = edgeOf(from, to);
            // A reply is the leg back of a round trip inside this walk: an earlier step went the
            // other way between the same two lifelines and has not been answered yet. Pairing
            // requests with replies (rather than asking whether the pair ever went the other way)
            // keeps a second, later request on the same pair solid — a client that exchanges a
            // token twice is making two calls, not one call and one reply.
            let open = 0;
            for (const prev of walk.steps.slice(0, step)) {
              if (prev.follow === `${to}->${from}`) open += 1;
              else if (prev.follow === st.follow && open > 0) open -= 1;
            }
            const reply = open > 0;
            const color = PATH_COLOR[edge?.path ?? "primary"] ?? PATH_COLOR.primary;
            const x1 = xOf(lifelines.indexOf(from));
            const x2 = xOf(lifelines.indexOf(to));
            const y = HEAD_H + step * ROW_H + ROW_H - 10;
            const dir = x2 > x1 ? 1 : -1;
            const start = x1 + dir * 11;
            const end = x2 - dir * 4;
            // Every arrow carries the edge's label. A bidirectional edge may author it as
            // "call / return", and the leg that runs against the authored direction shows
            // the return half.
            const authored = archetype.edges.some((e) => e.from === from && e.to === to);
            const halves = edge?.label?.split(" / ") ?? [];
            const label =
              edge?.bidir && halves.length === 2 ? halves[authored ? 0 : 1] : edge?.label;
            return (
              <g key={`${st.follow}-${step}`}>
                <title>{`${step + 1}. ${titleOf(from)} → ${titleOf(to)}${st.note ? ` — ${st.note}` : ""}`}</title>
                <line
                  x1={start}
                  x2={end}
                  y1={y}
                  y2={y}
                  stroke={color}
                  strokeWidth={1.6}
                  strokeDasharray={reply ? "5 4" : undefined}
                  markerEnd={`url(#seq-arrow-${edge?.path ?? "primary"})`}
                />
                {label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill="var(--ink-2)"
                    style={{ font: "500 10.5px var(--font-body), sans-serif" }}
                  >
                    {label}
                  </text>
                )}
                <circle cx={x1} cy={y} r={8.5} fill="var(--paper)" stroke="var(--introduced)" strokeWidth={1.3} />
                <text
                  x={x1}
                  y={y + 3.3}
                  textAnchor="middle"
                  fill="var(--introduced)"
                  style={{ font: "700 9.5px var(--font-mono-id), monospace" }}
                >
                  {step + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-1.5 px-1 text-[10.5px] text-ink-3">
        Numbers sit on the lifeline a message leaves from; a dashed arrow is the return leg of a round trip.
      </p>

      {/* The prose of the walk — what each step actually is. */}
      <ol className="mt-2.5 space-y-1.5 px-1">
        {walk.steps.map((st, step) => {
          const [from, to] = st.follow.split("->");
          const note = st.note ?? edgeOf(from, to)?.note;
          return (
            <li key={`${st.follow}-note-${step}`} className="flex gap-2 text-[11.5px] leading-snug text-ink-2">
              <span className="ident mt-[1px] inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border border-chip text-[9px] font-bold text-chip">
                {step + 1}
              </span>
              <span>
                <span className="font-semibold text-ink">
                  {titleOf(from)} → {titleOf(to)}
                </span>
                {note ? ` — ${note.replace(/\s+/g, " ").trim()}` : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
