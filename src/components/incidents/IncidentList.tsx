"use client";

/**
 * The Incidents index: every incident, newest first, filed under one attack type and replayed
 * on one reference architecture. Two filters and a list, so it reads at a glance with fifty
 * incidents as well as with ten; each walk-through lives on the incident's own page.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/Panel";
import { archetypeById, archetypesInOrder, incidents, surfaces } from "@/lib/data";
import { categoryById, INCIDENT_CATEGORIES } from "@/lib/incident-categories";
import { formatMonth, incidentsNewestFirst } from "./model";

export function IncidentList() {
  const params = useSearchParams();
  const linkedType = params.get("type");
  const linkedArch = params.get("arch");
  const [type, setType] = useState<string | null>(linkedType && categoryById.has(linkedType) ? linkedType : null);
  const [arch, setArch] = useState<string | null>(linkedArch && archetypeById.has(linkedArch) ? linkedArch : null);

  // Filters stay shareable. replaceState rather than router.push keeps the GitHub Pages basePath.
  useEffect(() => {
    const query = new URLSearchParams();
    if (type) query.set("type", type);
    if (arch) query.set("arch", arch);
    const q = query.toString();
    window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
  }, [type, arch]);

  const all = incidentsNewestFirst();
  const byArch = arch ? all.filter((i) => i.archetype === arch) : all;
  const shown = type ? byArch.filter((i) => i.category === type) : byArch;
  // Counts follow the other filter, so a chip never promises incidents the list will not show.
  const typeCount = (id: string) => byArch.filter((i) => i.category === id).length;
  const archCount = (id: string) => (type ? all.filter((i) => i.category === type) : all).filter((i) => i.archetype === id).length;
  const archetypesWithIncidents = archetypesInOrder.filter((a) => incidents.some((i) => i.archetype === a.id));

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors ${
      active ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-ink-3 hover:text-ink"
    }`;

  return (
    <>
      <PageHeader
        eyebrow="Incidents"
        title="Real AI incidents, replayed"
        lead={`${incidents.length} incidents from 2025–26, each walked step by step across the reference architecture it happened on, ending at the capabilities that would have broken the chain.`}
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-7">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Attack type">
          <button type="button" onClick={() => setType(null)} aria-pressed={type === null} className={chip(type === null)}>
            All <span className="font-normal opacity-70">{byArch.length}</span>
          </button>
          {INCIDENT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.blurb}
              onClick={() => setType(type === c.id ? null : c.id)}
              aria-pressed={type === c.id}
              disabled={typeCount(c.id) === 0 && type !== c.id}
              className={`${chip(type === c.id)} disabled:opacity-40`}
            >
              {c.label} <span className="font-normal opacity-70">{typeCount(c.id)}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-w-0 max-w-full items-center gap-2 text-[12.5px] text-ink-3">
            Architecture
            <select
              value={arch ?? ""}
              onChange={(e) => setArch(e.target.value || null)}
              className="min-w-0 max-w-full flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-introduced sm:flex-none"
            >
              <option value="">All architectures</option>
              {surfaces.map((s) => {
                const list = archetypesWithIncidents.filter((a) => a.surface === s.id);
                return list.length ? (
                  <optgroup key={s.id} label={s.title}>
                    {list.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({archCount(a.id)})
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </label>
          {type && <p className="text-[12.5px] text-ink-3">{categoryById.get(type)?.blurb}</p>}
        </div>

        {shown.length ? (
          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
            {shown.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/incidents/${i.id}`}
                  className="grid grid-cols-1 gap-x-5 gap-y-1.5 px-5 py-4 transition-colors hover:bg-mist/60 sm:grid-cols-[84px_minmax(0,1fr)_190px]"
                >
                  <span className="ident pt-0.5 text-ink-3">{formatMonth(i.date)}</span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug text-ink">{i.title}</span>
                    <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-ink-2">{i.subtitle}</span>
                  </span>
                  <span className="flex flex-wrap content-start items-start gap-1.5 sm:flex-col sm:items-end sm:text-right">
                    <span className="rounded-full border border-line bg-mist px-2.5 py-[2px] text-[11.5px] font-semibold text-ink-2">
                      {categoryById.get(i.category)?.label}
                    </span>
                    <span className="text-[12px] leading-snug text-ink-3">{archetypeById.get(i.archetype)?.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
            No incident matches both filters.{" "}
            <button type="button" onClick={() => { setType(null); setArch(null); }} className="font-semibold text-introduced hover:underline">
              Clear them
            </button>
          </p>
        )}
      </div>
    </>
  );
}
