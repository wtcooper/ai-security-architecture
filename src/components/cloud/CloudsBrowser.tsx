"use client";

/**
 * Reference › Clouds: one cloud at a time. First the patterns that are mapped onto it, each
 * with what it is there and the vendor's own reference architecture it follows; then every
 * control the cloud has an option for, under its NIST CSF category, with the setting, where it
 * is set, the value to set and the patterns that use it. The same data a pattern shows when it
 * is read as built on a cloud, turned round to answer "what does this cloud give me?".
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { SETTING_VIA_META } from "@/components/enable/labels";
import { capabilityName, clouds, enablement, mitigationById } from "@/lib/data";
import { cloudHref, controlHref, patternHref } from "@/lib/routes";
import type { Paragraph } from "@/lib/types";
import { cloudFromSlug, cloudOptionsForControl, patternsOn, platformWords } from "./model";

const first = (blocks?: Paragraph[]) => {
  const b = blocks?.[0];
  return b ? (Array.isArray(b) ? b.join(" ") : b).replace(/\s+/g, " ").trim() : "";
};

export function CloudsBrowser() {
  const params = useSearchParams();
  const cloud = cloudFromSlug(params.get("cloud")) ?? clouds[0];
  const patterns = patternsOn(cloud);
  const words = platformWords(cloud);
  // Every control this cloud has an option for, under its CSF category, in CSF order.
  const groups = enablement.groups
    .map((g) => ({
      group: g,
      controls: g.mitigations
        .map((id) => ({ id, options: cloudOptionsForControl(id).find((c) => c.cloud.id === cloud.id)?.options ?? [] }))
        .filter((c) => c.options.length && mitigationById.has(c.id)),
    }))
    .filter((g) => g.controls.length);
  const controlCount = groups.reduce((n, g) => n + g.controls.length, 0);
  // Settings a pattern lists that deliver no pinned control: hardening the cloud recommends anyway.
  const extras = cloud.settings
    .filter((s) => !s.mitigations.length)
    .map((s) => ({ setting: s, patterns: patterns.filter((a) => cloud.implementations.find((i) => i.architecture === a.id)?.settings.includes(s.id)) }))
    .filter((e) => e.patterns.length);

  return (
    <>
      <PageHeader
        eyebrow="Reference · Clouds & on-premises"
        title="Patterns and controls, platform by platform"
        lead="For each cloud, and for your own data centre: the patterns mapped onto it, with what plays each component, and the platform's own setting for every control, with the value to set. A pattern shows the same thing for itself when you choose Built on."
      >
        <div className="mt-5 flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-line bg-mist p-1" role="tablist" aria-label="Platform">
          {clouds.map((c) => (
            <Link
              key={c.id}
              href={cloudHref(c.id)}
              role="tab"
              aria-selected={c.id === cloud.id}
              scroll={false}
              className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                c.id === cloud.id ? "bg-ink text-white" : "text-ink-2 hover:bg-paper hover:text-ink"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl px-6 py-8" data-cloud-page={cloud.id}>
        <h2 className="display text-[18px] font-bold text-ink">
          {words.own ? "Patterns run on-premises" : `Patterns built on ${cloud.short}`} <span className="ml-1 text-[12px] font-normal text-ink-3">{patterns.length}</span>
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
          {words.own
            ? "Each opens the pattern drawn with the software that plays every component and its setting beside every control."
            : `Each opens the pattern drawn with ${cloud.short}'s services on every component and ${cloud.short}'s option beside every control.`}
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {patterns.map((a) => {
            const impl = cloud.implementations.find((i) => i.architecture === a.id)!;
            return (
              <li key={a.id} className="flex flex-col rounded-xl border border-line bg-paper p-4" data-cloud-pattern={a.id}>
                <Link href={patternHref(a.id, { cloud: cloud.id })} className="display text-[15px] font-semibold text-ink hover:text-introduced">
                  {a.title} →
                </Link>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-snug text-ink-2">{first(impl.summary)}</p>
                <p className="ident mt-2 text-[11px] text-ink-3">
                  {impl.bindings.length} components named · {impl.settings.length} settings · verified {impl.asOf}
                </p>
                {impl.reference.length > 0 && (
                  <p className="mt-1.5 text-[12px] leading-snug text-ink-3">
                    Follows{" "}
                    {impl.reference.map((r, i) => (
                      <span key={r.url}>
                        {i > 0 && " · "}
                        <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-introduced hover:underline">
                          {r.title}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <h2 className="display mt-12 text-[18px] font-bold text-ink">
          {words.own ? "The on-premises option for each control" : `${cloud.short}'s own option for each control`}{" "}
          <span className="ml-1 text-[12px] font-normal text-ink-3">
            {controlCount} controls · {cloud.settings.length} settings
          </span>
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
          Grouped by NIST CSF category. Each setting links to {words.docs} and names the patterns that use it; where{" "}
          {words.own ? "no product has a setting" : `${cloud.short} has no managed option`}, the row says what you build.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-paper">
          {groups.map(({ group, controls }) => (
            <section key={group.id} aria-labelledby={`cloud-group-${group.id}`}>
              <div className="border-b border-line bg-mist/40 px-4 py-2">
                <p id={`cloud-group-${group.id}`} className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                  {group.title}
                  <span className="ident rounded-sm border border-line-strong bg-paper px-1 py-px text-[9.5px] font-bold tracking-normal text-ink-3">{group.id}</span>
                </p>
              </div>
              <ul className="divide-y divide-line border-b border-line">
                {controls.map(({ id, options }) => (
                  <li key={id} className="grid gap-x-6 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]" data-cloud-control={id}>
                    <div>
                      <Link href={controlHref(id)} className="text-[13.5px] font-semibold leading-snug text-ink hover:text-introduced hover:underline">
                        {capabilityName(id)}
                      </Link>
                      <p className="ident mt-0.5 text-[10.5px] text-ink-3">{id}</p>
                    </div>
                    <ul className="space-y-3">
                      {options.map(({ setting: s, patterns: used }) => (
                        <li key={s.id} className="text-[12.5px] leading-snug">
                          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
                              {s.name}
                              <span className="ml-0.5 text-introduced">↗</span>
                            </a>
                            {s.setVia.map((v) => (
                              <span key={v} title={SETTING_VIA_META[v].blurb} className="rounded border border-line bg-mist px-1.5 py-px text-[10.5px] font-semibold text-ink-2">
                                {SETTING_VIA_META[v].label}
                              </span>
                            ))}
                          </p>
                          <p className="ident mt-0.5 break-words text-[10.5px] text-ink-3">{s.where}</p>
                          <p className="mt-1">
                            <span className="font-semibold text-ink">Set to: </span>
                            <span className="text-ink">{s.recommended}</span>
                          </p>
                          <p className="text-ink-2">{s.why}</p>
                          <p className="mt-1 text-[11.5px] text-ink-3">
                            Used on{" "}
                            {used.map((a, i) => (
                              <span key={a.id}>
                                {i > 0 && " · "}
                                <Link href={patternHref(a.id, { cloud: cloud.id, control: id })} className="hover:text-introduced hover:underline">
                                  {a.abbrev ?? a.title}
                                </Link>
                              </span>
                            ))}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {extras.length > 0 && (
            <section aria-labelledby="cloud-group-extras">
              <div className="border-b border-line bg-mist/40 px-4 py-2">
                <p id="cloud-group-extras" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2">Also set on {cloud.short}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-3">Hardening the patterns list that is not one of the numbered controls on a drawing.</p>
              </div>
              <ul className="divide-y divide-line">
                {extras.map(({ setting: s, patterns: used }) => (
                  <li key={s.id} className="px-4 py-3 text-[12.5px] leading-snug" data-cloud-extra={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
                      {s.name}
                      <span className="ml-0.5 text-introduced">↗</span>
                    </a>
                    <p className="ident mt-0.5 break-words text-[10.5px] text-ink-3">{s.where}</p>
                    <p className="mt-1">
                      <span className="font-semibold text-ink">Set to: </span>
                      <span className="text-ink">{s.recommended}</span>
                    </p>
                    <p className="text-ink-2">{s.why}</p>
                    <p className="mt-1 text-[11.5px] text-ink-3">Used on {used.map((a) => a.abbrev ?? a.title).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
