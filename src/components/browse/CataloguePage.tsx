"use client";

/**
 * One shape for the Controls and Mitigations pages: a header with control-group pills and a
 * search box, then a grouped list beside one full entry. Selection lives in the URL.
 */
import { useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { controlCategories } from "@/lib/data";
import { MasterDetail } from "./MasterDetail";

export const CONTROL_CATEGORY_ACCENT: Record<string, string> = {
  controlsData: "var(--band-data-rail)", controlsInfrastructure: "var(--band-infra-rail)",
  controlsModel: "var(--band-model-rail)", controlsApplication: "var(--band-app-rail)",
  controlsAssurance: "var(--mitigated)", controlsGovernance: "var(--ink-2)",
};

export function CataloguePage<T extends { id: string; title: string; category: string }>({ items, param, linked, eyebrow, title, lead, aside, placeholder, searchText, meta, detail }: {
  items: T[];
  /** The URL parameter that names the selected entry. */
  param: string;
  /** The entry a deep link asked for, already resolved by the caller. */
  linked: string | null;
  eyebrow: string;
  title: string;
  lead: string;
  aside?: ReactNode;
  placeholder: string;
  searchText: (item: T) => string;
  meta: (item: T) => ReactNode;
  detail: (item: T) => ReactNode;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [clicked, setClicked] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const shown = items.filter((x) => (!category || x.category === category) && searchText(x).toLowerCase().includes(q));
  const ids = shown.map((x) => x.id);
  const selected = clicked && ids.includes(clicked) ? clicked : linked && ids.includes(linked) ? linked : ids[0];
  useEffect(() => {
    if (typeof window === "undefined" || !selected) return;
    window.history.replaceState(null, "", `?${param}=${selected}`);
  }, [param, selected]);
  const groups = controlCategories
    .map((cat) => ({ id: cat.id, title: cat.title, accent: CONTROL_CATEGORY_ACCENT[cat.id], items: shown.filter((x) => x.category === cat.id) }))
    .filter((g) => g.items.length);
  const item = shown.find((x) => x.id === selected);
  return <>
    <PageHeader eyebrow={eyebrow} title={title} lead={lead} aside={aside}>
      <div className="mt-5 flex flex-wrap gap-1.5">
        <FilterPill active={!category} onClick={() => setCategory(null)}>All</FilterPill>
        {controlCategories.map((c) => <FilterPill key={c.id} active={category === c.id} accent={CONTROL_CATEGORY_ACCENT[c.id]} onClick={() => setCategory(category === c.id ? null : c.id)}>
          {c.title}<span className="ml-1.5 opacity-60">{items.filter((x) => x.category === c.id).length}</span>
        </FilterPill>)}
      </div>
      <input type="search" aria-label={`Search ${title}`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder}
        className="mt-4 w-full max-w-md rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
    </PageHeader>
    {!item ? <p className="mx-auto max-w-[1400px] px-6 py-8 text-sm text-ink-3">Nothing matches these filters.</p>
      : <MasterDetail groups={groups} selectedId={item.id} onSelect={setClicked} meta={meta}>{detail(item)}</MasterDetail>}
  </>;
}
