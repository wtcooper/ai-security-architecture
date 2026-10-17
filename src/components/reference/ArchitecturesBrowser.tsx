"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/Panel";
import { archetypeById, archetypesInOrder, surfaces, toolById } from "@/lib/data";
import type { Scenario } from "@/lib/types";
import { ArchetypeView } from "./ArchetypeView";
import { ArchPicker } from "./ArchPicker";
import type { Highlight } from "./FlowDiagram";

const SURFACE_TAGLINE: Record<string, string> = {
  surfaceEndpoint: "on the person's own device",
  surfaceCloud: "infrastructure you operate",
  surfaceSaas: "a vendor hosting its own",
};

/** Learn: how each class of AI application is built, how data moves through it, and where risk enters. */
export function ArchitecturesBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const linkedArchetype = params.get("archetype");
  const linkedTool = params.get("tool");

  // Products moved to Enable; an old product deep link lands there on the same record.
  useEffect(() => {
    const tool = linkedTool ? toolById.get(linkedTool) : undefined;
    if (tool) router.replace(`/enable?archetype=${tool.architecture}&tool=${tool.id}`);
  }, [linkedTool, router]);

  const [archetypeId, setArchetypeId] = useState(
    (linkedArchetype && archetypeById.has(linkedArchetype) && linkedArchetype) || archetypesInOrder[0]?.id || "",
  );
  // Index into the walk list, or null for the resting drawing. A page opens on the resting
  // drawing — the whole architecture, nothing faded — and a walk is something the reader chooses.
  const [walkIndex, setWalkIndex] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  const archetype = archetypeById.get(archetypeId) ?? archetypesInOrder[0];
  const walks = useMemo(
    () => [archetype.walkthrough, ...(archetype.scenarios ?? [])].filter(Boolean) as Scenario[],
    [archetype],
  );

  // Deep links stay shareable. replaceState rather than router.push: pushing would drop the
  // GitHub Pages basePath, the same reason TourExplorer does it this way.
  useEffect(() => {
    if (typeof window === "undefined" || linkedTool) return;
    window.history.replaceState(null, "", `?archetype=${archetypeId}`);
    document.title = `${archetype.title} · Reference architectures`;
  }, [archetypeId, archetype.title, linkedTool]);

  const select = (id: string) => {
    setArchetypeId(id);
    setWalkIndex(null);
    setHighlight(null);
  };
  const onWalk = (i: number | null) => {
    setWalkIndex(i);
    setHighlight(null);
  };
  const onHighlight = (h: Highlight | null) => {
    setHighlight(h);
    setWalkIndex(null);
  };

  const summary = typeof archetype.summary[0] === "string" ? archetype.summary[0] : "";
  const examples = new Intl.ListFormat("en", { type: "conjunction" }).format(
    (archetype.exemplars ?? []).map((example) => example.name),
  );

  return (
    <>
      <PageHeader
        eyebrow={`Learn · ${archetypesInOrder.length} architectures`}
        title="Reference architectures"
        lead="How each class of AI application is built, how data moves through it, and where risk enters. Pick one, then walk a sequence flow to follow a use case step by step."
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
          <Link
            href={`/enable?archetype=${archetype.id}`}
            className="shrink-0 rounded-lg bg-mitigated px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Enable this securely →
          </Link>
        </div>

        <ArchetypeView
          archetype={archetype}
          walks={walks}
          walkIndex={walkIndex}
          onWalk={onWalk}
          highlight={highlight}
          onHighlight={onHighlight}
        />
      </div>
    </>
  );
}
