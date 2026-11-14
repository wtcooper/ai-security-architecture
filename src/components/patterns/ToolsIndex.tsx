"use client";

/**
 * Every product and cloud in the registry on one page, for the reader who knows what they are
 * rolling out by name. A row says who makes it, which pattern it belongs to and how many of its
 * security settings are catalogued, and opens those settings on the pattern's Enable tab.
 */
import { useState } from "react";
import Link from "next/link";

import { AdoptionPill } from "@/components/enable/ProductSettings";
import { PageHeader } from "@/components/Panel";
import { adoptionFor, archetypeById, clouds, productStatus, toolsInOrder, vendorById } from "@/lib/data";
import { patternHref } from "@/lib/routes";
import { SURFACE_ORDER, SURFACE_SITUATION } from "./labels";

const anyAdoption = Object.values(productStatus).some((p) => p.status);

const GRID = "md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_84px_96px_92px]";

export function ToolsIndex() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = toolsInOrder
    .map((t) => ({ tool: t, vendor: vendorById.get(t.vendor)?.name ?? t.vendor, pattern: archetypeById.get(t.architecture)! }))
    .filter(({ tool, vendor, pattern }) => !q || `${tool.name} ${tool.family} ${vendor} ${pattern.title} ${(tool.variants ?? []).map((v) => v.name).join(" ")}`.toLowerCase().includes(q));
  const cloudRows = clouds.filter((c) => !q || `${c.name} ${c.short}`.toLowerCase().includes(q));

  return (
    <>
      <PageHeader
        eyebrow={`${toolsInOrder.length} tools · ${clouds.length} clouds`}
        title="Tools"
        lead="Every product and cloud with catalogued security settings. Open one for its settings on the pattern it belongs to: where each is set, the value to set it to, and the controls it delivers."
      />
      <div className="mx-auto w-full max-w-[1500px] px-6 py-7">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a product, vendor or pattern…"
          aria-label="Search tools"
          className="w-full max-w-xl rounded-lg border border-line-strong bg-paper px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
        />

        {SURFACE_ORDER.map((surface) => {
          const group = rows.filter((r) => r.pattern.surface === surface);
          if (!group.length) return null;
          return (
            <section key={surface} className="mt-7" aria-labelledby={`tools-${surface}`}>
              <h2 id={`tools-${surface}`} className="display text-[16px] font-bold text-ink">
                {SURFACE_SITUATION[surface]} <span className="ident ml-1 text-[11px] font-normal text-ink-3">{group.length}</span>
              </h2>
              <div className="mt-2 overflow-hidden rounded-xl border border-line bg-paper">
                <div className={`hidden gap-4 border-b border-line bg-mist/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${GRID}`}>
                  <span>Tool</span>
                  <span>Vendor</span>
                  <span>Pattern</span>
                  <span>Settings</span>
                  <span>Verified</span>
                  <span className="md:text-right">{anyAdoption ? "Status" : ""}</span>
                </div>
                <ul className="divide-y divide-line">
                  {group.map(({ tool, vendor, pattern }) => {
                    const adoption = adoptionFor(tool.id);
                    const checked = (tool.settings ?? []).map((s) => s.verified).sort().at(-1) ?? tool.asOf;
                    return (
                      <li key={tool.id}>
                        <Link href={patternHref(pattern.id, { tool: tool.id })} data-tool={tool.id} className={`grid grid-cols-1 gap-x-4 gap-y-0.5 px-4 py-2.5 transition-colors hover:bg-mist/50 ${GRID}`}>
                          <span className="text-[13.5px] font-semibold text-ink">{tool.name}</span>
                          <span className="text-[12.5px] text-ink-2">{vendor}</span>
                          <span className="text-[12.5px] text-ink-2">{pattern.title}</span>
                          <span className="ident text-[11.5px] text-ink-3">{(tool.settings ?? []).length || "—"}</span>
                          <span className="ident text-[11.5px] text-ink-3">{checked}</span>
                          <span className="md:text-right">{anyAdoption && <AdoptionPill status={adoption.status} title={adoption.note} />}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })}

        {cloudRows.length > 0 && (
          <section className="mt-7" aria-labelledby="tools-clouds">
            <h2 id="tools-clouds" className="display text-[16px] font-bold text-ink">
              Clouds <span className="ident ml-1 text-[11px] font-normal text-ink-3">{cloudRows.length}</span>
            </h2>
            <p className="mt-1 max-w-3xl text-[12.5px] leading-snug text-ink-3">
              Each pattern you build is mapped onto each cloud: which service plays each component, and the settings that secure it.
            </p>
            <ul className="mt-2 grid gap-3 lg:grid-cols-3">
              {cloudRows.map((c) => (
                <li key={c.id} className="rounded-xl border border-line bg-paper p-4" data-cloud={c.id}>
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="display text-[15px] font-semibold text-ink">{c.name}</span>
                    <span className="ident text-[11px] text-ink-3">{c.settings.length} settings</span>
                  </p>
                  <ul className="mt-2 space-y-1">
                    {c.implementations.map((impl) => (
                      <li key={impl.architecture}>
                        <Link href={patternHref(impl.architecture, { tool: c.id })} className="text-[13px] text-ink-2 hover:text-introduced hover:underline">
                          {archetypeById.get(impl.architecture)?.title} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!rows.length && !cloudRows.length && <p className="mt-7 text-[13.5px] text-ink-2">Nothing matches &ldquo;{query}&rdquo;.</p>}
      </div>
    </>
  );
}
