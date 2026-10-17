"use client";

/**
 * Enable: what to put in place, in the order an organisation puts it in place. Foundations
 * every AI deployment needs, set up once; what the surface adds; what this use case adds; then
 * the tools — build, buy or both — and how far each covers the rest. Learn explains the risk;
 * this page is the reduction.
 */
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { Prose } from "@/components/Prose";
import { ArchPicker } from "@/components/reference/ArchPicker";
import { archetypeById, archetypesInOrder, guidanceByArchetype, status, statusFor, surfaces, toolById, toolsForArchetype, additionsFor } from "@/lib/data";
import type { Mitigation } from "@/lib/types";
import { CapabilityTable } from "./CapabilityTable";
import { foundationGroups, surfaceBaseline } from "./model";
import { ToolRecord } from "./ToolRecord";
import { ToolsMatrix } from "./ToolsMatrix";

const anyStatus = Object.values(status).some((s) => s.status);

/** "3 of 5 enabled", once the organisation has set any status at all. */
function Progress({ capabilities }: { capabilities: Mitigation[] }) {
  if (!anyStatus) return null;
  const enabled = capabilities.filter((m) => statusFor(m.id) === "enabled").length;
  return <span className="text-[12px] font-normal text-ink-3">{enabled} of {capabilities.length} enabled</span>;
}

function Step({ n, id, title, lead, aside, children }: { n: number; id: string; title: string; lead: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-start gap-3">
        <span className="display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] font-bold text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <h2 className="display flex flex-wrap items-baseline gap-x-3 text-[20px] font-bold leading-tight text-ink">
            {title}
            {aside}
          </h2>
          <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">{lead}</p>
        </div>
      </div>
      <div className="mt-4 sm:pl-11">{children}</div>
    </section>
  );
}

