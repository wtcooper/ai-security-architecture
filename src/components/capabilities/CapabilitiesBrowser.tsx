"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/Panel";
import { FilterPill, RISK_CATEGORY_ACCENT } from "@/components/browse/RisksBrowser";
import type { BandId } from "@/lib/bands";
import {
  bandsForCapability,
  capabilitiesInOrder,
  capabilityById,
  controlCategories,
  riskById,
  riskCategories,
  surfaces,
} from "@/lib/data";
import type { Capability } from "@/lib/types";
import { CapabilityDetail } from "./CapabilityDetail";
import { SettingsDrawer } from "./SettingsDrawer";
import { StackFilter } from "./StackFilter";
import { STATUS_META, STATUS_STYLE, useStatusOverrides } from "./status";
import { CAPABILITY_STATUSES } from "@/lib/types";

const BAND_IDS: BandId[] = ["application", "model", "modelInfrastructure", "dataInfrastructure"];

export function CapabilitiesBrowser() {
  const params = useSearchParams();
  const linked = params.get("capability");

  const [riskCategory, setRiskCategory] = useState<string | null>(null);
  const [band, setBand] = useState<BandId | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { overrides, set, reset, effective, hasEdits } = useStatusOverrides();

  const selectedId = clicked ?? (linked && capabilityById.has(linked) ? linked : null);
  const selected = selectedId ? capabilityById.get(selectedId) : undefined;
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const matchesRisk = (cap: Capability) =>
    !riskCategory || cap.risks.some((id) => riskById.get(id)?.category === riskCategory);
  const matchesBand = (cap: Capability) => !band || bandsForCapability(cap.id).has(band);
  const shown = capabilitiesInOrder.filter((c) => matchesRisk(c) && matchesBand(c));

  // Stack-filter counts respond to the risk filter, so the two selectors read as one system.
  const bandCounts = Object.fromEntries(BAND_IDS.map((b) => [b, 0])) as Record<BandId, number>;
  for (const cap of capabilitiesInOrder) {
    if (!matchesRisk(cap)) continue;
    for (const b of bandsForCapability(cap.id)) bandCounts[b] += 1;
  }

  return (
    <>
      <PageHeader
        eyebrow={`${capabilitiesInOrder.length} technology capabilities · authored taxonomy`}
        title="Capabilities"
        lead="CoSAI names the control strategies; this taxonomy names the tooling classes that deliver them. Every surface — endpoint, cloud, third-party SaaS — runs its own instance of the same component stack, but the capabilities that work there differ. Rows are CoSAI control groups; columns are surfaces."
      >
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Filter by risk category</p>
            <div className="mt-2 flex max-w-xl flex-wrap gap-1.5">
              <FilterPill active={!riskCategory} onClick={() => setRiskCategory(null)}>
                All
              </FilterPill>
              {riskCategories.map((c) => (
                <FilterPill
                  key={c.id}
                  active={riskCategory === c.id}
                  accent={RISK_CATEGORY_ACCENT[c.id]}
                  onClick={() => setRiskCategory(riskCategory === c.id ? null : c.id)}
                >
                  {c.title}
                </FilterPill>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 lg:w-[300px]">
            <p className="eyebrow">Filter by stack layer</p>
            <div className="mt-2">
              <StackFilter value={band} counts={bandCounts} onChange={setBand} />
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <div className="flex items-center justify-between gap-3 pb-3">
          <p className="text-[13px] text-ink-3">
            {shown.length} of {capabilitiesInOrder.length} capabilities
            {(riskCategory || band) && (
              <button
                onClick={() => {
                  setRiskCategory(null);
                  setBand(null);
                }}
                className="ml-2 font-semibold text-introduced hover:underline"
              >
                Clear filters
              </button>
            )}
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            Edit taxonomy
            {hasEdits && <span className="ml-1.5 font-normal text-introduced">· edited</span>}
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-paper px-4 py-2.5">
          <span className="eyebrow">Coverage</span>
          {CAPABILITY_STATUSES.map((s) => {
            const tint = STATUS_STYLE[s];
            return (
              <span key={s} className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
                <span
                  className="h-3.5 w-6 rounded-full border"
                  style={{
                    background: tint.bg,
                    borderColor: tint.border,
                    borderStyle: tint.dashed ? "dashed" : "solid",
                  }}
                />
                {STATUS_META[s].label}
              </span>
            );
          })}
          <span className="text-[12.5px] text-ink-3">
            Nothing ships assessed — this repository maps what the taxonomy covers, not what
            anyone has deployed. Use{" "}
            <button
              onClick={() => setDrawerOpen(true)}
              className="font-semibold text-introduced hover:underline"
            >
              Edit taxonomy
            </button>{" "}
            to record your own posture.
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <div className="grid min-w-[860px] grid-cols-[180px_repeat(3,minmax(0,1fr))]">
            <div className="bg-ink px-4 py-3.5">
              <p className="text-[13.5px] font-bold text-white">CoSAI control group</p>
              <p className="mt-0.5 text-[11px] leading-snug text-white/60">what the tooling implements</p>
            </div>
            {surfaces.map((s) => (
              <div key={s.id} className="border-l border-white/10 bg-ink px-4 py-3.5">
                <p className="text-[13.5px] font-bold text-white">{s.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/60">
                  {SURFACE_TAGLINE[s.id]}
                </p>
              </div>
            ))}

            {controlCategories.map((cat) => {
              const rowCaps = shown.filter((c) => c.category === cat.id);
              return (
                <div key={cat.id} className="col-span-4 grid grid-cols-subgrid border-t border-line">
                  <div className="bg-[#fbfcfe] px-4 py-3.5">
                    <p className="text-[12.5px] font-bold leading-snug text-ink">{cat.title}</p>
                  </div>
                  {surfaces.map((s) => {
                    const cellCaps = rowCaps.filter((c) => c.surfaces[s.id]?.applies);
                    return (
                      <div key={s.id} className="border-l border-line px-3 py-3">
                        {cellCaps.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {cellCaps.map((cap) => {
                              const active = selectedId === cap.id;
                              const status = effective(cap, s.id);
                              const tint = STATUS_STYLE[status];
                              return (
                                <button
                                  key={cap.id}
                                  onClick={() => setClicked(active ? null : cap.id)}
                                  aria-pressed={active}
                                  title={`${cap.title} — ${STATUS_META[status].label}`}
                                  className="inline-flex items-center rounded-full border px-2.5 py-[5px] text-[12px] font-medium transition-shadow"
                                  style={{
                                    background: tint.bg,
                                    borderColor: active ? "var(--ink)" : tint.border,
                                    borderStyle: tint.dashed ? "dashed" : "solid",
                                    color: tint.text,
                                    boxShadow: active ? "0 0 0 1px var(--ink)" : undefined,
                                  }}
                                >
                                  {cap.abbrev ?? cap.title}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[13px] text-ink-3">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-[12px] text-ink-3">
          A capability sits in its primary control group; its full control mapping is in the
          detail. A blank cell means the capability cannot reach that surface at all — the
          reason is on the capability.
        </p>

        <div ref={detailRef} className="mt-6 scroll-mt-20">
          {selected && (
            <CapabilityDetail
              capability={selected}
              effective={effective}
              onClose={() => setClicked(null)}
            />
          )}
        </div>
      </div>

      <SettingsDrawer
        open={drawerOpen}
        overrides={overrides}
        effective={effective}
        onSet={set}
        onReset={reset}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

const SURFACE_TAGLINE: Record<string, string> = {
  surfaceEndpoint: "agents on managed devices",
  surfaceCloud: "production AI you operate",
  surfaceSaas: "vendor AI you consume",
};
