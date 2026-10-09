"use client";

/**
 * Option 5 — Simpler drawing + side panel. The drawing is re-drawn at lower density (see
 * SimpleCanvasRF): a card per component, named control badges, risks behind a switch. Clicking
 * a badge opens the side panel, which answers that control for every product: who covers it,
 * the exact setting, and — with org data on — our status. The Tools tab keeps one card per
 * product.
 */
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { Prose } from "@/components/Prose";
import { docsUrlFor } from "@/components/tooling/shared";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { mitigationById, orgSurfaceStatusFor, orgToolAvailableFor } from "@/lib/data";
import type { Archetype, Scenario, Tool } from "@/lib/types";
import {
  controlOf,
  enterpriseStatus,
  fullName,
  PLACEMENT_META,
  placementFor,
  settingUrl,
  shortName,
  sitesFor,
  toolStatus,
  VERDICT_META,
  VERDICT_ORDER,
  verdictFor,
  type Placement,
} from "./model";
import { AvailableTag, countBy, DrawingBar, StatusLegend, StatusTag, VerdictWord, vendorName } from "./parts";

const SimpleCanvasRF = dynamic(() => import("./SimpleCanvasRF").then((m) => m.SimpleCanvasRF), {
  ssr: false,
  loading: () => <div style={{ height: "min(720px, 78vh)" }} />,
});

export interface CanvasState {
  selected: string | null;
  setSelected: (id: string | null) => void;
  showRisks: boolean;
  setShowRisks: (v: boolean) => void;
}

export function useCanvasState(archetypeId: string): CanvasState {
  const [selected, setSelectedRaw] = useState<string | null>(null);
  const [showRisks, setShowRisks] = useState(false);
  const [lastArch, setLastArch] = useState(archetypeId);
  if (lastArch !== archetypeId) {
    setLastArch(archetypeId);
    setSelectedRaw(null);
  }
  const setSelected = useCallback((id: string | null) => setSelectedRaw((cur) => (cur === id ? null : id)), []);
  return { selected, setSelected, showRisks, setShowRisks };
}

export function CanvasDrawing({ archetype, tools, walk, state }: { archetype: Archetype; tools: Tool[]; walk: Scenario | null; state: CanvasState }) {
  const overlay = useOrgOverlay();
  return (
    <>
      <DrawingBar
        legend={
          overlay ? (
            <StatusLegend lead="Badges show our status" counts={countBy(archetype.mitigations.map((c) => orgSurfaceStatusFor(c, archetype.surface)))} />
          ) : (
            <p className="text-[11.5px] text-ink-3">Every badge is a reference control, named where it is enforced. Click one to see how each product covers it.</p>
          )
        }
      >
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-2">
          <input type="checkbox" checked={state.showRisks} onChange={(e) => state.setShowRisks(e.target.checked)} />
          Show risks
        </label>
        {walk && <span className="text-[12px] text-ink-2">Showing sequence: <span className="font-semibold text-ink">{walk.title}</span></span>}
      </DrawingBar>
      <div data-canvas className="relative -mx-6 scroll-mt-24 overflow-hidden border-y border-line bg-paper lg:mx-0 lg:rounded-xl lg:border">
        <SimpleCanvasRF archetype={archetype} walk={walk} selected={state.selected} onSelect={state.setSelected} showRisks={state.showRisks} />
        {state.selected && (
          <aside className="absolute bottom-3 right-3 top-3 z-10 w-[min(380px,calc(100%-24px))] overflow-y-auto rounded-xl border border-line-strong bg-paper px-4 py-4 shadow-xl">
            <ControlAnswer archetype={archetype} tools={tools} capId={state.selected} onClose={() => state.setSelected(null)} />
          </aside>
        )}
      </div>
      {!state.selected && (
        <div className="mt-3 rounded-xl border border-line bg-paper px-4 py-3">
          <ControlIndex archetype={archetype} onPick={state.setSelected} />
        </div>
      )}
    </>
  );
}

const PLACEMENTS: Placement[] = ["enterprise", "both", "product"];