export function EnableBrowser() {
  const params = useSearchParams();
  const linked = params.get("archetype");
  const linkedTool = params.get("tool");
  const [archetypeId, setArchetypeId] = useState<string | null>(linked && archetypeById.has(linked) ? linked : null);
  const archetype = archetypeId ? archetypeById.get(archetypeId) ?? null : null;
  const tools = archetype ? toolsForArchetype(archetype.id) : [];
  const [selected, setSelected] = useState<{ tool: string; capability?: string } | null>(
    linkedTool && toolById.get(linkedTool)?.architecture === archetypeId ? { tool: linkedTool } : null,
  );
  const recordRef = useRef<HTMLDivElement>(null);

  // Deep links stay shareable; replaceState keeps the GitHub Pages basePath (see TourExplorer).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = archetypeId ? `?archetype=${archetypeId}${selected ? `&tool=${selected.tool}` : ""}` : window.location.pathname;
    window.history.replaceState(null, "", query + window.location.hash);
    document.title = archetype ? `Enable ${archetype.title} · AI Security Architecture` : "Enable · AI Security Architecture";
  }, [archetypeId, archetype, selected]);

  // A capability anchor in the URL (from a Learn page) scrolls once the sections render.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: "center" });
  }, [archetypeId]);

  useEffect(() => {
    if (selected && !selected.capability) recordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  const select = (id: string) => {
    setArchetypeId(id);
    setSelected(null);
  };

  const foundations = foundationGroups();
  const allFoundations = foundations.flatMap((g) => g.capabilities);
  const baseline = archetype ? surfaceBaseline(archetype.surface) : null;
  const additions = archetype ? additionsFor(archetype) : [];
  const guidance = archetype ? guidanceByArchetype.get(archetype.id) : undefined;
  const tool = selected ? toolById.get(selected.tool) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Enable · reduce the risk"
        title="Enable AI securely"
        lead="Put controls in place in the order an organisation does: the foundations every AI deployment needs, what the surface adds, what this use case adds — then the tools, built or bought, and how far each covers the rest."
      >
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-[13px] font-semibold text-ink">What are you enabling?</span>
          <ArchPicker current={archetype} onSelect={select} placeholder="Choose a kind of AI application" />
        </div>
        {archetype && (
          <nav aria-label="Layers" className="mt-5 flex flex-wrap gap-2 text-[12.5px]">
            {[
              { href: "#foundations", label: "Foundations", n: allFoundations.length },
              { href: "#surface", label: `${baseline!.surface.title} baseline`, n: baseline!.capabilities.length },
              { href: "#use-case", label: "This use case", n: additions.length },
              { href: "#tools", label: "Tools", n: tools.length },
            ].map((s, i) => (
              <a key={s.href} href={s.href} className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-ink-2 hover:border-line-strong hover:text-ink">
                <span className="font-bold text-ink">{i + 1}</span>
                {s.label}
                <span className="text-ink-3">{s.n}</span>
              </a>
            ))}
          </nav>
        )}
      </PageHeader>

      <div className="mx-auto w-full max-w-[1200px] space-y-12 px-6 py-10">
        <Step
          n={1}
          id="foundations"
          title="Enterprise foundations"
          aside={<Progress capabilities={allFoundations} />}
          lead="Set up once and every AI deployment inherits them, whatever is enabled next. Most of the risk on every architecture is reduced here, before any tool is chosen."
        >
          {/* Open on the way in; once an architecture is chosen they fold to one line each, since they are already in place. */}
          <div key={archetype ? "chosen" : "start"} className="space-y-3">
            {foundations.map((g) => (
              <details key={g.id} open={!archetype} className="group rounded-xl border border-line bg-paper open:border-transparent open:bg-transparent">
                <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-3 group-open:px-0 group-open:pb-2 group-open:pt-0">
                  <span className="text-[11px] text-ink-3 transition-transform group-open:rotate-90">›</span>
                  <h3 className="text-[14px] font-semibold text-ink">{g.title}</h3>
                  <span className="text-[12px] text-ink-3">{g.capabilities.length} capabilities</span>
                  <Progress capabilities={g.capabilities} />
                  <span className="w-full pl-5 text-[12.5px] leading-snug text-ink-3">{g.blurb}</span>
                </summary>
                <CapabilityTable capabilities={g.capabilities} archetype={archetype ?? undefined} />
              </details>
            ))}
          </div>
        </Step>

        {!archetype ? (
          <section>
            <h2 className="display text-[20px] font-bold text-ink">Then choose what you are enabling</h2>
            <p className="mt-1 text-[13.5px] text-ink-2">Each adds its surface baseline, its own capabilities, and the products of that kind.</p>
            <div className="mt-5 grid gap-6 md:grid-cols-3">
              {surfaces.map((s) => (
                <div key={s.id}>
                  <p className="eyebrow">{s.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {archetypesInOrder.filter((a) => a.surface === s.id).map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => select(a.id)}
                          className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-left text-[13.5px] font-medium text-ink transition-colors hover:border-line-strong"
                        >
                          {a.title}
                          <span className="block text-[11.5px] font-normal text-ink-3">
                            {toolsForArchetype(a.id).length ? `${toolsForArchetype(a.id).length} products` : "Pattern only"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            <Step
              n={2}
              id="surface"
              title={`${baseline!.surface.title} baseline`}
              aside={<Progress capabilities={baseline!.capabilities} />}
              lead={baseline!.blurb}
            >
              <CapabilityTable capabilities={baseline!.capabilities} archetype={archetype} />
            </Step>

            <Step
              n={3}
              id="use-case"
              title={archetype.title}
              aside={<Progress capabilities={additions} />}
              lead="What this kind of application adds beyond the foundations and its surface. Open a row for where it sits on the architecture and how to govern it."
            >
              {additions.length ? (
                <CapabilityTable capabilities={additions} archetype={archetype} />
              ) : (
                <p className="text-[13px] text-ink-3">Nothing beyond the foundations and the surface baseline.</p>
              )}
              {guidance && (
                <details className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
                  <summary className="cursor-pointer text-[13px] font-semibold text-ink">How to govern this{guidance.status === "draft" ? " · draft" : ""}</summary>
                  <div className="mt-2"><Prose blocks={guidance.overview} size="sm" /></div>
                </details>
              )}
              <p className="mt-3 text-[12.5px] text-ink-3">
                Where each capability sits, and how data moves through it:{" "}
                <Link href={`/reference?archetype=${archetype.id}`} className="font-semibold text-introduced hover:underline">
                  the {archetype.abbrev ?? archetype.title} architecture →
                </Link>
              </p>
            </Step>

            <Step
              n={4}
              id="tools"
              title="Tools"
              lead={
                tools.length
                  ? "How each product's own settings cover the capabilities above. Anything not in the tool has to come from a foundation, the surface baseline or another product."
                  : "No product of this kind is in the registry yet. Build it to the capabilities above, or onboard a product with the tooling-onboard skill."
              }
            >
              {tools.length > 0 && (
                <ToolsMatrix
                  archetype={archetype}
                  tools={tools}
                  selected={selected}
                  onPick={(toolId, capability) => setSelected({ tool: toolId, capability })}
                />
              )}
              {tool && (
                <div ref={recordRef} className="mt-6 scroll-mt-20 rounded-xl border border-line bg-paper px-5 py-5">
                  <ToolRecord key={tool.id} tool={tool} focus={selected?.capability} onClose={() => setSelected(null)} />
                </div>
              )}
            </Step>
          </>
        )}
      </div>
    </>
  );
}
