"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/Panel";
import { controls, controlById, controlCategories, mitigations, mitigationById, mitigationAliases, mitigationsForControl } from "@/lib/data";
import type { Control } from "@/lib/types";
import { ControlDetail } from "./ControlDetail";
import { MitigationDetail } from "@/components/mitigations/MitigationDetail";

export const CONTROL_CATEGORY_ACCENT: Record<string, string> = {
  controlsData: "var(--band-data-rail)", controlsInfrastructure: "var(--band-infra-rail)",
  controlsModel: "var(--band-model-rail)", controlsApplication: "var(--band-app-rail)",
  controlsAssurance: "var(--mitigated)", controlsGovernance: "var(--ink-2)",
};

export function ControlsMitigationsTable({ shown, selectedControl, selectedMitigation, onSelect }: {
  shown: Control[];
  selectedControl?: string | null;
  selectedMitigation?: string | null;
  onSelect: (kind: "control" | "mitigation", id: string) => void;
}) {
  return <div className="overflow-x-auto rounded-xl border border-line bg-paper">
    <table className="w-full min-w-[650px] border-collapse text-left" aria-label="CoSAI controls and supporting MITRE mitigations">
      <thead><tr className="bg-ink text-sm text-white">
        <th scope="col" className="w-[38%] px-4 py-3">CoSAI controls</th>
        <th scope="col" className="px-4 py-3">MITRE mitigations</th>
      </tr></thead>
      <tbody>{controlCategories.filter((cat) => shown.some((c) => c.category === cat.id)).map((cat) => <Fragment key={cat.id}>
        <tr><th colSpan={2} scope="colgroup" className="border-t border-line bg-mist px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-2">{cat.title}</th></tr>
        {shown.filter((c) => c.category === cat.id).map((control) => {
          const methods = mitigationsForControl(control.id);
          return <tr key={control.id} className="border-t border-line">
            <th scope="row" className="px-4 py-3 align-top text-sm font-medium">
              <button onClick={() => onSelect("control", control.id)} aria-pressed={selectedControl === control.id}
                className={`text-left hover:text-introduced hover:underline ${selectedControl === control.id ? "text-introduced underline" : "text-ink"}`}>{control.title}</button>
            </th>
            <td className="border-l border-line px-4 py-3">
              {methods.length ? <div className="flex flex-wrap gap-1.5">{methods.map((m) => <button key={m.id}
                onClick={() => onSelect("mitigation", m.id)} aria-pressed={selectedMitigation === m.id} title={`${m.title} (${m.id})`}
                className={`rounded-full border px-2.5 py-1 text-xs ${selectedMitigation === m.id ? "border-ink bg-ink text-white" : "border-line bg-mist text-ink-2 hover:border-ink"}`}>{m.title}</button>)}</div>
                : <span className="text-xs text-ink-3">No MITRE mitigation mapped</span>}
            </td>
          </tr>;
        })}
      </Fragment>)}</tbody>
    </table>
  </div>;
}

export function ControlsBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const category = controlCategories.find((c) => c.id === params.get("group"))?.id ?? "";
  const linked = params.get("mitigation") ?? params.get("capability");
  const replacements = linked ? mitigationAliases[linked] : undefined;
  const mitigation = mitigationById.get(replacements?.[0] ?? linked ?? "");
  const control = !mitigation ? controlById.get(params.get("control") ?? "") : undefined;
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (control || mitigation) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [control, mitigation]);
  const select = (kind?: "control" | "mitigation", id?: string, group = category) => {
    const next = new URLSearchParams();
    if (group) next.set("group", group);
    if (kind && id) next.set(kind, id);
    router.replace(`/controls${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const shown = controls.filter((c) => (!category || c.category === category) &&
    `${c.title} ${c.id} ${mitigationsForControl(c.id).map((m) => `${m.title} ${m.id}`).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <PageHeader eyebrow={`${controls.length} CoSAI controls · ${mitigations.length} MITRE mitigations`} title="Controls & Mitigations"
      lead="Explore the protections CoSAI calls for and the MITRE methods that support them. Select a control or mitigation for its scope, sources and technology capabilities.">
      <div className="mt-5 flex flex-wrap gap-3">
        <input type="search" aria-label="Search controls and mitigations" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search controls or mitigations…" className="w-full max-w-md rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
        <select aria-label="CoSAI control group" value={category} onChange={(e) => select(undefined, undefined, e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
          <option value="">All control groups</option>{controlCategories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
    </PageHeader>
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      {replacements && <p className="mb-3 text-xs text-ink-3">This older mitigation link maps to {replacements.length ? replacements.map((id) => mitigationById.get(id)?.title).join(" · ") : "a retired entry; its requirements remain in CoSAI controls"}.</p>}
      <ControlsMitigationsTable shown={shown} selectedControl={control?.id} selectedMitigation={mitigation?.id} onSelect={select} />
      {!shown.length && <p className="mt-4 text-sm text-ink-3">No controls or mitigations match these filters.</p>}
      <p className="mt-3 text-xs text-ink-3">Supporting relationships are many-to-many. Organization mappings and deployment status are managed on Technology capabilities.</p>
      <div ref={detailRef} className="mt-6 scroll-mt-20">
        {control && <ControlDetail controlId={control.id} onClose={() => select()} />}
        {mitigation && <MitigationDetail mitigation={mitigation} onClose={() => select()} showOrg={false} />}
      </div>
    </div>
  </>;
}
