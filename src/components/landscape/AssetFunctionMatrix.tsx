"use client";

/**
 * Option B — the Cyber Defense Matrix form. AI asset classes down the side, NIST CSF 2.0
 * functions across the top; every cell is a question. A hatched cell has no capability in the
 * catalogue at all (a structural gap), distinct from a tinted tile the organisation has assessed.
 */
import type { LandscapeView } from "@/lib/types";
import { CoverageBar } from "./CoverageBar";
import { coverageOf, tilesInCell, type Tile as TileModel } from "./model";
import { Tile } from "./Tile";

interface Props {
  view: LandscapeView;
  tiles: TileModel[];
  surface: string | null;
  aiOnly: boolean;
  overlay: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
}

const HATCH = "repeating-linear-gradient(135deg, #eef1f5 0 5px, transparent 5px 11px)";

export function AssetFunctionMatrix({ view, tiles, surface, aiOnly, overlay, selected, onSelect }: Props) {
  const rows = view.rows ?? [];
  const columns = view.columns ?? [];
  const inColumn = (c: string) => tiles.filter((t) => rows.some((r) => tilesInCell(view, [t], r.id, c).length));
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-paper">
      <table aria-label={view.title} className="w-full min-w-[1040px] table-fixed border-collapse text-left">
        <thead>
          <tr className="bg-ink text-white">
            <th scope="col" className="w-[190px] px-3 py-3 align-bottom">
              <span className="eyebrow !text-white/60">AI asset ↓ · CSF function →</span>
            </th>
            {columns.map((c) => {
              const own = inColumn(c.id);
              return (
                <th key={c.id} scope="col" className="border-l border-white/10 px-3 py-3 align-bottom">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="display text-[13.5px] font-bold">{c.title}</span>
                    <span className="ident !text-white/60">{own.length}</span>
                  </p>
                  {c.blurb && <p className="mt-0.5 text-[10.5px] font-normal leading-snug text-white/60">{c.blurb}</p>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const inRow = tiles.filter((t) => columns.some((c) => tilesInCell(view, [t], r.id, c.id).length));
            return (
              <tr key={r.id} className="border-t border-line">
                <th scope="row" className="bg-[#fbfcfe] px-3 py-3 align-top">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="display text-[13px] font-bold leading-tight text-ink">{r.title}</span>
                    <span className="ident text-ink-3">{inRow.length}</span>
                  </p>
                  {r.blurb && <p className="mt-1 text-[10.5px] font-normal leading-snug text-ink-3">{r.blurb}</p>}
                  {overlay && <CoverageBar coverage={coverageOf(inRow)} className="mt-2" />}
                </th>
                {columns.map((c) => {
                  const cell = tilesInCell(view, tiles, r.id, c.id);
                  return (
                    <td key={c.id} className="border-l border-line p-2 align-top" style={cell.length ? undefined : { backgroundImage: HATCH }}>
                      {cell.length ? (
                        <div className="flex flex-col gap-1.5">
                          {cell.map((t) => <Tile key={t.id} tile={t} surface={surface} selected={selected === t.id} onSelect={onSelect} className="w-full" />)}
                        </div>
                      ) : (
                        <p className="px-1 py-1 text-[10.5px] leading-snug text-ink-3" title="No capability in the catalogue sits here. If this matters, it is a gap in the catalogue, not only in the organisation.">
                          {aiOnly ? "nothing AI-specific" : surface ? "none on this surface" : "none in catalogue"}
                        </p>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
