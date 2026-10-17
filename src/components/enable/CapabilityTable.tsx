"use client";

/** One layer's capabilities as rows: what it is, what it does, where it goes, and its status. */
import Link from "next/link";
import { useState } from "react";

import { Prose } from "@/components/Prose";
import { StatusHeading, StatusPill } from "@/components/StatusPill";
import { capabilityName, guidanceByArchetype, status as statusFile, statusFor } from "@/lib/data";
import type { Archetype, Mitigation } from "@/lib/types";
import { placementsFor } from "./model";

/** The first sentence of the authored implementation scope, kept to a couple of lines: what the capability does. */
const whatItDoes = (m: Mitigation) => {
  const text = m.implementation.replace(/\s+/g, " ").trim();
  const end = text.search(/\.\s/);
  const sentence = end === -1 ? text : text.slice(0, end + 1);
  if (sentence.length <= 150) return sentence;
  const cut = sentence.slice(0, 150);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
};

export function CapabilityTable({ capabilities, archetype }: { capabilities: Mitigation[]; archetype?: Archetype }) {
  const [open, setOpen] = useState<string | null>(null);
  const showWhere = Boolean(archetype);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className={`hidden gap-4 border-b border-line bg-mist/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${showWhere ? "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)_112px]" : "md:grid-cols-[minmax(0,1.1fr)_minmax(0,2.2fr)_112px]"}`}>
        <span>Capability</span>
        <span>What it does</span>
        {showWhere && <span>Where it goes</span>}
        <StatusHeading />
      </div>
      <ul className="divide-y divide-line">
        {capabilities.map((m) => {
          const expanded = open === m.id;
          const where = archetype ? placementsFor(archetype.id, m.id) : null;
          const guidance = archetype ? guidanceByArchetype.get(archetype.id)?.items.filter((i) => i.mitigations.includes(m.id)) ?? [] : [];
          const own = statusFile[m.id];
          return (
            <li key={m.id} id={`capability-${m.id}`} className="scroll-mt-24">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : m.id)}
                aria-expanded={expanded}
                className={`grid w-full gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-mist/50 ${expanded ? "bg-mist/50" : ""} ${showWhere ? "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)_112px]" : "md:grid-cols-[minmax(0,1.1fr)_minmax(0,2.2fr)_112px]"}`}
              >
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold leading-snug text-ink">{capabilityName(m.id)}</span>
                  {own?.displayName && <span className="block text-[11.5px] text-ink-3">{m.title}</span>}
                </span>
                <span className="text-[12.5px] leading-snug text-ink-2">{whatItDoes(m)}</span>
                {showWhere && (
                  <span className="text-[12px] leading-snug text-ink-3">
                    {where?.blocks.length ? where.blocks.join(" · ") : "Across the estate"}
                  </span>
                )}
                <span className="md:text-right">
                  <StatusPill status={statusFor(m.id)} title={own?.note} compact />
                </span>
              </button>
              {expanded && (
                <div className="space-y-3 border-t border-line bg-mist/30 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-2">
                  <p>{m.implementation}</p>
                  {where?.notes.length ? (
                    <div>
                      <p className="eyebrow">On this architecture</p>
                      <ul className="mt-1 space-y-1">
                        {where.notes.map((n) => <li key={n}>{n}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {guidance.map((item) => (
                    <div key={item.title} className="rounded-lg border border-line bg-paper px-3 py-2.5">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <div className="mt-1"><Prose blocks={item.body} size="sm" /></div>
                    </div>
                  ))}
                  <p className="text-[11.5px] text-ink-3">
                    Delivered by: {m.examples.slice(0, 5).join(" · ")}
                  </p>
                  <Link href={`/capabilities?capability=${m.id}`} className="inline-block text-[12px] font-semibold text-introduced hover:underline">
                    Full definition and every architecture it sits on →
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
