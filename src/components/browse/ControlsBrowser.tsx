"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/Panel";
import { firstLine } from "@/components/Prose";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { controls, controlCategories, mitigations, mitigationById, mitigationAliases, mitigationsForControl } from "@/lib/data";
import { MasterDetail } from "./MasterDetail";
import { ControlDetail } from "./ControlDetail";
import { MitigationDetail } from "@/components/mitigations/MitigationDetail";

export const CONTROL_CATEGORY_ACCENT: Record<string, string> = {
  controlsData: "var(--band-data-rail)", controlsInfrastructure: "var(--band-infra-rail)",
  controlsModel: "var(--band-model-rail)", controlsApplication: "var(--band-app-rail)",
  controlsAssurance: "var(--mitigated)", controlsGovernance: "var(--ink-2)",
};

type Tab = "controls" | "mitigations";
const TABS: { id: Tab; label: string; count: number }[] = [
  { id: "controls", label: "CoSAI controls", count: controls.length },
  { id: "mitigations", label: "MITRE mitigations", count: mitigations.length },
];

/**
 * One page, two taxonomies: the controls CoSAI requires and the MITRE methods that support them,
 * each as a grouped list beside one full entry. The two are cross-linked from inside the detail.
 */
export function ControlsBrowser() {
  const params = useSearchParams();
  const pathname = usePathname();
  // Links published when "capability" meant a MITRE method still resolve; retired ids explain themselves.
  const linked = params.get("mitigation") ?? params.get("capability");
  const replacements = linked ? mitigationAliases[linked] : undefined;
  const linkedMitigation = replacements?.[0] ?? (linked && mitigationById.has(linked) ? linked : null);
  const [tab, setTab] = useState<Tab>(linkedMitigation || pathname.startsWith("/mitigations") ? "mitigations" : "controls");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [clicked, setClicked] = useState<string | null>(null);
  const q = query.trim().toLowerCase();

  const shownControls = controls.filter((c) => (!category || c.category === category) &&
    `${c.title} ${c.id} ${mitigationsForControl(c.id).map((m) => `${m.title} ${m.id}`).join(" ")}`.toLowerCase().includes(q));
  const shownMitigations = mitigations.filter((m) => (!category || m.category === category) &&
    `${m.title} ${m.id} ${m.origin.framework} ${m.implementation}`.toLowerCase().includes(q));
  const ids = (tab === "controls" ? shownControls : shownMitigations).map((x) => x.id);
  const linkedId = tab === "controls" ? params.get("control") : linkedMitigation;
  const selected = clicked && ids.includes(clicked) ? clicked : linkedId && ids.includes(linkedId) ? linkedId : ids[0];
  useEffect(() => {
    if (typeof window === "undefined" || !selected) return;
    window.history.replaceState(null, "", `?${tab === "controls" ? "control" : "mitigation"}=${selected}`);
  }, [tab, selected]);

  const switchTab = (next: Tab) => { setTab(next); setClicked(null); };
  const groups = <T extends { id: string; title: string; category: string }>(items: T[]) => controlCategories
    .map((cat) => ({ id: cat.id, title: cat.title, accent: CONTROL_CATEGORY_ACCENT[cat.id], items: items.filter((x) => x.category === cat.id) }))
    .filter((g) => g.items.length);
  const countIn = (cat: string) => (tab === "controls" ? controls : mitigations).filter((x) => x.category === cat).length;

  return <>
    <PageHeader eyebrow={`${controls.length} CoSAI controls · ${mitigations.length} MITRE mitigations`} title="Controls & Mitigations"
      lead="CoSAI names the protections an AI deployment needs; MITRE D3FEND and ATLAS name the defensive methods that support them. A mapping is a contribution, not proof a control is fulfilled.">
      <div role="tablist" aria-label="Taxonomy" className="mt-5 flex gap-1 rounded-lg border border-line bg-paper p-1 w-fit">
        {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => switchTab(t.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${tab === t.id ? "bg-ink text-white" : "text-ink-2 hover:bg-mist"}`}>
          {t.label} <span className={`ml-1 font-normal ${tab === t.id ? "text-white/70" : "text-ink-3"}`}>{t.count}</span>
        </button>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <FilterPill active={!category} onClick={() => setCategory(null)}>All</FilterPill>
        {controlCategories.map((c) => <FilterPill key={c.id} active={category === c.id} accent={CONTROL_CATEGORY_ACCENT[c.id]} onClick={() => setCategory(category === c.id ? null : c.id)}>
          {c.title}<span className="ml-1.5 opacity-60">{countIn(c.id)}</span>
        </FilterPill>)}
      </div>
      <input type="search" aria-label={`Search ${tab}`} value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder={tab === "controls" ? "Search controls or the mitigations that support them…" : "Search mitigations by name, MITRE id or implementation…"}
        className="mt-4 w-full max-w-md rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
      {replacements && <p className="mt-3 text-xs text-ink-3">This older mitigation link maps to {replacements.length ? replacements.map((id) => mitigationById.get(id)?.title).join(" · ") : "a retired entry; its requirements remain in CoSAI controls"}.</p>}
    </PageHeader>
    {!selected ? <p className="mx-auto max-w-[1400px] px-6 py-8 text-sm text-ink-3">No {tab} match these filters.</p>
      : tab === "controls" ? (
        <MasterDetail groups={groups(shownControls)} selectedId={selected} onSelect={setClicked} meta={(c) => firstLine(c.description, 80)}>
          <ControlDetail controlId={selected} framed={false} />
        </MasterDetail>
      ) : (
        <MasterDetail groups={groups(shownMitigations)} selectedId={selected} onSelect={setClicked}
          meta={(m) => <span className="ident">{m.origin.framework.replace("MITRE ", "")} · {m.id}</span>}>
          <MitigationDetail mitigation={mitigationById.get(selected)!} showOrg={false} framed={false} />
        </MasterDetail>
      )}
  </>;
}
