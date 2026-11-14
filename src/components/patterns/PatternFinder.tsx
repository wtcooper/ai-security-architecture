"use client";

/**
 * The front door: every pattern as a card, grouped by where the AI runs and worded as the
 * reader's situation, with one search box that understands product, cloud and everyday names
 * ("copilot", "azure", "chatbot"). A reader picks what they are enabling and lands on its
 * Enable tab.
 */
import { useState } from "react";
import Link from "next/link";

import { archetypesInOrder, toolsForArchetype } from "@/lib/data";
import { patternHref } from "@/lib/routes";
import type { Archetype } from "@/lib/types";
import { SURFACE_BLURB, SURFACE_ORDER, SURFACE_SITUATION } from "./labels";
import { cloudsFor, findPatterns } from "./model";

function PatternCard({ pattern }: { pattern: Archetype }) {
  const examples = (pattern.exemplars ?? []).map((e) => e.name);
  const tools = toolsForArchetype(pattern.id).length;
  const builtOn = cloudsFor(pattern.id);
  return (
    <li>
      <Link
        href={patternHref(pattern.id)}
        data-pattern={pattern.id}
        className="group flex h-full flex-col rounded-xl border border-line bg-paper p-4 transition-colors hover:border-ink-3"
      >
        <span className="display text-[15.5px] font-semibold leading-snug text-ink group-hover:text-introduced">{pattern.title}</span>
        <span className="mt-1.5 flex-1 text-[13px] leading-snug text-ink-2">{pattern.useWhen}</span>
        {examples.length > 0 && (
          <span className="mt-2.5 text-[12px] leading-snug text-ink-3">
            {examples.slice(0, 4).join(" · ")}
            {examples.length > 4 && ` · +${examples.length - 4}`}
          </span>
        )}
        <span className="ident mt-2.5 text-[11px] text-ink-3">
          {pattern.mitigations.length} controls
          {tools > 0 && ` · ${tools} ${tools === 1 ? "tool" : "tools"}`}
          {builtOn.length > 0 && ` · ${builtOn.map((c) => c.short).join(", ")}`}
        </span>
      </Link>
    </li>
  );
}

export function PatternFinder() {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const matches = findPatterns(q);
  return (
    <div>
      <label className="block max-w-xl">
        <span className="sr-only">Search patterns</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product, cloud or what you are building — Copilot, Azure, chatbot…"
          className="w-full rounded-lg border border-line-strong bg-paper px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
        />
      </label>

      {q ? (
        <div className="mt-6">
          <p className="eyebrow">
            {matches.length} of {archetypesInOrder.length} patterns match &ldquo;{q}&rdquo;
          </p>
          {matches.length ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((a) => <PatternCard key={a.id} pattern={a} />)}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-line bg-paper px-5 py-5 text-[13.5px] text-ink-2">
              Nothing matches. Try a product name, a cloud, or a plainer word for what it does.{" "}
              <button type="button" onClick={() => setQuery("")} className="font-semibold text-introduced hover:underline">Show all patterns</button>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-7 grid gap-x-6 gap-y-9 lg:grid-cols-3">
          {SURFACE_ORDER.map((surface) => {
            const group = archetypesInOrder.filter((a) => a.surface === surface);
            return (
              <section key={surface} aria-labelledby={`surface-${surface}`}>
                <h2 id={`surface-${surface}`} className="display text-[17px] font-bold text-ink">{SURFACE_SITUATION[surface]}</h2>
                <p className="mt-1 min-h-[36px] text-[12.5px] leading-snug text-ink-3">{SURFACE_BLURB[surface]}</p>
                <ul className="mt-3 grid gap-3">
                  {group.map((a) => <PatternCard key={a.id} pattern={a} />)}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
