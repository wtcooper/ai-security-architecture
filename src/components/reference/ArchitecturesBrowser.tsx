"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { archetypeById, archetypesInOrder, guidanceByArchetype, surfaces } from "@/lib/data";
import type { Archetype, Paragraph, Scenario } from "@/lib/types";
import { ArchetypeDetail } from "./ArchetypeDetail";
import { FlowDiagram, type Highlight } from "./FlowDiagram";
import { FlowSequence } from "./FlowSequence";
import { FlowLegend } from "./FlowLegend";
import { GuidancePanel } from "./GuidancePanel";
import { InsightRail } from "./InsightRail";
import { FocusDesign } from "./designs/FocusDesign";
import { StoryDesign } from "./designs/StoryDesign";
import { StudioDesign } from "./designs/StudioDesign";
import { DESIGNS, type DesignId } from "./designs/types";

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
  const linkedDesign = params.get("design");

  const initial =
    (linkedArchetype && archetypeById.has(linkedArchetype) && linkedArchetype) ||
    archetypesInOrder[0]?.id ||
    "";

  const [archetypeId, setArchetypeId] = useState(initial);
  const [surface, setSurface] = useState<string | null>(
    linkedSurface && surfaces.some((s) => s.id === linkedSurface) ? linkedSurface : null,
  );
  // Index into the walk list, or null for the resting drawing. Every walk behaves identically:
  // the first is the complete walk through the architecture and the rest are variations, but
  // nothing about the selection treats them differently.
  const [walkIndex, setWalkIndex] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  // Which page design lays the content out. The candidates live side by side so they can be
  // compared on the live data; "current" is the layout this page has grown into.
  const [design, setDesign] = useState<DesignId>(
    DESIGNS.some((d) => d.id === linkedDesign) ? (linkedDesign as DesignId) : "current",
  );

  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];
  const walks = useMemo(
    () => [archetype.walkthrough, ...(archetype.scenarios ?? [])].filter(Boolean) as Scenario[],
    [archetype],
  );
  const activeWalk = walkIndex === null ? null : walks[walkIndex] ?? null;

  // Deep links stay shareable. replaceState rather than router.push: pushing would drop the
  // GitHub Pages basePath, the same reason TourExplorer does it this way.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState(
      null,
      "",
      `?archetype=${archetypeId}${design === "current" ? "" : `&design=${design}`}`,
    );
  }, [archetypeId, design]);

  const shown = archetypesInOrder.filter((a) => !surface || a.surface === surface);

  if (!archetype) return null;

  const select = (id: string) => {
    setArchetypeId(id);
    setWalkIndex(null);
    setHighlight(null);
  };
  const onWalk = (i: number | null) => {
    setWalkIndex(i);
    setHighlight(null);
  };
  const onHighlight = (h: Highlight | null) => {
    setHighlight(h);
    setWalkIndex(null);
  };
  const designProps = { archetype, walks, walkIndex, onWalk, highlight, onHighlight };

  const summary = typeof archetype.summary[0] === "string" ? archetype.summary[0] : "";

  return (
    <>
      <PageHeader
        eyebrow={`${archetypesInOrder.length} application archetypes · authored`}
        title="Reference architectures"
        lead="Target-state architectures in the reference-architecture grammar the industry actually reads: capability blocks connected by typed data paths, the capabilities to deploy numbered onto the drawing, the risks tagged where they surface, and a numbered walkthrough paired with its sequence diagram. Built to be copied, not audited against."
      />

      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        {/* --- Picker: surface filter pills + a searchable dropdown -------------------- */}
        <div className="rounded-xl border border-line bg-paper px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ArchPicker options={shown} current={archetype} onSelect={select} />
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
            <label className="flex items-center gap-2 text-[11.5px] text-ink-3 sm:ml-auto">
              Page design
              <select
                value={design}
                onChange={(e) => {
                  setDesign(e.target.value as DesignId);
                  setWalkIndex(null);
                  setHighlight(null);
                }}
                className="rounded-md border border-line bg-paper px-2 py-1 text-[12px] text-ink"
              >
                {DESIGNS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* --- Selected architecture: summary with the diagram ------------------------- */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="max-w-3xl">
            <p className="eyebrow">
              {surfaces.find((s) => s.id === archetype.surface)?.title} ·{" "}
              {SURFACE_TAGLINE[archetype.surface]}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="display text-[20px] font-bold leading-tight text-ink">
                {archetype.title}
              </h2>
              <span
                title="Every reference architecture in this catalogue is under active review — treat the drawing, pins and mappings as draft rather than finalised."
                className="ident cursor-help rounded-full border px-2 py-[3px] text-[10.5px] font-semibold"
                style={{ borderColor: "var(--band-data-rail)", color: "var(--band-data-rail)" }}
              >
                Under review
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{summary}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-ink-3">
              <span>{archetype.blocks.length} blocks</span>
              <span>{archetype.capabilities.length} capabilities</span>
              <span>{archetype.risks.length} risks</span>
              <span>{(archetype.scenarios?.length ?? 0) + 1} sequence walks</span>
              {guidanceByArchetype.has(archetype.id) && (
                <span>{guidanceByArchetype.get(archetype.id)!.items.length} controls-guidance items</span>
              )}
            </p>
          </div>
        </div>

        {design === "focus" && <FocusDesign {...designProps} />}
        {design === "studio" && <StudioDesign {...designProps} />}
        {design === "story" && <StoryDesign {...designProps} />}

        {design === "current" && (
        <>
        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div>
            <div className="flex items-start overflow-hidden rounded-xl border border-line bg-paper">
              <FlowDiagram
                archetype={archetype}
                walk={activeWalk}
                highlight={highlight}
                onHighlight={setHighlight}
                className="w-full"
              />
            </div>
            <FlowLegend className="mt-3 px-1" />
            {activeWalk && (
              <details className="mt-4 rounded-xl border border-line bg-paper" open>
                <summary className="flex cursor-pointer list-none items-baseline gap-2 px-4 py-2.5 text-[12.5px] text-ink-2 hover:text-ink">
                  <span className="ident text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Sequence
                  </span>
                  <span className="font-semibold text-ink">{activeWalk.title}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-ink-3">
                    {activeWalk.steps.length} steps
                  </span>
                </summary>
                <FlowSequence archetype={archetype} walk={activeWalk} className="px-4 pb-4" />
              </details>
            )}
          </div>
          <div className="self-start rounded-xl border border-line bg-paper p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <InsightRail
              archetype={archetype}
              walks={walks}
              walk={walkIndex}
              onWalk={(i) => {
                setWalkIndex(i);
                setHighlight(null);
              }}
              highlight={highlight}
              onHighlight={(h) => {
                setHighlight(h);
                setWalkIndex(null);
              }}
            />
          </div>
        </div>

        <div className="mt-6">
          <ArchetypeDetail archetype={archetype} />
        </div>

        {guidanceByArchetype.has(archetype.id) && (
          <div className="mt-8">
            <GuidancePanel archetype={archetype} />
          </div>
        )}
        </>
        )}
      </div>
    </>
  );
}

