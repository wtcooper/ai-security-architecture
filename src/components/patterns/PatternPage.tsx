"use client";

/**
 * One pattern: what it is and when it applies, its drawing, then the tabs beneath. Enable comes
 * first because it is what a reader came for; how the pattern works, where risk enters, how
 * data flows and the incidents that happened on it sit behind it. The pattern itself is fixed by the address
 * (`/patterns/<slug>/`); the tab, the cloud it is shown as built on and the open product ride in
 * the query, the open control in the anchor, so every view of a pattern can be shared.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ArchetypeView } from "@/components/reference/ArchetypeView";
import { ArchPicker } from "@/components/reference/ArchPicker";
import type { Highlight } from "@/components/drawing/types";
import { cloudFromSlug, cloudProductFor, cloudSlug } from "@/components/cloud/model";
import { archetypeById, archetypesInOrder, cloudById, productsForArchetype, surfaces, toolById } from "@/lib/data";
import { PATTERN_TABS, ROUTES, patternHref, type PatternTab } from "@/lib/routes";
import type { Scenario } from "@/lib/types";
import { SURFACE_SITUATION } from "./labels";

export function PatternPage({ archetypeId }: { archetypeId: string }) {
  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];
  const params = useSearchParams();
  const router = useRouter();
  const linkedTool = params.get("tool");
  const tool0 = linkedTool ? toolById.get(linkedTool) : undefined;
  // A product is a tool of this pattern, or a cloud this pattern is built on.
  const linkedProduct = linkedTool && productsForArchetype(archetype.id).some((p) => p.id === linkedTool) ? linkedTool : null;
  const linkedTab = params.get("tab") as PatternTab | null;
  // The cloud the pattern is shown as built on: `?cloud=aws`, or an older link that opened the cloud as a product.
  const linkedCloud = cloudProductFor(archetype.id, cloudFromSlug(params.get("cloud") ?? (linkedProduct && cloudById.has(linkedProduct) ? linkedProduct : null))?.id ?? null)?.id ?? null;
  // A cloud is not a tool: it is carried by `cloud`, and `selected` holds only a catalogued tool.
  const linkedToolOnly = linkedProduct && !cloudById.has(linkedProduct) ? linkedProduct : null;

  const tabFrom = (t: PatternTab | null): PatternTab => (t && PATTERN_TABS.includes(t) ? t : "enable");
  const [tab, setTab] = useState<PatternTab>(linkedToolOnly ? "enable" : tabFrom(linkedTab));
  const [cloud, setCloud] = useState<string | null>(linkedCloud);
  // Index into the walk list, or null for the resting drawing. The flows tab opens on the
  // complete walk; every other tab shows the whole pattern, nothing faded.
  const [walkIndex, setWalkIndex] = useState<number | null>(tab === "flows" ? 0 : null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [selected, setSelected] = useState<{ tool: string } | null>(linkedToolOnly ? { tool: linkedToolOnly } : null);

  // A link to this page from this page (search, say) changes the URL but not the mounted view:
  // adopt what it names. Our own replaceState echoes back here too, but matches the state already.
  const linkKey = `${linkedTab}|${linkedTool}|${linkedCloud}`;
  const [seenKey, setSeenKey] = useState(linkKey);
  if (linkKey !== seenKey) {
    setSeenKey(linkKey);
    const nextTab: PatternTab = linkedToolOnly ? "enable" : tabFrom(linkedTab);
    if (nextTab !== tab) setTab(nextTab);
    if (linkedToolOnly !== (selected?.tool ?? null)) setSelected(linkedToolOnly ? { tool: linkedToolOnly } : null);
    if (linkedCloud !== cloud) setCloud(linkedCloud);
  }

  // A product of another pattern in the address belongs on that pattern's page.
  useEffect(() => {
    if (tool0 && tool0.architecture !== archetype.id) router.replace(patternHref(tool0.architecture, { tool: tool0.id }));
  }, [tool0, archetype.id, router]);

  const walks = useMemo(
    () => [archetype.walkthrough, ...(archetype.scenarios ?? [])].filter(Boolean) as Scenario[],
    [archetype],
  );

  // Arriving on a named control, product or tab lands on it, not at the top of the page. The
  // control comes from the anchor, which only the browser knows, so it is read after mounting.
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    // In a frame of its own, so the first paint matches the server's and the state changes follow it.
    const frame = requestAnimationFrame(() => {
      const id = window.location.hash.match(/^#(?:control|capability)-(.+)$/)?.[1];
      const control = id && archetype.mitigations.includes(id) ? id : null;
      if (control) {
        setTab("enable");
        setWalkIndex(null);
        setHighlight({ kind: "mitigation", id: control });
      }
      setArrived(true);
      const target = control ? `control-${control}` : linkedToolOnly ? "tools" : linkedTab || linkedCloud ? "pattern-drawing" : null;
      // A further frame, so the opened row has been painted before it is measured.
      if (target) requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: control ? "center" : "start" }));
    });
    return () => cancelAnimationFrame(frame);
    // Arrival only: later tab changes are the reader's own and should not move the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep links stay shareable. replaceState rather than router.push keeps the GitHub Pages basePath.
  useEffect(() => {
    // Not before the anchor has been read, or the address would lose it.
    if (!arrived) return;
    const query = new URLSearchParams();
    if (tab !== "enable") query.set("tab", tab);
    if (cloud) query.set("cloud", cloudSlug(cloud));
    if (tab === "enable" && selected) query.set("tool", selected.tool);
    const open = tab === "enable" && highlight?.kind === "mitigation" ? `#control-${highlight.id}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${query.size ? `?${query}` : ""}${open}`);
  }, [arrived, tab, selected, highlight, cloud]);

  const onWalk = (i: number | null) => {
    setWalkIndex(i);
    setHighlight(null);
  };
  // Picking a control ends a walk; clearing the highlight must not, or opening the flows tab
  // (which clears it) would undo the walkthrough it has just selected.
  const onHighlight = (h: Highlight | null) => {
    setHighlight(h);
    if (h) setWalkIndex(null);
  };

  const surface = surfaces.find((s) => s.id === archetype.surface);
  const examples = (archetype.exemplars ?? []).map((e) => e.name);
  // The pattern's one-paragraph description: what it is, in the author's words.
  const summary = (archetype.summary ?? []).map((b) => (Array.isArray(b) ? b.join(" ") : b)).join(" ").trim();
  const cloudsHere = productsForArchetype(archetype.id).filter((p) => p.kind === "cloud" && cloudById.has(p.id));

  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
          <nav aria-label="Breadcrumb" className="text-[12.5px] text-ink-3">
            <Link href={ROUTES.patterns} className="font-semibold text-ink-2 hover:text-ink hover:underline">Patterns</Link>
            <span className="mx-1.5">/</span>
            <span>{surface?.title}</span>
          </nav>
          <ArchPicker current={archetype} onSelect={(id) => router.push(patternHref(id))} placeholder="Switch pattern" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-6 py-6">
        <div className="max-w-4xl">
          <p className="eyebrow">{SURFACE_SITUATION[archetype.surface] ?? surface?.title}</p>
          <h1 className="display mt-1.5 text-[26px] font-bold leading-tight text-ink">{archetype.title}</h1>
          <p className="mt-2 text-[15px] leading-snug text-ink">
            <span className="font-semibold">Use this pattern when: </span>
            {archetype.useWhen}
          </p>
          {summary && <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{summary}</p>}
          {examples.length > 0 && (
            <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
              <span className="font-semibold text-ink-2">Examples: </span>
              {examples.join(" · ")}
              {cloudsHere.length > 0 && <span className="text-ink-3"> · built on {cloudsHere.map((c) => (c.kind === "cloud" ? c.cloud.short : c.name)).join(", ")}</span>}
            </p>
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
          cloud={cloud}
          onCloud={setCloud}
        />
      </div>
    </>
  );
}
