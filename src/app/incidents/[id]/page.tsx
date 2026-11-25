import { Suspense } from "react";
import { IncidentPatternPage } from "@/components/incidents/IncidentPatternPage";
import { IncidentWalkthrough } from "@/components/incidents/IncidentWalkthrough";
import { incidentById, incidentPatternBySlug, incidentPatterns, incidents } from "@/lib/data";

/**
 * One page per incident pattern (by its slug) and one per deep dive (by its id), all generated at
 * build time for the static export. The two share this segment so the deep dives keep the
 * addresses they always had; the build refuses a slug that is also a deep dive's id.
 */
export const dynamicParams = false;
export const generateStaticParams = () => [...incidentPatterns.map((p) => ({ id: p.slug })), ...incidents.map((i) => ({ id: i.id }))];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pattern = incidentPatternBySlug.get(id);
  if (pattern) return { title: `${pattern.name} · Incidents`, description: pattern.short };
  return { title: `${incidentById.get(id)?.title ?? "Incident"} · Incidents` };
}

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pattern = incidentPatternBySlug.get(id);
  if (pattern) return <IncidentPatternPage id={pattern.id} />;
  return (
    <Suspense>
      <IncidentWalkthrough id={id} />
    </Suspense>
  );
}
