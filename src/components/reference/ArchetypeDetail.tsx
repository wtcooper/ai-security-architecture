"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { bandFor } from "@/lib/bands";
import { BAND_TOKENS } from "@/lib/map-layout";
import {
  capabilityById,
  componentById,
  componentTitle,
  controlCategories,
  controlKindById,
  controlsForArchetype,
  nodeTypeById,
  riskById,
} from "@/lib/data";
import type { Archetype } from "@/lib/types";
import type { DiagramSelection } from "./ZoneDiagram";
import { personaShort, zonePersonaLabel } from "./zone-style";

/**
 * One panel, three modes: the archetype, a node, or a crossing.
 *
 * Everything below the summary is folded away. The earlier version put the whole record on screen
 * at once — description, zones, risks, capabilities, controls, exemplars, drawing decisions and
 * sources — which is the right content and the wrong amount of it to meet at once. Sections open
 * on demand; the two that answer "what is this and what should I put here" stay open.
 */
export function ArchetypeDetail({
  archetype,
  selection,
  onClear,
}: {
  archetype: Archetype;
  selection: DiagramSelection | null;
  onClear: () => void;
}) {
  if (selection?.kind === "node") {
    const node = archetype.nodes.find((n) => n.id === selection.id);
    if (node) return <NodeDetail archetype={archetype} node={node} onClear={onClear} />;
  }
  if (selection?.kind === "edge") {
    const edge = archetype.edges.find((e) => `${e.from}->${e.to}` === selection.id);
    if (edge) return <EdgeDetail archetype={archetype} edge={edge} onClear={onClear} />;
  }
  return <OverviewDetail archetype={archetype} />;
}

