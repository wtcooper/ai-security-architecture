"use client";

/**
 * Option A — the Zero Trust poster. Pillars stand as columns (the estates security teams own),
 * cross-cutting groups run as full-width bars beneath them. A pillar with lanes is wider and lays
 * them side by side. This is the view a security organisation recognises as its own org chart.
 */
import type { LandscapeGroup, LandscapeView } from "@/lib/types";
import { CoverageBar } from "./CoverageBar";
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

export function DomainPoster({ view, tiles, surface, aiOnly, overlay, selected, onSelect }: Props) {
  const groups = view.groups ?? [];
  const pillars = groups.filter((g) => g.role !== "crosscutting");
  const bars = groups.filter((g) => g.role === "crosscutting");
  const tileProps = { surface, selected, onSelect };
  const tileOf = (t: TileModel, className: string) => <Tile key={t.id} tile={t} {...tileProps} selected={selected === t.id} className={className} />;
  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[1040px]">
        {/* A pillar with lanes is wider — its lanes stand side by side — so no one column towers over the rest. */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${pillars.reduce((n, g) => n + span(g), 0)}, minmax(0, 1fr))` }}>
          {pillars.map((g) => {
            const own = tilesInGroup(view, tiles, g.id);
            return (
              <section key={g.id} aria-label={g.title} className="flex flex-col rounded-xl border border-line bg-paper" style={{ gridColumn: `span ${span(g)}` }}>
                <GroupHeader group={g} count={own.length} coverage={overlay ? coverageOf(own) : null} />
                {g.lanes?.length ? (
                  <div className="grid flex-1 gap-2.5 p-2.5" style={{ gridTemplateColumns: `repeat(${g.lanes.length}, minmax(0, 1fr))` }}>
                    {g.lanes.map((lane) => {
                      const inLane = tilesInGroup(view, tiles, g.id, lane.id);
                      return (
                        <div key={lane.id} className="flex flex-col gap-1.5">
                          <p className="eyebrow !text-[9.5px] text-ink-3">{lane.title}</p>
                          {inLane.map((t) => tileOf(t, "w-full"))}
                          {!inLane.length && <Empty surface={surface} aiOnly={aiOnly} />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                    {own.map((t) => tileOf(t, "w-full"))}
                    {!own.length && <Empty surface={surface} aiOnly={aiOnly} />}
                  </div>
                )}
              </section>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {bars.map((g) => {
            const own = tilesInGroup(view, tiles, g.id);
            return (
              <section key={g.id} aria-label={g.title} className="grid grid-cols-[220px_minmax(0,1fr)] rounded-xl border border-line bg-mist">
                <GroupHeader group={g} count={own.length} coverage={overlay ? coverageOf(own) : null} bar />
                <div className="flex flex-wrap content-start gap-1.5 p-2.5">
                  {own.map((t) => tileOf(t, "w-[172px]"))}
                  {!own.length && <Empty surface={surface} aiOnly={aiOnly} />}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Grid columns a pillar takes: one, or one fewer than its lanes so three lanes read as two columns' width. */
const span = (g: LandscapeGroup) => Math.max(1, (g.lanes?.length ?? 1) - 1);

export function GroupHeader({ group, count, coverage, bar = false }: { group: LandscapeGroup; count: number; coverage: ReturnType<typeof coverageOf> | null; bar?: boolean }) {
  return (
    <header className={`px-3 py-2.5 ${bar ? "border-r border-line" : "border-b border-line"}`}>
      <p className="flex items-baseline justify-between gap-2">
        <span className="display text-[13.5px] font-bold leading-tight text-ink">{group.title}</span>
        <span className="ident text-ink-3">{count}</span>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-ink-3">{group.blurb}</p>
      {coverage && <CoverageBar coverage={coverage} className="mt-2" />}
    </header>
  );
}

export function Empty({ surface, aiOnly = false }: { surface: string | null; aiOnly?: boolean }) {
  return (
    <p className="px-1 py-2 text-[11px] text-ink-3">
      {aiOnly ? "Nothing AI-specific — the domain's own architecture covers it." : surface ? "Nothing in the catalogue reaches this surface here." : "Nothing in the catalogue."}
    </p>
  );
}
