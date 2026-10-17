"use client";

/**
 * Layer 4: every product of this kind against every capability its architecture needs. One word
 * per cell — Built-in, Partial, Not in tool — so the gaps a foundation has to fill read straight
 * off the grid. Selecting a product or a cell opens its record beneath.
 */
import { capabilityName, vendorById } from "@/lib/data";
import type { Archetype, Tool } from "@/lib/types";
import { CoverageMark } from "./CoverageMark";
import { COVERAGE_WORD, coverageWord, type CoverageWord } from "./labels";
import { LAYER_META, pinnedByLayer, toolControlFor } from "./model";

const LEGEND: CoverageWord[] = ["builtIn", "partial", "notInTool"];

export function ToolsMatrix({
  archetype,
  tools,
  selected,
  onPick,
}: {
  archetype: Archetype;
  tools: Tool[];
  selected: { tool: string; capability?: string } | null;
  onPick: (toolId: string, capabilityId?: string) => void;
}) {
  const layers = pinnedByLayer(archetype);
  const total = layers.reduce((n, l) => n + l.capabilities.length, 0);
  const builtIn = (tool: Tool) =>
    layers.flatMap((l) => l.capabilities).filter((m) => coverageWord(toolControlFor(tool, m.id)?.coverage) === "builtIn").length;

  return (
    <div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
        {LEGEND.map((w) => (
          <span key={w} title={COVERAGE_WORD[w].blurb} className="inline-flex items-center gap-1.5">
            <CoverageMark word={w} />
            <span className="font-semibold">{COVERAGE_WORD[w].label}</span>
            <span className="text-ink-3"> — {COVERAGE_WORD[w].blurb.split(";")[0].replace(/\.$/, "")}</span>
          </span>
        ))}
      </p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-mist/60">
              <th scope="col" className="sticky left-0 z-[1] w-[260px] bg-mist/95 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                Capability
              </th>
              {tools.map((t) => (
                <th key={t.id} scope="col" className="px-2 py-2 align-bottom">
                  <button
                    type="button"
                    onClick={() => onPick(t.id)}
                    aria-pressed={selected?.tool === t.id}
                    className={`block w-full rounded-md px-2 py-1 text-left transition-colors ${selected?.tool === t.id ? "bg-ink text-white" : "hover:bg-paper"}`}
                  >
                    <span className="block text-[12.5px] font-semibold leading-tight">{t.name}</span>
                    <span className={`block text-[10.5px] ${selected?.tool === t.id ? "text-white/70" : "text-ink-3"}`}>
                      {vendorById.get(t.vendor)?.name} · {builtIn(t)}/{total} built-in
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          {layers.map(({ layer, capabilities }) => (
            <tbody key={layer}>
              <tr>
                <th colSpan={tools.length + 1} scope="colgroup" className="border-t border-line bg-paper px-4 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  {LAYER_META[layer].n} · {LAYER_META[layer].title}
                </th>
              </tr>
              {capabilities.map((m) => (
                <tr key={m.id} className="border-t border-line/60">
                  <th scope="row" className="sticky left-0 z-[1] bg-paper px-4 py-2 text-[12.5px] font-medium leading-snug text-ink">
                    {capabilityName(m.id)}
                  </th>
                  {tools.map((t) => {
                    const word = coverageWord(toolControlFor(t, m.id)?.coverage);
                    const meta = COVERAGE_WORD[word];
                    const active = selected?.tool === t.id && selected.capability === m.id;
                    return (
                      <td key={t.id} className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => onPick(t.id, m.id)}
                          title={`${t.name} · ${capabilityName(m.id)}: ${meta.blurb}`}
                          className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[12px] transition-colors ${active ? "outline outline-2 outline-ink" : "hover:bg-mist"} ${
                            word === "builtIn" ? "font-semibold text-ink" : word === "partial" ? "text-ink-2" : "text-ink-3"
                          }`}
                        >
                          <CoverageMark word={word} />
                          {meta.label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
