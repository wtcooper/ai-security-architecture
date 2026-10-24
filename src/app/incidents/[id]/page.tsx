import { Suspense } from "react";
import { IncidentWalkthrough } from "@/components/incidents/IncidentWalkthrough";
import { incidentById, incidents } from "@/lib/data";

/** One page per incident, all generated at build time for the static export. */
export const dynamicParams = false;
export const generateStaticParams = () => incidents.map((i) => ({ id: i.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${incidentById.get(id)?.title ?? "Incident"} · Incidents` };
}

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <IncidentWalkthrough id={id} />
    </Suspense>
  );
}
