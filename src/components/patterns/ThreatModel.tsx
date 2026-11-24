"use client";

/**
 * A pattern's Threat model tab, read top down: the executive summary, where risk concentrates
 * and a compact table of the threats; each row opens, as a control row does on Enable, to how it
 * happens here, where (lit on the drawing while the row is open), the risks it is, its ATLAS
 * techniques and OWASP items, the controls that break it, its incidents and sources. Beneath,
 * folded: assets and threat actors, OWASP coverage, design review questions, scope and rating.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { Section } from "@/components/reference/ArchetypeDetail";
import { archetypeById, atlasTechniques, controlName, frameworkById, frameworkEntries, incidentById, riskById, riskCode, threatModelFor } from "@/lib/data";
import { incidentHref, patternHref, riskHref } from "@/lib/routes";
import type { Archetype, Threat, ThreatModel } from "@/lib/types";
import { EVIDENCE_WORD, RATING_STYLE, owaspShort } from "./threat-style";

/** The few framework tags a closed row has room for. */
const TAGS_SHOWN = 3;

/** A place on the drawing in the reader's words: the box's title, or both ends of the arrow. */
export function placeName(archetype: Archetype, place: string) {
  const title = (id: string) => archetype.blocks.find((b) => b.id === id)?.title ?? id;
  return place.includes("->") ? place.split("->").map(title).join(" → ") : title(place);
}

/** The OWASP list an id belongs to, among the lists the model names. */
const listOf = (model: ThreatModel, id: string) => model.lists.find((l) => frameworkEntries[l]?.[id]);
const owaspLabel = (model: ThreatModel, id: string) => frameworkEntries[listOf(model, id) ?? ""]?.[id]?.label ?? id;

export function RatingChip({ rating }: { rating: Threat["rating"] }) {
  const s = RATING_STYLE[rating];
  return (
    <span className="inline-block rounded-full border px-2 py-px text-[11px] font-bold leading-[16px]" style={{ background: s.background, color: s.color, borderColor: s.border }} data-rating={rating}>
      {s.label}
    </span>
  );
}

