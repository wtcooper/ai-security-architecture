"use client";

/** One product: what it is, where it runs, and how it covers each capability its architecture needs. */
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Chip } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { Section } from "@/components/reference/ArchetypeDetail";
import { archetypeById, capabilityName, riskById, riskCode, vendorById } from "@/lib/data";
import type { Tool, ToolVariant } from "@/lib/types";
import { CoverageMark } from "./CoverageMark";
import { COVERAGE_WORD, coverageWord, SURFACE_CLASS_META } from "./labels";
import { LAYER_META, pinnedByLayer, toolControlFor } from "./model";

const RELEASE_LABEL = { ga: "GA", beta: "Beta", preview: "Preview", announced: "Announced" } as const;

export function ToolRecord({ tool, focus, onClose }: { tool: Tool; focus?: string | null; onClose?: () => void }) {
  const vendor = vendorById.get(tool.vendor);
  const arch = archetypeById.get(tool.architecture)!;
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus, tool.id]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="eyebrow">
          {vendor?.name ?? tool.vendor} · {tool.family}
        </p>
        {tool.status && (
          <span className="ident rounded-full border border-line-strong px-2 py-[2px] text-[10.5px] font-semibold text-ink-2">
            {RELEASE_LABEL[tool.status]}
          </span>
        )}
        <span className="ident text-[10.5px] text-ink-3">verified {tool.asOf}</span>
        {onClose && (
          <button type="button" onClick={onClose} className="ml-auto text-[12px] font-semibold text-ink-3 hover:text-ink">
            Close ✕
          </button>
        )}
      </div>
      <h3 className="display mt-1.5 text-[24px] font-bold leading-tight text-ink">{tool.name}</h3>
      <Prose blocks={tool.summary} className="mt-3" />

      <div className="mt-4">
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
            </Chip>
          ))}
        </div>
      </div>

      {tool.facts?.length ? (
        <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-lg border border-line bg-mist/40 px-4 py-3 text-[12.5px] sm:grid-cols-[max-content_minmax(0,1fr)]">
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
        <p className="eyebrow">How {tool.name} covers each capability</p>
        <div className="mt-2 space-y-4">
          {pinnedByLayer(arch).map(({ layer, capabilities }) => (
            <div key={layer}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                {LAYER_META[layer].n} · {LAYER_META[layer].title}
              </p>
              <div className="mt-1 divide-y divide-line rounded-lg border border-line">
                {capabilities.map((m) => {
                  const control = toolControlFor(tool, m.id);
                  const mark = coverageWord(control?.coverage);
                  const word = COVERAGE_WORD[mark];
                  const open = focus === m.id;
                  return (
                    <div key={m.id} ref={open ? focusRef : undefined}>
                      <details open={open} className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 hover:bg-mist/60">
                          <span className="flex w-[112px] shrink-0 items-center gap-1.5 text-[12px] font-semibold text-ink-2" title={word.blurb}>
                            <CoverageMark word={mark} />
                            {word.label}
                          </span>
                          <span className="min-w-0 flex-1 text-[13px] text-ink">{capabilityName(m.id)}</span>
                          <span className="text-[11px] text-ink-3 transition-transform group-open:rotate-90">›</span>
                        </summary>
                        <div className="px-3 pb-3 pl-[136px] max-sm:pl-3">
                          {control?.mechanism && (
                            <p className="text-[12.5px] text-ink-2">
                              <span className="eyebrow mr-2">Where</span>
                              {control.mechanism}
                            </p>
                          )}
                          {control?.note && <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{control.note}</p>}
                          {control?.steps?.length ? (
                            <ol className="mt-2 space-y-2">
                              {control.steps.map((step, si) => (
                                <li key={`${step.title}-${si}`} className="flex gap-2.5">
                                  <span className="ident mt-[2px] shrink-0 text-ink-3">{si + 1}</span>
                                  <div className="min-w-0">
                                    <p className="text-[12.5px] font-semibold text-ink">
                                      {step.url ? (
                                        <a href={step.url} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline">
                                          {step.title} ↗
                                        </a>
                                      ) : (
                                        step.title
                                      )}
                                    </p>
                                    <Prose blocks={step.body} size="sm" />
                                  </div>
                                </li>
                              ))}
                            </ol>
                          ) : null}
                          {control?.evidence?.length ? (
                            <p className="mt-2 text-[11.5px] leading-snug text-ink-3">
                              <span className="eyebrow mr-1">Checked at</span>
                              {control.evidence.map((e, i) => (
                                <span key={e.url}>
                                  {i > 0 && " · "}
                                  <a href={e.url} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline">
                                    {e.title} ↗
                                  </a>
                                </span>
                              ))}
                            </p>
                          ) : null}
                          {!control && <p className="text-[12.5px] text-ink-3">No vendor record yet for this capability.</p>}
                          {coverageWord(control?.coverage) === "notInTool" && (
                            <p className="mt-1.5 text-[12px] text-ink-3">
                              Cover it with the {LAYER_META[layer].short.toLowerCase()} layer, or another product.
                            </p>
                          )}
                          {control?.verified && <p className="ident mt-2 text-[10.5px] text-ink-3">verified {control.verified}</p>}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {tool.riskNotes?.length ? (
        <div className="mt-6">
          <p className="eyebrow">Risks this product changes the shape of</p>
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
        </div>
      ) : null}

      {(tool.items.length > 0 || tool.advisories?.length) && (
        <div className="mt-6 rounded-xl border border-line">
          {tool.items.map((item, i) => (
            <Section key={item.title} title={item.title} count={null} last={i === tool.items.length - 1 && !tool.advisories?.length}>
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
