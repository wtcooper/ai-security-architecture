"use client";

/**
 * A pattern's enterprise controls as one table, a band per NIST CSF category and a row per
 * control, each led by the number of its chip on the drawing. Opening a row lights that
 * chip; picking a chip on the drawing opens its row. The open row is the drawing's highlight,
 * so the two can never disagree. A row is kept to its number, name, one line and where it goes;
 * everything else is in the open row. With a cloud chosen, each row also names that cloud's own
 * options for the control, and the open row gives each one's value and why.
 */
import Link from "next/link";
import { Fragment } from "react";

import { StatusHeading, StatusPill } from "@/components/StatusPill";
import { capabilityName, guidanceByArchetype, isBaseline, riskCode, risksForMitigation, status as statusFile, statusFor } from "@/lib/data";
import type { Archetype, Mitigation } from "@/lib/types";
import { NativeOptions, OptionNames } from "@/components/cloud/CloudViews";
import { optionsFor, type CloudProduct } from "@/components/cloud/model";
import { placementsFor, type ControlGroup } from "./model";
import { controlHref } from "@/lib/routes";

/** The first sentence of the authored implementation scope, kept to a couple of lines: what the capability does. */
const whatItDoes = (m: Mitigation) => {
  const text = m.implementation.replace(/\s+/g, " ").trim();
  const end = text.search(/\.\s/);
  const sentence = end === -1 ? text : text.slice(0, end + 1);
  if (sentence.length <= 150) return sentence;
  const cut = sentence.slice(0, 150);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
};

const anyStatus = Object.values(statusFile).some((s) => s.status);
// The status column appears once the organisation has recorded any status; until then every row would read "Not set".
const GRID = anyStatus
  ? "md:grid-cols-[28px_minmax(0,1.1fr)_minmax(0,1.7fr)_minmax(0,0.9fr)_104px]"
  : "md:grid-cols-[28px_minmax(0,1.1fr)_minmax(0,1.8fr)_minmax(0,0.9fr)]";

export const BASELINE_HELP = "Needed by every AI deployment, whatever the pattern: set up once and reused.";

export function CapabilityTable({
  groups,
  archetype,
  open,
  onOpen,
  onShowDrawing,
  cloud = null,
}: {
  groups: ControlGroup[];
  archetype: Archetype;
  /** The cloud the pattern is shown as built on: its own options are listed on every control. */
  cloud?: CloudProduct | null;
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
        <span>Control</span>
        <span>What it does</span>
        <span>Where it goes</span>
        {anyStatus && <StatusHeading />}
      </div>
      {groups.map((group) => (
        <Fragment key={group.id}>
          <div id={`group-${group.id}`} className="border-b border-line bg-mist/30 px-4 py-1.5" title={group.blurb}>
            <p className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2">
              {group.title}
              <span className="ident text-[10px] font-normal tracking-normal text-ink-3" title={`NIST CSF 2.0 · ${group.function} · ${group.id}`}>
                {group.id}
              </span>
              {anyStatus && (
                <span className="font-normal normal-case tracking-normal text-ink-3">
                  {group.capabilities.filter((m) => statusFor(m.id) === "enabled").length} of {group.capabilities.length} enabled
                </span>
              )}
            </p>
          </div>
          <ul className="divide-y divide-line border-b border-line last:border-b-0">
            {group.capabilities.map((m) => {
          const expanded = open === m.id;
          const where = placementsFor(archetype.id, m.id);
          const items = guidance?.items.filter((i) => i.mitigations.includes(m.id)) ?? [];
          const reduces = risksForMitigation(m.id).filter((r) => pinnedRisks.has(r.id));
          const own = statusFile[m.id];
          const options = cloud ? optionsFor(cloud, m.id) : [];
          return (
            <li key={m.id} id={`control-${m.id}`} className="scroll-mt-24">
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
                <span className="col-start-2 text-[12.5px] leading-snug text-ink-2 md:col-start-auto">
                  {whatItDoes(m)}
                  {cloud && <OptionNames short={cloud.cloud.short} options={options} />}
                </span>
                <span className="col-start-2 text-[12px] leading-snug text-ink-3 md:col-start-auto">{where.blocks.join(" · ")}</span>
                {anyStatus && (
                  <span className="col-start-2 md:col-start-auto md:text-right">
                    <StatusPill status={statusFor(m.id)} title={own?.note} compact />
                  </span>
                )}
              </button>
              {expanded && (
                <div className="space-y-3 border-t border-line bg-mist/30 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-2 md:pl-[60px]">
                  <p>{m.implementation}</p>
                  {isBaseline(m.id) && <p className="text-[12px] text-ink-3" data-baseline>{BASELINE_HELP}</p>}
                  {where.notes.length ? (
                    <div>
                      <p className="eyebrow">On this pattern</p>
                      <ul className="mt-1 space-y-1">
                        {where.notes.map((n) => <li key={n}>{n}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {cloud && <NativeOptions cloud={cloud.cloud} options={options} />}
                  {items.length > 0 && (
                    <p className="text-[12px]">
                      <span className="font-semibold text-ink">Part of: </span>
                      {items.map((item) => item.title).join(" · ")}
                    </p>
                  )}
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
                    <Link href={controlHref(m.id)} className="text-[12px] font-semibold text-introduced hover:underline">
                      Full definition →
                    </Link>
                  </span>
                </div>
              )}
            </li>
          );
            })}
          </ul>
        </Fragment>
      ))}
    </div>
  );
}
