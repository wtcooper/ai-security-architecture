"use client";

/**
 * A pattern's enterprise controls as one table, a band per NIST CSF category and a row per
 * control, each led by the number of its chip on the drawing. Opening a row lights that
 * chip; picking a chip on the drawing opens its row. The open row is the drawing's highlight,
 * so the two can never disagree.
 *
 * A row leads with what to do, as one plain sentence, and why: written for whoever has to put
 * the control in place, not for a security architect. The control's catalogue name is the
 * reference beside it, with where it goes on the drawing. With a product chosen (a cloud or a
 * tool) the row also names that product's settings for the control, and the open row gives
 * each one's place, value and reason. The architect's note and the catalogue's definition are
 * in the open row, last.
 */
import Link from "next/link";
import { Fragment } from "react";

import { OrgControlList, OrgControlNames } from "@/components/OrgControls";
import { StatusHeading, StatusPill } from "@/components/StatusPill";
import { capabilityName, isBaseline, riskCode, risksForMitigation, status as statusFile, statusFor, type Product } from "@/lib/data";
import type { Archetype } from "@/lib/types";
import { NativeOptions, OptionNames } from "@/components/cloud/CloudViews";
import { optionsFor, productShort } from "@/components/cloud/model";
import { placementsFor, type ControlGroup } from "./model";
import { controlHref } from "@/lib/routes";

const anyStatus = Object.values(statusFile).some((s) => s.status);
// The status column appears once the organisation has recorded any status; until then every row would read "Not set".
const GRID = anyStatus ? "md:grid-cols-[28px_minmax(0,2.3fr)_minmax(0,1fr)_104px]" : "md:grid-cols-[28px_minmax(0,2.3fr)_minmax(0,1fr)]";

export const BASELINE_HELP = "Needed by every AI deployment, whatever the pattern: set up once and reused.";

export function CapabilityTable({
  groups,
  archetype,
  open,
  onOpen,
  onShowDrawing,
  product = null,
  products = product ? [product] : [],
}: {
  groups: ControlGroup[];
  archetype: Archetype;
  /** The cloud or tool the reader is enabling: its own settings are named on every control. */
  product?: Product | null;
  /** On a hosted pattern, both choices: the platform it runs on and the framework it is built with. */
  products?: Product[];
  /** The capability whose row is open, which is also the one lit on the drawing. */
  open: string | null;
  onOpen: (id: string | null) => void;
  /** Brings the drawing back into view; offered in an open row. */
  onShowDrawing?: () => void;
}) {
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  const pinnedRisks = new Set(archetype.risks);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className={`hidden gap-4 border-b border-line bg-mist/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${GRID}`}>
        <span aria-label="Pin" />
        <span>What to do</span>
        <span>Control · where it goes</span>
        {anyStatus && <StatusHeading />}
      </div>
      {groups.map((group) => (
        <Fragment key={group.id}>
          <div id={`group-${group.id}`} className="border-b border-line bg-mist/40 px-4 py-2" title={group.blurb}>
            <p className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="display text-[14px] font-bold text-ink">{group.plain}</span>
              <span className="text-[11px] text-ink-3" title={`NIST CSF 2.0 · ${group.function}`}>{group.title}</span>
              {anyStatus && (
                <span className="text-[11px] text-ink-3">
                  {group.capabilities.filter((m) => statusFor(m.id) === "enabled").length} of {group.capabilities.length} enabled
                </span>
              )}
            </p>
          </div>
          <ul className="divide-y divide-line border-b border-line last:border-b-0">
            {group.capabilities.map((m) => {
          const expanded = open === m.id;
          const where = placementsFor(archetype.id, m.id);
          const reduces = risksForMitigation(m.id).filter((r) => pinnedRisks.has(r.id));
          const own = statusFile[m.id];
          const named = products.map((p) => ({ product: p, options: optionsFor(p, m.id) }));
          // One instruction per place the control is pinned; most controls have one.
          const steps = where.steps;
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
                <span className="min-w-0 space-y-2" data-instruction>
                  {steps.map((step, i) => (
                    <span key={i} className="block">
                      {steps.length > 1 && <span className="mb-0.5 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">At {step.where.join(" → ")}</span>}
                      <span className="block text-[13.5px] font-semibold leading-snug text-ink" data-do>{step.do}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-2" data-why>{step.why}</span>
                    </span>
                  ))}
                  {named.map(({ product: p, options }) => (
                    <OptionNames key={p.id} short={productShort(p)} options={options} />
                  ))}
                </span>
                <span className="col-start-2 text-[12px] leading-snug md:col-start-auto">
                  <span className="block font-semibold text-ink-2" data-control-name>{capabilityName(m.id)}</span>
                  <OrgControlNames controlId={m.id} />
                  <span className="block text-ink-3">{where.blocks.join(" · ")}</span>
                </span>
                {anyStatus && (
                  <span className="col-start-2 md:col-start-auto md:text-right">
                    <StatusPill status={statusFor(m.id)} title={own?.note} compact />
                  </span>
                )}
              </button>
              {expanded && (
                <div className="space-y-3 border-t border-line bg-mist/30 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-2 md:pl-[60px]">
                  {named.map(({ product: p, options }) => (
                    <NativeOptions key={p.id} id={p.id} name={p.name} options={options} />
                  ))}
                  <OrgControlList controlId={m.id} />
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
                  {steps.some((step) => step.note) && (
                    <div data-detail>
                      <p className="eyebrow">In detail</p>
                      <ul className="mt-1 space-y-1.5">
                        {steps.filter((step) => step.note).map((step, i) => (
                          <li key={i}>
                            {steps.length > 1 && <span className="font-semibold text-ink">{step.where.join(" → ")}: </span>}
                            {step.note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-[12px] text-ink-3" data-definition>
                    <p>
                      <span className="font-semibold text-ink-2">The control: </span>
                      {m.implementation}
                    </p>
                    <p className="mt-1">Delivered by: {m.examples.slice(0, 5).join(" · ")}</p>
                    {isBaseline(m.id) && <p className="mt-1" data-baseline>{BASELINE_HELP}</p>}
                  </div>
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
