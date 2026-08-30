"use client";

/**
 * The sequence view of a numbered flow (spike grammar). The reference architecture answers
 * "what is connected to what"; a round trip — a phone instructing a session that runs on the
 * user's own laptop, by way of a vendor relay — is a story about ordering, and an arrow on a
 * static drawing cannot tell it. This renders the flow's ordered path as lifelines and
 * numbered messages beneath the canvas, so the pair reads as one explanation.
 *
 * Laid out in HTML rather than SVG so step notes wrap and stay selectable.
 */
import type { Archetype } from "@/lib/types";

const refOf = (raw: string | { follow: string; note?: string }) =>
  typeof raw === "string" ? raw : raw.follow;
const noteOf = (raw: string | { follow: string; note?: string }) =>
  typeof raw === "string" ? undefined : raw.note;

const HEAD_H = 46;
const ROW_H = 62;

export function FlowSequence({
  archetype,
  flowId,
  className,
}: {
  archetype: Archetype;
  flowId: string;
  className?: string;
}) {
  const flow = archetype.flows?.find((f) => f.id === flowId);
  if (!flow) return null;

  // Lifelines in first-appearance order — the order the story visits them.
  const lifelines: string[] = [];
  for (const raw of flow.path) {
    for (const part of refOf(raw).split("->")) if (!lifelines.includes(part)) lifelines.push(part);
  }
  const titleOf = (id: string) => archetype.blocks.find((b) => b.id === id)?.title ?? id;
  const labelOf = (from: string, to: string) =>
    archetype.edges.find(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
    )?.label;

  const n = Math.max(lifelines.length, 1);
  const colAt = (i: number) => ((i + 0.5) / n) * 100;

  return (
    <figure className={className}>
      <figcaption className="mb-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-1">
        <span className="ident rounded bg-ink px-1.5 py-[2px] text-[10px] font-bold text-paper">
          {flow.id}
        </span>
        <span className="text-[13px] font-semibold text-ink">{flow.title} — sequence</span>
        <span className="text-[11.5px] text-ink-3">{flow.moves}</span>
      </figcaption>

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
          <div className="relative" style={{ height: flow.path.length * ROW_H }}>
            {lifelines.map((id, i) => (
              <div
                key={id}
                className="absolute top-0 border-l border-dashed border-line-strong"
                style={{ left: `${colAt(i)}%`, height: "100%" }}
                aria-hidden
              />
            ))}

            {flow.path.map((raw, step) => {
              const ref = refOf(raw);
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
        {flow.path.map((raw, step) => {
          const ref = refOf(raw);
          const [from, to] = ref.split("->");
          const note =
            noteOf(raw) ??
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
