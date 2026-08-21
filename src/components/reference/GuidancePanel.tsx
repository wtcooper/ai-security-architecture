"use client";

/**
 * The controls-guidance panel: the rung below the architecture prose, for admins, architects
 * and security teams — what an organisation enforces around this class of system. Rendered
 * only where a guidance document exists; an absent panel means the layer has not reached this
 * architecture yet, not that there is nothing to enforce.
 *
 * Developer-facing setup guidance and starter templates live in the ai-security-sdlc project;
 * this panel is deliberately the org-controls side only.
 */
import Link from "next/link";

import { Prose } from "@/components/Prose";
import { capabilityById, guidanceByArchetype, guidanceToolById } from "@/lib/data";
import type { Archetype, GuidanceItem, GuidanceMode, GuidanceTool } from "@/lib/types";
import { Section } from "./ArchetypeDetail";

const MODE_LABEL: Record<GuidanceMode, string> = {
  build: "Your teams build this",
  use: "Your teams use a vendor's",
  hybrid: "Built and consumed",
};

export function GuidancePanel({ archetype }: { archetype: Archetype }) {
  const doc = guidanceByArchetype.get(archetype.id);
  if (!doc) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
        <h2 className="display text-[16px] font-bold leading-tight text-ink">
          Controls guidance
        </h2>
        <span className="ident rounded-full border border-line-strong px-2 py-[3px] text-[10.5px] font-semibold text-ink-2">
          {MODE_LABEL[doc.mode]}
        </span>
        {doc.status === "draft" && (
          <span
            title="This guidance document is a draft under active review — verify each claim against the cited sources before enforcing it."
            className="ident cursor-help rounded-full border px-2 py-[3px] text-[10.5px] font-semibold"
            style={{ borderColor: "var(--band-data-rail)", color: "var(--band-data-rail)" }}
          >
            Draft
          </span>
        )}
      </div>
      <p className="mt-1 px-1 text-[12.5px] leading-snug text-ink-3">
        For security teams, architects and admins: what to enforce around this architecture.
        Every item cites capabilities pinned on the drawing above.
      </p>

      <div className="mt-3 rounded-xl border border-line bg-paper">
        <Section title="What governing this looks like" count={null} defaultOpen>
          <Prose blocks={doc.overview} size="sm" />
        </Section>

        {doc.items.map((item) => (
          <Section key={item.title} title={item.title} count={null}>
            <GuidanceItemBody item={item} />
          </Section>
        ))}

        <Section title="Sources" count={doc.sources.length} last>
          <ul className="space-y-1.5">
            {doc.sources.map((s) => (
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
    </div>
  );
}

function GuidanceItemBody({ item }: { item: GuidanceItem }) {
  const tools = (item.tools ?? [])
    .map((id) => guidanceToolById.get(id))
    .filter((t): t is GuidanceTool => Boolean(t));

  return (
    <div className="space-y-3">
      <Prose blocks={item.body} size="sm" />

      {/* The capabilities this item directs the organisation to deploy — always pinned on the
          drawing, so each chip is also on the canvas above. */}
      <div className="flex flex-wrap gap-1.5">
        {item.capabilities.map((id) => (
          <Link
            key={id}
            href={`/capabilities?capability=${id}`}
            className="rounded-full border border-introduced bg-introduced-soft px-2.5 py-1 text-[11.5px] font-semibold leading-none text-introduced hover:underline"
          >
            {capabilityById.get(id)?.title ?? id}
          </Link>
        ))}
      </div>

      {tools.length > 0 && (
        <div>
          <p className="mb-2 text-[12px] leading-snug text-ink-3">
            Dated product specifics, not the taxonomy — verify against the vendor&rsquo;s current
            documentation before enforcing.
          </p>
          <div className="space-y-2.5">
            {tools.map((tool) => (
              <ToolBlock key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {(item.links?.length ?? 0) > 0 && (
        <ul className="space-y-1">
          {item.links!.map((link) => (
            <li key={link.url} className="text-[12.5px] leading-snug">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-ink-2 hover:text-introduced hover:underline"
              >
                {link.title} →
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ToolBlock({ tool }: { tool: GuidanceTool }) {
  return (
    <div className="rounded-lg border border-line bg-mist/40 px-3.5 py-3">
      <p className="text-[13.5px] font-semibold text-ink">
        {tool.name}
        <span className="ml-2 text-[11.5px] font-medium text-ink-3">{tool.vendor}</span>
        <span className="ident ml-2 text-[10.5px] font-medium text-ink-3">as of {tool.asOf}</span>
      </p>
      <div className="mt-1">
        <Prose blocks={tool.summary} size="sm" />
      </div>
      <div className="mt-2 space-y-2">
        {tool.items.map((ti) => (
          <div key={ti.title}>
            <p className="text-[12.5px] font-semibold text-ink-2">{ti.title}</p>
            <div className="mt-0.5">
              <Prose blocks={ti.body} size="sm" />
            </div>
            {(ti.links?.length ?? 0) > 0 && (
              <ul className="mt-1 space-y-0.5">
                {ti.links!.map((link) => (
                  <li key={link.url} className="text-[12px] leading-snug">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink-3 hover:text-introduced hover:underline"
                    >
                      {link.title} →
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