function ControlChip({ n, lit = false }: { n?: number; lit?: boolean }) {
  return (
    <span className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${lit ? "border-chip bg-chip text-white" : "border-chip bg-chip-soft text-chip"}`}>{n}</span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3 sm:pt-0.5">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

function ThreatDetail({ archetype, model, threat, onPickControl, onShowDrawing }: { archetype: Archetype; model: ThreatModel; threat: Threat; onPickControl: (id: string) => void; onShowDrawing?: () => void }) {
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  const link = "font-semibold text-introduced hover:underline";
  return (
    <div className="space-y-3 border-t border-line bg-mist/30 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-2 md:pl-[60px]" data-threat-detail={threat.id}>
      <p className="max-w-3xl text-[13.5px] leading-relaxed text-ink" data-threat-story>
        {threat.story.trim()}
      </p>
      <dl className="grid gap-x-5 gap-y-2.5 sm:grid-cols-[130px_minmax(0,1fr)]">
        <Field label="Where it happens">
          <span className="flex flex-wrap items-center gap-1.5" data-threat-places>
            {threat.at.map((p) => (
              <span key={p} className="rounded border border-exposed-ink/40 bg-paper px-1.5 py-px text-[12px] font-semibold text-ink" data-threat-place={p}>
                {placeName(archetype, p)}
              </span>
            ))}
            {onShowDrawing && (
              <button type="button" onClick={onShowDrawing} className={`${link} text-[12px]`}>
                ↑ See it on the drawing
              </button>
            )}
          </span>
        </Field>
        <Field label="The risks it is">
          <span className="flex flex-wrap gap-x-3 gap-y-1" data-threat-risks>
            {threat.risks.map((id) => (
              <Link key={id} href={riskHref(id)} className="inline-flex items-baseline gap-1.5 text-ink hover:text-introduced hover:underline" data-threat-risk={id}>
                <span className="font-mono rounded-sm border border-line-strong bg-mist px-1 py-px text-[10px] font-bold text-ink-2">{riskCode(id)}</span>
                {riskById.get(id)?.title ?? id}
              </Link>
            ))}
          </span>
        </Field>
        {threat.atlas.length > 0 && (
          <Field label="MITRE ATLAS">
            <ul className="space-y-0.5" data-threat-atlas>
              {threat.atlas.map((id) => (
                <li key={id}>
                  <a href={`https://atlas.mitre.org/techniques/${id}`} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline" data-atlas={id}>
                    <span className="font-mono text-[11px] font-semibold text-ink-2">{id}</span> <span className="font-semibold text-ink">{atlasTechniques[id]?.name ?? id}</span> <span className="text-[11px] text-introduced">↗</span>
                  </a>
                  {atlasTechniques[id]?.tactics.length ? <span className="text-ink-3"> · {atlasTechniques[id].tactics.join(", ")}</span> : null}
                </li>
              ))}
            </ul>
          </Field>
        )}
        {threat.owasp.length > 0 && (
          <Field label="OWASP">
            <ul className="space-y-0.5" data-threat-owasp>
              {threat.owasp.map((id) => (
                <li key={id} data-owasp={id}>
                  <span className="font-mono text-[11px] font-semibold text-ink-2">{id}</span> <span className="text-ink">{owaspLabel(model, id)}</span>
                </li>
              ))}
            </ul>
          </Field>
        )}
        <Field label="Broken by">
          <span className="flex flex-wrap gap-1.5" data-threat-controls>
            {threat.controls.map((id) => (
              <Link
                key={id}
                href={patternHref(archetype.id, { control: id })}
                onClick={(e) => {
                  // On the page, the chip's own move: Enable, with its row open. A modified click opens the address.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  onPickControl(id);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-1 pr-2.5 text-[12px] text-ink-2 hover:border-chip hover:text-ink"
                data-threat-control={id}
              >
                <ControlChip n={number.get(id)} />
                {controlName(id)}
              </Link>
            ))}
          </span>
        </Field>
        {(threat.incidents?.length ?? 0) > 0 && (
          <Field label="Incidents">
            <ul className="space-y-0.5" data-threat-incidents>
              {threat.incidents!.map((id) => (
                <li key={id}>
                  <Link href={incidentHref(id)} className="font-semibold text-ink hover:text-introduced hover:underline" data-threat-incident={id}>
                    {incidentById.get(id)?.title ?? id} →
                  </Link>
                  {incidentById.get(id) && incidentById.get(id)!.archetype !== archetype.id && (
                    <span className="text-ink-3"> · on the {archetypeById.get(incidentById.get(id)!.archetype)?.abbrev ?? archetypeById.get(incidentById.get(id)!.archetype)?.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </Field>
        )}
        {(threat.refs?.length ?? 0) > 0 && (
          <Field label="Sources">
            <ul className="space-y-0.5" data-threat-refs>
              {threat.refs!.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-ink hover:text-introduced hover:underline">
                    {r.title} <span className="text-[11px] text-introduced">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Field>
        )}
      </dl>
    </div>
  );
}

export function ThreatModelPanel({
  archetype,
  open,
  onOpen,
  onPickControl,
  onShowDrawing,
  foldsOpen = false,
}: {
  archetype: Archetype;
  /** The threat whose row is open, which is also what the drawing lights. */
  open: string | null;
  onOpen: (id: string | null) => void;
  /** Opens a control's row on Enable. */
  onPickControl: (id: string) => void;
  /** Brings the drawing back into view; offered in an open row. */
  onShowDrawing?: () => void;
  /** Opens the folds beneath the table; they are closed for a reader. */
  foldsOpen?: boolean;
}) {
  const model = threatModelFor(archetype.id);
  if (!model) {
    return (
      <div className="rounded-xl border border-line bg-paper px-5 py-6" data-threat-model-pending>
        <p className="text-[14px] font-semibold text-ink">The threat model for this pattern is being written.</p>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
          Until it is published, the risks that enter the pattern are under How it works, and the controls that reduce them are on Enable.
        </p>
      </div>
    );
  }
  const counts = (["critical", "high", "medium", "low"] as const).map((r) => [r, model.threats.filter((t) => t.rating === r).length] as const).filter(([, n]) => n);
  const GRID = "md:grid-cols-[28px_minmax(0,1fr)_82px_92px_minmax(0,150px)]";
  const reveal = (id: string) => {
    onOpen(id);
    requestAnimationFrame(() => document.getElementById(`threat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  return (
    <section aria-label="Threat model" data-threat-model={model.pattern} className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <div className="px-5 pb-4 pt-4" data-threat-summary>
          <p className="eyebrow">Executive summary</p>
          <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink">{model.summary.trim()}</p>
          <div className="mt-3 max-w-3xl rounded-r-md border-l-[3px] border-exposed-ink bg-exposed-soft/50 px-3 py-2" data-concentrates>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.05em] text-exposed-ink">Where risk concentrates</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{model.concentrates.trim()}</p>
          </div>
          <p className="mt-3 text-[12px] text-ink-3">
            {model.threats.length} threats, most severe first: {counts.map(([r, n]) => `${n} ${RATING_STYLE[r].label.toLowerCase()}`).join(", ")}. Open one to light where it happens on the drawing. Reviewed {model.reviewed}.
          </p>
        </div>
        <div className={`hidden gap-4 border-y border-line bg-mist/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${GRID}`}>
          <span aria-hidden />
          <span>Threat</span>
          <span>Rating</span>
          <span>Evidence</span>
          <span>OWASP</span>
        </div>
        <ul className="divide-y divide-line border-t border-line md:border-t-0" data-threat-table>
          {model.threats.map((t) => {
            const expanded = open === t.id;
            const more = t.owasp.length - TAGS_SHOWN;
            return (
              <li key={t.id} id={`threat-${t.id}`} className="scroll-mt-24" data-threat={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen(expanded ? null : t.id)}
                  aria-expanded={expanded}
                  className={`grid w-full grid-cols-[28px_minmax(0,1fr)] items-start gap-x-4 gap-y-1 px-4 py-2.5 text-left transition-colors hover:bg-mist/50 ${expanded ? "bg-mist/50" : ""} ${GRID}`}
                >
                  <span className={`font-mono pt-px text-[11px] font-bold ${expanded ? "text-ink" : "text-ink-2"}`}>{t.id}</span>
                  <span className="text-[13.5px] font-semibold leading-snug text-ink" data-threat-title>
                    {t.title}
                  </span>
                  <span className="col-start-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 md:contents">
                    <span className="md:pt-px">
                      <RatingChip rating={t.rating} />
                    </span>
                    <span className="text-[12px] text-ink-2 md:pt-0.5" title={EVIDENCE_WORD[t.evidence].help} data-evidence={t.evidence}>
                      {EVIDENCE_WORD[t.evidence].label}
                    </span>
                    <span className="flex flex-wrap gap-1 md:pt-px" data-threat-tags>
                      {t.owasp.slice(0, TAGS_SHOWN).map((id) => (
                        <span key={id} title={`${id} ${owaspLabel(model, id)}`} className="font-mono rounded border border-line bg-mist px-1 py-px text-[10.5px] font-semibold text-ink-2">
                          {owaspShort(id)}
                        </span>
                      ))}
                      {more > 0 && <span className="text-[11px] text-ink-3">+{more}</span>}
                    </span>
                  </span>
                </button>
                {expanded && <ThreatDetail archetype={archetype} model={model} threat={t} onPickControl={onPickControl} onShowDrawing={onShowDrawing} />}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-line bg-paper" data-threat-folds>
        <Section title="Assets and threat actors" count={null} defaultOpen={foldsOpen}>
          <AssetsAndActors model={model} />
        </Section>
        <Section title="OWASP coverage" count={null} defaultOpen={foldsOpen}>
          <OwaspCoverage model={model} onReveal={reveal} />
        </Section>
        <Section title="Design review questions" count={model.questions.length} defaultOpen={foldsOpen}>
          <ol className="max-w-3xl list-inside list-decimal space-y-1.5 text-[13px] leading-snug text-ink-2 marker:font-semibold marker:text-ink-3" data-threat-questions>
            {model.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </Section>
        <Section title="Scope and rating" count={null} defaultOpen={foldsOpen} last>
          <p className="max-w-3xl text-[13px] leading-relaxed text-ink-2" data-threat-scope>
            <span className="font-semibold text-ink">Rated for: </span>
            {model.scope.trim()}{" "}
            <span className="text-ink-3">Ratings are inherent (before the controls) and change with the deployment; the evidence word says what shows each threat is real.</span>
          </p>
        </Section>
      </div>
    </section>
  );
}

/** The fold of what is at stake and who threatens it. */
export function AssetsAndActors({ model }: { model: ThreatModel }) {
  return (
    <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]" data-threat-assets>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">What is at stake</p>
        <ul className="mt-1.5 space-y-1 text-[13px] leading-snug text-ink-2">
          {model.assets.map((x) => (
            <li key={x} className="list-inside list-disc marker:text-ink-3">
              {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-[12.5px] leading-snug" data-threat-actors>
          <thead>
            <tr className="border-b border-line-strong text-[11px] uppercase tracking-[0.05em] text-ink-3">
              <th className="py-1.5 pr-4 font-semibold">Who</th>
              <th className="py-1.5 pr-4 font-semibold">What they can reach</th>
              <th className="py-1.5 font-semibold">What they want</th>
            </tr>
          </thead>
          <tbody>
            {model.actors.map((a) => (
              <tr key={a.who} className="border-b border-line align-top last:border-b-0">
                <th scope="row" className="py-1.5 pr-4 font-semibold text-ink">{a.who}</th>
                <td className="py-1.5 pr-4 text-ink-2">{a.access}</td>
                <td className="py-1.5 text-ink-2">{a.wants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The fold that checks every item of each OWASP list the model names: the threats that cover it, or why it does not apply. */
export function OwaspCoverage({ model, onReveal }: { model: ThreatModel; onReveal: (threatId: string) => void }) {
  return (
    <div className="space-y-5" data-owasp-coverage>
      {model.lists.map((l) => {
        const entries = Object.entries(frameworkEntries[l] ?? {});
        return (
          <div key={l} data-owasp-list={l}>
            <p className="text-[12.5px] font-semibold text-ink">{frameworkById.get(l)?.fullName ?? frameworkById.get(l)?.name ?? l}</p>
            <ul className="mt-1.5 divide-y divide-line rounded-lg border border-line">
              {entries.map(([id, e]) => {
                const by = model.threats.filter((t) => t.owasp.includes(id));
                const why = model.coverage.find((c) => c.id === id)?.why;
                return (
                  <li key={id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-0.5 px-3 py-1.5 text-[12.5px] leading-snug sm:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.2fr)]" data-owasp-item={id}>
                    <span className="font-mono pt-px text-[11px] font-semibold text-ink-2">{owaspShort(id)}</span>
                    <span className="font-semibold text-ink">{e.label}</span>
                    <span className="col-start-2 sm:col-start-auto">
                      {by.length ? (
                        <span className="flex flex-wrap items-center gap-1" data-covered-by>
                          {by.map((t) => (
                            <button key={t.id} type="button" onClick={() => onReveal(t.id)} title={t.title} className="font-mono rounded border border-line-strong bg-paper px-1.5 py-px text-[11px] font-bold text-ink hover:border-ink">
                              {t.id}
                            </button>
                          ))}
                        </span>
                      ) : (
                        <span className="text-ink-2" data-not-applicable>
                          <span className="font-semibold text-ink-2">Why no threat: </span>
                          {why}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
