"use client";

/**
 * ⌘K over everything with a name: risks (with their R-codes), controls, capabilities (with
 * their abbreviations), components, personas, architectures and incidents. The dataset is
 * already in the bundle, so the index is built once and matched in the browser; a result is
 * a plain link into the page that owns the entity, so navigation works under the GitHub
 * Pages base path exactly as every other link does.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  activePersonas,
  archetypesInOrder,
  capabilitiesInOrder,
  componentTitle,
  components,
  controls,
  incidents,
  riskCode,
  risksInOrder,
} from "@/lib/data";

interface Entry {
  kind: string;
  title: string;
  hint?: string;
  href: string;
  /** Everything a query may match, lower-cased. */
  text: string;
}

function buildIndex(): Entry[] {
  const norm = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase();
  return [
    ...risksInOrder.map((r) => ({
      kind: "Risk",
      title: r.title,
      hint: riskCode(r.id),
      href: `/risks?risk=${r.id}`,
      text: norm(r.title, riskCode(r.id), r.id),
    })),
    ...controls.map((c) => ({
      kind: "Control",
      title: c.title,
      href: `/controls?control=${c.id}`,
      text: norm(c.title, c.id),
    })),
    ...capabilitiesInOrder.map((c) => ({
      kind: "Capability",
      title: c.title,
      hint: c.abbrev,
      href: `/capabilities?capability=${c.id}`,
      text: norm(c.title, c.abbrev, c.id),
    })),
    ...components.map((c) => ({
      kind: "Component",
      title: componentTitle(c.id),
      hint: componentTitle(c.id) === c.title ? undefined : c.title,
      href: `/components?component=${c.id}`,
      text: norm(componentTitle(c.id), c.title, c.id),
    })),
    ...activePersonas.map((p) => ({
      kind: "Persona",
      title: p.title,
      href: `/personas?persona=${p.id}`,
      text: norm(p.title, p.id),
    })),
    ...archetypesInOrder.map((a) => ({
      kind: "Architecture",
      title: a.title,
      hint: a.abbrev,
      href: `/reference?archetype=${a.id}`,
      text: norm(a.title, a.abbrev, a.id),
    })),
    ...incidents.map((i) => ({
      kind: "Incident",
      title: i.title,
      hint: i.dateRange,
      href: `/examples?incident=${i.id}`,
      text: norm(i.title, i.id, ...i.patterns),
    })),
  ];
}

const KIND_ORDER = ["Architecture", "Risk", "Control", "Capability", "Component", "Incident", "Persona"];

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const index = useMemo(() => buildIndex(), []);
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
          placeholder="Search risks, controls, capabilities, components, architectures, incidents…"
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
