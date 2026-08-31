"use client";

/**
 * The sequence view of a walk. The reference architecture answers "what is connected to what";
 * a round trip — a phone instructing a session that runs on the user's own laptop, by way of a
 * vendor relay — is a story about ordering, and an arrow on a static drawing cannot tell it.
 * This renders the walk's ordered steps as lifelines and numbered messages beneath the canvas,
 * so the drawing and the sequence read as one explanation of the same thing.
 *
 * It renders whichever walk the canvas is currently numbering: the walkthrough at rest, or a
 * scenario when one is selected. The numbers match, in both directions.
 *
 * Laid out in HTML rather than SVG so step notes wrap and stay selectable.
 */
import type { Archetype, Scenario } from "@/lib/types";

const HEAD_H = 46;
const ROW_H = 62;

export function FlowSequence({
  archetype,
  walk,
  eyebrow,
  className,
}: {
  archetype: Archetype;
  walk: Scenario;
  /** "Walkthrough" or "Scenario" — which of the two uses of a walk this is. */
  eyebrow: string;
  className?: string;
}) {
  // Lifelines in first-appearance order — the order the story visits them.
  const lifelines: string[] = [];
  for (const st of walk.steps) {
    for (const part of st.follow.split("->")) if (!lifelines.includes(part)) lifelines.push(part);
  }
  // Block titles repeat across bands on purpose — "Tool services" is the same component
  // wherever it runs, and the band says whose it is. Two identical lifeline heads would be
  // unreadable, so a repeated title picks up its band.
  const bandOf = (id: string) => {
    const zoneId = archetype.blocks.find((b) => b.id === id)?.zone;
    return archetype.zones?.find((z) => z.id === zoneId)?.title;
  };
  const rawTitle = (id: string) => archetype.blocks.find((b) => b.id === id)?.title ?? id;
  const repeated = new Set(
    lifelines
      .map(rawTitle)
      .filter((t, i, all) => all.indexOf(t) !== i),
  );
  const titleOf = (id: string) => {
    const t = rawTitle(id);
    return repeated.has(t) && bandOf(id) ? `${t} · ${bandOf(id)}` : t;
  };
  const labelOf = (from: string, to: string) =>
    archetype.edges.find(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
    )?.label;

  const n = Math.max(lifelines.length, 1);
  const colAt = (i: number) => ((i + 0.5) / n) * 100;

  return (
    <figure className={className}>
      {walk.moves && (
        <figcaption className="mb-2.5 px-1 text-[11.5px] leading-snug text-ink-3">
          {walk.moves}
        </figcaption>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <div className="relative min-w-[720px] px-3 pb-4">
          {/* Lifeline heads */}
          <div className="relative" style={{ height: HEAD_H }}>
            {lifelines.map((id, i) => (
              <div
                key={id}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${colAt(i)}%`, top: 10, width: `${100 / n}%` }}
              >
                <span className="ident rounded border border-line-strong bg-mist px-1.5 py-[3px] text-[10px] font-semibold text-ink-2">
                  {titleOf(id)}
                </span>
              </div>
            ))}
          </div>

          {/* Lifelines + messages */}
          <div className="relative" style={{ height: walk.steps.length * ROW_H }}>
            {lifelines.map((id, i) => (
              <div
                key={id}
                className="absolute top-0 border-l border-dashed border-line-strong"
                style={{ left: `${colAt(i)}%`, height: "100%" }}
                aria-hidden
              />
            ))}

            {walk.steps.map((st, step) => {
              const ref = st.follow;
              const [from, to] = ref.split("->");
              const a = colAt(lifelines.indexOf(from));
              const b = colAt(lifelines.indexOf(to));
              const left = Math.min(a, b);
              const width = Math.abs(b - a);
              const rightward = b >= a;
              const label = labelOf(from, to);
              return (
                <div key={`${ref}-${step}`} className="absolute" style={{ top: step * ROW_H, left: 0, right: 0 }}>
                  {/* the message line */}
                  <div className="absolute" style={{ left: `${left}%`, width: `${width}%`, top: 16 }}>
                    <div className="h-0 border-t-[1.5px] border-model" />
                    {rightward ? (
                      <div
                        className="absolute h-0 w-0"
                        style={{
                          right: -1,
                          top: -4,
                          borderTop: "5px solid transparent",
                          borderBottom: "5px solid transparent",
                          borderLeft: "7px solid var(--model)",
                        }}
                        aria-hidden
                      />
                    ) : (
                      <div
                        className="absolute h-0 w-0"
                        style={{
                          left: -1,
                          top: -4,
                          borderTop: "5px solid transparent",
                          borderBottom: "5px solid transparent",
                          borderRight: "7px solid var(--model)",
                        }}
                        aria-hidden
                      />
                    )}
                  </div>
                  {/* step number and label, centred on the message */}
                  <div
                    className="absolute -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${left + width / 2}%`, top: 0 }}
                  >
                    <span className="ident mr-1.5 inline-flex h-[17px] w-[17px] items-center justify-center rounded-full border border-chip bg-paper text-[9.5px] font-bold text-chip">
                      {step + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-ink-2">
                      {label ?? `${titleOf(from)} → ${titleOf(to)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* The prose of the walk — what each step actually is. */}
      <ol className="mt-2.5 space-y-1.5 px-1">
        {walk.steps.map((st, step) => {
          const ref = st.follow;
          const [from, to] = ref.split("->");
          const note =
            st.note ??
            archetype.edges.find(
              (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
            )?.note;
          return (
            <li key={`${ref}-note-${step}`} className="flex gap-2 text-[11.5px] leading-snug text-ink-2">
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
