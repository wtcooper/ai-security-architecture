"use client";

/**
 * The front door: browse with a preview. The patterns are split by where the AI runs, worded as
 * the reader's situation, one situation showing at a time, so the page is a short list and not a
 * wall of cards. Beside the list is the pattern the pointer or the keyboard is on: when it
 * applies, its examples and its drawing. A click opens it. One search box understands product,
 * cloud and everyday names ("copilot", "azure", "chatbot") and searches every situation at once.
 * On a phone there is no room for a preview, so each row carries its own use-when line.
 */
import { useMemo, useState } from "react";
import Link from "next/link";

import { BoxDiagram } from "@/components/drawing/BoxDiagram";
import { boundaryLayout, type ViewSpec } from "@/components/drawing/layout";
import { archetypesInOrder, toolsForArchetype } from "@/lib/data";
import { patternHref } from "@/lib/routes";
import type { Archetype } from "@/lib/types";
import { SURFACE_BLURB, SURFACE_ORDER, SURFACE_SITUATION } from "./labels";
import { cloudsFor, findPatterns } from "./model";

/** Laid out once per pattern, the first time it is previewed. */
const specs = new Map<string, ViewSpec>();
const specFor = (pattern: Archetype) => {
  if (!specs.has(pattern.id)) specs.set(pattern.id, boundaryLayout(pattern));
  return specs.get(pattern.id)!;
};

const facts = (pattern: Archetype) => {
  const tools = toolsForArchetype(pattern.id).length;
  const builtOn = cloudsFor(pattern.id);
  return [
    `${pattern.mitigations.length} controls`,
    `${pattern.risks.length} risks`,
    ...(tools ? [`${tools} ${tools === 1 ? "tool" : "tools"}`] : []),
    ...(builtOn.length ? [builtOn.map((c) => c.short).join(", ")] : []),
  ];
};

function Row({ pattern, active, onPreview }: { pattern: Archetype; active: boolean; onPreview: () => void }) {
  const examples = (pattern.exemplars ?? []).map((e) => e.name);
  return (
    <li>
      <Link
        href={patternHref(pattern.id)}
        data-pattern={pattern.id}
        data-active={active || undefined}
        onMouseEnter={onPreview}
        onFocus={onPreview}
        className={`group flex items-center gap-3 border-l-[3px] px-4 py-2.5 transition-colors ${
          active ? "border-ink bg-mist" : "border-transparent hover:bg-mist"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="display block text-[14.5px] font-semibold leading-snug text-ink">{pattern.title}</span>
          {/* With no preview beside it, a row says for itself when it applies. */}
          <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-2 lg:hidden">{pattern.useWhen}</span>
          {examples.length > 0 && (
            <span className="mt-0.5 block truncate text-[12px] leading-snug text-ink-3">
              {examples.slice(0, 3).join(" · ")}
              {examples.length > 3 && ` · +${examples.length - 3}`}
            </span>
          )}
        </span>
        <span aria-hidden className={`text-[15px] transition-colors ${active ? "text-ink" : "text-ink-3 group-hover:text-ink"}`}>→</span>
      </Link>
    </li>
  );
}

function Preview({ pattern }: { pattern: Archetype }) {
  const spec = useMemo(() => specFor(pattern), [pattern]);
  const examples = (pattern.exemplars ?? []).map((e) => e.name);
  return (
    <Link
      href={patternHref(pattern.id)}
      data-preview={pattern.id}
      aria-label={`Open ${pattern.title}`}
      className="group hidden min-w-0 flex-col rounded-xl border border-line bg-paper transition-colors hover:border-ink-3 lg:flex"
    >
      <div className="flex min-h-[128px] items-start gap-6 px-5 pt-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{SURFACE_SITUATION[pattern.surface]}</p>
          <p className="display mt-1 text-[21px] font-bold leading-tight text-ink">{pattern.title}</p>
          <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">
            <span className="font-semibold text-ink">Use it when: </span>
            {pattern.useWhen}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">
            {examples.length > 0 && <>{examples.slice(0, 5).join(" · ")}{examples.length > 5 && ` · +${examples.length - 5}`}</>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-block whitespace-nowrap rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-white group-hover:bg-introduced">
            Open pattern →
          </span>
          <p className="ident mt-2 text-[11px] leading-relaxed text-ink-3">
            {facts(pattern).map((f) => (
              <span key={f} className="block">{f}</span>
            ))}
          </p>
        </div>
      </div>
      {/* The pattern's own drawing, small: the shape of it, not something to read. */}
      <div className="pointer-events-none mt-3 h-[270px] border-t border-line bg-mist/60 px-4 py-3" aria-hidden inert>
        <BoxDiagram archetype={pattern} spec={spec} pins="controls" className="h-full w-full" />
      </div>
    </Link>
  );
}

export function PatternFinder() {
  const [query, setQuery] = useState("");
  const [surface, setSurface] = useState(SURFACE_ORDER[0]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const q = query.trim();
  const matches = useMemo(() => (q ? findPatterns(q) : []), [q]);
  const shown = q ? matches : archetypesInOrder.filter((a) => a.surface === surface);
  // The previewed pattern, or the first of what is listed when the pointer has not chosen one of them.
  const preview = shown.find((a) => a.id === previewId) ?? shown[0] ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-paper p-1" role="tablist" aria-label="Where the AI runs">
          {SURFACE_ORDER.map((s) => {
            const on = !q && surface === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={on}
                title={SURFACE_BLURB[s]}
                onClick={() => {
                  setSurface(s);
                  setQuery("");
                  setPreviewId(null);
                }}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  on ? "bg-ink font-semibold text-white" : "text-ink-2 hover:bg-mist hover:text-ink"
                }`}
              >
                {SURFACE_SITUATION[s]}
                <span className="ml-1.5 opacity-60">{archetypesInOrder.filter((a) => a.surface === s).length}</span>
              </button>
            );
          })}
        </div>
        <label className="block min-w-[240px] flex-1">
          <span className="sr-only">Search patterns</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or search every pattern: Copilot, Azure, chatbot…"
            className="w-full rounded-lg border border-line-strong bg-paper px-4 py-2 text-[13.5px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
          />
        </label>
      </div>

      <p className="mt-3 text-[13px] leading-snug text-ink-3">
        {q ? (
          <>
            {matches.length} of {archetypesInOrder.length} patterns match &ldquo;{q}&rdquo;
          </>
        ) : (
          SURFACE_BLURB[surface]
        )}
      </p>

      {shown.length ? (
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          <ul className="divide-y divide-line self-start overflow-hidden rounded-xl border border-line bg-paper">
            {shown.map((a) => (
              <Row key={a.id} pattern={a} active={preview?.id === a.id} onPreview={() => setPreviewId(a.id)} />
            ))}
          </ul>
          {preview && <Preview pattern={preview} />}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-line bg-paper px-5 py-5 text-[13.5px] text-ink-2">
          Nothing matches. Try a product name, a cloud, or a plainer word for what it does.{" "}
          <button type="button" onClick={() => setQuery("")} className="font-semibold text-introduced hover:underline">Show all patterns</button>
        </p>
      )}
    </div>
  );
}
