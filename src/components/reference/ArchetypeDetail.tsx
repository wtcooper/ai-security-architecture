"use client";

/**
 * The prose below the diagram. The diagram carries the security content — this panel carries
 * the reading: how the pattern works, every component and what it holds (the drawing shows one
 * line per box; this is the full list), how to govern it (the guidance, as prose), why it is its own pattern, the products that are examples
 * of it, where its drawing departs from the catalogue's rules, and where the claims come from. Collapsed except the narrative,
 * because the earlier version of this tab taught that showing everything at once reads as noise.
 */
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { CloudComparison, OnCloud } from "@/components/cloud/CloudViews";
import { bindingFor, cloudProductsFor, isControlBox, KIND_LABEL, NO_STACK, productsInEffect, stackChosen, type CloudProduct, type Stack } from "@/components/cloud/model";
import { summaryOf } from "@/components/drawing/layout";
import { packShort } from "@/components/enable/ChooseStack";
import { componentChoiceFor, fillsOn, toolsForArchetype } from "@/lib/data";
import { patternHref } from "@/lib/routes";
import type { Archetype, CloudBinding, ComponentChoice, WatchNote } from "@/lib/types";

/**
 * What a box is built with, kept apart from where it runs: the catalogued frameworks and servers
 * that fill it, and, with a platform chosen, the one that platform's own guides use.
 */
function BuiltWith({ archetype, blockId, cloud }: { archetype: Archetype; blockId: string; cloud: CloudProduct | null }) {
  const tools = toolsForArchetype(archetype.id).filter((t) => fillsOn(t, archetype.id).includes(blockId));
  const usual = cloud ? bindingFor(cloud, blockId)?.builtWith : undefined;
  if (!tools.length && !usual) return null;
  return (
    <span className="mt-0.5 block text-[12.5px] text-ink-2" data-component-built-with>
      <span className="font-semibold text-ink">Built with: </span>
      {usual && (
        <>
          {usual} ({cloud!.cloud.selfManaged ? "this mapping's default" : `${cloud!.cloud.short}'s guides`})
          {tools.length ? " · or " : ""}
        </>
      )}
      {tools.length > 0 && (
        <>
          {tools.map((t, i) => (
            <span key={t.id}>
              {i > 0 && " · "}
              <Link href={patternHref(archetype.id, { tool: t.id, cloud: cloud?.id })} className="font-semibold text-introduced hover:underline">
                {t.name}
              </Link>
            </span>
          ))}
        </>
      )}
    </span>
  );
}

/** What the organisation recorded it runs for a component (data/org/products.yaml), with its own module or runbook. */
function OurChoice({ choice }: { choice?: ComponentChoice }) {
  if (!choice) return null;
  return (
    <span className="mt-0.5 block text-ink" data-component-ours>
      <span className="font-semibold">Your organisation uses: </span>
      {choice.link ? (
        <a href={choice.link} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline">
          {choice.uses} <span className="text-[11px] text-introduced">↗</span>
        </a>
      ) : (
        choice.uses
      )}
      {choice.note && <span className="block text-[12px] text-ink-3">{choice.note}</span>}
    </span>
  );
}

