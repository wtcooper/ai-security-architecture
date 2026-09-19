"use client";

import { useSearchParams } from "next/navigation";
import { mitigations, mitigationById, mitigationAliases } from "@/lib/data";
import { CataloguePage } from "@/components/browse/CataloguePage";
import { MitigationDetail } from "./MitigationDetail";

/** Reference catalogue: the MITRE methods that support CoSAI controls and number the drawings. */
export function MitigationsBrowser() {
  const params = useSearchParams();
  // Links published when "capability" meant a MITRE method still resolve; retired ids explain themselves.
  const linked = params.get("mitigation") ?? params.get("capability");
  const replacements = linked ? mitigationAliases[linked] : undefined;
  const resolved = replacements?.[0] ?? (linked && mitigationById.has(linked) ? linked : null);
  return <CataloguePage items={mitigations} param="mitigation" linked={resolved}
    eyebrow={`${mitigations.length} mitigations · MITRE D3FEND + ATLAS`} title="Mitigations"
    lead="Defensive techniques from MITRE D3FEND and AI mitigations from MITRE ATLAS. They support CoSAI controls and are the numbered chips on every reference architecture. A mapping is a contribution, not proof a control is fulfilled."
    placeholder="Search by name, MITRE id or implementation…"
    searchText={(m) => `${m.title} ${m.id} ${m.origin.framework} ${m.implementation}`}
    meta={(m) => <span className="ident">{m.origin.framework.replace("MITRE ", "")} · {m.id}</span>}
    detail={(m) => <>
      {replacements && <p className="mb-3 text-xs text-ink-3">This older mitigation link maps to {replacements.length ? replacements.map((id) => mitigationById.get(id)?.title).join(" · ") : "a retired entry; its requirements remain in CoSAI controls"}.</p>}
      <MitigationDetail mitigation={m} showOrg={false} framed={false} />
    </>} />;
}
