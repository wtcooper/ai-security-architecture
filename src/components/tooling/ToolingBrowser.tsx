"use client";

/**
 * The AI Tooling tab: the named products, each mapped to a reference architecture, with the
 * controls that drawing pins and how the vendor lets an administrator switch each one on —
 * and, from data/org, whether the organisation has. Two views over the same registry: a
 * catalogue (one product at a time) and a comparison (every product on one architecture).
 */
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { MasterDetail, useMasterSelection } from "@/components/browse/MasterDetail";
import { archetypeById, archetypesInOrder, org, toolsInOrder, vendors } from "@/lib/data";
import type { ToolSurfaceClass } from "@/lib/types";
import { CoverageBarsView } from "./CoverageBarsView";
import { SURFACE_CLASS_META, SURFACE_CLASS_ORDER } from "./labels";
import { MatrixView } from "./MatrixView";
import { cosaiRows, hasOrgMappings, orgRows, type LabelMode } from "./model";
import { ScorecardView } from "./ScorecardView";
import { ToolDetail } from "./ToolDetail";

type View = "catalogue" | "matrix" | "scorecards" | "bars";
const VIEWS: { id: View; label: string; blurb: string }[] = [
  { id: "catalogue", label: "Catalogue", blurb: "One product at a time, in full." },
  { id: "matrix", label: "A · Matrix", blurb: "Variants as columns, controls as rows, status as tint." },
  { id: "scorecards", label: "B · Scorecards", blurb: "One card per variant with coverage and status bars." },
  { id: "bars", label: "C · Coverage bars", blurb: "One row per control, every variant a tile." },
];

