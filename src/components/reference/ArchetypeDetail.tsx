"use client";

/**
 * How it works, below the drawing, kept short because the drawing carries the detail: the way to
 * Enable, the overview (what the pattern is, in a few sentences), then the pattern's description
 * in a few plain paragraphs. Beneath, folded: the risks that enter it (opening one tags it on the
 * drawing), with a platform chosen what is different on that platform, and the sources. What
 * plays each box, and its options, are in the drawing's hover help; the examples are named in the
 * page header.
 */
import { useState, type ReactNode } from "react";

import { OnCloud } from "@/components/cloud/CloudViews";
import type { CloudProduct } from "@/components/cloud/model";
import { Prose } from "@/components/Prose";
import type { Archetype } from "@/lib/types";

export function ArchetypeDetail({
  archetype,
  cloud = null,
  onEnable,
  risks,
  riskOpen = null,
}: {
  archetype: Archetype;
  /** The platform the pattern is shown as built on: its own fold says what differs there. */
  cloud?: CloudProduct | null;
  /** Opens the Enable tab, where the pattern is put in place. */
  onEnable?: () => void;
  /** The risks that enter the pattern, as a folded section. */
  risks?: ReactNode;
  /** The risk lit on the drawing: lighting one (from a tag, say) opens the Risks fold. */
  riskOpen?: string | null;
}) {
  const detail = archetype.description ?? [];
  return (
    <div className="rounded-xl border border-line bg-paper">
      {onEnable && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-mist/50 px-5 py-3" data-enable-link>
          <p className="text-[13px] leading-snug text-ink-2">
            The {archetype.mitigations.length} controls this pattern needs, and the settings that deliver them, are on Enable.
          </p>
          <button type="button" onClick={onEnable} className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-ink-2">
            How to enable it →
          </button>
        </div>
      )}
      <div className="border-b border-line px-5 py-4">
        <p className="eyebrow">Overview</p>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink" data-overview>
          {archetype.overview}
        </p>
        {detail.length > 0 && (
          <div className="mt-4" data-detail>
            <p className="eyebrow">In more detail</p>
            <Prose blocks={detail} size="sm" className="mt-1.5 max-w-3xl" />
          </div>
        )}
      </div>

      {risks && archetype.risks.length > 0 && (
        <Section title="Risks" count={archetype.risks.length} openWhen={riskOpen}>
          {risks}
        </Section>
      )}

      {cloud && (
        <div id="on-cloud" className="scroll-mt-28">
          <Section key={`on-${cloud.id}`} title={cloud.cloud.selfManaged ? "On-premises" : `On ${cloud.cloud.name}`} count={null} defaultOpen>
            <OnCloud archetype={archetype} product={cloud} />
          </Section>
        </div>
      )}

      <Section title="Sources" count={archetype.sources.length} last>
        <ul className="space-y-1.5">
          {archetype.sources.map((s) => (
            <li key={s.url} className="text-[13px] leading-snug">
              <a href={s.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/** Collapsible section, shared with the Threat model tab. */
export function Section({
  title,
  count,
  defaultOpen = false,
  openWhen = null,
  last = false,
  children,
}: {
  title: string;
  count: number | null;
  defaultOpen?: boolean;
  /** Opens the section whenever this changes to a value: something it holds was picked elsewhere. */
  openWhen?: string | null;
  last?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || Boolean(openWhen));
  // Adjusted during render, as the page's other resets are.
  const [seen, setSeen] = useState(openWhen);
  if (openWhen !== seen) {
    setSeen(openWhen);
    if (openWhen && !open) setOpen(true);
  }
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
