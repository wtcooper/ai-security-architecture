"use client";

/**
 * Option 2 — Tool lens on the drawing. A product picked above the drawing recolours every
 * control chip by who covers it for that product; with org data on, by our status for it. The
 * Tools tab lists the same answers grouped, and selecting one lights its chip.
 */
import { useMemo, useState } from "react";

import { STATUS_META } from "@/components/StatusPill";
import type { Highlight } from "@/components/reference/FlowDiagram";
import type { ChipPaint } from "@/components/reference/flow-style";
import { ControlRowDetail } from "@/components/tooling/ControlRowDetail";
import { docsUrlFor } from "@/components/tooling/shared";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { orgSurfaceStatusFor, orgToolAvailableFor } from "@/lib/data";
import type { Archetype, Tool } from "@/lib/types";
import { controlOf, fullName, settingUrl, shortName, sitesFor, STATUS_FILL, VERDICT_META, VERDICT_ORDER, verdictFor, type Verdict } from "./model";
import {
  answerStatus,
  AvailableTag,
  ChipNumber,
  chipNumber,
  countBy,
  DrawingBar,
  StatusLegend,
  StatusTag,
  statusPaint,
  VerdictLegend,
  verdictPaint,
  vendorName,
} from "./parts";

export interface LensState {
  tool: Tool | null;
  setLens: (id: string | null) => void;
  paint: Map<string, ChipPaint> | null;
  /** Org data on and the product in use: chips carry our status rather than the verdict. */
  byStatus: boolean;
}

export function useLens(archetype: Archetype, tools: Tool[]): LensState {
  const overlay = useOrgOverlay();
  const [lensId, setLens] = useState<string | null>(tools[0]?.id ?? null);
  const [lastArch, setLastArch] = useState(archetype.id);
  if (lastArch !== archetype.id) {
    setLastArch(archetype.id);
    setLens(tools[0]?.id ?? null);
  }
  const tool = tools.find((t) => t.id === lensId) ?? null;
  const byStatus = overlay && !!tool && orgToolAvailableFor(tool.id);
  const paint = useMemo(() => {
    if (!tool) return overlay ? statusPaint(archetype) : null;
    return new Map(
      archetype.mitigations.map((capId): [string, ChipPaint] => {
        const v = verdictFor(archetype, tool, capId);
        const mech = controlOf(tool, capId)?.mechanism;
        const said = `${tool.name}: ${VERDICT_META[v].long}${mech ? ` — ${mech}` : ""}`;
        if (byStatus) {
          const s = answerStatus(archetype, tool, capId);
          return [capId, { ...STATUS_FILL[s], hint: `Our status: ${STATUS_META[s].label}\n${said}` }];
        }
        return [capId, { ...verdictPaint(v), hint: said }];
      }),
    );
  }, [archetype, tool, overlay, byStatus]);
  return { tool, setLens, paint, byStatus };
}

export function LensBar({ archetype, tools, lens }: { archetype: Archetype; tools: Tool[]; lens: LensState }) {
  const overlay = useOrgOverlay();
  const tool = lens.tool;
  const verdicts = tool ? countBy(archetype.mitigations.map((c) => verdictFor(archetype, tool, c))) : undefined;
  const legend = !tool ? (
    overlay ? (
      <StatusLegend lead="Chips show our status" counts={countBy(archetype.mitigations.map((c) => orgSurfaceStatusFor(c, archetype.surface)))} />
    ) : (
      <p className="text-[11.5px] text-ink-3">Reference controls. Pick a product to colour each chip by who covers it for that product.</p>
    )
  ) : lens.byStatus ? (
    <StatusLegend lead={`Our status for ${tool.name}`} counts={countBy(archetype.mitigations.map((c) => answerStatus(archetype, tool, c)))} />
  ) : (
    <div className="space-y-1">
      <VerdictLegend lead={`Who covers it · ${tool.name}`} counts={verdicts} />
      {overlay && <p className="text-[11.5px] text-ink-3">{tool.name} is not in use here, so there is no status to show — chips keep the who-covers-it colours.</p>}
    </div>
  );
  return (
    <DrawingBar legend={legend}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="eyebrow mr-1">View the drawing as</span>
        <LensButton active={!tool} onClick={() => lens.setLens(null)}>
          Reference
        </LensButton>
        {tools.map((t) => (
          <LensButton key={t.id} active={tool?.id === t.id} onClick={() => lens.setLens(t.id)}>
            {t.name}
          </LensButton>
        ))}
      </div>
    </DrawingBar>
  );
}

function LensButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-[12px] ${active ? "border-ink bg-ink font-semibold text-white" : "border-line-strong bg-paper text-ink-2 hover:border-ink hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

export function LensPanel({
  archetype,
  tools,
  lens,
  highlight,
  onHighlight,
}: {
  archetype: Archetype;
  tools: Tool[];
  lens: LensState;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
}) {
  const overlay = useOrgOverlay();
  const [open, setOpen] = useState<string | null>(null);
  const tool = lens.tool;

  const compare = (
    <div className="overflow-x-auto rounded-xl border border-line bg-paper">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
            <th className="px-3 py-2 font-semibold">Product</th>
            {VERDICT_ORDER.map((v) => (
              <th key={v} className="px-2 py-2 text-center font-semibold" style={{ color: VERDICT_META[v].color }}>
                {VERDICT_META[v].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tools.map((t) => {
            const c = countBy(archetype.mitigations.map((m) => verdictFor(archetype, t, m)));
            return (
              <tr key={t.id} className={`border-t border-line ${tool?.id === t.id ? "bg-mist" : ""}`}>
                <td className="px-3 py-1.5">
                  <button type="button" onClick={() => lens.setLens(t.id)} className="font-semibold text-ink hover:text-introduced hover:underline">
                    {t.name}
                  </button>
                  <span className="ml-1.5 text-[11px] text-ink-3">{vendorName(t)}</span>
                </td>
                {VERDICT_ORDER.map((v) => (
                  <td key={v} className="px-2 py-1.5 text-center text-ink-2">
                    {c[v] ?? <span className="text-line-strong">·</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (!tool) {
    return (
      <div className="space-y-3">
        <p className="text-[12.5px] text-ink-2">Pick a product above the drawing — or here — to put it on the drawing.</p>
        {compare}
      </div>
    );
  }

  const groups = VERDICT_ORDER.map((v) => ({ v, caps: archetype.mitigations.filter((c) => verdictFor(archetype, tool, c) === v) })).filter((g) => g.caps.length);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-paper px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{vendorName(tool)}</span>
            {tool.status && <span className="rounded-full border border-line-strong px-1.5 py-px font-mono text-[10px] font-semibold uppercase text-ink-2">{tool.status}</span>}
            {overlay && <AvailableTag tool={tool} />}
          </div>
          <h4 className="mt-1 text-[16px] font-bold text-ink">{tool.name} on this architecture</h4>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{typeof tool.summary[0] === "string" ? tool.summary[0] : ""}</p>
          {docsUrlFor(tool) && (
            <a href={docsUrlFor(tool)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11.5px] font-semibold text-introduced hover:underline">
              Vendor docs ↗
            </a>
          )}
        </div>
        {groups.map((g) => (
          <VerdictGroup
            key={g.v}
            verdict={g.v}
            caps={g.caps}
            archetype={archetype}
            tool={tool}
            byStatus={lens.byStatus}
            overlay={overlay}
            open={open}
            onOpen={(id) => {
              setOpen(open === id ? null : id);
              onHighlight(open === id ? null : { kind: "mitigation", id });
            }}
            lit={highlight?.kind === "mitigation" ? highlight.id : null}
          />
        ))}
      </div>
      <div>
        <p className="eyebrow mb-2">Compare products · who covers what</p>
        <CompareList archetype={archetype} tools={tools} current={tool.id} onPick={lens.setLens} />
      </div>
    </div>
  );
}

function CompareList({ archetype, tools, current, onPick }: { archetype: Archetype; tools: Tool[]; current: string; onPick: (id: string) => void }) {
  return (
    <ul className="space-y-1.5">
      {tools.map((t) => {
        const c = countBy(archetype.mitigations.map((m) => verdictFor(archetype, t, m)));
        const total = archetype.mitigations.length;
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onPick(t.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left ${t.id === current ? "border-ink bg-paper" : "border-line bg-paper hover:border-line-strong"}`}
            >
              <span className="text-[12.5px] font-semibold text-ink">{t.name}</span>
              <span className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full border border-line" aria-hidden>
                {VERDICT_ORDER.map((v) =>
                  c[v] ? <span key={v} style={{ width: `${(c[v]! / total) * 100}%`, background: verdictPaint(v).border, opacity: v === "na" ? 0.4 : 1 }} /> : null,
                )}
              </span>
              <span className="mt-1 block text-[10.5px] text-ink-3">
                {VERDICT_ORDER.filter((v) => c[v]).map((v) => `${c[v]} ${VERDICT_META[v].label.toLowerCase()}`).join(" · ")}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function VerdictGroup({
  verdict,
  caps,
  archetype,
  tool,
  byStatus,
  overlay,
  open,
  onOpen,
  lit,
}: {
  verdict: Verdict;
  caps: string[];
  archetype: Archetype;
  tool: Tool;
  byStatus: boolean;
  overlay: boolean;
  open: string | null;
  onOpen: (id: string) => void;
  lit: string | null;
}) {
  const meta = VERDICT_META[verdict];
  return (
    <div className="rounded-xl border border-line bg-paper">
      <div className="flex items-baseline gap-2 border-b border-line px-4 py-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
        <span className="text-[13px] font-semibold" style={{ color: meta.color }}>
          {meta.long}
        </span>
        <span className="text-[11.5px] text-ink-3">
          {caps.length} · {meta.blurb}
        </span>
      </div>
      <ul>
        {caps.map((capId) => {
          const control = controlOf(tool, capId);
          const url = settingUrl(control);
          const ours = [...new Set(sitesFor(archetype, capId).filter((s) => s.side === "enterprise").map((s) => s.title))];
          const status = answerStatus(archetype, tool, capId);
          return (
            <li key={capId} className={`border-b border-line last:border-b-0 ${lit === capId ? "bg-mist" : ""}`}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onOpen(capId)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(capId)}
                className="flex w-full cursor-pointer items-start gap-2.5 px-4 py-2.5 text-left hover:bg-mist"
              >
                <ChipNumber n={chipNumber(archetype, capId)} paint={byStatus ? STATUS_FILL[status] : verdictPaint(verdict)} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-ink">{shortName(capId)}</span>
                    {overlay && byStatus && <StatusTag status={status} />}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-2">
                    {control?.mechanism ?? (control ? "" : "No vendor record for this control yet.")}
                  </span>
                  {ours.length > 0 && (
                    <span className="mt-0.5 block text-[11px] text-ink-3">
                      <span className="font-semibold text-ink-2">Our side:</span> {ours.join(" · ")}
                    </span>
                  )}
                </span>
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-[11px] font-semibold text-introduced hover:underline">
                    setting ↗
                  </a>
                )}
              </div>
              {open === capId && (
                <div className="border-t border-line bg-mist/50 px-4 py-3">
                  <p className="eyebrow mb-2">{fullName(capId)}</p>
                  <ControlRowDetail tool={tool} mitigationId={capId} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
