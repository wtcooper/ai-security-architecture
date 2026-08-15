"use client";

/**
 * The prose below the diagram. The diagram and the rail carry the security content — this panel
 * carries the reading: how the architecture works, why it is its own archetype, what it looks
 * like in the wild, and where the claims come from. Collapsed by default except the narrative,
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

      {archetype.exemplars?.length ? (
        <Section title="Real-world instances" count={archetype.exemplars.length}>
          <p className="mb-3 text-[12px] leading-snug text-ink-3">
            Dated illustrations, not the taxonomy — the architecture itself stays vendor-neutral.
          </p>
          <div className="space-y-3">
            {archetype.exemplars.map((ex) => (
              <div key={ex.name}>
                <p className="text-[13.5px] font-semibold text-ink">
                  {ex.url ? (
                    <a href={ex.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {ex.name}
                    </a>
                  ) : (
                    ex.name
                  )}
                  {ex.asOf && (
                    <span className="ident ml-2 text-[10.5px] font-medium text-ink-3">
                      as of {ex.asOf}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{ex.note}</p>
              </div>
            ))}
          </div>
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

function Section({
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
