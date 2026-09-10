"use client";

/**
 * Option 3 — product cards. One card per product, and inside it the reference controls as a
 * checklist: the control, whether an admin can switch it on, the configure link, and (overlay)
 * the status pill. Reads like a runbook for each product; the same card, grouped by
 * architecture, is the vendor perspective.
 */
import { useState } from "react";
import Link from "next/link";

import { archetypeById, orgStatusFor, vendorById } from "@/lib/data";
import type { Tool } from "@/lib/types";
import { ControlRowDetail } from "./ControlRowDetail";
import { SURFACE_CLASS_META } from "./labels";
import { cellFor, type RowGroup } from "./model";
import { CoverageBadge, configureUrl, docsUrlFor } from "./shared";
import { OrgStatusPill } from "./OrgStatusPill";

export function CardsView({ tools, groups, overlay }: { tools: Tool[]; groups: RowGroup[]; overlay: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((t) => (
        <ProductCard key={t.id} tool={t} groups={groups} overlay={overlay} />
      ))}
    </div>
  );
}

export function ProductCard({ tool, groups, overlay }: { tool: Tool; groups: RowGroup[]; overlay: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = groups.flatMap((g) => g.rows);
  const settable = rows.filter((r) => cellFor(tool, r).coverage === "native").length;
  const enabled = overlay ? rows.filter((r) => cellFor(tool, r).status === "inPlace").length : 0;
  const arch = archetypeById.get(tool.architecture);
  return (
    <div className="flex flex-col rounded-xl border border-line bg-paper">
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <Link href={`/tooling?tool=${tool.id}`} className="text-[14px] font-semibold text-ink hover:underline">
            {tool.name}
          </Link>
          <span className="text-[11px] text-ink-3">
            {vendorById.get(tool.vendor)?.name} · {tool.surfaceClasses.map((c) => SURFACE_CLASS_META[c].short).join(" · ")}
          </span>
          {docsUrlFor(tool) && (
            <a href={docsUrlFor(tool)} target="_blank" rel="noreferrer" className="ml-auto text-[11px] font-semibold text-introduced hover:underline">
              vendor docs ↗
            </a>
          )}
        </div>
        <p className="mt-1 text-[11.5px] text-ink-2">
          <span className="font-semibold text-ink">{settable} of {rows.length}</span> controls admin-settable
          {overlay && (
            <>
              {" "}
              · <span className="font-semibold text-ink">{enabled}</span> enabled
            </>
          )}
          {arch && (
            <>
              {" "}
              · inherits from{" "}
              <Link href={`/reference?archetype=${arch.id}`} className="font-medium hover:underline">
                {arch.abbrev ?? arch.title}
              </Link>
            </>
          )}
        </p>
      </div>
      <ul className="divide-y divide-line">
        {groups.map((g) => (
          <li key={g.id}>
            <p className="bg-mist/60 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">{g.title}</p>
            <ul className="divide-y divide-line/70">
              {g.rows.map((row) => {
                const cell = cellFor(tool, row);
                const url = cell.parts.map((p) => configureUrl(p.control)).find(Boolean);
                const status = overlay ? orgStatusFor(tool.id, row.capabilities[0])?.status : undefined;
                const isOpen = open === row.id;
                return (
                  <li key={row.id}>
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <button type="button" onClick={() => setOpen(isOpen ? null : row.id)} className="min-w-0 flex-1 truncate text-left text-[12px] text-ink hover:underline" title={row.title ?? row.label}>
                        {row.label}
                      </button>
                      {status && <OrgStatusPill status={status} compact />}
                      <CoverageBadge coverage={cell.coverage} />
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" title="How to configure — the vendor's page" className="w-4 text-center text-[12px] font-bold text-introduced hover:underline">
                          ↗
                        </a>
                      ) : (
                        <span className="w-4" />
                      )}
                    </div>
                    {isOpen && (
                      <div className="border-t border-line bg-mist/20 px-4 py-3">
                        {row.capabilities.map((c) => (
                          <ControlRowDetail key={c} tool={tool} capabilityId={c} showTitle={row.capabilities.length > 1} />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
