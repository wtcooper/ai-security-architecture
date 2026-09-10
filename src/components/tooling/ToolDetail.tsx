"use client";

/** One product: what it is, where it runs, and how each reference control is switched on. */
import Link from "next/link";

import { Chip } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/reference/ArchetypeDetail";
import { archetypeById, org, orgAdoptionFor, orgPostureFor, riskById, riskCode, vendorById } from "@/lib/data";
import type { Tool, ToolVariant } from "@/lib/types";
import { ADOPTION_META, SURFACE_CLASS_META } from "./labels";
import { useOrgOverlay } from "./overlay";
import { OverlayToggle } from "./OverlayToggle";
import { ToolControlsTable } from "./ToolControlsTable";

const STATUS_LABEL = { ga: "GA", beta: "Beta", preview: "Preview", announced: "Announced" } as const;

export function ToolDetail({ tool, openCapability }: { tool: Tool; openCapability?: string | null }) {
  const overlay = useOrgOverlay();
  const vendor = vendorById.get(tool.vendor);
  const arch = archetypeById.get(tool.architecture);
  const adoption = orgAdoptionFor(tool.id);
  const posture = orgPostureFor(tool.id);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="eyebrow">
          {vendor?.name ?? tool.vendor} · {tool.family}
        </p>
        {tool.status && (
          <span className="ident rounded-full border border-line-strong px-2 py-[2px] text-[10.5px] font-semibold text-ink-2">
            {STATUS_LABEL[tool.status]}
          </span>
        )}
        <span className="ident text-[10.5px] text-ink-3">as of {tool.asOf}</span>
        <OverlayToggle className="ml-auto" />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <h2 className="display text-[27px] font-bold leading-tight text-ink">{tool.name}</h2>
        {overlay && (
          <span
            className="rounded-full border border-ink px-2.5 py-[3px] text-[11.5px] font-semibold text-ink"
            title={`${org.example ? "Example organisation" : org.name}: ${ADOPTION_META[adoption].blurb}${posture?.note ? ` — ${posture.note}` : ""}`}
          >
            {ADOPTION_META[adoption].label}
            {org.example && <span className="ml-1 font-normal text-ink-3">· example</span>}
          </span>
        )}
      </div>

      <Prose blocks={tool.summary} className="mt-4" />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Ships as</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(tool.variants?.length
              ? tool.variants
              : tool.surfaceClasses.map((c): ToolVariant => ({ name: SURFACE_CLASS_META[c].label, class: c }))
            ).map((v) => (
              <Chip key={v.name} title={v.note ?? SURFACE_CLASS_META[v.class].label}>
                {v.url ? (
                  <a href={v.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {v.name}
                  </a>
                ) : (
                  v.name
                )}
                <span className="ml-1.5 text-ink-3">{SURFACE_CLASS_META[v.class].short}</span>
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow">Reference architecture</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {arch && (
              <Link href={`/reference?archetype=${arch.id}`}>
                <Chip tone="introduced">{arch.title}</Chip>
              </Link>
            )}
          </div>
          {arch && (
            <p className="mt-1.5 text-[12px] leading-snug text-ink-3">
              The drawing fixes the reference control set: {arch.capabilities.length} capabilities and{" "}
              {arch.risks.length} risks pinned on it.{" "}
              <Link href={`/tooling?arch=${arch.id}`} className="font-semibold text-introduced hover:underline">
                All products in this category →
              </Link>
            </p>
          )}
        </div>
      </div>

      {tool.facts?.length ? (
        <dl className="mt-5 grid gap-x-6 gap-y-2 rounded-lg border border-line bg-mist/40 px-4 py-3 text-[12.5px] sm:grid-cols-[max-content_minmax(0,1fr)]">
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

      <div className="mt-6">
        <ToolControlsTable tool={tool} openCapability={openCapability} />
      </div>

      {tool.riskNotes?.length ? (
        <div className="mt-6">
          <p className="eyebrow">Risks this tool emphasises</p>
          <ul className="mt-2 space-y-1.5">
            {tool.riskNotes.map((rn) => (
              <li key={rn.risk} className="text-[12.5px] leading-snug text-ink-2">
                <Link href={`/risks?risk=${rn.risk}`} className="mr-1.5 hover:underline">
                  <span className="ident rounded-sm border border-line-strong bg-mist px-1 py-px text-[9.5px] font-bold text-ink-2">
                    {riskCode(rn.risk)}
                  </span>{" "}
                  <span className="font-semibold text-ink">{riskById.get(rn.risk)?.title ?? rn.risk}</span>
                </Link>
                {rn.note}
              </li>
            ))}
          </ul>
          {arch && (
            <p className="mt-1.5 text-[11.5px] text-ink-3">
              Every risk tagged on{" "}
              <Link href={`/reference?archetype=${arch.id}`} className="font-medium hover:underline">
                the architecture
              </Link>{" "}
              applies; these are the ones this product changes the shape of.
            </p>
          )}
        </div>
      ) : null}

      {(tool.items.length > 0 || tool.advisories?.length) && (
        <div className="mt-6 rounded-xl border border-line">
          {tool.items.map((item, i) => (
            <Section key={item.title} title={item.title} count={null} defaultOpen={i === 0} last={i === tool.items.length - 1 && !tool.advisories?.length}>
              <Prose blocks={item.body} size="sm" />
              {(item.links?.length ?? 0) > 0 && (
                <ul className="mt-2 space-y-1">
                  {item.links!.map((l) => (
                    <li key={l.url} className="text-[12.5px] leading-snug">
                      <a href={l.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline">
                        {l.title} →
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          ))}
          {tool.advisories?.length ? (
            <Section title="Advisories & incidents" count={tool.advisories.length} last>
              <ul className="space-y-1.5">
                {tool.advisories.map((a) => (
                  <li key={a.url} className="text-[12.5px] leading-snug">
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline">
                      {a.title} →
                    </a>
                    {a.date && <span className="ident ml-1.5 text-ink-3">{a.date}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      )}

      <div className="mt-6 border-t border-line pt-4">
        <p className="eyebrow">Sources · verified {tool.asOf}</p>
        <ul className="mt-1.5 space-y-1">
          {tool.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-[13px] text-introduced hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
