"use client";

import { useState } from "react";

import { archetypesInOrder, surfaces } from "@/lib/data";
import type { Archetype, Paragraph } from "@/lib/types";

const flat = (blocks?: Paragraph[]) =>
  (blocks ?? []).map((b) => (Array.isArray(b) ? b.join(" ") : b)).join(" ");

/** Everything the search box matches against, built once per architecture. */
const haystack = new Map(
  archetypesInOrder.map((a): [string, string] => [
    a.id,
    `${a.title} ${a.abbrev ?? ""} ${flat(a.summary)} ${flat(a.description)} ${(a.exemplars ?? []).map((ex) => `${ex.name} ${ex.note}`).join(" ")}`.toLowerCase(),
  ]),
);

/**
 * The architecture selector on the Architectures page: one compact button opening a
 * searchable list grouped by surface. Pills for every name took a third of a phone screen; a
 * combobox takes one row anywhere.
 */
export function ArchPicker({
  current,
  onSelect,
  placeholder = "Choose an architecture",
}: {
  current: Archetype | null;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = archetypesInOrder.filter((a) => !q || haystack.get(a.id)?.includes(q));

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const pick = (id: string) => {
    onSelect(id);
    close();
  };

  return (
    <div className="relative w-full sm:w-[380px]">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-3 rounded-lg bg-ink px-4 py-2.5 text-left text-[13.5px] font-semibold text-white"
      >
        <span className="truncate">{current?.title ?? placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M 2 4 L 6 8 L 10 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
                placeholder="Search name, product or description…"
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
                            aria-selected={a.id === current?.id}
                            onClick={() => pick(a.id)}
                            className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] leading-snug transition-colors ${
                              a.id === current?.id ? "bg-ink font-semibold text-white" : "text-ink-2 hover:bg-mist hover:text-ink"
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
                  Nothing matches &ldquo;{query}&rdquo; — try a product, component or scenario word.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
