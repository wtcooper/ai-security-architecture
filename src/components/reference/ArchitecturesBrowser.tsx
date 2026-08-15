"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { archetypeById, archetypesInOrder, surfaces } from "@/lib/data";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { DiagramLegend } from "./DiagramLegend";
import { ZoneDiagram, type DiagramSelection } from "./ZoneDiagram";

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
    linkedSurface && surfaces.some((s) => s.id === linkedSurface)
      ? linkedSurface
      : archetypeById.get(initial)?.surface ?? null,
  );
  const [selection, setSelection] = useState<DiagramSelection | null>(null);

  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];
  const detailRef = useRef<HTMLDivElement>(null);

  // Deep links stay shareable. replaceState rather than router.push: pushing would drop the
  // GitHub Pages basePath, the same reason TourExplorer does it this way.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", `?archetype=${archetypeId}`);
  }, [archetypeId]);

  useEffect(() => {
    if (selection) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selection]);

  if (!archetype) return null;

  const shown = surface ? archetypesInOrder.filter((a) => a.surface === surface) : archetypesInOrder;

  const select = (id: string) => {
    setArchetypeId(id);
    setSelection(null);
  };

  return (
    <>
      <PageHeader
        eyebrow={`${archetypesInOrder.length} application archetypes · authored`}
        title="Reference architectures"
        lead="Target-state architectures. For each class of AI application: the components, the trust boundaries, the CoSAI persona responsible for each one, and the control securing every crossing between them — with the capability that delivers it. Built to be copied, not audited against."
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

      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        {/* --- Archetype picker ---------------------------------------------------- */}
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
                  {surfaces.find((s) => s.id === a.surface)?.title} ·{" "}
                  {SURFACE_TAGLINE[a.surface]}
                </p>
                <p className="display mt-1 text-[15px] font-semibold leading-snug text-ink">
                  {a.title}
                </p>
                <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-snug text-ink-3">
                  {typeof a.summary[0] === "string" ? a.summary[0] : ""}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-ink-3">
                  <span>{a.zones.length} zones</span>
                  <span>{a.edges.filter((e) => e.control).length} controls</span>
                  <span>{a.risks.length} risks</span>
                </p>
              </button>
            );
          })}
        </div>

        {/* --- Diagram ------------------------------------------------------------- */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Architecture</p>
            <h2 className="display mt-1 text-[20px] font-bold leading-tight text-ink">
              {archetype.title}
            </h2>
          </div>
        </div>

        <div className="mt-3">
          <DiagramLegend archetype={archetype} />
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-line bg-paper">
          <ZoneDiagram
            archetype={archetype}
            selected={selection}
            onSelect={setSelection}
            className="w-full"
          />
        </div>

        <div ref={detailRef} className="mt-6 scroll-mt-20">
          <ArchetypeDetail
            archetype={archetype}
            selection={selection}
            onClear={() => setSelection(null)}
          />
        </div>
      </div>
    </>
  );
}

