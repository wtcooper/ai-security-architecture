"use client";

/**
 * ⌘K over everything with a name: patterns (by title, product, cloud and everyday words), tools,
 * clouds, controls, incident patterns, deep dives, the feed's items (by title, each landing on
 * the feed with the item in view), the threats of each pattern's threat model (by title), risks (with
 * their R-codes), CoSAI controls, components and personas. The dataset is
 * already in the bundle, so the index is built once and matched in the browser; the feed is not,
 * so its titles are fetched the first time search opens. A result is
 * a plain link into the page that owns the entity, so navigation works under the GitHub
 * Pages base path exactly as every other link does.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { categoryById } from "@/lib/incident-categories";
import {
  activePersonas,
  archetypeById,
  archetypesInOrder,
  clouds,
  controlName,
  mitigationsInOrder,
  componentTitle,
  components,
  controls,
  incidentPatterns,
  incidents,
  riskCode,
  risksInOrder,
  threatModels,
  toolsInOrder,
  vendorById,
} from "@/lib/data";
import { SURFACE_SITUATION } from "@/components/patterns/labels";
import { RATING_STYLE } from "@/components/patterns/threat-style";
import { cloudsFor } from "@/components/patterns/model";
import { formatDay } from "@/components/incidents/model";
import { cloudHref, patternHref, controlHref, cosaiControlHref, feedHref, incidentHref, incidentPatternHref, riskHref, componentHref, personaHref } from "@/lib/routes";
import type { FeedTitle } from "@/lib/types";
import { kindById } from "@/lib/feed-vocabulary";
import { fileHref } from "@/lib/site";

interface Entry {
  kind: string;
  title: string;
  hint?: string;
  href: string;
  /** Everything a query may match, lower-cased. */
  text: string;
}

/** Every entry search can find. `reports` is the feed's titles, as they have been fetched (none before). */
export function buildIndex(reports: FeedTitle[] = []): Entry[] {
  const norm = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase();
  return [
    ...risksInOrder.map((r) => ({
      kind: "Risk",
      title: r.title,
      hint: riskCode(r.id),
      href: riskHref(r.id),
      text: norm(r.title, riskCode(r.id), r.id),
    })),
    ...controls.map((c) => ({
      kind: "CoSAI control",
      title: c.title,
      href: cosaiControlHref(c.id),
      text: norm(c.title, c.id),
    })),
    ...mitigationsInOrder.map((c) => ({
      kind: "Control",
      title: controlName(c.id),
      hint: c.parent ? ` · specialisation` : c.id,
      href: controlHref(c.id),
      text: norm(controlName(c.id), c.title, c.abbrev, c.id, c.parent),
    })),
    ...components.map((c) => ({
      kind: "Component",
      title: componentTitle(c.id),
      hint: componentTitle(c.id) === c.title ? undefined : c.title,
      href: componentHref(c.id),
      text: norm(componentTitle(c.id), c.title, c.id),
    })),
    ...activePersonas.map((p) => ({
      kind: "Persona",
      title: p.title,
      href: personaHref(p.id),
      text: norm(p.title, p.id),
    })),
    ...archetypesInOrder.map((a) => ({
      kind: "Pattern",
      title: a.title,
      hint: SURFACE_SITUATION[a.surface],
      href: patternHref(a.id),
      text: norm(a.title, a.abbrev, a.id, a.useWhen, ...a.keywords, ...(a.exemplars ?? []).map((e) => e.name), ...cloudsFor(a.id).flatMap((c) => [c.name, c.short])),
    })),
    ...toolsInOrder.map((t) => ({
      kind: "Tool",
      title: t.name,
      hint: `${vendorById.get(t.vendor)?.name ?? t.vendor} · ${archetypeById.get(t.architecture)?.title ?? ""}`,
      href: patternHref(t.architecture, { tool: t.id }),
      text: norm(t.name, t.family, t.vendor, t.id, ...(t.variants ?? []).map((v) => v.name)),
    })),
    ...clouds.map((c) => ({
      kind: "Cloud",
      title: c.name,
      hint: `${c.implementations.length} patterns built on it`,
      href: cloudHref(c.id),
      text: norm(c.name, c.short, c.id),
    })),
    // A threat opens its row on its pattern's Threat model tab.
    ...threatModels.flatMap((m) =>
      m.threats.map((t) => ({
        kind: "Threat",
        title: t.title,
        hint: `${RATING_STYLE[t.rating].label} · ${archetypeById.get(m.pattern)?.abbrev ?? archetypeById.get(m.pattern)?.title ?? ""}`,
        href: patternHref(m.pattern, { threat: t.id }),
        text: norm(t.title),
      })),
    ),
    // How AI systems are being attacked: by name, one-liner and id.
    ...incidentPatterns.map((p) => ({
      kind: "Incident pattern",
      title: p.name,
      hint: p.short,
      href: incidentPatternHref(p.id),
      text: norm(p.name, p.short, p.id, p.slug),
    })),
    ...incidents.map((i) => ({
      kind: "Deep dive",
      title: i.title,
      hint: `${categoryById.get(i.category)?.label ?? ""} · ${i.dateRange}`,
      href: incidentHref(i.id),
      text: norm(i.title, i.id, i.subtitle, categoryById.get(i.category)?.label ?? "", ...(i.patterns ?? [])),
    })),
    // An item opens the feed scrolled to it: an incident hints at its incident pattern, any other at its kind.
    ...reports.map((f) => ({
      kind: "Feed",
      title: f.title,
      hint: `${(f.kind === "incident" ? categoryById.get(f.category ?? "")?.label : kindById.get(f.kind)?.label) ?? ""} · ${formatDay(f.date)}`,
      href: feedHref({}, f.id),
      text: norm(f.title),
    })),
  ];
}

