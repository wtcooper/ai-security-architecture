import { PatternFinder } from "@/components/patterns/PatternFinder";
import { PageHeader } from "@/components/Panel";
import { archetypes } from "@/lib/data";

export const metadata = { title: "Patterns · AI Security Architecture" };

export default function PatternsPage() {
  return (
    <>
      <PageHeader
        eyebrow={`${archetypes.length} patterns`}
        title="Patterns"
        lead="One pattern for each kind of AI tool or application. Pick the one that matches what you are enabling: it shows the enterprise controls you need in place and the settings of the product you chose."
      />
      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        <PatternFinder />
      </div>
    </>
  );
}
