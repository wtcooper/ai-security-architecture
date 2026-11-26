"use client";

/**
 * One incident pattern (/incidents/<slug>/), laid out like a pattern page: a breadcrumb bar,
 * the name and its one-liner, then the sections in reading order. What it is (Overview), the
 * chain in general terms (How it works), what it looks like (Signs), the controls that stop it,
 * the patterns it lands on, its deep dives, the newest feed reports, the risks and framework
 * entries it is, and the incident patterns it is not. A section whose field the file leaves out,
 * or which has nothing under it yet, is not shown.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { archetypeById, atlasTechniques, controlName, frameworkEntries, incidentById, incidentPatternById, incidentPatternView, riskCode, riskTitle } from "@/lib/data";
import { FEED_ON_INCIDENT_PATTERN, feedForCategory } from "@/lib/feed";
import { categoryColour } from "@/lib/incident-categories";
import { THREAT_LISTS, type FeedItem, type IncidentPatternAuthored } from "@/lib/types";
import { controlHref, feedHref, incidentHref, incidentPatternHref, incidentReportsHref, patternHref, riskHref } from "@/lib/routes";
import { CategoryDot, EvidenceTag, IncidentsBreadcrumb, plural } from "./chrome";
import { formatDay, formatMonth } from "./model";

export { FEED_ON_INCIDENT_PATTERN };

/** An OWASP id's name, from whichever of the lists the threat models use carries it. */
const owaspLabel = (id: string) => THREAT_LISTS.map((l) => frameworkEntries[l]?.[id]?.label).find(Boolean) ?? id;

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} id={id} className="scroll-mt-20" data-section={id}>
      <h2 id={`${id}-title`} className="display flex items-baseline gap-2 border-b border-line pb-1.5 text-[17px] font-bold text-ink">
        {title}
        {count !== undefined && <span className="text-[13px] font-normal text-ink-3">{count}</span>}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function IncidentPatternPage({
  id,
  pattern: given,
  feed: whole,
  reports: newest = [],
}: {
  /** The incident pattern's id. */
  id?: string;
  /** The incident pattern itself, for a test; the dataset's by `id` otherwise. */
  pattern?: IncidentPatternAuthored;
  /** A whole feed to work everything out from, for a test. */
  feed?: FeedItem[];
  /** Its newest incidents, newest first, as the page was built with them; the count and landings are the dataset's. */
  reports?: FeedItem[];
}) {
  const authored = given ?? incidentPatternById.get(id ?? "");
  if (!authored) return null;
  const pattern = incidentPatternView(authored, whole);
  const reports = whole ? feedForCategory(pattern.id, whole) : newest;
  const total = pattern.feedCount;
  const deepDives = pattern.deepDives.map((d) => incidentById.get(d)).filter((d) => d !== undefined);
  const colour = categoryColour(pattern.id);
  const frameworks = (pattern.owasp?.length ?? 0) + (pattern.atlas?.length ?? 0);

  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto w-full max-w-5xl px-6 py-3">
          <IncidentsBreadcrumb trail={[{ label: pattern.name }]} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-6">
        <div className="max-w-4xl">
          <p className="eyebrow flex items-center gap-2">
            <CategoryDot category={pattern.id} />
            Incident pattern
          </p>
          <h1 className="display mt-1.5 text-[26px] font-bold leading-tight text-ink sm:text-[30px]">{pattern.name}</h1>
          <p className="mt-2 text-[15px] leading-snug text-ink">{pattern.short}</p>
          <p className="ident mt-2 text-ink-3" data-incident-pattern-facts>
            {plural(deepDives.length, "deep dive")} · {plural(total, "report")} in the feed · since {formatDay(pattern.since)}
          </p>
        </div>

        <div className="mt-7 max-w-4xl space-y-8">
          {pattern.overview && (
            <Section id="overview" title="Overview">
              <p className="text-[14px] leading-relaxed text-ink-2">{pattern.overview}</p>
            </Section>
          )}

          {pattern.howItWorks && pattern.howItWorks.length > 0 && (
            <Section id="how-it-works" title="How it works">
              <ol className="space-y-2.5">
                {pattern.howItWorks.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-snug text-ink-2">
                    <span className="display flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: colour.rail }}>
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {pattern.signs && pattern.signs.length > 0 && (
            <Section id="signs" title="Signs">
              <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-snug text-ink-2 marker:text-ink-3">
                {pattern.signs.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Section>
          )}

          {pattern.stops && pattern.stops.length > 0 && (
            <Section id="stops" title="What stops it" count={pattern.stops.length}>
              <ul className="space-y-3">
                {pattern.stops.map((s) => (
                  <li key={s.control} data-stop={s.control}>
                    <Link
                      href={controlHref(s.control)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-chip bg-chip-soft px-2.5 py-[3px] text-[12.5px] font-semibold text-chip hover:underline"
                    >
                      {controlName(s.control)}
                    </Link>
                    <p className="mt-1 text-[13.5px] leading-snug text-ink-2">{s.how}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {pattern.landsOn.length > 0 && (
            <Section id="lands" title="Where it lands" count={pattern.landsOn.length}>
              <p className="mb-2 text-[13px] leading-snug text-ink-3">The patterns its incidents happened on or would replay on, most often first.</p>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
                {pattern.landsOn.map((l) => (
                  <li key={l.pattern} data-lands={l.pattern}>
                    <Link href={patternHref(l.pattern, { tab: "incidents" })} className="flex items-baseline justify-between gap-4 px-4 py-2 transition-colors hover:bg-mist/60">
                      <span className="min-w-0 text-[13.5px] font-medium text-ink">{archetypeById.get(l.pattern)?.title ?? l.pattern}</span>
                      <span className="shrink-0 text-right text-[12px] text-ink-3">
                        <span className="font-semibold text-ink-2">{plural(l.count, "incident")}</span>
                        <span className="hidden sm:inline">
                          {" "}
                          · {l.feed} in the feed · {plural(l.deepDives, "deep dive")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {deepDives.length > 0 && (
            <Section id="deep-dives" title="Deep dives" count={deepDives.length}>
              <p className="mb-2 text-[13px] leading-snug text-ink-3">Real incidents of this incident pattern, each told step by step across the pattern it happened on.</p>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
                {deepDives.map((d) => (
                  <li key={d.id} data-deep-dive={d.id}>
                    <Link href={incidentHref(d.id)} className="grid grid-cols-1 gap-x-5 gap-y-1 px-4 py-3 transition-colors hover:bg-mist/60 sm:grid-cols-[76px_minmax(0,1fr)_170px] sm:px-5">
                      <span className="ident pt-0.5 text-ink-3">{formatMonth(d.date)}</span>
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-semibold leading-snug text-ink">{d.title}</span>
                        <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-ink-2">{d.subtitle}</span>
                      </span>
                      <span className="text-[12px] leading-snug text-ink-3 sm:text-right">{archetypeById.get(d.archetype)?.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {reports.length > 0 && (
            <Section id="feed" title="Recent in the feed" count={total}>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
                {reports.slice(0, FEED_ON_INCIDENT_PATTERN).map((f) => (
                  <li key={f.id} data-feed-item={f.id}>
                    <Link
                      href={feedHref({}, f.id)}
                      className="grid grid-cols-[72px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 px-4 py-2.5 transition-colors hover:bg-mist/60 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:px-5"
                    >
                      <span className="ident whitespace-nowrap text-ink-3">{formatDay(f.date)}</span>
                      <span className="min-w-0 text-[13.5px] font-medium leading-snug text-ink">{f.title}</span>
                      <span className="col-start-2 sm:col-start-auto sm:text-right">
                        <EvidenceTag evidence={f.evidence ?? ""} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={incidentReportsHref({ category: pattern.id })} className="mt-2.5 inline-block text-[13px] font-semibold text-introduced hover:underline">
                All {total} incident reports →
              </Link>
            </Section>
          )}

          {!deepDives.length && !reports.length && (
            <p className="rounded-xl border border-line bg-paper px-5 py-5 text-[13.5px] text-ink-2">Nothing is filed under this incident pattern yet.</p>
          )}

          {((pattern.risks?.length ?? 0) > 0 || frameworks > 0) && (
            <Section id="risks" title="Risks and frameworks">
              <div className="space-y-4">
                {pattern.risks && pattern.risks.length > 0 && (
                  <div>
                    <p className="eyebrow">Risks</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {pattern.risks.map((r) => (
                        <Link
                          key={r}
                          href={riskHref(r)}
                          data-risk={r}
                          className="inline-flex items-center gap-1.5 rounded-full bg-exposed-soft px-2.5 py-[3px] text-[12px] font-medium text-exposed-ink hover:underline"
                        >
                          <span className="ident text-[10px] font-bold text-exposed-ink">{riskCode(r)}</span>
                          {riskTitle(r)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {pattern.owasp && pattern.owasp.length > 0 && (
                  <div>
                    <p className="eyebrow">OWASP</p>
                    <ul className="mt-1.5 space-y-0.5 text-[13px] leading-snug">
                      {pattern.owasp.map((o) => (
                        <li key={o} data-owasp={o}>
                          <span className="font-mono text-[11px] font-semibold text-ink-2">{o}</span> <span className="text-ink">{owaspLabel(o)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pattern.atlas && pattern.atlas.length > 0 && (
                  <div>
                    <p className="eyebrow">MITRE ATLAS</p>
                    <ul className="mt-1.5 space-y-0.5 text-[13px] leading-snug">
                      {pattern.atlas.map((a) => (
                        <li key={a} data-atlas={a}>
                          <a href={`https://atlas.mitre.org/techniques/${a}`} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline">
                            <span className="font-mono text-[11px] font-semibold text-ink-2">{a}</span> <span className="text-ink">{atlasTechniques[a]?.name ?? a}</span>{" "}
                            <span className="text-[11px] text-introduced">↗</span>
                          </a>
                          {atlasTechniques[a]?.tactics.length ? <span className="text-ink-3"> · {atlasTechniques[a].tactics.join(", ")}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          {pattern.notSameAs && pattern.notSameAs.length > 0 && (
            <Section id="not-same-as" title="Not the same as">
              <ul className="space-y-2.5">
                {pattern.notSameAs.map((c) => (
                  <li key={c.pattern} data-not-same-as={c.pattern} className="text-[13.5px] leading-snug">
                    <Link href={incidentPatternHref(c.pattern)} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-introduced hover:underline">
                      <CategoryDot category={c.pattern} />
                      {incidentPatternById.get(c.pattern)?.name ?? c.pattern}
                    </Link>
                    <p className="mt-0.5 text-ink-2">{c.why}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
