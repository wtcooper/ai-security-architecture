import Link from "next/link";
import { PatternFinder } from "@/components/patterns/PatternFinder";
import { archetypes, incidentPatterns, incidents, mitigations } from "@/lib/data";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "AI Security Architecture",
  description:
    "Pick the pattern for the AI tool or application you are enabling. It shows the enterprise controls your organisation needs in place and the settings of the product you chose.",
};

const STEPS = [
  { n: 1, title: "Pick the pattern", body: "One kind of AI tool or application, drawn with its components, data flows and trust boundaries." },
  { n: 2, title: "Put the controls in place", body: "The enterprise controls it needs, by NIST CSF category, each numbered onto the drawing." },
  { n: 3, title: "Configure the tool", body: "The security settings of the product or cloud you chose: where, what value, and why." },
];

export default function HomePage() {
  const more = [
    { href: ROUTES.controls, title: "Controls", body: `The catalogue behind the patterns: ${mitigations.length} controls from MITRE D3FEND and ATLAS, by NIST CSF category.` },
    { href: ROUTES.incidents, title: "Incidents", body: `How AI systems are being attacked, in ${incidentPatterns.length} incident patterns, with ${incidents.length} real incidents walked step by step and a feed reviewed daily.` },
    { href: ROUTES.reference, title: "Reference", body: `The reasoning: the risk map, the risks, the CoSAI controls and the framework crosswalks the ${archetypes.length} patterns are built on.` },
  ];
  return (
    <>
      {/* What this is and how to read it, before anything to choose from. */}
      <header className="border-b border-line bg-paper">
        <div className="mx-auto grid w-full max-w-[1500px] gap-x-12 gap-y-6 px-6 py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
          <div>
            <p className="eyebrow">Securely enabling AI</p>
            <h1 className="display mt-2 text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">What are you enabling?</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">
              Pick the pattern for the AI tool or application in front of you. It shows the controls your organisation needs in place and
              the settings of the product you chose.
            </p>
          </div>
          <section aria-labelledby="how-to-read">
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
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-6 py-5">
        <PatternFinder />

        <nav aria-label="Also here" className="mt-10 grid gap-x-10 gap-y-4 border-t border-line pt-6 md:grid-cols-3">
          {more.map((m) => (
            <Link key={m.href} href={m.href} className="group block">
              <p className="display text-[14.5px] font-semibold text-ink group-hover:text-introduced">{m.title} →</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">{m.body}</p>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
