"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { archetypeById, archetypesInOrder, cloudById, surfaces, toolById } from "@/lib/data";
import type { Scenario } from "@/lib/types";
import { ArchetypeView, TABS, type Tab } from "./ArchetypeView";
import { ArchPicker } from "./ArchPicker";
import type { Highlight } from "./FlowDiagram";

const SURFACE_TAGLINE: Record<string, string> = {
  surfaceEndpoint: "on the person's own device",
  surfaceCloud: "infrastructure you operate",
  surfaceSaas: "a vendor hosting its own",
};

/** Each class of AI application: how it is built, how data moves through it, and how to enable it securely. */
export function ArchitecturesBrowser() {
  const params = useSearchParams();
  const linkedTool = params.get("tool");
  const tool0 = linkedTool ? toolById.get(linkedTool) : undefined;
  // A product is a tool (which names its own architecture) or a cloud (which does not).
  const linkedProduct = linkedTool && (tool0 || cloudById.has(linkedTool)) ? linkedTool : null;
  // A product link names its own architecture; it wins over a stale archetype in the same URL.
  const linkedArchetype = tool0?.architecture ?? params.get("archetype");
  const linkedTab = params.get("tab") as Tab | null;
  // Read once on arrival; this view renders on the client only, behind useSearchParams' Suspense.
  const [anchored] = useState(() => {
    const id = typeof window === "undefined" ? undefined : window.location.hash.match(/^#capability-(.+)$/)?.[1];
    const arch = linkedArchetype ? archetypeById.get(linkedArchetype) : undefined;
    return id && arch?.mitigations.includes(id) ? id : null;
  });

  const [archetypeId, setArchetypeId] = useState(
    (linkedArchetype && archetypeById.has(linkedArchetype) && linkedArchetype) || archetypesInOrder[0]?.id || "",
  );
  // Opens on the overview with the whole drawing, unless the link names a tab or a product.
  const [tab, setTab] = useState<Tab>(linkedProduct || anchored ? "enable" : linkedTab && TABS.includes(linkedTab) ? linkedTab : "overview");
  // Index into the walk list, or null for the resting drawing. A page opens on the resting
  // drawing — the whole architecture, nothing faded — and a walk is something the reader chooses.
  const [walkIndex, setWalkIndex] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(anchored ? { kind: "mitigation", id: anchored } : null);
  const [selected, setSelected] = useState<{ tool: string } | null>(linkedProduct ? { tool: linkedProduct } : null);

  // A link to this page from this page (search, say) changes the URL but not the mounted view:
  // adopt what it names. Our own replaceState echoes back here too, but matches the state already.
  const linkKey = `${linkedArchetype}|${linkedTab}|${linkedTool}`;
  const [seenKey, setSeenKey] = useState(linkKey);
  if (linkKey !== seenKey) {
    setSeenKey(linkKey);
    if (linkedArchetype && linkedArchetype !== archetypeId && archetypeById.has(linkedArchetype)) {
      setArchetypeId(linkedArchetype);
      setWalkIndex(null);
      setHighlight(null);
    }
    const nextTab: Tab = linkedProduct ? "enable" : linkedTab && TABS.includes(linkedTab) ? linkedTab : "overview";
    if (nextTab !== tab) setTab(nextTab);
    if (linkedProduct !== (selected?.tool ?? null)) setSelected(linkedProduct ? { tool: linkedProduct } : null);
  }

  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];
  const walks = useMemo(
    () => [archetype.walkthrough, ...(archetype.scenarios ?? [])].filter(Boolean) as Scenario[],
    [archetype],
  );

  // A capability anchor in the URL (an old Enable link) opens that row on the Enable tab.
  useEffect(() => {
    if (anchored) requestAnimationFrame(() => document.getElementById(`capability-${anchored}`)?.scrollIntoView({ block: "center" }));
  }, [anchored]);

  // Deep links stay shareable. replaceState rather than router.push: pushing would drop the
  // GitHub Pages basePath, the same reason TourExplorer does it this way.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams({ archetype: archetypeId });
    if (tab !== "overview") query.set("tab", tab);
    if (tab === "enable" && selected) query.set("tool", selected.tool);
    window.history.replaceState(null, "", `?${query}${window.location.hash}`);
    document.title = `${archetype.title} · Reference architectures`;
  }, [archetypeId, archetype.title, tab, selected]);

  const select = (id: string) => {
    setArchetypeId(id);
    setWalkIndex(null);
    setHighlight(null);
    setSelected(null);
  };
  const onWalk = (i: number | null) => {
    setWalkIndex(i);
    setHighlight(null);
  };
  // Picking a capability ends a walk; clearing the highlight must not, or opening the
  // flows tab (which clears it) would undo the walkthrough it has just selected.
  const onHighlight = (h: Highlight | null) => {
    setHighlight(h);
    if (h) setWalkIndex(null);
  };
  const openEnable = () => {
    setTab("enable");
    setWalkIndex(null);
    requestAnimationFrame(() => document.getElementById("architecture-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const summary = typeof archetype.summary[0] === "string" ? archetype.summary[0] : "";
  const examples = new Intl.ListFormat("en", { type: "conjunction" }).format(
    (archetype.exemplars ?? []).map((example) => example.name),
  );

  return (
    <>
      <PageHeader
        eyebrow={`${archetypesInOrder.length} architectures`}
        title="Reference architectures"
        lead="How each class of AI application is built, how data moves through it, where each capability goes, and how to enable it securely. Pick one, walk a sequence flow, then open Enable for what to put in place and which tools deliver it."
      >
        <div className="mt-6">
          <ArchPicker current={archetype} onSelect={select} />
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="max-w-3xl">
            <p className="eyebrow">
              {surfaces.find((s) => s.id === archetype.surface)?.title} · {SURFACE_TAGLINE[archetype.surface]}
            </p>
            <h2 className="display mt-1 text-[20px] font-bold leading-tight text-ink">{archetype.title}</h2>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">
              {examples && `Examples include ${examples}. `}{summary}
            </p>
          </div>
          {tab !== "enable" && (
            <button
              type="button"
              onClick={openEnable}
              className="shrink-0 rounded-lg bg-mitigated px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Enable this securely →
            </button>
          )}
        </div>

        <ArchetypeView
          archetype={archetype}
          tab={tab}
          onTab={setTab}
          walks={walks}
          walkIndex={walkIndex}
          onWalk={onWalk}
          highlight={highlight}
          onHighlight={onHighlight}
          tool={selected?.tool ?? null}
          focus={null}
          onPickTool={(id) => setSelected(id ? { tool: id } : null)}
        />
      </div>
    </>
  );
}
