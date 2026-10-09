"use client";

/** Experimental: small pieces the five mockups share — the org switch above the drawing, legends, words. */
import type { ReactNode } from "react";

import { STATUS_META, STATUS_STYLE } from "@/components/StatusPill";
import { setOrgOverlay, useOrgOverlay } from "@/components/tooling/overlay";
import { org, orgSurfaceStatusFor, orgToolAvailableFor, vendorById } from "@/lib/data";
import type { ChipPaint } from "@/components/reference/flow-style";
import type { Archetype, DisplayStatus, Tool } from "@/lib/types";
import {
  enterpriseStatus,
  STATUS_FILL,
  toolStatus,
  VERDICT_META,
  verdictFor,
  type Verdict,
} from "./model";

/** The org switch, moved from the page header to directly above the drawing. */
export function OrgSwitch() {
  const on = useOrgOverlay();
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[12px] text-ink-2">
      <span
        role="switch"
        aria-checked={on}
        tabIndex={0}
        onClick={() => setOrgOverlay(!on)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setOrgOverlay(!on);
          }
        }}
        className={`relative h-[18px] w-[32px] rounded-full border transition-colors ${on ? "border-ink bg-ink" : "border-line-strong bg-mist"}`}
      >
        <span className={`absolute top-[2px] h-[12px] w-[12px] rounded-full transition-all ${on ? "left-[16px] bg-white" : "left-[2px] bg-ink-3"}`} />
      </span>
      <span className="font-semibold text-ink">Show org data</span>
      {org.example && <span className="rounded-full border border-line px-1.5 py-px text-[10.5px] text-ink-3">example org</span>}
    </label>
  );
}

/** The bar directly above the drawing: the switch on the left, whatever the mockup needs on the right. */
export function DrawingBar({ children, legend }: { children?: ReactNode; legend?: ReactNode }) {
  return (
    <div className="mb-2 rounded-xl border border-line bg-paper px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <OrgSwitch />
        {children}
      </div>
      {legend && <div className="mt-2 border-t border-line pt-2">{legend}</div>}
    </div>
  );
}

const STATUS_ORDER: DisplayStatus[] = ["enabled", "inProgress", "gap", "notAssessed"];

export function Swatch({ paint, label, count }: { paint: { bg: string; border: string; text: string; dashed?: boolean }; label: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-2">
      <span
        className="inline-block h-3 w-3 rounded-full border-[1.5px]"
        style={{ background: paint.bg, borderColor: paint.border, borderStyle: paint.dashed ? "dashed" : "solid" }}
      />
      {label}
      {count !== undefined && <span className="text-ink-3">{count}</span>}
    </span>
  );
}

export function StatusLegend({ counts, lead }: { counts?: Partial<Record<DisplayStatus, number>>; lead?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {lead && <span className="eyebrow">{lead}</span>}
      {STATUS_ORDER.map((s) => (
        <Swatch key={s} paint={STATUS_FILL[s]} label={STATUS_META[s].label} count={counts?.[s]} />
      ))}
    </div>
  );
}

export function VerdictLegend({ counts, lead, only }: { counts?: Partial<Record<Verdict, number>>; lead?: string; only?: Verdict[] }) {
  const list = (only ?? (Object.keys(VERDICT_META) as Verdict[])).filter((v) => !counts || counts[v]);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {lead && <span className="eyebrow">{lead}</span>}
      {list.map((v) => (
        <span key={v} title={VERDICT_META[v].blurb}>
          <Swatch paint={verdictPaint(v)} label={VERDICT_META[v].label} count={counts?.[v]} />
        </span>
      ))}
    </div>
  );
}

export const verdictPaint = (v: Verdict) => {
  const c = VERDICT_META[v].color;
  return v === "uncovered" || v === "unverified" || v === "na"
    ? { bg: "#ffffff", border: c, text: c, dashed: true }
    : { bg: c, border: c, text: "#ffffff" };
};

/** The verdict as a coloured word — the core answer, shown with or without org data. */
export function VerdictWord({ verdict, className = "" }: { verdict: Verdict; className?: string }) {
  return (
    <span title={VERDICT_META[verdict].blurb} className={`font-semibold ${className}`} style={{ color: VERDICT_META[verdict].color }}>
      {VERDICT_META[verdict].label}
    </span>
  );
}

export function StatusTag({ status, compact = true }: { status: DisplayStatus; compact?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      title={STATUS_META[status].blurb}
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-semibold ${compact ? "px-1.5 py-px text-[10.5px]" : "px-2 py-[2px] text-[11.5px]"}`}
      style={{ background: s.bg, borderColor: s.border, color: s.text, borderStyle: s.dashed ? "dashed" : "solid" }}
    >
      {STATUS_META[status].label}
    </span>
  );
}

export function AvailableTag({ tool }: { tool: Tool }) {
  const yes = orgToolAvailableFor(tool.id);
  return (
    <span
      title={yes ? "People in the organisation may use this product." : "The organisation does not provide this product."}
      className="inline-flex items-center whitespace-nowrap rounded-full border px-1.5 py-px text-[10.5px] font-semibold"
      style={yes ? { background: "#e8f6ef", borderColor: "#a7dcc4", color: "#06845a" } : { background: "#f7f8fa", borderColor: "#dfe4ec", color: "#5b6675" }}
    >
      {yes ? "We run it" : "Not in use"}
    </span>
  );
}

export const vendorName = (tool: Tool) => vendorById.get(tool.vendor)?.name ?? tool.vendor;

/** The capability's number on the drawing, so every list ties back to a chip. */
export const chipNumber = (arch: Archetype, capId: string) => arch.mitigations.indexOf(capId) + 1;

export function ChipNumber({ n, paint }: { n: number; paint?: { bg: string; border: string; text: string; dashed?: boolean } }) {
  const p = paint ?? { bg: "#ffffff", border: "#4a5fd0", text: "#4a5fd0" };
  return (
    <span
      className="inline-flex h-[18px] font-mono min-w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[10px] font-bold"
      style={{ background: p.bg, borderColor: p.border, color: p.text, borderStyle: p.dashed ? "dashed" : "solid" }}
    >
      {n}
    </span>
  );
}

/**
 * The status that answers "do we have this?" for one product: our enterprise record where our
 * layer is what covers it, the product's own record otherwise.
 */
export function answerStatus(arch: Archetype, tool: Tool, capId: string): DisplayStatus {
  const v = verdictFor(arch, tool, capId);
  if (v === "enterprise") return enterpriseStatus(capId, arch.surface).status;
  return toolStatus(tool, capId)?.status ?? "notAssessed";
}

/** Chip fills for the drawing with org data on: the architecture's rolled-up status, saturated. */
export function statusPaint(arch: Archetype): Map<string, ChipPaint> {
  return new Map(
    arch.mitigations.map((id) => {
      const s = orgSurfaceStatusFor(id, arch.surface);
      return [id, { ...STATUS_FILL[s], hint: `Our status: ${STATUS_META[s].label}` }];
    }),
  );
}

export function countBy<T extends string>(values: T[]): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}
