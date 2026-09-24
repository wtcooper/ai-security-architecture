"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { OverlayToggle } from "@/components/tooling/OverlayToggle";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { archetypeById, archetypesInOrder, guidanceByArchetype, landscape, surfaces, toolById } from "@/lib/data";
import type { Archetype, LandscapeView as LandscapeViewDef, Paragraph, Scenario } from "@/lib/types";
import { LandscapeView } from "@/components/landscape/LandscapeView";
import { isAiSpecific, landscapeViewById, parents } from "@/components/landscape/model";
import { ArchetypeView } from "./ArchetypeView";
import type { Highlight } from "./FlowDiagram";

const SURFACE_TAGLINE: Record<string, string> = {
  surfaceEndpoint: "on the person's own device",
  surfaceCloud: "infrastructure you operate",
  surfaceSaas: "a vendor hosting its own",
};

const flat = (blocks?: Paragraph[]) =>
  (blocks ?? []).map((b) => (Array.isArray(b) ? b.join(" ") : b)).join(" ");

/** Everything the search box matches against, built once per architecture. */
const haystack = new Map([
  ...archetypesInOrder.map((a): [string, string] => [
    a.id,
    `${a.title} ${a.abbrev ?? ""} ${flat(a.summary)} ${flat(a.description)}`.toLowerCase(),
  ]),
  ...landscape.views.map((v): [string, string] => [v.id, `${v.title} ${v.basis} ${v.description} enterprise landscape`.toLowerCase()]),
]);

export function ArchitecturesBrowser() {
  const params = useSearchParams();
  const linkedArchetype = params.get("archetype");
  const linkedLandscape = params.get("landscape");
  const linkedAi = params.get("ai") === "1";
  const linkedSurface = params.get("surface");
  const linkedTool = params.get("tool");
  const linkedToolArch = linkedTool ? toolById.get(linkedTool)?.architecture : undefined;

  // A product deep link opens its own architecture, whatever else the URL says.
  const initial =
    linkedToolArch ||
    (linkedArchetype && archetypeById.has(linkedArchetype) && linkedArchetype) ||
    archetypesInOrder[0]?.id ||
    "";

  const [archetypeId, setArchetypeId] = useState(initial);
  // The enterprise landscape views sit in the same picker; one chosen replaces the drawing.
  const [landscapeId, setLandscapeId] = useState<string | null>(
    !linkedToolArch && linkedLandscape && landscapeViewById.has(linkedLandscape) ? linkedLandscape : null,
  );
  // Landscape only: hide the foundational capabilities a domain's own architecture already owns.
  const [aiOnly, setAiOnly] = useState(linkedAi);
  const [surface, setSurface] = useState<string | null>(
    linkedSurface && surfaces.some((s) => s.id === linkedSurface) ? linkedSurface : null,
  );
  // Index into the walk list, or null for the resting drawing. Every walk behaves identically:
  // the first is the complete walk through the architecture and the rest are variations, but
  // nothing about the selection treats them differently. A page opens on the resting drawing —
  // the whole architecture, nothing faded — and a walk is something the reader chooses.
  const [walkIndex, setWalkIndex] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [toolId, setToolId] = useState<string | null>(linkedToolArch ? linkedTool : null);

  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];
  const walks = useMemo(
    () => [archetype.walkthrough, ...(archetype.scenarios ?? [])].filter(Boolean) as Scenario[],
    [archetype],
  );

  // Deep links stay shareable. replaceState rather than router.push: pushing would drop the
  // GitHub Pages basePath, the same reason TourExplorer does it this way.
  const landscapeView = landscapeId ? landscapeViewById.get(landscapeId) : undefined;
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (landscapeView) {
      window.history.replaceState(null, "", `?landscape=${landscapeView.id}${surface ? `&surface=${surface}` : ""}${aiOnly ? "&ai=1" : ""}`);
      document.title = `${landscapeView.title} · Enterprise AI security · Reference architectures`;
      return;
    }
    window.history.replaceState(null, "", `?archetype=${archetypeId}${toolId ? `&tool=${toolId}` : ""}`);
    document.title = `${archetype.title} · Reference architectures`;
  }, [archetypeId, archetype.title, toolId, landscapeView, surface, aiOnly]);

  const shown = archetypesInOrder.filter((a) => !surface || a.surface === surface);

  if (!archetype) return null;

  const select = (id: string) => {
    if (landscapeViewById.has(id)) {
      setLandscapeId(id);
      return;
    }
    setLandscapeId(null);
    setArchetypeId(id);
    setWalkIndex(null);
    setHighlight(null);
    setToolId(null);
  };
  const onWalk = (i: number | null) => {
    setWalkIndex(i);
    setHighlight(null);
  };
  const onHighlight = (h: Highlight | null) => {
    setHighlight(h);
    setWalkIndex(null);
  };

  const summary = typeof archetype.summary[0] === "string" ? archetype.summary[0] : "";

  return (
    <>
      <PageHeader
        eyebrow={`${landscape.views.length} enterprise landscape view${landscape.views.length === 1 ? "" : "s"} · ${archetypesInOrder.length} application archetypes · authored`}
        title="Reference architectures"
        lead="Target-state architectures in the reference-architecture grammar the industry actually reads: mitigation blocks connected by typed data paths, the mitigations to deploy numbered onto the drawing, the risks tagged where they surface, and a numbered walkthrough paired with its sequence diagram. Built to be copied, not audited against."
        aside={<OverlayToggle />}
      >
        {/* --- Picker: a searchable dropdown + surface filter pills -------------------- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ArchPicker options={shown} landscapes={landscape.views} current={landscapeView ?? archetype} onSelect={select} />
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
                    {landscapeView
                      ? parents.filter((m) => m.surfaces[s.id]?.applies).length
                      : archetypesInOrder.filter((a) => a.surface === s.id).length}
                  </span>
                </FilterPill>
              ))}
            </div>
            {landscapeView && (
              <FilterPill active={aiOnly} accent="var(--introduced)" onClick={() => setAiOnly(!aiOnly)}>
                AI-specific only
                <span className="ml-1.5 opacity-60">{parents.filter((m) => isAiSpecific(m) && (!surface || m.surfaces[surface]?.applies)).length}</span>
              </FilterPill>
            )}
        </div>
      </PageHeader>

      {landscapeView ? (
        <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
          {/* --- Selected landscape view: the enterprise before any one architecture ----- */}
          <div className="max-w-3xl">
            <p className="eyebrow">Enterprise AI security · the landscape before any one architecture</p>
            <h2 className="display mt-1 text-[20px] font-bold leading-tight text-ink">{landscapeView.title}</h2>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{landscapeView.description}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-ink-3">
              <span>{parents.length} MITRE parent capabilities</span>
              <span>{landscapeView.groups!.length} groups</span>
              <span>{landscapeView.basis}</span>
            </p>
          </div>
          <LandscapeView view={landscapeView} surface={surface} aiOnly={aiOnly} />
        </div>
      ) : (
      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        {/* --- Selected architecture: summary with the diagram ------------------------- */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="max-w-3xl">
            <p className="eyebrow">
              {surfaces.find((s) => s.id === archetype.surface)?.title} ·{" "}
              {SURFACE_TAGLINE[archetype.surface]}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="display text-[20px] font-bold leading-tight text-ink">
                {archetype.title}
              </h2>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{summary}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-ink-3">
              <span>{archetype.blocks.length} blocks</span>
              <span>{archetype.mitigations.length} mitigations</span>
              <span>{archetype.risks.length} risks</span>
              <span>{(archetype.scenarios?.length ?? 0) + 1} sequence walks</span>
              {guidanceByArchetype.has(archetype.id) && (
                <span>{guidanceByArchetype.get(archetype.id)!.items.length} guidance items</span>
              )}
            </p>
          </div>
        </div>

        <ArchetypeView
          archetype={archetype}
          walks={walks}
          walkIndex={walkIndex}
          onWalk={onWalk}
          highlight={highlight}
          onHighlight={onHighlight}
          toolId={toolId}
          onTool={setToolId}
        />
      </div>
      )}
    </>
  );
}

