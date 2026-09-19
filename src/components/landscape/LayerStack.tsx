"use client";

/**
 * Option C — the market's layer cake. Four horizontal layers from AI governance at the top to
 * the infrastructure stack at the bottom, touching, each with its header on the left and its
 * capabilities flowing to the right. A layer with lanes lays them out as sub-columns, so the
 * foundational stack still reads as identity, network, hosts and supply chain.
 */
import type { LandscapeView } from "@/lib/types";
import { CoverageBar } from "./CoverageBar";
import { Empty } from "./DomainPoster";
import { coverageOf, tilesInGroup, type Tile as TileModel } from "./model";
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

export function LayerStack({ view, tiles, surface, aiOnly, overlay, selected, onSelect }: Props) {
  const groups = view.groups ?? [];
  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[1040px] overflow-hidden rounded-xl border border-line bg-paper">
        {groups.map((g, i) => {
          const own = tilesInGroup(view, tiles, g.id);
          const lanes = g.lanes ?? [];
          return (
            <section key={g.id} aria-label={g.title} className={`grid grid-cols-[240px_minmax(0,1fr)] ${i > 0 ? "border-t-2 border-line-strong" : ""}`}>
              <header className="border-r border-line bg-mist px-4 py-3.5">
                <p className="eyebrow !text-[9.5px] text-ink-3">Layer {i + 1}</p>
                <p className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="display text-[14px] font-bold leading-tight text-ink">{g.title}</span>
                  <span className="ident text-ink-3">{own.length}</span>
                </p>
                <p className="mt-1.5 text-[11px] leading-snug text-ink-3">{g.blurb}</p>
                {overlay && <CoverageBar coverage={coverageOf(own)} className="mt-2.5" />}
              </header>
              {lanes.length ? (
                <div className="grid gap-3 p-3" style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(0, 1fr))` }}>
                  {lanes.map((lane) => {
                    const inLane = tilesInGroup(view, tiles, g.id, lane.id);
                    return (
                      <div key={lane.id} className="flex flex-col gap-1.5">
                        <p className="eyebrow !text-[9.5px] text-ink-3">{lane.title}</p>
                        {inLane.map((t) => <Tile key={t.id} tile={t} surface={surface} selected={selected === t.id} onSelect={onSelect} className="w-full" />)}
                        {!inLane.length && <Empty surface={surface} aiOnly={aiOnly} />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap content-start gap-1.5 p-3">
                  {own.map((t) => <Tile key={t.id} tile={t} surface={surface} selected={selected === t.id} onSelect={onSelect} className="w-[172px]" />)}
                  {!own.length && <Empty surface={surface} aiOnly={aiOnly} />}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