/** A disclosure row. Same idiom as the taxonomy pages' Panel, sized for inside a card. */
function Section({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="eyebrow flex-1 group-hover:text-ink">{title}</span>
        {count !== undefined && <span className="ident">{count}</span>}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          aria-hidden
          className="shrink-0 text-ink-3 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <path
            d="M4 6.5 L8 10.5 L12 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function Shell({
  eyebrow,
  title,
  onClear,
  children,
}: {
  eyebrow: string;
  title: string;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display mt-1.5 text-[24px] font-bold leading-tight text-ink">{title}</h2>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            aria-label="Back to the architecture"
            className="shrink-0 rounded-md p-1.5 text-ink-3 transition-colors hover:bg-mist hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// --- Overview -----------------------------------------------------------------------

function OverviewDetail({ archetype }: { archetype: Archetype }) {
  const controls = controlsForArchetype(archetype.id);
  const crossings = archetype.edges.filter((e) => e.control);

  // Which classes of control this architecture leans on, most-used first. The most useful single
  // answer to "what do we have to put in place", and it comes out of the diagram rather than prose.
  const byKind = new Map<string, number>();
  for (const e of crossings) {
    if (e.control) byKind.set(e.control.kind, (byKind.get(e.control.kind) ?? 0) + 1);
  }
  const kinds = [...byKind.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Shell eyebrow="Target reference architecture" title={archetype.title}>
      <Prose blocks={archetype.summary} className="mt-3" />

      <div className="mt-5">
        <p className="eyebrow">Controls this architecture requires</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {kinds.map(([kindId, n]) => {
            const kind = controlKindById.get(kindId);
            const capability = kind && capabilityById.get(kind.capability);
            return (
              <Link
                key={kindId}
                href={`/capabilities?capability=${kind?.capability}`}
                title={`${kind?.description ?? ""}\n\nDelivered by: ${capability?.title ?? ""}`}
              >
                <Chip tone="mitigated">
                  {kind?.title ?? kindId}
                  <span className="ml-1.5 opacity-60">{n}</span>
                </Chip>
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] text-ink-3">
          Every boundary on the diagram carries one of these. Each links to the capability that
          delivers it.
        </p>
      </div>

      <div className="mt-6">
        <Section title="How it works" defaultOpen>
          <Prose blocks={archetype.description} />
        </Section>

        {archetype.distinguishedBy?.length ? (
          <Section title="Why this is its own archetype">
            <Prose blocks={archetype.distinguishedBy} />
          </Section>
        ) : null}

        <Section title="Trust zones and who is responsible" count={archetype.zones.length}>
          <div className="space-y-2">
            {archetype.zones.map((zone) => (
              <div key={zone.id} className="rounded-lg border border-line p-3.5">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13.5px] font-semibold text-ink">
                  {zone.label}
                  {zone.personas.length ? (
                    zone.personas.map((id) => (
                      <Link key={id} href={`/personas?persona=${id}`}>
                        <Chip tone="introduced">{personaShort(id)}</Chip>
                      </Link>
                    ))
                  ) : (
                    <Chip>outside the system</Chip>
                  )}
                </p>
                {zone.note && <p className="mt-1 text-[13px] leading-snug text-ink-2">{zone.note}</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-ink-3">
            Zone names are canonical across every architecture here, so the same tier means the same
            thing on any two diagrams. Two personas on one zone is shared responsibility.
          </p>
        </Section>

        <Section title="Risks in this architecture" count={archetype.risks.length}>
          {archetype.crossCutting?.length ? (
            <div className="mb-4 space-y-2.5">
              <p className="eyebrow">Not localised to one node</p>
              {archetype.crossCutting.map((cc) => (
                <div key={cc.risk} className="border-l-2 border-exposed pl-3">
                  <Link
                    href={`/risks?risk=${cc.risk}`}
                    className="text-[13.5px] font-semibold text-ink hover:text-introduced"
                  >
                    {riskById.get(cc.risk)?.title ?? cc.risk}
                  </Link>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{cc.note}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {archetype.risks.map((id) => (
              <Link key={id} href={`/risks?risk=${id}`}>
                <Chip tone="exposed">{riskById.get(id)?.title ?? id}</Chip>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Capabilities to deploy" count={archetype.capabilities.length}>
          <div className="flex flex-wrap gap-1.5">
            {archetype.capabilities.map((id) => (
              <Link key={id} href={`/capabilities?capability=${id}`}>
                <Chip tone="mitigated">
                  {capabilityById.get(id)?.abbrev ?? capabilityById.get(id)?.title ?? id}
                </Chip>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="CoSAI controls reached" count={controls.length}>
          <div className="space-y-2">
            {controlCategories
              .filter((cat) => controls.some((c) => c.category === cat.id))
              .map((cat) => (
                <div key={cat.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
                  <span className="ident shrink-0">{cat.title}</span>
                  {controls
                    .filter((c) => c.category === cat.id)
                    .map((c) => (
                      <Link key={c.id} href={`/controls?control=${c.id}`}>
                        <Chip tone="mitigated">{c.title}</Chip>
                      </Link>
                    ))}
                </div>
              ))}
          </div>
          <p className="mt-2 text-[12px] text-ink-3">
            Derived from the capability mappings rather than authored here, so an architecture
            cannot claim a control its own tooling does not implement.
          </p>
        </Section>

        {archetype.exemplars?.length ? (
          <Section title="Real-world instances" count={archetype.exemplars.length}>
            <div className="space-y-2.5">
              {archetype.exemplars.map((ex) => (
                <div key={ex.name} className="rounded-lg border border-line p-3.5">
                  <p className="flex flex-wrap items-baseline gap-2 text-[13.5px] font-semibold text-ink">
                    {ex.url ? (
                      <a href={ex.url} target="_blank" rel="noreferrer" className="text-introduced hover:underline">
                        {ex.name}
                      </a>
                    ) : (
                      ex.name
                    )}
                    {ex.asOf && <span className="ident">as of {ex.asOf}</span>}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-ink-2">{ex.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-3">
              The architecture is vendor-neutral; named products are illustration only and are dated
              because this list ages faster than the taxonomy does.
            </p>
          </Section>
        ) : null}

        {archetype.deviations?.length ? (
          <Section title="Drawing decisions" count={archetype.deviations.length}>
            <div className="space-y-2.5">
              {archetype.deviations.map((d) => (
                <div key={d.subject} className="border-l-2 border-line-strong pl-3">
                  <p className="text-[13.5px] font-semibold text-ink">{d.subject}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{d.reason}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        <Section title="Sources" count={archetype.sources.length}>
          <ul className="space-y-1">
            {archetype.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-[13px] text-introduced hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Shell>
  );
}

// --- Node ---------------------------------------------------------------------------

function NodeDetail({
  archetype,
  node,
  onClear,
}: {
  archetype: Archetype;
  node: Archetype["nodes"][number];
  onClear: () => void;
}) {
  const type = nodeTypeById.get(node.type);
  const zone = archetype.zones.find((z) => z.id === node.zone);
  const anchor = node.cosaiComponent ?? type?.cosaiComponent;
  const component = anchor ? componentById.get(anchor) : undefined;
  const touching = archetype.edges.filter((e) => e.from === node.id || e.to === node.id);

  return (
    <Shell eyebrow={`${type?.title ?? node.type} · in ${zone?.label ?? node.zone}`} title={node.label} onClear={onClear}>
      {node.note && <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{node.note}</p>}

      {node.capabilities?.length ? (
        <div className="mt-5">
          <p className="eyebrow">Capabilities that secure this</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {node.capabilities.map((id) => (
              <Link key={id} href={`/capabilities?capability=${id}`}>
                <Chip tone="mitigated">
                  {capabilityById.get(id)?.abbrev ?? capabilityById.get(id)?.title ?? id}
                </Chip>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {type?.description && (
          <Section title="What this node type is, anywhere it appears">
            <p className="text-[13px] leading-snug text-ink-2">{type.description}</p>
          </Section>
        )}

        <Section title="Risks that surface here" count={node.risks?.length ?? 0}>
          <div className="flex flex-wrap gap-1.5">
            {node.risks?.length ? (
              node.risks.map((id) => (
                <Link key={id} href={`/risks?risk=${id}`}>
                  <Chip tone="exposed">{riskById.get(id)?.title ?? id}</Chip>
                </Link>
              ))
            ) : (
              <span className="text-[13px] text-ink-3">None pinned to this node specifically.</span>
            )}
          </div>
        </Section>

        <Section title="On the risk map">
          {component ? (
            <Link href={`/components?component=${component.id}`} className="inline-block">
              <Chip>
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{
                    background:
                      BAND_TOKENS[bandFor(component.id, component.category, component.subcategory)].rail,
                  }}
                />
                {componentTitle(component.id)}
              </Chip>
            </Link>
          ) : (
            <p className="text-[13px] leading-snug text-ink-3">
              CoSAI names no equivalent component. That is the case for the whole governance plane —
              identity, policy, registry, audit, approval and shutdown are absent from the risk-map
              taxonomy, and this node is one of the places that gap shows.
            </p>
          )}
        </Section>

        <Section title="Connections" count={touching.length}>
          <ul className="space-y-1.5">
            {touching.map((e) => {
              const other = e.from === node.id ? e.to : e.from;
              const otherNode = archetype.nodes.find((n) => n.id === other);
              return (
                <li key={`${e.from}->${e.to}`} className="text-[13px] text-ink-2">
                  <span className="ident">{e.from === node.id ? "out" : "in"}</span>{" "}
                  {otherNode?.label ?? other}
                  {e.label && <span className="text-ink-3"> · {e.label}</span>}
                  {e.control && <span className="text-mitigated"> · {e.control.title}</span>}
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </Shell>
  );
}

// --- Edge ---------------------------------------------------------------------------

function EdgeDetail({
  archetype,
  edge,
  onClear,
}: {
  archetype: Archetype;
  edge: Archetype["edges"][number];
  onClear: () => void;
}) {
  const from = archetype.nodes.find((n) => n.id === edge.from);
  const to = archetype.nodes.find((n) => n.id === edge.to);
  const fromZone = archetype.zones.find((z) => z.id === from?.zone);
  const toZone = archetype.zones.find((z) => z.id === to?.zone);
  const crosses = from?.zone !== to?.zone;
  const control = edge.control;
  const kind = control && controlKindById.get(control.kind);
  const capability = control && capabilityById.get(control.capability);

  return (
    <Shell
      eyebrow={crosses ? "Trust boundary crossing" : "Internal connection"}
      title={`${from?.label ?? edge.from} → ${to?.label ?? edge.to}`}
      onClear={onClear}
    >
      {edge.label && <p className="mt-3 text-[14px] leading-relaxed text-ink-2">Carries: {edge.label}</p>}

      {crosses && (
        <p className="mt-2 text-[13px] text-ink-3">
          {fromZone?.label} ({zonePersonaLabel(fromZone?.personas ?? [])}) → {toZone?.label} (
          {zonePersonaLabel(toZone?.personas ?? [])})
        </p>
      )}

      {control ? (
        <div className="mt-5 rounded-lg border border-mitigated p-4">
          <p className="eyebrow">Secured by</p>
          <p className="display mt-1 text-[18px] font-bold leading-tight text-mitigated">
            {control.title}
          </p>
          {kind?.description && (
            <p className="mt-1.5 text-[13px] leading-snug text-ink-3">{kind.description}</p>
          )}
          {control.note && (
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">{control.note}</p>
          )}
          {capability && (
            <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">
              Delivered by{" "}
              <Link
                href={`/capabilities?capability=${capability.id}`}
                className="font-semibold text-introduced hover:underline"
              >
                {capability.title}
              </Link>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-[13px] leading-snug text-ink-3">
          Inside one trust zone, so no boundary is crossed. The build requires a control on every
          crossing and leaves internal connections to the components at either end.
        </p>
      )}

      {edge.kind === "control" && (
        <p className="mt-3 text-[13px] leading-snug text-ink-3">
          A governance-plane relationship rather than a request path — drawn dashed and apart from
          the data flow.
        </p>
      )}

      {edge.risks?.length ? (
        <div className="mt-5">
          <p className="eyebrow">Risks on this edge</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {edge.risks.map((id) => (
              <Link key={id} href={`/risks?risk=${id}`}>
                <Chip tone="exposed">{riskById.get(id)?.title ?? id}</Chip>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
