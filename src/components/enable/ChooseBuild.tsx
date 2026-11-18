"use client";

/**
 * Step 2 of Enable on a hosted pattern: the choices a builder makes before any setting, in the
 * order they are made. Where it runs (a cloud, or the organisation's own data centre); how it is
 * hosted there (your own cluster, the platform's own runtime, or a managed agent service);
 * and what the boxes you build are built with (a framework or a server).
 *
 * The hosting options of a platform are compared on the same rows, each a sentence taken from the
 * vendor's own pages, with no ranking. Two of the three kinds keep the same pattern and change
 * only some components and settings; a managed agent service moves the agent loop into the
 * vendor's boundary, so it is drawn as another pattern and this step links to it. What the
 * organisation has approved (data/status.yaml) is marked on each option.
 */
import Link from "next/link";

import { HOSTING_KIND_LABEL, hostingInEffect, hostingOptionsFor, type CloudProduct } from "@/components/cloud/model";
import { archetypeById, hostingAdoptionFor, type Product } from "@/lib/data";
import { patternHref } from "@/lib/routes";
import { HOSTING_COMPARE, type Archetype, type HostingOption } from "@/lib/types";
import { AdoptionPill, ChoiceRow, ProductPills } from "./ProductSettings";

/** What choosing an option does, in a few words. */
const consequence = (option: HostingOption, inEffect: boolean) =>
  option.kind === "managed"
    ? "The vendor hosts and operates the agent, so this is drawn as another pattern"
    : inEffect
      ? "Shown on the drawing and in the settings below"
      : "The same pattern: some components and settings change";

function HostingCards({
  platform,
  host,
  onPickHost,
}: {
  platform: CloudProduct;
  host: string | null;
  onPickHost: (id: string | null) => void;
}) {
  const options = hostingOptionsFor(platform);
  const inEffect = hostingInEffect(platform, host)?.id;
  return (
    <div className="grid gap-2 md:grid-cols-3" role="group" aria-label="How it is hosted">
      {options.map((o) => {
        const on = o.id === inEffect;
        const approved = hostingAdoptionFor(platform.id, o.id);
        const other = o.kind === "managed" && o.pattern ? archetypeById.get(o.pattern) : undefined;
        const body = (
          <>
            <span className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
              <span className="text-[13px] font-semibold leading-snug text-ink">{o.name}</span>
              {approved.set && <AdoptionPill status={approved.status} title={approved.note ?? "Recorded in data/status.yaml"} />}
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{HOSTING_KIND_LABEL[o.kind]}</span>
            <span className="mt-1.5 block text-[12.5px] leading-snug text-ink-2">{o.compare.fits}</span>
            <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-3">{consequence(o, on)}</span>
          </>
        );
        const frame = `flex h-full flex-col justify-start rounded-lg border p-3 text-left transition-colors ${on ? "border-ink bg-paper ring-1 ring-ink" : "border-line bg-paper hover:border-ink-3"}`;
        return o.kind === "managed" ? (
          <div key={o.id} className={frame} data-hosting-option={o.id} data-hosting-kind={o.kind}>
            {body}
            {other && (
              <Link href={patternHref(other.id, o.tool ? { tool: o.tool } : {})} className="mt-2 block text-[12px] font-semibold text-introduced hover:underline" data-hosting-pattern={other.id}>
                Open the pattern for it: {other.title} →
              </Link>
            )}
          </div>
        ) : (
          <button key={o.id} type="button" aria-pressed={on} onClick={() => onPickHost(o.mapped ? null : o.id)} className={frame} data-hosting-option={o.id} data-hosting-kind={o.kind}>
            {body}
          </button>
        );
      })}
    </div>
  );
}

