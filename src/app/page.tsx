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
  technologyCategories,
  tools,
} from "@/lib/data";
import { visibleExternalFrameworks } from "@/lib/frameworks";

export const metadata = {
  title: "AI Security Architecture",
  description:
    "AI security from risk map to reference architecture: CoSAI risks and controls, MITRE-backed capabilities, and target-state architectures for every class of AI application.",
};

const specialisations = mitigations.filter((m) => m.parent).length;

/** The three questions, in the order the site answers them, with the map in front. */
const LADDER = [
  {
    href: "/map",
    label: "Risk map",
    blurb: "Where each risk is introduced, exposed and mitigated across the components of an AI system.",
    count: `${risks.length} risks · ${components.length} components`,
  },
  {
    href: "/controls",
    label: "Controls",
    blurb: "The protections CoSAI requires, and how far the organisation delivers each one.",
    count: `${controls.length} controls`,
  },
  {
    href: "/capabilities",
    label: "Capabilities",
    blurb: "The countermeasures that deliver the controls, pinned in the data flow. Status lives here.",
    count: `${mitigations.length} capabilities · ${technologyCategories.length} technology categories`,
  },
  {
    href: "/reference",
    label: "Architectures",
    blurb: "One target-state drawing per class of AI application, with the named products rated against it.",
    count: `${archetypes.length} archetypes · ${tools.length} tools`,
  },
];

/** Reference pages: one line of links, not a second set of cards. */
const REFERENCE = [
  { href: "/examples", label: "Incidents", count: incidents.length },
  { href: "/components", label: "Components", count: components.length },
  { href: "/risks", label: "Risks", count: risks.length },
  { href: "/personas", label: "Personas", count: activePersonas.length },
  { href: "/frameworks", label: "Frameworks", count: visibleExternalFrameworks.length },
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
      <p className="eyebrow">AI security, from risk map to reference architecture</p>
      <h1 className="display mt-4 max-w-3xl text-[44px] font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[56px]">
        Where AI risk is <span className="text-introduced">introduced</span>,{" "}
        <span className="text-exposed">exposed</span>, and{" "}
        <span className="text-mitigated">mitigated</span> — and what to build about it.
      </h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2">
        A recreation of{" "}
        <a href="https://saif.google/secure-ai-framework" target="_blank" rel="noreferrer" className={link}>Google&rsquo;s SAIF Map</a>
        {" "}on the{" "}
        <a href="https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map" target="_blank" rel="noreferrer" className={link}>CoSAI Risk Map</a>
        {" "}that succeeded it. Same walkthrough, more of the modern attack surface: agents, orchestration, tools, memory and
        retrieval.
      </p>
      <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">
        From the map the site descends one rung at a time: the controls CoSAI requires, the MITRE-backed capabilities that
        deliver them and where the organisation stands on each, and a reference architecture for every class of AI
        application with those capabilities numbered onto the drawing.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/map" className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
          Start the tour
        </Link>
        <Link href="/capabilities" className="text-[14px] font-semibold text-ink hover:text-introduced hover:underline">
          See the capabilities →
        </Link>
        <Link href="/reference" className="text-[14px] font-semibold text-ink hover:text-introduced hover:underline">
          Browse the architectures →
        </Link>
      </div>

      <div className="mt-10 rounded-xl border border-line bg-paper p-6">
        <p className="eyebrow">Explore the security model</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LADDER.map((rung, i) => (
            <li key={rung.href} className="relative">
              <Link href={rung.href} className="group flex h-full flex-col rounded-lg border border-line bg-mist/50 p-4 transition-colors hover:border-ink">
                <span className="display text-[15px] font-semibold text-ink group-hover:text-introduced">{rung.label}</span>
                <span className="mt-2 flex-1 text-[13px] leading-snug text-ink-2">{rung.blurb}</span>
                <span className="ident mt-3 text-ink-3">{rung.count}</span>
              </Link>
              {i < LADDER.length - 1 && (
                <span aria-hidden className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-line-strong lg:block">›</span>
              )}
            </li>
          ))}
        </ul>
        <PhaseLegend className="mt-5" />
      </div>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[14px] text-ink-2">
        <span className="eyebrow">Also</span>
        {REFERENCE.map((r) => (
          <Link key={r.href} href={r.href} className="font-semibold text-ink hover:text-introduced hover:underline">
            {r.label} <span className="ident font-normal text-ink-3">{r.count}</span>
          </Link>
        ))}
      </p>

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
