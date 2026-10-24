import Link from "next/link";
import { PhaseLegend } from "@/components/PhaseRail";
import { REPO_URL } from "@/components/shell/SiteHeader";
import {
  archetypes,
  mitigations,
  components,
  controls,
  incidents,
  activePersonas,
  risks,
  tools,
} from "@/lib/data";
import { visibleFrameworks } from "@/lib/frameworks";

export const metadata = {
  title: "AI Security Architecture",
  description:
    "Securely enabling AI, grounded in risk: learn where AI risk is introduced, exposed and mitigated, then put the foundations, controls and tools in place to reduce it.",
};

const specialisations = mitigations.filter((m) => m.parent).length;

type Card = { href: string; label: string; blurb: string; count: string; accent: string };

/** One path, from the risk down to what reduces it on a given deployment. */
const FLOW: Card[] = [
  {
    href: "/map",
    label: "Risks",
    blurb: "Step through every risk and watch it light up where it is introduced, exposed and mitigated.",
    count: `${risks.length} risks`,
    accent: "var(--exposed)",
  },
  {
    href: "/capabilities",
    label: "Capabilities",
    blurb: "The MITRE D3FEND and ATLAS countermeasures that reduce each risk, grouped under the CoSAI controls they deliver.",
    count: `${mitigations.length} capabilities`,
    accent: "var(--mitigated)",
  },
  {
    href: "/reference",
    label: "Architectures",
    blurb: "How each class of AI application is built and how data moves through it, with every capability pinned where it goes.",
    count: `${archetypes.length} architectures`,
    accent: "var(--band-model-rail)",
  },
  {
    href: "/reference?tab=enable",
    label: "Enable",
    blurb: "On each architecture: the foundations, the surface baseline and the use case's own additions, then how far each product covers them.",
    count: `${tools.length} products`,
    accent: "var(--chip)",
  },
];

const REFERENCE: { href: string; label: string; count: string }[] = [
  { href: "/risks", label: "Risks", count: `${risks.length}` },
  { href: "/controls", label: "Controls", count: `${controls.length}` },
  { href: "/components", label: "Components", count: `${components.length}` },
  { href: "/personas", label: "Personas", count: `${activePersonas.length}` },
  { href: "/frameworks", label: "Frameworks", count: `${visibleFrameworks.length}` },
];

const SOURCES = [
  {
    title: "CoSAI Risk Map",
    body: `Components, risks, controls and personas, vendored at a pinned commit. Google donated SAIF to CoSAI, which grew it from 15 risks to ${risks.length}.`,
    href: "https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map",
    label: "cosai-oasis/secure-ai-tooling ↗",
  },
  {
    title: "Google SAIF",
    body: "The three-phase walkthrough and the component highlights for the 15 original risks come from the public SAIF Map.",
    href: "https://saif.google/secure-ai-framework",
    label: "saif.google ↗",
  },
  {
    title: "MITRE D3FEND and ATLAS",
    body: `The ${mitigations.length - specialisations} capability identifiers and definitions, checksum-pinned. Their CoSAI mappings, the ${specialisations} specialisations and every architecture are authored here.`,
    href: "https://d3fend.mitre.org/",
    label: "d3fend.mitre.org ↗",
  },
];

const link = "font-medium text-introduced underline decoration-introduced/30 underline-offset-4 hover:decoration-introduced";

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <p className="eyebrow">Securely enabling AI, grounded in risk</p>
      <h1 className="display mt-4 max-w-3xl text-[44px] font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[56px]">
        Understand where AI risk is <span className="text-introduced">introduced</span> and{" "}
        <span className="text-exposed">exposed</span> — then put in place what{" "}
        <span className="text-mitigated">reduces</span> it.
      </h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2">
        Built on the{" "}
        <a href="https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map" target="_blank" rel="noreferrer" className={link}>CoSAI Risk Map</a>
        {" "}that succeeded{" "}
        <a href="https://saif.google/secure-ai-framework" target="_blank" rel="noreferrer" className={link}>Google&rsquo;s SAIF</a>
        , with MITRE D3FEND and ATLAS capabilities and the products that deliver them.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/map" className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
          Start with the risks
        </Link>
        <Link href="/reference" className="text-[14px] font-semibold text-ink hover:text-mitigated hover:underline">
          Go straight to an architecture →
        </Link>
      </div>

      <PhaseLegend className="mt-8" />

      <h2 className="display mt-14 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">From risk to enablement</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FLOW.map((s, i) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-line-strong"
            >
              <span className="flex items-center gap-2">
                <span className="display flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">{i + 1}</span>
                <span className="h-[3px] w-8 rounded-full" style={{ background: s.accent }} aria-hidden />
              </span>
              <span className="display mt-3 text-[17px] font-semibold text-ink transition-colors group-hover:text-introduced">
                {s.label}
              </span>
              <span className="mt-1.5 flex-1 text-[13.5px] leading-snug text-ink-2">{s.blurb}</span>
              <span className="ident mt-3">{s.count}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[13.5px] text-ink-2">
        See it happen:{" "}
        <Link href="/examples" className={link}>{incidents.length} real 2025–26 incidents</Link>
        {" "}replayed on the same map, step by step and sourced.
      </p>

      <h2 className="display mt-12 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">Reference</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {REFERENCE.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[13.5px] font-medium text-ink-2 hover:border-line-strong hover:text-ink">
              {r.label}
              <span className="ident">{r.count}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="display mt-16 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">Where the data comes from</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {SOURCES.map((s) => (
          <div key={s.title} className="rounded-xl border border-line bg-paper p-5">
            <p className="display text-[15px] font-semibold text-ink">{s.title}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{s.body}</p>
            <a href={s.href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13.5px] font-semibold text-introduced hover:underline">{s.label}</a>
          </div>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-[13px] leading-relaxed text-ink-3">
        The taxonomy is CoSAI&rsquo;s; the composition is SAIF&rsquo;s. Where the two disagree, the choice is declared on the
        component it affects.{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-medium text-introduced hover:underline">Source and full audit on GitHub ↗</a>
      </p>
    </div>
  );
}