/**
 * The architecture selector: one compact button opening a searchable list — the enterprise
 * landscape views first, then the architectures grouped by surface.
 * Pills for 28 names took a third of a phone screen; a combobox takes one row anywhere.
 */
function ArchPicker({
  options,
  landscapes,
  current,
  onSelect,
}: {
  /** Already surface-filtered, in display order. */
  options: Archetype[];
  landscapes: LandscapeViewDef[];
  current: { id: string; title: string };
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = options.filter((a) => !q || haystack.get(a.id)?.includes(q));
  const landscapeMatches = landscapes.filter((v) => !q || haystack.get(v.id)?.includes(q));
  const option = (id: string, title: string, hint?: string) => (
    <li key={id}>
      <button
        role="option"
        aria-selected={id === current.id}
        onClick={() => pick(id)}
        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] leading-snug transition-colors ${
          id === current.id ? "bg-ink font-semibold text-white" : "text-ink-2 hover:bg-mist hover:text-ink"
        }`}
      >
        {title}
        {hint && <span className={`ml-1.5 text-[11px] ${id === current.id ? "text-white/60" : "text-ink-3"}`}>{hint}</span>}
      </button>
    </li>
  );

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
                  if (e.key === "Enter" && (landscapeMatches.length || matches.length)) pick((landscapeMatches[0] ?? matches[0]).id);
                }}
                placeholder="Search name or description…"
                aria-label="Search architectures by name or description"
                className="w-full rounded-md border border-line bg-mist px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-[55vh] overflow-y-auto p-1.5">
              {landscapeMatches.length > 0 && (
                <li className="border-b border-line pb-1.5">
                  <p className="eyebrow px-2.5 pb-1 pt-2">Enterprise AI security</p>
                  <ul>{landscapeMatches.map((v) => option(v.id, v.title, v.short))}</ul>
                </li>
              )}
              {surfaces.map((s) => {
                const group = matches.filter((a) => a.surface === s.id);
                if (!group.length) return null;
                return (
                  <li key={s.id}>
                    <p className="eyebrow px-2.5 pb-1 pt-2">{s.title}</p>
                    <ul>{group.map((a) => option(a.id, a.title))}</ul>
                  </li>
                );
              })}
              {!matches.length && !landscapeMatches.length && (
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
