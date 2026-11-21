"use client";

/**
 * A pattern's enterprise controls as one table, a band per NIST CSF category and a row per
 * control, each led by the number of its chip on the drawing. Opening a row lights that chip;
 * picking a chip on the drawing opens its row. The open row is the drawing's highlight, so the
 * two can never disagree.
 *
 * A row is one line of reference: the control, your organisation's own controls that deliver
 * it, where it goes on the drawing, the chosen product's settings for it, and its status once
 * the organisation records one. The band above a group carries the one sentence that says what
 * the group is for. The open row holds only what it takes to put the control in place: what to
 * do and why, each setting with the value to set, your own controls, and the way to the drawing
 * and the full definition.
 */
import Link from "next/link";
import { Fragment } from "react";

import { OrgControlList, OrgControlNames } from "@/components/OrgControls";
import { StatusHeading, StatusPill } from "@/components/StatusPill";
import { controlName, isBaseline, status as statusFile, statusFor, type Product } from "@/lib/data";
import type { Archetype, ProductSetting } from "@/lib/types";
import { NativeOptions } from "@/components/cloud/CloudViews";
import { optionsFor, productShort } from "@/components/cloud/model";
import { placementsFor, type ControlGroup } from "./model";
import { controlHref } from "@/lib/routes";

/** True once the organisation has recorded a status for any control (data/org/controls.yaml). */
export const anyControlStatus = Object.values(statusFile).some((s) => s.status);

export const BASELINE_HELP = "Needed by every AI deployment, whatever the pattern: set up once and reused.";

/** A product's settings for one control, in a few words: up to two names, then how many more. */
function SettingNames({ short, options }: { short: string; options: ProductSetting[] }) {
  if (!options.length) return null;
  const shown = options.slice(0, 2).map((s) => s.name);
  const more = options.length - shown.length;
  return (
    <span className="block truncate" data-option-names title={options.map((s) => s.name).join(" · ")}>
      <span className="font-semibold text-ink-2">{short}: </span>
      {shown.join(" · ")}
      {more > 0 && <span className="text-ink-3"> +{more}</span>}
    </span>
  );
}

const GRIDS = {
  plain: "md:grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1fr)]",
  status: "md:grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1fr)_96px]",
  settings: "md:grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)]",
  both: "md:grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_96px]",
} as const;

export function ControlTable({
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
  /** The control whose row is open, which is also the one lit on the drawing. */
  open: string | null;
  onOpen: (id: string | null) => void;
  /** Brings the drawing back into view; offered in an open row. */
  onShowDrawing?: () => void;
}) {
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  const withSettings = products.length > 0;
  const GRID = GRIDS[withSettings ? (anyControlStatus ? "both" : "settings") : anyControlStatus ? "status" : "plain"];
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper" data-control-table="names">
      <div className={`hidden gap-4 border-b border-line bg-mist/60 py-2 pl-8 pr-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${GRID}`}>
        <span aria-label="Chip on the drawing" />
        <span>Control</span>
        <span>Where it goes</span>
        {withSettings && <span>Settings</span>}
        {anyControlStatus && <StatusHeading className="md:justify-end" />}
      </div>
      {groups.map((group) => (
        <Fragment key={group.id}>
          <div id={`group-${group.id}`} className="border-b border-line bg-mist/40 px-4 py-2">
            <p className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="display text-[14px] font-bold text-ink">{group.plain}</span>
              <span className="text-[11px] text-ink-3" title={`NIST CSF 2.0 · ${group.function}`}>
                {group.title}
              </span>
              {anyControlStatus && (
                <span className="text-[11px] text-ink-3">
                  {group.controls.filter((m) => statusFor(m.id) === "enabled").length} of {group.controls.length} enabled
                </span>
              )}
            </p>
            <p className="mt-0.5 max-w-4xl text-[12px] leading-snug text-ink-2" data-group-blurb>
              {group.blurb}
            </p>
          </div>
          <ul className="divide-y divide-line border-b border-line last:border-b-0">
            {group.controls.map((m) => {
              const expanded = open === m.id;
              const steps = placementsFor(archetype.id, m.id).steps;
              const where = placementsFor(archetype.id, m.id).blocks;
              const own = statusFile[m.id];
              const named = products.map((p) => ({ product: p, options: optionsFor(p, m.id) }));
              const none = named.length > 0 && named.every(({ options }) => !options.length);
              return (
                <li key={m.id} id={`control-${m.id}`} className="scroll-mt-24">
                  <button
                    type="button"
                    onClick={() => onOpen(expanded ? null : m.id)}
                    aria-expanded={expanded}
                    className={`grid w-full grid-cols-[28px_minmax(0,1fr)] items-start gap-x-4 gap-y-0.5 py-2.5 pl-8 pr-4 text-left transition-colors hover:bg-mist/50 ${expanded ? "bg-mist/50" : ""} ${GRID}`}
                  >
                    <span
                      className={`flex h-[21px] w-[21px] items-center justify-center rounded-full border text-[10.5px] font-bold ${expanded ? "border-chip bg-chip text-white" : "border-chip bg-chip-soft text-chip"}`}
                      title="Its chip on the drawing"
                    >
                      {number.get(m.id)}
                    </span>
                    <span className="min-w-0 text-[13px] leading-snug" data-instruction>
                      <span className="block font-semibold text-ink" data-control-name>
                        {controlName(m.id)}
                        {isBaseline(m.id) && (
                          <span className="ml-2 inline-block rounded border border-line bg-mist px-1.5 py-px align-[1px] text-[10px] font-semibold text-ink-3" title={BASELINE_HELP} data-baseline>
                            Every deployment
                          </span>
                        )}
                      </span>
                      <OrgControlNames controlId={m.id} className="text-[11.5px]" />
                    </span>
                    <span className="col-start-2 text-[12px] leading-snug text-ink-3 md:col-start-auto">{where.join(" · ")}</span>
                    {withSettings && (
                      <span className="col-start-2 min-w-0 space-y-1 text-[12px] leading-snug text-ink md:col-start-auto">
                        {named.map(({ product: p, options }) => (
                          <SettingNames key={p.id} short={productShort(p)} options={options} />
                        ))}
                        {none && <span className="text-ink-3">No setting: {named.map(({ product: p }) => productShort(p)).join(" or ")} leaves it to you</span>}
                      </span>
                    )}
                    {anyControlStatus && (
                      <span className="col-start-2 md:col-start-auto md:text-right">
                        <StatusPill status={statusFor(m.id)} title={own?.note} compact />
                      </span>
                    )}
                  </button>
                  {expanded && (
                    <div className="space-y-3 border-t border-line bg-mist/30 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-2 md:pl-[76px]">
                      <ul className="space-y-1.5" data-what-to-do>
                        {steps.map((step, i) => (
                          <li key={i}>
                            {steps.length > 1 && <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">At {step.where.join(" → ")}:</span>}
                            <span className="font-semibold text-ink" data-do>
                              {step.do}
                            </span>{" "}
                            <span data-why>{step.why}</span>
                          </li>
                        ))}
                      </ul>
                      {named.map(({ product: p, options }) => (
                        <NativeOptions key={p.id} id={p.id} name={p.name} options={options} />
                      ))}
                      <OrgControlList controlId={m.id} />
                      <span className="flex flex-wrap gap-x-4" data-definition>
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
