import Link from "next/link";
import { PatternFinder } from "@/components/patterns/PatternFinder";
import { archetypes, incidents, mitigations, tools } from "@/lib/data";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "AI Security Architecture",
  description:
    "Pick the pattern for the AI tool or application you are enabling. It shows the enterprise controls your organisation needs in place and the settings of the product you chose.",
};

const link = "font-medium text-introduced underline decoration-introduced/30 underline-offset-4 hover:decoration-introduced";

const STEPS = [
  { n: 1, title: "Pick the pattern", body: "Each pattern is one kind of AI tool or application, drawn with its components, data flows and trust boundaries." },
  { n: 2, title: "Put the controls in place", body: "The enterprise controls that pattern needs, grouped by NIST CSF category, each numbered onto the drawing where it goes." },
  { n: 3, title: "Configure the tool", body: "The security settings of the product or cloud you chose: where each is set, the value to set it to, and why." },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-6 py-12 sm:py-16">
      <p className="eyebrow">Securely enabling AI</p>
      <h1 className="display mt-3 max-w-3xl text-[38px] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[46px]">
        What are you enabling?
      </h1>
      <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-2">
        Pick the pattern for the AI tool or application in front of you. It shows the controls your organisation needs in place and the
        settings of the product you chose. Everything else here is the evidence behind those two lists.
      </p>

      <div className="mt-8">
        <PatternFinder />
      </div>

      <h2 className="display mt-16 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">How to read a pattern</h2>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-xl border border-line bg-paper p-5">
            <span className="display flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">{s.n}</span>
            <p className="display mt-3 text-[16px] font-semibold text-ink">{s.title}</p>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <Link href={ROUTES.controls} className="rounded-xl border border-line bg-paper p-5 hover:border-ink-3">
          <p className="display text-[15px] font-semibold text-ink">Controls</p>
          <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">The whole catalogue behind the patterns: {mitigations.length} controls from MITRE D3FEND and ATLAS, grouped by NIST CSF category.</p>
        </Link>
        <Link href={ROUTES.tools} className="rounded-xl border border-line bg-paper p-5 hover:border-ink-3">
          <p className="display text-[15px] font-semibold text-ink">Tools</p>
          <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{tools.length} products and three clouds, each with its security settings and the pattern it belongs to.</p>
        </Link>
        <Link href={ROUTES.incidents} className="rounded-xl border border-line bg-paper p-5 hover:border-ink-3">
          <p className="display text-[15px] font-semibold text-ink">Incidents</p>
          <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{incidents.length} real 2025–26 incidents walked step by step across the pattern each happened on.</p>
        </Link>
      </div>

      <p className="mt-8 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">
        Want the reasoning? <Link href={ROUTES.reference} className={link}>Reference</Link> holds the risk map, the risks, the CoSAI
        controls and the framework crosswalks the {archetypes.length} patterns are built on.
      </p>
    </div>
  );
}