export function ArchetypeDetail({
  archetype,
  cloud = null,
  stack = NO_STACK,
  onEnable,
  risks,
}: {
  archetype: Archetype;
  /** The cloud the pattern is shown as built on. */
  cloud?: CloudProduct | null;
  /** Where the platform has packs: the pack and add-ons chosen, which put a product on each box. */
  stack?: Stack;
  /** Opens the Enable tab, where the pattern is put in place. */
  onEnable?: () => void;
  /** The risks that enter the pattern, as a folded section. */
  risks?: ReactNode;
}) {
  const cloudProducts = cloudProductsFor(archetype.id);
  return (
    <div className="rounded-xl border border-line bg-paper">
      {onEnable && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-mist/50 px-5 py-3" data-enable-link>
          <p className="text-[13px] leading-snug text-ink-2">
            The {archetype.mitigations.length} controls this pattern needs, and the settings that deliver them, are on Enable.
          </p>
          <button type="button" onClick={onEnable} className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-ink-2">
            How to enable it →
          </button>
        </div>
      )}
      <Section title="Overview" count={null} defaultOpen>
        <p className="max-w-3xl text-[13.5px] leading-relaxed text-ink-2" data-overview>
          {archetype.overview}
        </p>
      </Section>

      {risks && archetype.risks.length > 0 && (
        <Section title="Risks" count={archetype.risks.length}>
          {risks}
        </Section>
      )}

      <Section key={`components-${cloud?.id ?? "generic"}`} title="Components" count={archetype.blocks.length} defaultOpen={Boolean(cloud)}>
        <ComponentList archetype={archetype} cloud={cloud} stack={stack} />
      </Section>

      {cloud && (
        <div id="on-cloud" className="scroll-mt-28">
          <Section key={`on-${cloud.id}`} title={cloud.cloud.selfManaged ? "On-premises: what differs and what else you run" : `On ${cloud.cloud.name}: what differs and what else you need`} count={null} defaultOpen>
            <OnCloud archetype={archetype} product={cloud} />
          </Section>
        </div>
      )}

      {cloudProducts.length > 1 && (
        <Section key={cloud?.id ?? "generic"} title={cloudProducts.some((p) => p.cloud.selfManaged) ? "Each platform side by side" : "Each cloud side by side"} count={cloudProducts.length}>
          <CloudComparison archetype={archetype} products={cloudProducts} />
        </Section>
      )}

      {archetype.exemplars?.length ? (
        <Section title="Examples" count={archetype.exemplars.length}>
          <ul className="space-y-2">
            {archetype.exemplars.map((e) => (
              <li key={e.name} className="text-[13px] leading-snug text-ink-2" data-example={e.name}>
                {e.url ? (
                  <a href={e.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
                    {e.name} ↗
                  </a>
                ) : (
                  <span className="font-semibold text-ink">{e.name}</span>
                )}
                {e.fills && (
                  <span className="ml-2 inline-block rounded border border-line bg-mist px-1.5 py-px align-[1px] text-[10.5px] font-semibold text-ink-2" data-example-fills={e.fills} title="The box on the drawing it is an example of">
                    {archetype.blocks.find((b) => b.id === e.fills)?.title ?? e.fills}
                  </span>
                )}
                {e.note && <span className="mt-0.5 block">{e.note.trim()}</span>}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Sources" count={archetype.sources.length} last>
        <ul className="space-y-1.5">
          {archetype.sources.map((s) => (
            <li key={s.url} className="text-[13px] leading-snug">
              <a href={s.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/** Notes on a product or a bound service: its limits, edition requirements, preview status and quirks. */
function Watch({ notes }: { notes?: WatchNote[] }) {
  if (!notes?.length) return null;
  return (
    <ul className="mt-0.5 space-y-0.5 text-[11.5px] text-ink-3" data-watch>
      {notes.map((w, i) => (
        <li key={i}>
          <span className="font-semibold text-ink-2">Watch: </span>
          {w.text}
          {w.url && (
            <>
              {" "}
              <a href={w.url} target="_blank" rel="noreferrer" className="font-semibold text-introduced hover:underline">
                Source ↗
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Where the organisation chooses the product: the role, the product the chosen stack puts there,
 * and every option with its kind and the packs it is part of, none ranked.
 */
function ComponentOptions({ archetype, cloud, binding, stack }: { archetype: Archetype; cloud: CloudProduct; binding: CloudBinding; stack: Stack }) {
  const packs = new Map((cloud.cloud.packs ?? []).map((p) => [p.id, p]));
  const inEffect = productsInEffect(binding, stack, isControlBox(archetype, binding.block));
  return (
    <div className="mt-1" data-component-options={binding.block}>
      {stackChosen(stack) && (
        <p className="text-ink" data-component-in-effect>
          <span className="font-semibold">In your stack: </span>
          {inEffect.length ? inEffect.map((o) => o.name).join(" · ") : <span className="text-ink-3">nothing: you bring your own</span>}
        </p>
      )}
      <p className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-3">Options, none ranked</p>
      <ul className="mt-0.5 space-y-1">
        {binding.options!.map((o) => (
          <li key={o.name} className="text-[12.5px]" data-component-option={o.name} data-in-effect={inEffect.includes(o) || undefined}>
            <a href={o.url} target="_blank" rel="noreferrer" className={`${inEffect.includes(o) ? "font-bold" : "font-semibold"} text-ink hover:text-introduced hover:underline`}>
              {o.name} <span className="text-[11px] text-introduced">↗</span>
            </a>
            <span className="text-ink-3"> · {KIND_LABEL[o.kind]}</span>
            {(o.packs ?? []).length > 0 && <span className="text-ink-3"> · in {(o.packs ?? []).map((id) => (packs.get(id) ? packShort(packs.get(id)!) : id)).join(", ")}</span>}
            {o.note && <span className="block text-[12px] text-ink-2">{o.note}</span>}
            <Watch notes={o.watch} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComponentList({ archetype, cloud = null, stack = NO_STACK }: { archetype: Archetype; cloud?: CloudProduct | null; stack?: Stack }) {
  return (
      <div className="space-y-5">
        {componentGroups(archetype).map((g) => (
          <div key={g.zone}>
            <p className="ident text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">{g.title}</p>
            <ul className="mt-2 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {g.blocks.map((b) => (
                <li key={b.id} data-component={b.id} className="text-[13px] leading-snug text-ink-2">
                  <span className="font-semibold text-ink">{b.title}</span>
                  {summaryOf(b) && <span className="text-ink-3"> · {summaryOf(b)}</span>}
                {cloud && bindingFor(cloud, b.id) && (
                  <div className="mt-0.5 text-ink" data-component-service>
                    {/* On-premises a box with options names its role; on a provider's cloud it keeps the service drawn. */}
                    <span className="font-semibold">{bindingFor(cloud, b.id)!.options && cloud.cloud.selfManaged ? "Role on-premises: " : cloud.cloud.selfManaged ? "On-premises: " : `On ${cloud.cloud.short}: `}</span>
                    {bindingFor(cloud, b.id)!.url && !(bindingFor(cloud, b.id)!.options && cloud.cloud.selfManaged) ? (
                      <a href={bindingFor(cloud, b.id)!.url} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline">
                        {bindingFor(cloud, b.id)!.service}
                      </a>
                    ) : (
                      bindingFor(cloud, b.id)!.service
                    )}
                    {bindingFor(cloud, b.id)!.build && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-3">You build this</span>}
                    {bindingFor(cloud, b.id)!.url && !(bindingFor(cloud, b.id)!.options && cloud.cloud.selfManaged) && <span className="ml-1 text-[11px] text-introduced">↗</span>}
                    {bindingFor(cloud, b.id)!.note && <span className="block text-[12px] text-ink-3">{bindingFor(cloud, b.id)!.note}</span>}
                    <Watch notes={bindingFor(cloud, b.id)!.watch} />
                    {bindingFor(cloud, b.id)!.options && <ComponentOptions archetype={archetype} cloud={cloud} binding={bindingFor(cloud, b.id)!} stack={stack} />}
                  </div>
                )}
                {cloud && <OurChoice choice={componentChoiceFor(cloud.id, archetype.id, b.id)} />}
                <BuiltWith archetype={archetype} blockId={b.id} cloud={cloud} />
                  {b.items?.length ? <span className="mt-0.5 block text-[12px] text-ink-3">Holds: {b.items.map((it) => it.label).join(" · ")}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
  );
}

/** The pattern's boxes under the boundary each sits in, boundaries in the pattern's own order. */
function componentGroups(archetype: Archetype) {
  const zones = archetype.zones ?? [];
  const title = (id: string) => zones.find((z) => z.id === id)?.title ?? "Components";
  const order = [...zones.map((z) => z.id), ...new Set(archetype.blocks.map((b) => b.zone ?? "").filter((z) => !zones.some((x) => x.id === z)))];
  return order
    .map((zone) => ({ zone, title: title(zone), blocks: archetype.blocks.filter((b) => (b.zone ?? "") === zone) }))
    .filter((g) => g.blocks.length);
}

/** Collapsible prose section, shared with the guidance panel below this component. */
export function Section({
  title,
  count,
  defaultOpen = false,
  last = false,
  children,
}: {
  title: string;
  count: number | null;
  defaultOpen?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={last ? "" : "border-b border-line"}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-3.5 text-left"
      >
        <span className="eyebrow flex-1">
          {title}
          {count !== null && <span className="ml-1.5 opacity-60">{count}</span>}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M 2 4 L 6 8 L 10 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
