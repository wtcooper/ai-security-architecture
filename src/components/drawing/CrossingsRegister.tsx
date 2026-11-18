"use client";

/**
 * The register of boundary crossings: every flow on a pattern that leaves one trust zone for
 * another, what crosses, what it passes through on our side, and the controls held there. Read
 * as a review checklist: a row marked "nothing of ours in the path" is a crossing the
 * organisation does not broker.
 */
import { controlName } from "@/lib/data";
import type { Archetype, CrossingKind } from "@/lib/types";
import { OUTSIDE, CROSSING_LABEL, crossingsOf } from "./crossings";

const KIND_COLOR: Record<CrossingKind, string> = {
  brokered: "var(--ink)",
  vendor: "#5B4B9A",
  person: "var(--ink-2)",
  direct: "var(--exposed)",
};

export function CrossingsRegister({ archetype, onPickMitigation }: { archetype: Archetype; onPickMitigation?: (id: string) => void }) {
  const crossings = crossingsOf(archetype);
  const zoneTitle = new Map<string, string>([...(archetype.zones ?? []).map((z): [string, string] => [z.id, z.title ?? z.owner]), [OUTSIDE, "Outside"]]);
  if (!crossings.length) return <p className="text-[13px] text-ink-3">No flow on this pattern crosses a trust boundary.</p>;
  const direct = crossings.filter((c) => c.kind === "direct").length;
  return (
    <div>
      <p className="mb-2 max-w-3xl text-[12.5px] leading-snug text-ink-2">
        {crossings.length} flows cross a trust boundary on this pattern
        {direct ? `; ${direct} of them ${direct === 1 ? "has" : "have"} nothing of ours in the path` : ""}. Each row says what crosses, what it
        passes through on our side, and the controls held there.
      </p>
      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[760px] text-left text-[12.5px]">
          <thead className="border-b border-line bg-mist/60 text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <tr>
              <th className="px-3 py-2 font-semibold">Crossing</th>
              <th className="px-3 py-2 font-semibold">What crosses</th>
              <th className="px-3 py-2 font-semibold">Passes through on our side</th>
              <th className="px-3 py-2 font-semibold">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {crossings.map((c) => (
              <tr key={c.key} id={`crossing-${c.key.replace("->", "-")}`} data-kind={c.kind}>
                <td className="px-3 py-2 align-top">
                  <p className="font-semibold text-ink">
                    {c.from.title} {c.edge.bidir ? "↔" : "→"} {c.to.title}
                  </p>
                  <p className="text-[11px] text-ink-3">
                    {zoneTitle.get(c.fromZone)} {c.edge.bidir ? "↔" : "→"} {zoneTitle.get(c.toZone)}
                  </p>
                </td>
                <td className="px-3 py-2 align-top text-ink-2">{c.edge.label}</td>
                <td className="px-3 py-2 align-top">
                  <p className="text-ink-2" style={{ color: c.kind === "direct" ? KIND_COLOR.direct : undefined }}>
                    {c.via}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-3">
                    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-[3px] border-[1.5px] bg-paper" style={{ borderColor: KIND_COLOR[c.kind] }} />
                    {CROSSING_LABEL[c.kind]}
                  </p>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-1">
                    {c.controls.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onPickMitigation?.(id)}
                        title={`${controlName(id)}: open it on Enable`}
                        className="flex h-[21px] w-[21px] items-center justify-center rounded-full border border-chip bg-chip-soft text-[10.5px] font-bold text-chip hover:bg-chip hover:text-white"
                      >
                        {archetype.mitigations.indexOf(id) + 1}
                      </button>
                    ))}
                    {!c.controls.length && <span className="text-[11.5px] text-ink-3">None pinned</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
