"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { archetypeById, archetypesInOrder, surfaces } from "@/lib/data";
import { BANDS, BAND_TOKENS } from "@/lib/map-layout";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { FlowDiagram, type Highlight } from "./FlowDiagram";
import { PATH_STYLE } from "./flow-style";
import { InsightRail } from "./InsightRail";

const SURFACE_TAGLINE: Record<string, string> = {
  surfaceEndpoint: "on the person's own device",
  surfaceCloud: "infrastructure you operate",
  surfaceSaas: "a vendor hosting its own",
};

export function ArchitecturesBrowser() {
  const params = useSearchParams();
  const linkedArchetype = params.get("archetype");
  const linkedSurface = params.get("surface");

  const initial =
    (linkedArchetype && archetypeById.has(linkedArchetype) && linkedArchetype) ||
    archetypesInOrder[0]?.id ||
    "";

  const [archetypeId, setArchetypeId] = useState(initial);
  const [surface, setSurface] = useState<string | null>(
    linkedSurface && surfaces.some((s) => s.id === linkedSurface) ? linkedSurface : null,
  );
  const [scenario, setScenario] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];

  // Deep links stay shareable. replaceState rather than router.push: pushing would drop the
  // GitHub Pages basePath, the same reason TourExplorer does it this way.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", `?archetype=${archetypeId}`);
  }, [archetypeId]);

  if (!archetype) return null;

  const shown = surface
    ? archetypesInOrder.filter((a) => a.surface === surface)
    : archetypesInOrder;

  const select = (id: string) => {
    setArchetypeId(id);
    setScenario(null);
    setHighlight(null);
  };

  return (
    <>
      <PageHeader
        eyebrow={`${archetypesInOrder.length} application archetypes · authored`}
        title="Reference architectures"
        lead="Target-state architectures in the reference-architecture grammar the industry actually reads: capability blocks connected by typed data paths, the capabilities to deploy numbered onto the drawing, the risks tagged where they surface, and scenario walks over the same canvas. Built to be copied, not audited against."
      >
        <div className="mt-6">
          <p className="eyebrow">Deployment surface</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <FilterPill active={!surface} onClick={() => setSurface(null)}>
              All
            </FilterPill>
            {surfaces.map((s) => (
              <FilterPill
                key={s.id}
                active={surface === s.id}
                onClick={() => setSurface(surface === s.id ? null : s.id)}
              >
                {s.title}
                <span className="ml-1.5 opacity-60">
                  {archetypesInOrder.filter((a) => a.surface === s.id).length}
                </span>
              </FilterPill>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        {/* --- Architecture picker ---------------------------------------------------- */}
        {shown.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a) => {
              const active = a.id === archetype.id;
              return (
                <button
                  key={a.id}
                  onClick={() => select(a.id)}
                  aria-pressed={active}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-ink bg-paper shadow-[0_0_0_1px_var(--ink)]"
                      : "border-line bg-paper hover:border-line-strong"
                  }`}
                >
                  <p className="eyebrow">
                    {surfaces.find((s) => s.id === a.surface)?.title} · {SURFACE_TAGLINE[a.surface]}
                  </p>
                  <p className="display mt-1 text-[15px] font-semibold leading-snug text-ink">
                    {a.title}
                  </p>
                  <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-snug text-ink-3">
                    {typeof a.summary[0] === "string" ? a.summary[0] : ""}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-ink-3">
                    <span>{a.blocks.length} blocks</span>
                    <span>{a.capabilities.length} capabilities</span>
                    <span>{a.risks.length} risks</span>
                    <span>{a.scenarios?.length ?? 0} walks</span>
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-line bg-paper p-5 text-[13.5px] text-ink-2">
            No architecture on this surface has been rebuilt in the flow style yet. The zone-style
            catalogue that covered it is archived under{" "}
            <span className="ident">data/reference/archive</span> and returns here one architecture
            at a time.
          </p>
        )}

        {/* --- Diagram + rail ---------------------------------------------------------- */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Architecture</p>
            <h2 className="display mt-1 text-[20px] font-bold leading-tight text-ink">
              {archetype.title}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-2">
            {Object.entries(PATH_STYLE).map(([id, style]) => (
              <span key={id} className="flex items-center gap-1.5">
                <svg width="26" height="10" aria-hidden>
                  <path
                    d="M 1 5 H 25"
                    stroke={style.stroke}
                    strokeWidth="2"
                    strokeDasharray={style.dash}
                  />
                </svg>
                {style.label}
              </span>
            ))}
            <span className="flex items-center gap-2.5 border-l border-line pl-4">
              <span className="text-ink-3">Tab colour = risk-map layer</span>
              {BANDS.map((b) => (
                <span key={b.id} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-[2px]"
                    style={{ background: BAND_TOKENS[b.id].rail }}
                  />
                  {b.label}
                </span>
              ))}
            </span>
            <span className="text-ink-3">Hover anything · ⌘ or Ctrl + wheel to zoom</span>
          </div>
        </div>

        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="flex items-start overflow-hidden rounded-xl border border-line bg-paper">
            <FlowDiagram
              archetype={archetype}
              scenario={scenario}
              highlight={highlight}
              onHighlight={setHighlight}
              className="w-full"
            />
          </div>
          <div className="self-start rounded-xl border border-line bg-paper p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <InsightRail
              archetype={archetype}
              scenario={scenario}
              onScenario={(i) => {
                setScenario(i);
                setHighlight(null);
              }}
              highlight={highlight}
              onHighlight={(h) => {
                setHighlight(h);
                setScenario(null);
              }}
            />
          </div>
        </div>

        <div className="mt-6">
          <ArchetypeDetail archetype={archetype} />
        </div>
      </div>
    </>
  );
}
