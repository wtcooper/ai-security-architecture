import { Suspense } from "react";
import { PatternPage } from "@/components/patterns/PatternPage";
import { archetypes } from "@/lib/data";

export const generateStaticParams = () => archetypes.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = archetypes.find((a) => a.slug === slug);
  return { title: `${pattern?.title ?? "Pattern"} · AI Security Architecture`, description: pattern?.useWhen };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = archetypes.find((a) => a.slug === slug);
  return (
    <Suspense>
      <PatternPage archetypeId={pattern?.id ?? ""} />
    </Suspense>
  );
}
