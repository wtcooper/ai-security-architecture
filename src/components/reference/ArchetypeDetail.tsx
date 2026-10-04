"use client";

/**
 * The prose below the diagram. The diagram and the rail carry the security content — this panel
 * carries the reading: how the architecture works, why it is its own archetype, and where
 * the claims come from. Product examples sit above the drawing. Collapsed except the narrative,
 * because the earlier version of this tab taught that showing everything at once reads as noise.
 */
import { useState, type ReactNode } from "react";

import { Prose } from "@/components/Prose";
import type { Archetype } from "@/lib/types";

export function ArchetypeDetail({ archetype }: { archetype: Archetype }) {
  return (
    <div className="rounded-xl border border-line bg-paper">
      <Section title="How it works" count={null} defaultOpen>
        <Prose blocks={archetype.description} size="sm" />
      </Section>

      {archetype.distinguishedBy?.length ? (
        <Section title="Why this is its own archetype" count={null}>
          <Prose blocks={archetype.distinguishedBy} size="sm" />
        </Section>
      ) : null}

      <Section title="Sources" count={archetype.sources.length} last>
        <ul className="space-y-1.5">
          {archetype.sources.map((s) => (
            <li key={s.url} className="text-[13px] leading-snug">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-ink-2 hover:text-introduced hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/** Collapsible prose section, shared with the guidance panel below this component. */
export function Section({
  title,
  count,
  defaultOpen = false,
  last = false,
  children,
}: {
  title: string;
  count: number | null;
  defaultOpen?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={last ? "" : "border-b border-line"}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-3.5 text-left"
      >
        <span className="eyebrow flex-1">
          {title}
          {count !== null && <span className="ml-1.5 opacity-60">{count}</span>}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M 2 4 L 6 8 L 10 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