/**
 * The architecture selector: one compact button opening a searchable list, grouped by surface.
 * Pills for 28 names took a third of a phone screen; a combobox takes one row anywhere.
 */
function ArchPicker({
  options,
  current,
  onSelect,
}: {
  /** Already surface-filtered, in display order. */
  options: Archetype[];
  current: Archetype;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = options.filter((a) => !q || haystack.get(a.id)?.includes(q));

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const pick = (id: string) => {
    onSelect(id);
    close();
  };

  return (
    <div className="relative w-full sm:w-[360px]">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-3 rounded-lg bg-ink px-4 py-2.5 text-left text-[13.5px] font-semibold text-white"
      >
        <span className="truncate">{current.title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M 2 4 L 6 8 L 10 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* Click-away backdrop, as the site header menu does it. */}
          <button aria-hidden tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={close} />
          <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-line bg-paper shadow-lg">
            <div className="border-b border-line p-2">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                  if (e.key === "Enter" && matches.length) pick(matches[0].id);
                }}
                placeholder="Search name or description…"
                aria-label="Search architectures by name or description"
                className="w-full rounded-md border border-line bg-mist px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-[55vh] overflow-y-auto p-1.5">
              {surfaces.map((s) => {
                const group = matches.filter((a) => a.surface === s.id);
                if (!group.length) return null;
                return (
                  <li key={s.id}>
                    <p className="eyebrow px-2.5 pb-1 pt-2">{s.title}</p>
                    <ul>
                      {group.map((a) => (
                        <li key={a.id}>
                          <button
                            role="option"
                            aria-selected={a.id === current.id}
                            onClick={() => pick(a.id)}
                            className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] leading-snug transition-colors ${
                              a.id === current.id
                                ? "bg-ink font-semibold text-white"
                                : "text-ink-2 hover:bg-mist hover:text-ink"
                            }`}
                          >
                            {a.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
              {!matches.length && (
                <li className="px-3 py-2.5 text-[13px] text-ink-3">
                  Nothing matches &ldquo;{query}&rdquo; — try a component, risk or scenario word,
                  or clear the surface filter.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