/** Every option on the same rows, a sentence each from the vendor's own pages. */
function HostingComparison({ platform }: { platform: CloudProduct }) {
  const options = hostingOptionsFor(platform);
  const sources = [...new Set(options.flatMap((o) => o.sources ?? []))];
  const offers = options.filter((o) => o.offers?.length);
  const asOf = options.map((o) => o.asOf).filter(Boolean).sort().at(-1);
  return (
    <details className="mt-3 rounded-lg border border-line bg-paper" open data-hosting-comparison>
      <summary className="cursor-pointer px-3 py-2 text-[12.5px] font-semibold text-ink">Compare them row by row</summary>
      <div className="overflow-x-auto border-t border-line px-3 pb-3 pt-2">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-[12.5px] leading-snug">
          <thead>
            <tr className="border-b border-line-strong text-[11px] uppercase tracking-[0.06em] text-ink-3">
              <th className="w-[17%] py-2 pr-4 font-semibold" />
              {options.map((o) => (
                <th key={o.id} className="py-2 pr-4 font-semibold">{o.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOSTING_COMPARE.map(([key, label]) => (
              <tr key={key} className="border-b border-line align-top" data-compare-row={key}>
                <th scope="row" className="py-2 pr-4 font-semibold text-ink">{label}</th>
                {options.map((o) => (
                  <td key={o.id} className="py-2 pr-4 text-ink-2">{o.compare[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {offers.map((o) => (
          <div key={o.id} className="mt-3 text-[12.5px] leading-snug text-ink-2" data-hosting-offers={o.id}>
            <p className="font-semibold text-ink">What {o.name} lets you build</p>
            <ul className="mt-1 space-y-1">
              {o.offers!.map((x) => (
                <li key={x.name}>
                  {x.url ? (
                    <a href={x.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
                      {x.name} ↗
                    </a>
                  ) : (
                    <span className="font-semibold text-ink">{x.name}</span>
                  )}
                  : {x.what}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-3 max-w-3xl text-[12px] leading-snug text-ink-3">
          Each cell is taken from the vendor&rsquo;s own pages{asOf ? `, read in ${asOf}` : ""}. Nothing here ranks the options: which is right depends on what your organisation has approved and what the work
          needs. A rule that usually holds: take the most managed option your organisation has approved that still meets your data-boundary and control requirements.
          {sources.length > 0 && (
            <>
              {" "}Sources:{" "}
              {sources.map((u, i) => (
                <span key={u}>
                  {i > 0 && " · "}
                  <a href={u} target="_blank" rel="noreferrer" className="font-semibold text-introduced hover:underline">
                    {i + 1} ↗
                  </a>
                </span>
              ))}
            </>
          )}
        </p>
      </div>
    </details>
  );
}

export function ChooseBuild({
  archetype,
  products,
  platform,
  framework,
  host,
  onPickPlatform,
  onPickHost,
  onPickFramework,
}: {
  archetype: Archetype;
  products: Product[];
  /** The platform the pattern is shown on, as hosted on the option in effect. */
  platform: CloudProduct | null;
  framework: Product | null;
  /** The hosting option chosen, or null for the one the mapping describes. */
  host: string | null;
  onPickPlatform: (id: string) => void;
  onPickHost: (id: string | null) => void;
  onPickFramework: (id: string | null) => void;
}) {
  const platforms = products.filter((p) => p.kind === "cloud");
  const frameworks = products.filter((p) => p.kind === "tool");
  const titles = new Map(archetype.blocks.map((b) => [b.id, b.title]));
  // The boxes the catalogued frameworks fill, as the reader sees them on the drawing.
  const filled = [...new Set(frameworks.flatMap((p) => (p.kind === "tool" ? p.tool.fills ?? [] : [])).map((id) => titles.get(id) ?? id))];
  const defaults = platform ? [...new Set(platform.implementation.bindings.map((b) => b.builtWith).filter((x): x is string => Boolean(x)))] : [];
  const options = platform ? hostingOptionsFor(platform) : [];
  const short = platform ? (platform.cloud.selfManaged ? "This mapping" : `${platform.cloud.short}'s own guides`) : "";
  return (
    <div className="space-y-4" data-choose-build>
      <ChoiceRow n="a" label="Where it runs" hint="a cloud, or your own data centre">
        <ProductPills products={platforms} selected={platform?.id ?? ""} onPick={onPickPlatform} label="Where it runs" />
      </ChoiceRow>

      <ChoiceRow n="b" label="How it is hosted there" hint="who runs the agent: you, the platform, or the vendor">
        {!platform ? (
          <p className="pt-1 text-[12.5px] leading-snug text-ink-3" data-hosting-wait>Pick where it runs first; that platform&rsquo;s ways of hosting it appear here.</p>
        ) : options.length ? (
          <>
            <HostingCards platform={platform} host={host} onPickHost={onPickHost} />
            <HostingComparison platform={platform} />
          </>
        ) : (
          <p className="pt-1 text-[12.5px] leading-snug text-ink-3" data-hosting-single>
            One way of hosting is mapped {platform.cloud.selfManaged ? "on-premises" : `on ${platform.cloud.short}`} so far: the one the drawing and the settings show. Its alternatives are not yet compared here.
          </p>
        )}
      </ChoiceRow>

      {frameworks.length > 0 && (
        <ChoiceRow n="c" label="What you build it with" hint={`fills ${filled.length === 1 ? "the" : "these boxes:"} ${filled.join(", ")}${filled.length === 1 ? " box" : ""}`}>
          <ProductPills products={frameworks} selected={framework?.id ?? ""} onPick={(id) => onPickFramework(id === framework?.id ? null : id)} label="What you build it with" />
          {defaults.length > 0 && !framework && (
            <p className="mt-1.5 text-[12px] leading-snug text-ink-3" data-default-framework>
              {short} build{platform!.cloud.selfManaged ? "s" : ""} it with {defaults.join(" and ")}. That is a default, not a requirement: any framework that fills the box runs there.
            </p>
          )}
        </ChoiceRow>
      )}
    </div>
  );
}
