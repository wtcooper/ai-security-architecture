import { PatternFinder } from "@/components/patterns/PatternFinder";
import { PageHeader } from "@/components/Panel";
import { archetypes } from "@/lib/data";

export const metadata = { title: "Patterns · AI Security Architecture" };

const STEPS = [
  { n: 1, title: "Pick the pattern", body: "One kind of AI tool or application, drawn with its components, data flows and trust boundaries." },
  { n: 2, title: "Put the controls in place", body: "The enterprise controls it needs, by NIST CSF category, each numbered onto the drawing." },
  { n: 3, title: "Configure the tool", body: "The security settings of the product or cloud you chose: where, what value, and why." },
];

/** What you are enabling: how to read a pattern, then the pattern finder. */
export default function PatternsPage() {
  return (
    <>
      <PageHeader
        eyebrow={`${archetypes.length} patterns`}
        title="Patterns"
        lead="One pattern for each kind of AI tool or application. Pick the one that matches what you are enabling: it shows the enterprise controls you need in place and the settings of the product you chose."
      >
        <section aria-labelledby="how-to-read" className="mt-6">
          <h2 id="how-to-read" className="eyebrow">How to read a pattern</h2>
          <ol className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t-2 border-ink pt-3">
                <p className="flex items-center gap-2">
                  <span className="display flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">{s.n}</span>
                  <span className="display text-[14.5px] font-semibold leading-tight text-ink">{s.title}</span>
                </p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </PageHeader>
      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        <PatternFinder />
      </div>
    </>
  );
}
