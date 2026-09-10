"use client";

/**
 * The AI Tooling tab: the named products, each mapped to a reference architecture, with the
 * controls that drawing pins and how the vendor lets an administrator switch each one on —
 * and, from data/org, whether the organisation has. Two views over the same registry: a
 * catalogue (one product at a time) and a comparison (every product on one architecture).
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { MasterDetail, useMasterSelection } from "@/components/browse/MasterDetail";
import { archetypeById, archetypesInOrder, org, toolsInOrder, vendors } from "@/lib/data";
import type { ToolSurfaceClass } from "@/lib/types";
import { CompareMatrix } from "./CompareMatrix";
import { SURFACE_CLASS_META, SURFACE_CLASS_ORDER } from "./labels";
import { ToolDetail } from "./ToolDetail";

type View = "catalogue" | "compare";

export function ToolingBrowser() {
  const params = useSearchParams();
  const [view, setView] = useState<View>(params.get("view") === "compare" ? "compare" : "catalogue");
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

  // Compare works one architecture at a time — the pinned set is the row list, and rows from
  // two drawings would not be comparable. Offer only architectures that have tools.
  const compareArchetypes = useMemo(
    () => archetypesInOrder.filter((a) => toolsInOrder.some((t) => t.architecture === a.id || t.secondaryArchitectures?.includes(a.id))),
    [],
  );
  const linkedArch = params.get("arch");
  const [compareArch, setCompareArch] = useState<string>(
    linkedArch && archetypeById.has(linkedArch) ? linkedArch : compareArchetypes[0]?.id ?? "",
  );
  const compared = shown.filter((t) => t.architecture === compareArch || t.secondaryArchitectures?.includes(compareArch));

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
          {(["catalogue", "compare"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-md border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                view === v ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-line-strong"
              }`}
            >
              {v === "catalogue" ? "Catalogue" : "Compare on an architecture"}
            </button>
          ))}
        </div>
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
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow mr-1.5">Architecture</span>
            {compareArchetypes.map((a) => (
              <FilterPill key={a.id} active={compareArch === a.id} accent="var(--introduced)" onClick={() => setCompareArch(a.id)}>
                {a.abbrev ?? a.title}
                <span className="ml-1.5 opacity-60">
                  {toolsInOrder.filter((t) => t.architecture === a.id || t.secondaryArchitectures?.includes(a.id)).length}
                </span>
              </FilterPill>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-snug text-ink-3">
            Rows are the capabilities pinned on{" "}
            <Link href={`/reference?archetype=${compareArch}`} className="font-medium text-ink-2 hover:underline">
              {archetypeById.get(compareArch)?.title}
            </Link>
            ; columns are the tools that instantiate it. The glyph is the vendor&rsquo;s coverage (● native, ◐ partial, ○ via
            a third-party product, — none, ? unverified); the tint is the organisation&rsquo;s status. Click a cell for the
            operator steps.
          </p>
          <div className="mt-4">
            {compared.length ? (
              <CompareMatrix archetypeId={compareArch} tools={compared} onSelect={select} />
            ) : (
              <p className="text-[13.5px] text-ink-3">No tool matches these filters on this architecture.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
