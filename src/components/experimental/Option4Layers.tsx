"use client";

/**
 * Option 4 — Defense layers. The architecture's controls grouped into seven layers a security
 * team already thinks in. Our enterprise column fills once for every product of this type; each
 * product column shows only what that product adds. One encoding throughout: the left bar of a
 * pill says who covers it, the fill (with org data on) says whether we have it.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { STATUS_STYLE } from "@/components/StatusPill";
import { CapabilityDetail } from "@/components/capabilities/CapabilityDetail";
import type { Highlight } from "@/components/reference/FlowDiagram";
import { ControlRowDetail } from "@/components/tooling/ControlRowDetail";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { mitigationById, orgSurfaceStatusFor, orgToolAvailableFor } from "@/lib/data";
import type { Archetype, DisplayStatus, Tool } from "@/lib/types";
import { enterpriseStatus, fullName, layersFor, shortName, sitesFor, toolStatus, VERDICT_META, verdictFor, type Verdict } from "./model";
import { AvailableTag, countBy, DrawingBar, StatusLegend, statusPaint, VerdictLegend, vendorName } from "./parts";

export function useLayersPaint(archetype: Archetype) {
  const overlay = useOrgOverlay();
  return useMemo(() => (overlay ? statusPaint(archetype) : null), [overlay, archetype]);
}

export function LayersBar({ archetype }: { archetype: Archetype }) {
  const overlay = useOrgOverlay();
  return (
    <DrawingBar
      legend={
        overlay ? (
          <StatusLegend lead="Chips show our status" counts={countBy(archetype.mitigations.map((c) => orgSurfaceStatusFor(c, archetype.surface)))} />
        ) : (
          <p className="text-[11.5px] text-ink-3">Chips show the reference controls. Switch org data on to colour them by our status.</p>
        )
      }
    />
  );
}

type Pick = { capId: string; toolId: string | null };

export function LayersPanel({ archetype, tools, onHighlight }: { archetype: Archetype; tools: Tool[]; onHighlight: (h: Highlight | null) => void }) {
  const overlay = useOrgOverlay();
  const layers = layersFor(archetype);
  const [picked, setPicked] = useState<Pick | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (picked) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [picked]);
  const pick = (p: Pick) => {
    const same = picked?.capId === p.capId && picked.toolId === p.toolId;
    setPicked(same ? null : p);
    onHighlight(same ? null : { kind: "mitigation", id: p.capId });
  };
  const productVerdicts = countBy(tools.flatMap((t) => archetype.mitigations.map((c) => verdictFor(archetype, t, c)).filter((v) => v !== "enterprise" && v !== "na")));
  const pickedTool = tools.find((t) => t.id === picked?.toolId);
  const cols = `160px minmax(250px,320px) repeat(${tools.length}, minmax(220px,1fr))`;

  return (
    <div className="space-y-3">
      <p className="max-w-4xl text-[12.5px] leading-snug text-ink-2">
        Read across a layer: what our enterprise layer provides once for every product, then what each product adds on top.
        A product column only lists controls the product itself has a part in.
      </p>
      <div className="space-y-1.5 rounded-xl border border-line bg-paper px-3 py-2">
        <VerdictLegend lead="Left bar · who covers it" counts={productVerdicts} />
        {overlay && <StatusLegend lead="Fill · our status" />}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <div className="grid text-[12px]" style={{ gridTemplateColumns: cols }}>
          <div className="sticky left-0 z-10 border-b border-r border-line bg-mist px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">Layer</div>
          <div className="border-b border-r border-line bg-[#eef1f6] px-3 py-2.5">
            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink">Our enterprise layer</span>
            <span className="block text-[11px] text-ink-3">Once, for every product of this type</span>
          </div>
          {tools.map((t) => (
            <div key={t.id} className="border-b border-l border-line px-3 py-2.5">
              <span className="block text-[10.5px] text-ink-3">{vendorName(t)}</span>
              <span className="block text-[12.5px] font-semibold text-ink">{t.name}</span>
              {overlay && (
                <span className="mt-1 block">
                  <AvailableTag tool={t} />
                </span>
              )}
            </div>
          ))}

          {layers.map((layer, li) => (
            <LayerRow key={layer.id} index={li} layer={layer} archetype={archetype} tools={tools} overlay={overlay} picked={picked} onPick={pick} />
          ))}
        </div>
      </div>

      <div ref={detailRef} className="scroll-mt-20">
        {picked && pickedTool && (
          <div className="rounded-xl border border-line bg-paper px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3 text-[12px]">
              <span className="eyebrow">{pickedTool.name} · {fullName(picked.capId)}</span>
              <button type="button" onClick={() => setPicked(null)} className="font-semibold text-introduced hover:underline">Close ×</button>
            </div>
            <ControlRowDetail tool={pickedTool} mitigationId={picked.capId} showTitle />
          </div>
        )}
        {picked && !picked.toolId && mitigationById.get(picked.capId) && (
          <div className="space-y-3">
            <OurSide archetype={archetype} capId={picked.capId} overlay={overlay} />
            <CapabilityDetail mitigation={mitigationById.get(picked.capId)!} onClose={() => setPicked(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function LayerRow({
  index,
  layer,
  archetype,
  tools,
  overlay,
  picked,
  onPick,
}: {
  index: number;
  layer: { id: string; title: string; caps: string[] };
  archetype: Archetype;
  tools: Tool[];
  overlay: boolean;
  picked: Pick | null;
  onPick: (p: Pick) => void;
}) {
  const ours = layer.caps.filter((c) => sitesFor(archetype, c).some((s) => s.side === "enterprise"));
  // A stepped tint down the stack, so the layers read as layers.
  const shade = ["#f7f9fc", "#f3f6fa", "#eff3f8", "#ebf0f6", "#e7edf4", "#e3e9f1", "#dfe6ee", "#dbe3ec"][index % 8];
  return (
    <>
      <div className="sticky left-0 z-10 border-b border-r border-line px-3 py-3" style={{ background: shade }}>
        <span className="block text-[12.5px] font-bold text-ink">{layer.title}</span>
        <span className="block text-[11px] text-ink-3">{layer.caps.length} control{layer.caps.length === 1 ? "" : "s"}</span>
      </div>
      <div className="flex flex-wrap content-start gap-1.5 border-b border-r border-line bg-[#f5f7fa] px-2.5 py-2.5">
        {ours.length ? (
          ours.map((c) => {
            const ent = enterpriseStatus(c, archetype.surface);
            const where = [...new Set(sitesFor(archetype, c).filter((s) => s.side === "enterprise").map((s) => s.title))].join(" · ");
            return (
              <LayerPill
                key={c}
                label={shortName(c)}
                sub={where}
                bar="#344054"
                status={overlay ? ent.status : undefined}
                selected={picked?.capId === c && !picked.toolId}
                title={`${fullName(c)} — at ${where}${overlay && ent.names.length ? `\nOurs: ${ent.names.join(" · ")}` : ""}`}
                onClick={() => onPick({ capId: c, toolId: null })}
              />
            );
          })
        ) : (
          <span className="px-1 py-1 text-[11.5px] text-ink-3">Nothing on our side — product only</span>
        )}
      </div>
      {tools.map((t) => {
        const own = layer.caps
          .map((c) => ({ c, v: verdictFor(archetype, t, c) }))
          .filter((x) => x.v !== "enterprise" && x.v !== "na");
        const available = orgToolAvailableFor(t.id);
        return (
          <div key={t.id} className="flex flex-wrap content-start gap-1.5 border-b border-l border-line px-2.5 py-2.5">
            {own.length ? (
              own.map(({ c, v }) => (
                <LayerPill
                  key={c}
                  label={shortName(c)}
                  sub={VERDICT_META[v].label}
                  subColor={VERDICT_META[v].color}
                  bar={VERDICT_META[v].color}
                  dashed={v === "uncovered" || v === "unverified"}
                  status={overlay && available ? toolStatus(t, c)?.status : undefined}
                  selected={picked?.capId === c && picked.toolId === t.id}
                  title={`${fullName(c)} — ${VERDICT_META[v].long}`}
                  onClick={() => onPick({ capId: c, toolId: t.id })}
                />
              ))
            ) : (
              <span className="px-1 py-1 text-[11.5px] text-ink-3">Nothing extra in the product</span>
            )}
          </div>
        );
      })}
    </>
  );
}

function LayerPill({
  label,
  sub,
  subColor,
  bar,
  dashed,
  status,
  selected,
  title,
  onClick,
}: {
  label: string;
  sub?: string;
  subColor?: string;
  bar: string;
  dashed?: boolean;
  status?: DisplayStatus;
  selected: boolean;
  title: string;
  onClick: () => void;
}) {
  const s = status ? STATUS_STYLE[status] : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`max-w-full rounded-md border py-1 pl-2 pr-2 text-left leading-tight ${selected ? "ring-2 ring-ink" : ""}`}
      style={{
        background: s?.bg ?? "#fff",
        borderTopColor: s?.border ?? "var(--line-strong)",
        borderRightColor: s?.border ?? "var(--line-strong)",
        borderBottomColor: s?.border ?? "var(--line-strong)",
        borderLeftColor: bar,
        borderLeftWidth: 4,
        borderLeftStyle: dashed ? "dashed" : "solid",
      }}
    >
      <span className="block text-[11.5px] font-semibold text-ink">{label}</span>
      {sub && (
        <span className="block text-[10.5px]" style={{ color: subColor ?? "var(--ink-3)" }}>
          {sub}
        </span>
      )}
    </button>
  );
}

function OurSide({ archetype, capId, overlay }: { archetype: Archetype; capId: string; overlay: boolean }) {
  const sites = sitesFor(archetype, capId);
  const ent = enterpriseStatus(capId, archetype.surface);
  return (
    <div className="rounded-xl border border-line bg-paper px-5 py-4">
      <p className="eyebrow">Our side of {fullName(capId)} on this architecture</p>
      <ul className="mt-2 space-y-1.5">
        {sites.map((s, i) => (
          <li key={`${s.at}-${i}`} className="text-[12px] leading-snug text-ink-2">
            <span className="font-semibold text-ink">{s.title}</span>
            <span className="text-ink-3"> · {s.side === "enterprise" ? "ours" : "in the product"}</span>
            {s.note && <span className="block text-[11.5px] text-ink-3">{s.note}</span>}
          </li>
        ))}
      </ul>
      {overlay && (
        <p className="mt-2 text-[12px] text-ink-2">
          <span className="font-semibold text-ink">Our status:</span> {ent.names.join(" · ") || "no organisation capability recorded"}
          {ent.note && <span className="block text-[11.5px] text-ink-3">{ent.note}</span>}
        </p>
      )}
    </div>
  );
}

export type { Verdict };
