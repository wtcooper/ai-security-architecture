"use client";

/**
 * The AI Tooling tab. Two perspectives over one registry, chosen with one switch:
 *
 *   By category — a reference architecture is a category of tool. Pick one; its drawing's
 *   pinned capabilities are the controls every product of that kind needs, and the matrix
 *   shows every vendor's product rated against that same set.
 *
 *   By vendor — one vendor across categories: which architectures its products instantiate,
 *   and per product how much of the inherited set the vendor covers and how much the
 *   organisation has switched on.
 *
 * A product's full record (`?tool=`) opens from either, from search, and from the drawings.
 */
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { archetypeById, archetypesInOrder, toolById, toolsForArchetype, toolsInOrder, vendorById, vendors } from "@/lib/data";
import { ArchitectureViews } from "./ArchitectureViews";
import { ToolDetail } from "./ToolDetail";
import { VendorView } from "./VendorView";

type Perspective = "category" | "vendor";

export function ToolingBrowser() {
  const params = useSearchParams();
  const linkedTool = params.get("tool");
  const linkedArch = params.get("arch");
  const linkedVendor = params.get("vendor");

  const categories = archetypesInOrder.filter((a) => toolsForArchetype(a.id).length);
  const [perspective, setPerspective] = useState<Perspective>(linkedVendor && vendorById.has(linkedVendor) ? "vendor" : "category");
  const [arch, setArch] = useState<string>(linkedArch && archetypeById.has(linkedArch) ? linkedArch : categories[0]?.id ?? "");
  const [vendor, setVendor] = useState<string>(linkedVendor && vendorById.has(linkedVendor) ? linkedVendor : vendors[0]?.id ?? "");
  const [toolId, setToolId] = useState<string | null>(linkedTool && toolById.has(linkedTool) ? linkedTool : null);
  const tool = toolId ? toolById.get(toolId) : undefined;
  const latest = toolsInOrder.map((t) => t.asOf).sort().at(-1);

  const pickArchitecture = (id: string) => {
    setArch(id);
    setPerspective("category");
    setToolId(null);
  };

  return (
    <>
      <PageHeader
        eyebrow={`${toolsInOrder.length} products · ${vendors.length} vendors · ${categories.length} architectures · verified ${latest ?? "—"}`}
        title="AI Tooling"
        lead="A reference architecture is a category of tool: its drawing pins the controls every product of that kind needs. Each named product inherits that reference set and records how its vendor lets an administrator switch each control on, with the vendor's own page behind every step. An organisation that has recorded its status in data/org can switch that overlay on to see it beside the reference."
      >
        <div className="mt-6 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Perspective">
          {(
            [
              { id: "category", label: "By reference architecture" },
              { id: "vendor", label: "By vendor" },
            ] as { id: Perspective; label: string }[]
          ).map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={perspective === p.id && !tool}
              onClick={() => {
                setPerspective(p.id);
                setToolId(null);
              }}
              className={`rounded-md border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                perspective === p.id && !tool ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-line-strong"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {!tool && perspective === "category" && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="eyebrow mr-1.5">Architecture</span>
            {categories.map((a) => {
              const active = arch === a.id;
              return (
                <span
                  key={a.id}
                  className={`inline-flex items-stretch overflow-hidden rounded-full border text-[13px] font-medium transition-colors ${
                    active ? "border-transparent text-white" : "border-line bg-paper text-ink-2 hover:border-line-strong"
                  }`}
                  style={active ? { background: "var(--introduced)" } : undefined}
                >
                  <button type="button" aria-pressed={active} onClick={() => setArch(a.id)} className="py-1.5 pl-3 pr-2">
                    {a.title}
                    <span className="ml-1.5 opacity-60">{toolsForArchetype(a.id).length}</span>
                  </button>
                  <Link
                    href={`/reference?archetype=${a.id}`}
                    title={`Open the ${a.title} drawing`}
                    className={`flex items-center border-l py-1.5 pl-2 pr-2.5 text-[12px] ${active ? "border-white/30 hover:bg-white/15" : "border-line hover:bg-mist"}`}
                  >
                    ↗
                  </Link>
                </span>
              );
            })}
          </div>
        )}
        {!tool && perspective === "vendor" && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="eyebrow mr-1.5">Vendor</span>
            {vendors.map((v) => (
              <FilterPill key={v.id} active={vendor === v.id} accent="var(--band-data-rail)" onClick={() => setVendor(v.id)}>
                {v.name}
                <span className="ml-1.5 opacity-60">{toolsInOrder.filter((t) => t.vendor === v.id).length}</span>
              </FilterPill>
            ))}
          </div>
        )}
      </PageHeader>

      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        {tool ? (
          <div>
            <p className="mb-3 text-[12px] text-ink-3">
              <button type="button" onClick={() => setToolId(null)} className="font-semibold text-introduced hover:underline">
                ← Back to {perspective === "vendor" ? vendorById.get(vendor)?.name : archetypeById.get(tool.architecture)?.abbrev}
              </button>
              <span className="mx-2">·</span>
              <Link href={`/reference?archetype=${tool.architecture}`} className="font-semibold text-introduced hover:underline">
                Its drawing →
              </Link>
            </p>
            <article className="rounded-xl border border-line bg-paper p-7">
              <ToolDetail key={tool.id} tool={tool} />
            </article>
          </div>
        ) : perspective === "category" ? (
          arch ? (
            <ArchitectureViews key={arch} archetypeId={arch} tools={toolsForArchetype(arch)} showDrawingLink />
          ) : null
        ) : (
          <VendorView key={vendor} vendorId={vendor} onPickArchitecture={pickArchitecture} />
        )}
      </div>
    </>
  );
}
