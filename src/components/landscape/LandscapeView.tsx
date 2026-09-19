"use client";

/**
 * One landscape view on the Reference architectures page: the framing's provenance line, the
 * legend, the drawing itself, and the selected capability's full record beneath it. The three
 * drawings share tiles, statuses and selection; only the arrangement differs.
 */
import { useState } from "react";

import { CapabilityDetail } from "@/components/capabilities/CapabilityDetail";
import { ORG_STATUSES, STATUS_META, STATUS_STYLE, type DisplayStatus } from "@/components/StatusPill";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { mitigationById } from "@/lib/data";
import type { LandscapeView as View } from "@/lib/types";
import { AssetFunctionMatrix } from "./AssetFunctionMatrix";
import { DomainPoster } from "./DomainPoster";
import { LayerStack } from "./LayerStack";
import { parents, tilesFor } from "./model";
import { AiDot } from "./Tile";

export function LandscapeView({ view, surface, aiOnly }: { view: View; surface: string | null; aiOnly: boolean }) {
  const overlay = useOrgOverlay();
  const [selected, setSelected] = useState<string | null>(null);
  const tiles = tilesFor(surface, overlay, aiOnly);
  const onSelect = (id: string) => setSelected(id === selected ? null : id);
  const props = { view, tiles, surface, aiOnly, overlay, selected, onSelect };
  const capability = selected ? mitigationById.get(selected) : undefined;
  return (
    <div className="mt-4">
      <Legend view={view} overlay={overlay} shown={tiles.length} aiOnly={aiOnly} />
      <div className="mt-3">
        {view.id === "matrix" ? <AssetFunctionMatrix {...props} /> : view.id === "layers" ? <LayerStack {...props} /> : <DomainPoster {...props} />}
      </div>
      <p className="mt-2 text-xs text-ink-3">
        Each MITRE parent has one home per view — an authored judgement, not the framework&rsquo;s. Its specialisations roll up into it, as on the Capabilities page. Framing after{" "}
        <a href={view.url} target="_blank" rel="noreferrer" className="font-semibold text-introduced hover:underline">{view.basis} ↗</a>
      </p>
      {capability && (
        <div className="mt-6 scroll-mt-20">
          <CapabilityDetail mitigation={capability} showOrg={overlay} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

function Legend({ view, overlay, shown, aiOnly }: { view: View; overlay: boolean; shown: number; aiOnly: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-[11px] text-ink-3">
      <span className="font-semibold text-ink-2">
        {shown === parents.length ? `${parents.length} MITRE parent capabilities` : `${shown} of ${parents.length} MITRE parent capabilities${aiOnly ? " are AI-specific" : " reach this surface"}`}
      </span>
      <span className="flex items-center gap-1.5"><AiDot kind="native" /> AI-native (MITRE ATLAS)</span>
      <span className="flex items-center gap-1.5"><AiDot kind="extended" /> foundational, extended for AI by a specialisation</span>
      <span>plain = foundational (MITRE D3FEND){aiOnly ? ", hidden — the domain's own architecture owns it" : ""}</span>
      {view.kind === "matrix" && (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-[2px] border border-line" style={{ backgroundImage: "repeating-linear-gradient(135deg, #e3e8ef 0 2px, transparent 2px 5px)" }} />
          no capability in the catalogue
        </span>
      )}
      {overlay ? (
        <>
          <span className="eyebrow ml-1">Org status</span>
          {([...ORG_STATUSES, "notAssessed"] as DisplayStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[2px] border" style={{ background: STATUS_STYLE[s].bg, borderColor: STATUS_STYLE[s].border, borderStyle: STATUS_STYLE[s].dashed ? "dashed" : "solid" }} />
              {STATUS_META[s].label}
            </span>
          ))}
          <span>· rolled up across surfaces and products; mixed reads as partial</span>
        </>
      ) : (
        <span>· switch on <span className="font-semibold text-ink-2">Show org data</span> to tint each tile with the organisation&rsquo;s status</span>
      )}
      <span>· hover for detail, click for the record</span>
    </div>
  );
}