export function ToolingBrowser() {
  const params = useSearchParams();
  const linkedView = params.get("view");
  const [view, setView] = useState<View>(
    VIEWS.some((v) => v.id === linkedView) ? (linkedView as View) : linkedView === "compare" ? "matrix" : "catalogue",
  );
  const [labels, setLabels] = useState<LabelMode>("cosai");
  const [keyOnly, setKeyOnly] = useState(false);
  const [vendor, setVendor] = useState<string | null>(null);
  const [surfaceClass, setSurfaceClass] = useState<ToolSurfaceClass | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);
  const [openCapability, setOpenCapability] = useState<string | null>(null);

  const shown = toolsInOrder.filter(
    (t) => (!vendor || t.vendor === vendor) && (!surfaceClass || t.surfaceClasses.includes(surfaceClass)),
  );
  const selectedId = useMasterSelection(
    "tool",
    params.get("tool"),
    shown.map((t) => t.id),
    clicked && shown.some((t) => t.id === clicked) ? clicked : null,
  );
  const tool = shown.find((t) => t.id === selectedId) ?? shown[0];

  // The visual lenses can be narrowed to one architecture — the products that instantiate it —
  // which is what the Tools tab on a drawing links to. Rows are the union of the shown products'
  // pinned capabilities, so products from different drawings still compare; a control a product's
  // own drawing does not pin is hatched, not blank.
  const archetypesWithTools = useMemo(
    () => archetypesInOrder.filter((a) => toolsInOrder.some((t) => t.architecture === a.id || t.secondaryArchitectures?.includes(a.id))),
    [],
  );
  const linkedArch = params.get("arch");
  const [arch, setArch] = useState<string | null>(linkedArch && archetypeById.has(linkedArch) ? linkedArch : null);
  const visual = arch ? shown.filter((t) => t.architecture === arch || t.secondaryArchitectures?.includes(arch)) : shown;
  const groups = labels === "org" ? orgRows(visual) : cosaiRows(visual, keyOnly);

  const latest = toolsInOrder.map((t) => t.asOf).sort().at(-1);
  const classesInUse = SURFACE_CLASS_ORDER.filter((c) => toolsInOrder.some((t) => t.surfaceClasses.includes(c)));

  const select = (id: string, capabilityId?: string) => {
    setClicked(id);
    setOpenCapability(capabilityId ?? null);
    setView("catalogue");
  };

  return (
    <>
      <PageHeader
        eyebrow={`${toolsInOrder.length} tools · ${vendors.length} vendors · verified ${latest ?? "—"}`}
        title="AI Tooling"
        lead={`The named products below the architectures: each mapped to the drawing it instantiates, with the controls that drawing pins and how the vendor lets an administrator switch each one on. Status is ${org.example ? "the example organisation's, from data/org/example" : `${org.name}'s, from data/org/local`} — whether this tool is configured, which is a different question from whether a capability is deployed on a surface (the Capabilities tab).`}
      >
        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          <span className="eyebrow mr-1.5 w-full sm:w-auto">Vendor</span>
          <FilterPill active={!vendor} onClick={() => setVendor(null)}>
            All
          </FilterPill>
          {vendors.map((v) => (
            <FilterPill key={v.id} active={vendor === v.id} onClick={() => setVendor(vendor === v.id ? null : v.id)}>
              {v.name}
              <span className="ml-1.5 opacity-60">{toolsInOrder.filter((t) => t.vendor === v.id).length}</span>
            </FilterPill>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="eyebrow mr-1.5 w-full sm:w-auto">Surface</span>
          <FilterPill active={!surfaceClass} onClick={() => setSurfaceClass(null)}>
            All
          </FilterPill>
          {classesInUse.map((c) => (
            <FilterPill
              key={c}
              active={surfaceClass === c}
              accent="var(--band-data-rail)"
              onClick={() => setSurfaceClass(surfaceClass === c ? null : c)}
            >
              {SURFACE_CLASS_META[c].label}
              <span className="ml-1.5 opacity-60">{toolsInOrder.filter((t) => t.surfaceClasses.includes(c)).length}</span>
            </FilterPill>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="View">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              title={v.blurb}
              className={`rounded-md border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                view === v.id ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-line-strong"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view !== "catalogue" && (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            <span className="flex items-center gap-1.5">
              <span className="eyebrow">Rows</span>
              {(["cosai", "org"] as LabelMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={labels === m}
                  disabled={m === "org" && !hasOrgMappings}
                  onClick={() => setLabels(m)}
                  title={m === "org" && !hasOrgMappings ? "No organisation catalogue maps onto capabilities yet (data/org)." : undefined}
                  className={`rounded-full border px-2.5 py-1 font-medium transition-colors disabled:opacity-40 ${
                    labels === m ? "border-transparent bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-line-strong"
                  }`}
                >
                  {m === "cosai" ? "CoSAI capabilities" : org.example ? "Example organisation's controls" : `${org.name}'s controls`}
                </button>
              ))}
            </span>
            {labels === "cosai" && hasOrgMappings && (
              <label className="flex cursor-pointer items-center gap-1.5 text-ink-2">
                <input type="checkbox" checked={keyOnly} onChange={(e) => setKeyOnly(e.target.checked)} className="accent-[var(--ink)]" />
                Only controls in {org.example ? "the example" : "your"} standard
              </label>
            )}
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="eyebrow">Architecture</span>
              <FilterPill active={!arch} onClick={() => setArch(null)}>
                All
              </FilterPill>
              {archetypesWithTools.map((a) => (
                <FilterPill key={a.id} active={arch === a.id} accent="var(--introduced)" onClick={() => setArch(arch === a.id ? null : a.id)}>
                  {a.abbrev ?? a.title}
                </FilterPill>
              ))}
            </span>
          </div>
        )}
      </PageHeader>

      {view === "catalogue" ? (
        tool ? (
          <MasterDetail
            groups={vendors
              .map((v) => ({
                id: v.id,
                title: v.name,
                accent: "var(--band-data-rail)",
                items: shown.filter((t) => t.vendor === v.id).map((t) => ({ id: t.id, title: t.name, tool: t })),
              }))
              .filter((g) => g.items.length)}
            selectedId={tool.id}
            onSelect={(id) => select(id)}
            meta={({ tool: t }) =>
              `${t.family} · ${t.surfaceClasses.map((c) => SURFACE_CLASS_META[c].short).join(", ")} · ${archetypeById.get(t.architecture)?.abbrev ?? t.architecture}`
            }
          >
            <ToolDetail key={tool.id} tool={tool} openCapability={openCapability} />
          </MasterDetail>
        ) : (
          <p className="mx-auto w-full max-w-[1400px] px-6 py-10 text-[13.5px] text-ink-3">No tool matches these filters.</p>
        )
      ) : (
        <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
          {view === "matrix" && <MatrixView tools={visual} groups={groups} />}
          {view === "scorecards" && <ScorecardView tools={visual} groups={groups} />}
          {view === "bars" && <CoverageBarsView tools={visual} groups={groups} />}
        </div>
      )}
    </>
  );
}
