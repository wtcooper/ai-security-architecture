"use client";

/**
 * Option 1 — the control checklist. One row per reference control, read top to bottom as the
 * list of what this category needs; on each row, every product as a chip carrying the coverage
 * word, the configure link and (overlay) the status pill. Open a row for the vendor's steps
 * for every product at once — the "how do we turn this on everywhere" view.
 */
import { useState } from "react";
import Link from "next/link";

import { STATUS_STYLE } from "@/components/capabilities/status";
import { capabilityById, controlsForCapability } from "@/lib/data";
import type { Tool } from "@/lib/types";
import { ControlRowDetail } from "./ControlRowDetail";
import { COVERAGE_META, ORG_STATUS_LABEL } from "./labels";
import { cellFor, type Row, type RowGroup } from "./model";
import { configureUrl, EnterpriseModules } from "./shared";

export function ChecklistView({ tools, groups, overlay, archetypeId }: { tools: Tool[]; groups: RowGroup[]; overlay: boolean; archetypeId: string }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rounded-xl border border-line bg-paper">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="border-b border-line bg-mist/70 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">{group.title}</p>
          {group.rows.map((row) => (
            <ControlRow key={row.id} row={row} tools={tools} overlay={overlay} archetypeId={archetypeId} open={open === row.id} onToggle={() => setOpen(open === row.id ? null : row.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ControlRow({ row, tools, overlay, archetypeId, open, onToggle }: { row: Row; tools: Tool[]; overlay: boolean; archetypeId: string; open: boolean; onToggle: () => void }) {
  const cosai = row.capabilities.length === 1 ? controlsForCapability(row.capabilities[0]) : [];
  const settable = tools.filter((t) => cellFor(t, row).coverage === "native").length;
  return (
    <div className="border-b border-line last:border-b-0">
      <div className={`grid gap-x-4 gap-y-2 px-4 py-2.5 lg:grid-cols-[300px_minmax(0,1fr)] ${open ? "bg-mist/40" : ""}`}>
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 text-left">
          <span className="block text-[13px] font-semibold leading-tight text-ink hover:underline">{row.label}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">
            {cosai.length ? cosai.map((c) => c.title).join(" · ") : row.title}
            {overlay && row.aside && <span className="ident ml-1.5 text-ink-3">{row.aside}</span>}
          </span>
          <span className="mt-0.5 block text-[10.5px] text-ink-3">
            {settable} of {tools.length} products admin-settable
          </span>
        </button>
        <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="ident mr-0.5 w-[72px] shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">Admin</span>
          {tools.map((t) => {
            const cell = cellFor(t, row);
            const m = cell.coverage ? COVERAGE_META[cell.coverage] : null;
            const status = overlay ? cell.status : undefined;
            const url = cell.parts.map((p) => configureUrl(p.control)).find(Boolean);
            return (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-md border px-1.5 py-[3px] text-[11px]"
                style={m ? { background: m.bg, borderColor: m.border === "transparent" ? m.bg : m.border, color: m.text, borderStyle: m.dashed ? "dashed" : "solid" } : { borderColor: "var(--line)", color: "var(--ink-3)" }}
                title={`${t.name}: ${m ? m.long : "not assessed"}${m ? ` — ${m.blurb}` : ""}`}
              >
                <button type="button" onClick={onToggle} className="font-semibold hover:underline">
                  {t.name}
                </button>
                <span className="opacity-80">· {m ? m.label : "—"}</span>
                {status && (
                  <span className="rounded-full border px-1 text-[9.5px] font-semibold" style={{ borderColor: STATUS_STYLE[status].border, color: STATUS_STYLE[status].text, background: "var(--paper)" }}>
                    {ORG_STATUS_LABEL[status]}
                  </span>
                )}
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" title="How to configure — the vendor's page" className="font-bold opacity-70 hover:opacity-100">
                    ↗
                  </a>
                )}
              </span>
            );
          })}
        </div>
        {row.enforcement.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="ident mr-0.5 w-[72px] shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">Enterprise</span>
            <EnterpriseModules row={row} archetypeId={archetypeId} overlay={overlay} />
          </div>
        )}
        </div>
      </div>
      {open && (
        <div className="divide-y divide-line border-t border-line bg-mist/20 px-4">
          {tools.map((t) => (
            <div key={t.id} className="py-3">
              <p className="mb-1.5 text-[12.5px] font-semibold text-ink">
                <Link href={`/tooling?tool=${t.id}`} className="hover:underline">
                  {t.name}
                </Link>
              </p>
              {row.capabilities.map((c) => (
                <div key={c} className="mb-2">
                  <ControlRowDetail tool={t} capabilityId={c} showTitle={row.capabilities.length > 1} />
                </div>
              ))}
            </div>
          ))}
          {row.capabilities.length === 1 && capabilityById.get(row.capabilities[0]) && (
            <p className="py-2 text-[11.5px] text-ink-3">
              <Link href={`/capabilities?capability=${row.capabilities[0]}`} className="font-semibold text-introduced hover:underline">
                What this control class is, across every surface →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
