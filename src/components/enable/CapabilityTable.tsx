"use client";

/**
 * One layer's capabilities as rows, each led by the number of its chip on the drawing. Opening
 * a row lights that chip; picking a chip on the drawing opens its row. The open row is the
 * drawing's highlight, so the two can never disagree.
 */
import Link from "next/link";

import { Prose } from "@/components/Prose";
import { StatusHeading, StatusPill } from "@/components/StatusPill";
import { capabilityName, guidanceByArchetype, riskCode, risksForMitigation, status as statusFile, statusFor } from "@/lib/data";
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

const GRID = "md:grid-cols-[28px_minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)_112px]";

export function CapabilityTable({
  capabilities,
  archetype,
  open,
  onOpen,
  onShowDrawing,
}: {
  capabilities: Mitigation[];
  archetype: Archetype;
  /** The capability whose row is open, which is also the one lit on the drawing. */
  open: string | null;
  onOpen: (id: string | null) => void;
  /** Brings the drawing back into view; offered in an open row. */
  onShowDrawing?: () => void;
}) {
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  const pinnedRisks = new Set(archetype.risks);
  const guidance = guidanceByArchetype.get(archetype.id);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className={`hidden gap-4 border-b border-line bg-mist/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${GRID}`}>
        <span aria-label="Pin" />
        <span>Capability</span>
        <span>What it does</span>
        <span>Where it goes</span>
        <StatusHeading />
      </div>
      <ul className="divide-y divide-line">
        {capabilities.map((m) => {
          const expanded = open === m.id;
          const where = placementsFor(archetype.id, m.id);
          const items = guidance?.items.filter((i) => i.mitigations.includes(m.id)) ?? [];
          const reduces = risksForMitigation(m.id).filter((r) => pinnedRisks.has(r.id));
          const own = statusFile[m.id];
          return (
            <li key={m.id} id={`capability-${m.id}`} className="scroll-mt-24">
              <button
                type="button"
                onClick={() => onOpen(expanded ? null : m.id)}
                aria-expanded={expanded}
                className={`grid w-full grid-cols-[28px_minmax(0,1fr)] gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-mist/50 ${expanded ? "bg-mist/50" : ""} ${GRID}`}
              >
                <span
                  className={`flex h-[21px] w-[21px] items-center justify-center rounded-full border text-[10.5px] font-bold ${expanded ? "border-chip bg-chip text-white" : "border-chip bg-chip-soft text-chip"}`}
                  title="Its chip on the drawing"
                >
                  {number.get(m.id)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold leading-snug text-ink">{capabilityName(m.id)}</span>
                  {own?.displayName && <span className="block text-[11.5px] text-ink-3">{m.title}</span>}
                </span>
                <span className="col-start-2 text-[12.5px] leading-snug text-ink-2 md:col-start-auto">{whatItDoes(m)}</span>
                <span className="col-start-2 text-[12px] leading-snug text-ink-3 md:col-start-auto">{where.blocks.join(" · ")}</span>
                <span className="col-start-2 md:col-start-auto md:text-right">
                  <StatusPill status={statusFor(m.id)} title={own?.note} compact />
                </span>
              </button>
              {expanded && (
                <div className="space-y-3 border-t border-line bg-mist/30 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-2 md:pl-[60px]">
                  <p>{m.implementation}</p>
                  {where.notes.length ? (
                    <div>
                      <p className="eyebrow">On this architecture</p>
                      <ul className="mt-1 space-y-1">
                        {where.notes.map((n) => <li key={n}>{n}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {items.map((item) => (
                    <div key={item.title} className="rounded-lg border border-line bg-paper px-3 py-2.5">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <div className="mt-1"><Prose blocks={item.body} size="sm" /></div>
                    </div>
                  ))}
                  {reduces.length > 0 && (
                    <p className="text-[12px]">
                      <span className="font-semibold text-ink">Reduces here: </span>
                      {reduces.map((r, i) => (
                        <span key={r.id}>
                          {i > 0 && " · "}
                          <span className="ident mr-1 text-[10px] font-bold text-ink-3">{riskCode(r.id)}</span>
                          {r.title}
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="text-[11.5px] text-ink-3">
                    Delivered by: {m.examples.slice(0, 5).join(" · ")}
                  </p>
                  <span className="flex flex-wrap gap-x-4">
                    {onShowDrawing && (
                      <button type="button" onClick={onShowDrawing} className="text-[12px] font-semibold text-introduced hover:underline">
                        ↑ See it on the drawing
                      </button>
                    )}
                    <Link href={`/capabilities?capability=${m.id}`} className="text-[12px] font-semibold text-introduced hover:underline">
                      Full definition →
                    </Link>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