const KIND_ORDER = ["Pattern", "Tool", "Cloud", "Control", "Incident pattern", "Deep dive", "Feed", "Threat", "Risk", "CoSAI control", "Component", "Persona"];

/**
 * The feed's titles, fetched the first time search opens (public/data/feed/titles.json): the feed
 * grows every day, so it is not in the bundle every page loads. Until they arrive, or if they
 * cannot be fetched, search finds everything else.
 */
let titles: Promise<FeedTitle[]> | undefined;
const loadTitles = () =>
  (titles ??= fetch(fileHref("/data/feed/titles.json"))
    .then((r) => (r.ok ? (r.json() as Promise<FeedTitle[]>) : []))
    .catch(() => {
      titles = undefined;
      return [];
    }));

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [reports, setReports] = useState<FeedTitle[]>([]);
  useEffect(() => {
    if (!open) return;
    let live = true;
    loadTitles().then((t) => {
      if (live) setReports(t);
    });
    return () => {
      live = false;
    };
  }, [open]);
  const index = useMemo(() => buildIndex(reports), [reports]);
  const [query, setQuery] = useState("");
  // The cursor remembers which query it belongs to, so a new query starts at the top without
  // an effect having to reset it.
  const [cursorAt, setCursorAt] = useState({ q: "", i: 0 });
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Opening starts clean — adjusted during render, the idiom the header uses for navigation.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setCursorAt({ q: "", i: 0 });
    }
  }

  const q = query.trim().toLowerCase();
  const cursor = cursorAt.q === q ? cursorAt.i : 0;
  const setCursor = (next: number | ((c: number) => number)) =>
    setCursorAt({ q, i: typeof next === "function" ? next(cursor) : next });
  const words = q.split(/\s+/).filter(Boolean);
  const results = useMemo(() => {
    if (!words.length) return [];
    const hits = index.filter((e) => words.every((w) => e.text.includes(w)));
    // Title-prefix matches first, then by kind, then alphabetically — stable enough to learn.
    const score = (e: Entry) => (e.title.toLowerCase().startsWith(words[0]) ? 0 : 1);
    return hits
      .sort(
        (a, b) =>
          score(a) - score(b) ||
          KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
          a.title.localeCompare(b.title),
      )
      .slice(0, 24);
  }, [index, words]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      const el = listRef.current?.children[cursor]?.querySelector("a") as HTMLAnchorElement | null;
      el?.click();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
      <button aria-label="Close search" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="absolute left-1/2 top-[12vh] w-[min(640px,92vw)] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-paper shadow-2xl">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search patterns, tools, controls, risks, incidents…"
          aria-label="Search the site"
          className="w-full border-b border-line bg-paper px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
        />
        {q && (
          <ul ref={listRef} className="max-h-[55vh] overflow-y-auto p-1.5" role="listbox">
            {results.map((r, i) => (
              <li key={r.href} role="option" aria-selected={i === cursor}>
                <Link
                  href={r.href}
                  onClick={onClose}
                  onMouseEnter={() => setCursor(i)}
                  className={`flex items-baseline gap-3 rounded-md px-3 py-2 ${
                    i === cursor ? "bg-ink text-white" : "text-ink hover:bg-mist"
                  }`}
                >
                  <span
                    className={`ident w-[88px] shrink-0 text-[10px] uppercase tracking-[0.08em] ${
                      i === cursor ? "text-white/70" : "text-ink-3"
                    }`}
                  >
                    {r.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{r.title}</span>
                  {r.hint && (
                    <span className={`ident shrink-0 text-[11px] ${i === cursor ? "text-white/70" : "text-ink-3"}`}>
                      {r.hint}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {!results.length && (
              <li className="px-3 py-3 text-[13px] text-ink-3">Nothing matches “{query}”.</li>
            )}
          </ul>
        )}
        <div className="flex gap-4 border-t border-line px-4 py-2 text-[10.5px] text-ink-3">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