function ControlIndex({ archetype, onPick }: { archetype: Archetype; onPick: (id: string) => void }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink">Click any control on the drawing — or pick one here</p>
      <p className="mt-0.5 text-[11.5px] text-ink-3">A side panel opens over the drawing and answers it for every product.</p>
      <div className="flex flex-wrap gap-x-6">
      {PLACEMENTS.map((p) => {
        const caps = archetype.mitigations.filter((c) => placementFor(archetype, c) === p);
        if (!caps.length) return null;
        return (
          <div key={p} className="mt-3">
            <p className="eyebrow">{PLACEMENT_META[p].label}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {caps.map((c) => (
                <button key={c} type="button" onClick={() => onPick(c)} className="rounded-full border-[1.5px] border-[#4a5fd0] px-2 py-[1px] text-[11px] font-semibold text-[#3d5bd9] hover:bg-[#eef1ff]">
                  {shortName(c)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function ControlAnswer({ archetype, tools, capId, onClose }: { archetype: Archetype; tools: Tool[]; capId: string; onClose: () => void }) {
  const overlay = useOrgOverlay();
  const m = mitigationById.get(capId);
  const sites = sitesFor(archetype, capId);
  const ent = enterpriseStatus(capId, archetype.surface);
  const placement = placementFor(archetype, capId);
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="eyebrow">{PLACEMENT_META[placement].label}</p>
          <h4 className="mt-0.5 text-[16px] font-bold leading-tight text-ink">{shortName(capId)}</h4>
          {shortName(capId) !== fullName(capId) && <p className="text-[11.5px] text-ink-3">{fullName(capId)}</p>}
        </div>
        <button type="button" onClick={onClose} className="shrink-0 text-[12px] font-semibold text-introduced hover:underline">
          Close ×
        </button>
      </div>
      {m?.description?.length ? (
        <div className="mt-2 line-clamp-4">
          <Prose blocks={m.description.slice(0, 1)} size="sm" className="!text-[12px] !leading-snug" />
        </div>
      ) : null}

      <p className="eyebrow mt-3">Where it is enforced</p>
      <ul className="mt-1 space-y-1.5">
        {sites.map((s, i) => (
          <li key={`${s.at}-${i}`} className="text-[12px] leading-snug">
            <span className="font-semibold text-ink">{s.title}</span>
            <span className="text-ink-3"> · {s.side === "enterprise" ? "ours" : "in the product"}</span>
            {s.note && <span className="mt-0.5 line-clamp-3 text-[11.5px] text-ink-3">{s.note}</span>}
          </li>
        ))}
      </ul>

      {overlay && sites.some((s) => s.side === "enterprise") && (
        <div className="mt-3 rounded-lg border border-line bg-mist px-3 py-2">
          <p className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <span className="font-semibold text-ink">Our side</span>
            <StatusTag status={ent.status} />
          </p>
          <p className="mt-0.5 text-[11.5px] text-ink-2">{ent.names.join(" · ") || "No organisation capability recorded."}</p>
          {ent.note && <p className="mt-0.5 text-[11px] text-ink-3">{ent.note}</p>}
        </div>
      )}

      <p className="eyebrow mt-3">Per product</p>
      <ul className="mt-1.5 space-y-2">
        {tools.map((t) => {
          const v = verdictFor(archetype, t, capId);
          const control = controlOf(t, capId);
          const url = settingUrl(control);
          const st = overlay ? toolStatus(t, capId) : null;
          return (
            <li key={t.id} className="rounded-lg border border-line px-3 py-2">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                <span className="font-semibold text-ink">{t.name}</span>
                <VerdictWord verdict={v} className="text-[11.5px]" />
                {overlay && (st ? <StatusTag status={st.status} /> : <AvailableTag tool={t} />)}
              </p>
              {control?.mechanism && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-2">{control.mechanism}</p>}
              {!control && <p className="mt-0.5 text-[11.5px] text-ink-3">No vendor record yet.</p>}
              {overlay && st?.note && <p className="mt-0.5 line-clamp-3 text-[11px] text-ink-3">{st.note}</p>}
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-[11px] font-semibold text-introduced hover:underline">
                  Open the setting ↗
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The Tools tab for option 5: one card per product, since the drawing's panel answers per control. */
export function CanvasPanel({ archetype, tools, state }: { archetype: Archetype; tools: Tool[]; state: CanvasState }) {
  const overlay = useOrgOverlay();
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-ink-2">
        Controls are answered on the drawing&rsquo;s side panel. Here, one card per product with its overall shape.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((t) => {
          const c = countBy(archetype.mitigations.map((m) => verdictFor(archetype, t, m)));
          return (
            <div key={t.id} className="rounded-xl border border-line bg-paper px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow">{vendorName(t)}</span>
                {overlay && <AvailableTag tool={t} />}
              </div>
              <p className="mt-0.5 text-[15px] font-bold text-ink">{t.name}</p>
              <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-ink-2">{typeof t.summary[0] === "string" ? t.summary[0] : ""}</p>
              <ul className="mt-2 space-y-0.5">
                {VERDICT_ORDER.filter((v) => c[v]).map((v) => (
                  <li key={v} className="flex items-baseline justify-between text-[12px]">
                    <VerdictWord verdict={v} />
                    <span className="text-ink-3">{c[v]}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-1">
                {archetype.mitigations
                  .filter((m) => ["uncovered", "unverified", "thirdParty"].includes(verdictFor(archetype, t, m)))
                  .map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        state.setSelected(m);
                        document.querySelector("[data-canvas]")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="rounded-full border px-2 py-[1px] text-[10.5px] font-semibold"
                      style={{ borderColor: VERDICT_META[verdictFor(archetype, t, m)].color, color: VERDICT_META[verdictFor(archetype, t, m)].color }}
                      title={VERDICT_META[verdictFor(archetype, t, m)].long}
                    >
                      {shortName(m)}
                    </button>
                  ))}
              </div>
              {docsUrlFor(t) && (
                <a href={docsUrlFor(t)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-semibold text-introduced hover:underline">
                  Vendor docs ↗
                </a>
              )}
              {overlay && !orgToolAvailableFor(t.id) && <p className="mt-1 text-[11px] text-ink-3">Not in use here, so no status is recorded.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
