"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { archetypeById, archetypesInOrder, surfaces } from "@/lib/data";
import { BANDS, BAND_TOKENS } from "@/lib/map-layout";
import type { Archetype, Paragraph } from "@/lib/types";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { FlowDiagram, type Highlight } from "./FlowDiagram";
import { PATH_STYLE } from "./flow-style";
import { InsightRail } from "./InsightRail";

const SURFACE_TAGLINE: Record<string, string> = {
  surfaceEndpoint: "on the person's own device",
  surfaceCloud: "infrastructure you operate",
  surfaceSaas: "a vendor hosting its own",
};

const flat = (blocks?: Paragraph[]) =>
  (blocks ?? []).map((b) => (Array.isArray(b) ? b.join(" ") : b)).join(" ");

/** Everything the search box matches against, built once per architecture. */
const haystack = new Map(
  archetypesInOrder.map((a) => [
    a.id,
    `${a.title} ${a.abbrev ?? ""} ${flat(a.summary)} ${flat(a.description)}`.toLowerCase(),
  ]),
);

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
  const [query, setQuery] = useState("");
  const [scenario, setScenario] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];

  // Deep links stay shareable. replaceState rather than router.push: pushing would drop the
  // GitHub Pages basePath, the same reason TourExplorer does it this way.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", `?archetype=${archetypeId}`);
  }, [archetypeId]);

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      archetypesInOrder.filter(
        (a) =>
          (!surface || a.surface === surface) &&
          (!q || haystack.get(a.id)?.includes(q)),
      ),
    [surface, q],
  );

  if (!archetype) return null;

  const select = (id: string) => {
    setArchetypeId(id);
    setScenario(null);
    setHighlight(null);
  };

  const summary = typeof archetype.summary[0] === "string" ? archetype.summary[0] : "";

  return (
    <>
      <PageHeader
        eyebrow={`${archetypesInOrder.length} application archetypes · authored`}
        title="Reference architectures"
        lead="Target-state architectures in the reference-architecture grammar the industry actually reads: capability blocks connected by typed data paths, the capabilities to deploy numbered onto the drawing, the risks tagged where they surface, and scenario walks over the same canvas. Built to be copied, not audited against."
      />

      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        {/* --- Picker: search, surface filter, name pills grouped by surface ---------- */}
        <div className="rounded-xl border border-line bg-paper px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
            <div className="relative">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
              >
                <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 15 15 L 20.5 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or description…"
                aria-label="Search architectures by name or description"
                className="w-64 rounded-lg border border-line bg-mist py-1.5 pl-8 pr-3 text-[13px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
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
            {q && (
              <span className="text-[12px] text-ink-3">
                {shown.length} match{shown.length === 1 ? "" : "es"}
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2.5">
            {surfaces.map((s) => {
              const group = shown.filter((a) => a.surface === s.id);
              if (!group.length) return null;
              return (
                <div key={s.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
                  <span className="eyebrow w-24 shrink-0">{s.title}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((a) => (
                      <NamePill
                        key={a.id}
                        archetype={a}
                        active={a.id === archetype.id}
                        onClick={() => select(a.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {!shown.length && (
              <p className="text-[13px] text-ink-3">
                Nothing matches “{query}” — try a component, risk or scenario word from a
                description, or clear the surface filter.
              </p>
            )}
          </div>
        </div>

        {/* --- Selected architecture: summary with the diagram ------------------------- */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="max-w-3xl">
            <p className="eyebrow">
              {surfaces.find((s) => s.id === archetype.surface)?.title} ·{" "}
              {SURFACE_TAGLINE[archetype.surface]}
            </p>
            <h2 className="display mt-1 text-[20px] font-bold leading-tight text-ink">
              {archetype.title}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{summary}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-ink-3">
              <span>{archetype.blocks.length} blocks</span>
              <span>{archetype.capabilities.length} capabilities</span>
              <span>{archetype.risks.length} risks</span>
              <span>{archetype.scenarios?.length ?? 0} scenario walks</span>
            </p>
          </div>
          <div className="flex max-w-md flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-2">
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
            <span className="flex flex-wrap items-center gap-2.5">
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

/** A compact name-only pill, the F5 building-block row applied to the catalogue. */
function NamePill({
  archetype,
  active,
  onClick,
}: {
  archetype: Archetype;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={typeof archetype.summary[0] === "string" ? archetype.summary[0] : undefined}
      className={`rounded-full border px-3 py-1 text-[12.5px] leading-snug transition-colors ${
        active
          ? "border-ink bg-ink font-semibold text-white"
          : "border-line bg-paper text-ink-2 hover:border-line-strong hover:text-ink"
      }`}
    >
      {archetype.abbrev ?? archetype.title}
    </button>
  );
}
