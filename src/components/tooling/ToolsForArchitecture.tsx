"use client";

/**
 * The Tools tab on a reference architecture: the named products that instantiate this drawing,
 * in the same shape as the sequence-flows tab — pick one on the left, read it on the right.
 * The right panel carries the elements leadership asks for without leaving the page: what the
 * product is, where it runs, how it ships, the organisation's adoption decision, and the
 * reference-controls table (vendor coverage of every pinned capability, the organisation's
 * status, operator steps behind each row). The AI Tooling tab remains the full record.
 */
import { useState } from "react";
import Link from "next/link";

import { Chip } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { org, orgAdoptionFor, orgPostureFor, riskById, riskCode, vendorById, vendors } from "@/lib/data";
import type { Archetype, Tool, ToolVariant } from "@/lib/types";
import { ADOPTION_META, SURFACE_CLASS_META } from "./labels";
import { OrgStatusPill } from "./OrgStatusPill";
import { ToolControlsTable } from "./ToolControlsTable";

const STATUS_LABEL = { ga: "GA", beta: "Beta", preview: "Preview", announced: "Announced" } as const;

export function ToolsForArchitecture({ archetype, tools }: { archetype: Archetype; tools: Tool[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(tools[0]?.id ?? null);
  const tool = tools.find((t) => t.id === selectedId) ?? tools[0];

  if (!tools.length) {
    return (
      <p className="text-[13px] text-ink-3">
        No product in the registry maps onto this architecture yet. Add one under data/tooling/ with{" "}
        <span className="ident">architecture: {archetype.id}</span>, or run the tooling-onboard skill.
      </p>
    );
  }

  const pinned = archetype.capabilities;
  const covered = (t: Tool) =>
    t.controls.filter((c) => pinned.includes(c.capability) && c.coverage !== "none" && c.coverage !== "unknown").length;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div>
        <p className="text-[12px] leading-snug text-ink-3">
          Select a product to read how it implements this drawing. Coverage counts the {pinned.length} pinned
          capabilities the vendor documents a control for.
        </p>
        <div className="mt-3 space-y-3">
          {vendors
            .filter((v) => tools.some((t) => t.vendor === v.id))
            .map((v) => (
              <div key={v.id}>
                <p className="eyebrow mb-1">{v.name}</p>
                <div className="space-y-1.5">
                  {tools
                    .filter((t) => t.vendor === v.id)
                    .map((t) => {
                      const active = t.id === tool.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          aria-pressed={active}
                          className={`block w-full rounded-lg border px-3 py-2 text-left text-[12.5px] leading-snug transition-colors ${
                            active
                              ? "border-mitigated bg-mitigated-soft font-semibold text-ink"
                              : "border-line bg-paper text-ink-2 hover:border-line-strong"
                          }`}
                        >
                          {t.name}
                          {t.architecture !== archetype.id && (
                            <span className="ident ml-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                              secondary
                            </span>
                          )}
                          <span className="ml-1.5 opacity-60">
                            {covered(t)}/{pinned.length}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-line bg-paper">
        <ToolBrief key={tool.id} tool={tool} archetype={archetype} />
      </div>
    </div>
  );
}

function ToolBrief({ tool, archetype }: { tool: Tool; archetype: Archetype }) {
  const vendor = vendorById.get(tool.vendor);
  const adoption = orgAdoptionFor(tool.id);
  const posture = orgPostureFor(tool.id);
  const statuses = Object.values(posture?.controls ?? {});
  const enabled = statuses.filter((s) => s.status === "inPlace").length;
  const secondary = tool.architecture !== archetype.id;
  const variants: ToolVariant[] = tool.variants?.length
    ? tool.variants
    : tool.surfaceClasses.map((c) => ({ name: SURFACE_CLASS_META[c].label, class: c }));

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-line px-4 py-2.5 text-[12.5px]">
        <span className="ident text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">Product</span>
        <span className="font-semibold text-ink">{tool.name}</span>
        <span className="text-ink-3">{vendor?.name ?? tool.vendor}</span>
        {tool.status && (
          <span className="ident rounded-full border border-line-strong px-2 py-px text-[10px] font-semibold text-ink-2">
            {STATUS_LABEL[tool.status]}
          </span>
        )}
        <span
          className="rounded-full border border-ink px-2 py-px text-[10.5px] font-semibold text-ink"
          title={`${org.example ? "Example organisation" : org.name}: ${ADOPTION_META[adoption].blurb}${posture?.note ? ` — ${posture.note}` : ""}`}
        >
          {ADOPTION_META[adoption].label}
          {org.example && <span className="ml-1 font-normal text-ink-3">· example</span>}
        </span>
        {statuses.length > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <OrgStatusPill status="inPlace" compact title="Controls enabled" />
            {enabled} of {statuses.length} assessed
          </span>
        )}
        <span className="ml-auto ident text-[10.5px] text-ink-3">as of {tool.asOf}</span>
      </div>

      <div className="space-y-5 px-4 pb-4 pt-3">
        {secondary && (
          <p className="rounded-md bg-mist px-3 py-2 text-[12px] leading-snug text-ink-2">
            This product&rsquo;s primary architecture is another drawing; the controls below are the ones it shares
            with this one.
          </p>
        )}

        <Prose blocks={tool.summary.slice(0, 2)} size="sm" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Ships as</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {variants.map((v) => (
                <Chip key={v.name} title={v.note ?? SURFACE_CLASS_META[v.class].label}>
                  {v.name}
                  <span className="ml-1.5 text-ink-3">{SURFACE_CLASS_META[v.class].short}</span>
                </Chip>
              ))}
            </div>
          </div>
          {tool.riskNotes?.length ? (
            <div>
              <p className="eyebrow">Risks it changes the shape of</p>
              <ul className="mt-1.5 space-y-1">
                {tool.riskNotes.map((rn) => (
                  <li key={rn.risk} className="text-[12px] leading-snug text-ink-2">
                    <Link href={`/risks?risk=${rn.risk}`} className="hover:underline">
                      <span className="ident mr-1 rounded-sm border border-line-strong bg-mist px-1 py-px text-[9.5px] font-bold text-ink-2">
                        {riskCode(rn.risk)}
                      </span>
                      <span className="font-semibold text-ink">{riskById.get(rn.risk)?.title ?? rn.risk}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {tool.facts?.length ? (
          <dl className="grid gap-x-6 gap-y-1.5 rounded-lg border border-line bg-mist/40 px-4 py-3 text-[12px] sm:grid-cols-[max-content_minmax(0,1fr)]">
            {tool.facts.map((f) => (
              <div key={f.label} className="contents">
                <dt className="eyebrow sm:pt-[3px]">{f.label}</dt>
                <dd className="text-ink-2">
                  {f.value}
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer" className="ml-1.5 text-introduced hover:underline">
                      ↗
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <ToolControlsTable tool={tool} archetypeId={archetype.id} />

        <p className="text-[12px] text-ink-3">
          <Link href={`/tooling?tool=${tool.id}`} className="font-semibold text-introduced hover:underline">
            Full record on the AI Tooling tab →
          </Link>
          <span className="mx-2">·</span>
          <Link href={`/tooling?view=compare&arch=${archetype.id}`} className="font-semibold text-introduced hover:underline">
            Compare every product on this architecture →
          </Link>
        </p>
      </div>
    </div>
  );
}
