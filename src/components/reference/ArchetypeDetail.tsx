"use client";

/**
 * The prose below the diagram. The diagram carries the security content — this panel carries
 * the reading: how the pattern works, every component and what it holds (the drawing shows one
 * line per box; this is the full list), how to govern it (the guidance, as prose), why it is its own pattern, the products that are examples
 * of it, where its drawing departs from the catalogue's rules, and where the claims come from. Collapsed except the narrative,
 * because the earlier version of this tab taught that showing everything at once reads as noise.
 */
import { useState, type ReactNode } from "react";

import { Prose } from "@/components/Prose";
import { CloudComparison } from "@/components/cloud/CloudViews";
import { bindingFor, cloudProductsFor, type CloudProduct } from "@/components/cloud/model";
import { summaryOf } from "@/components/drawing/layout";
import { capabilityName, guidanceByArchetype } from "@/lib/data";
import type { Archetype } from "@/lib/types";

export function ArchetypeDetail({ archetype, cloud = null }: { archetype: Archetype; /** The cloud the pattern is shown as built on. */ cloud?: CloudProduct | null }) {
  const cloudProducts = cloudProductsFor(archetype.id);
  const guidance = guidanceByArchetype.get(archetype.id);
  return (
    <div className="rounded-xl border border-line bg-paper">
      <Section title="How it works" count={null} defaultOpen>
        <Prose blocks={archetype.description} size="sm" />
      </Section>

      <Section title="Components" count={archetype.blocks.length}>
        <p className="mb-3 text-[12.5px] leading-snug text-ink-3">
          Every box on the drawing, by the boundary it sits in, with what it holds.
        </p>
        <ComponentList archetype={archetype} cloud={cloud} />
      </Section>

      {cloudProducts.length > 0 && (
        // Open when a cloud is chosen: the reader has asked how the pattern is built.
        <Section key={cloud?.id ?? "generic"} title="On each cloud" count={cloudProducts.length} defaultOpen={Boolean(cloud)}>
          <p className="mb-3 max-w-3xl text-[12.5px] leading-snug text-ink-3">
            What plays each component on {cloudProducts.map((p) => p.cloud.short).join(", ")}, side by side. A control-plane box is a
            function, so its row lists the settings that deliver its controls; their values are on Enable.
          </p>
          <CloudComparison archetype={archetype} products={cloudProducts} />
        </Section>
      )}

      {guidance && (
        // The reasoning behind the controls, as prose. The steps themselves are on Enable.
        <Section title={`How to govern this pattern${guidance.status === "draft" ? " · draft" : ""}`} count={guidance.items.length}>
          <div className="max-w-3xl">
            <Prose blocks={guidance.overview} size="sm" />
            <ol className="mt-4 space-y-4">
              {guidance.items.map((item) => (
                <li key={item.title} data-guidance-item className="text-[13px] leading-snug text-ink-2">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <div className="mt-1"><Prose blocks={item.body} size="sm" /></div>
                  <p className="mt-1 text-[12px] text-ink-3">
                    Controls:{" "}
                    {item.mitigations
                      .filter((id) => archetype.mitigations.includes(id))
                      .map((id) => `${archetype.mitigations.indexOf(id) + 1} ${capabilityName(id)}`)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      )}

      {archetype.distinguishedBy?.length ? (
        <Section title="Why this is its own pattern" count={null}>
          <Prose blocks={archetype.distinguishedBy} size="sm" />
        </Section>
      ) : null}

      {archetype.exemplars?.length ? (
        <Section title="Examples" count={archetype.exemplars.length}>
          <ul className="space-y-2.5">
            {archetype.exemplars.map((e) => (
              <li key={e.name} className="text-[13px] leading-snug text-ink-2">
                {e.url ? (
                  <a href={e.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
                    {e.name} ↗
                  </a>
                ) : (
                  <span className="font-semibold text-ink">{e.name}</span>
                )}
                {e.asOf && <span className="ident ml-2 text-[10.5px] text-ink-3">as of {e.asOf}</span>}
                {e.note && <span className="mt-0.5 block">{e.note.trim()}</span>}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {archetype.deviations?.length ? (
        <Section title="Where this drawing departs from the catalogue's rules" count={archetype.deviations.length}>
          <ul className="space-y-3">
            {archetype.deviations.map((d) => (
              <li key={d.subject} className="text-[13px] leading-snug text-ink-2">
                <span className="font-semibold text-ink">{d.subject}</span>
                <span className="mt-0.5 block">{d.reason.trim()}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Sources" count={archetype.sources.length} last>
        <ul className="space-y-1.5">
          {archetype.sources.map((s) => (
            <li key={s.url} className="text-[13px] leading-snug">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-ink-2 hover:text-introduced hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/** Every box of the pattern with its note and everything it holds: the full list behind the drawing's one-liners. */
export function ComponentList({ archetype, cloud = null }: { archetype: Archetype; cloud?: CloudProduct | null }) {
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
                  <span className="mt-0.5 block text-ink" data-component-service>
                    <span className="font-semibold">On {cloud.cloud.short}: </span>
                    {bindingFor(cloud, b.id)!.service}
                    {bindingFor(cloud, b.id)!.build && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-3">You build this</span>}
                  </span>
                )}
                  {b.note && <span className="mt-0.5 block">{b.note.trim()}</span>}
                  {b.items?.length ? (
                    <ul className="mt-1.5 space-y-1 border-l border-line pl-3">
                      {b.items.map((it) => (
                        <li key={it.label} className="text-[12.5px] leading-snug">
                          <span className="font-medium text-ink">{it.label}</span>
                          {it.note && <span className="text-ink-2">: {it.note.trim()}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
