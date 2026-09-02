import Link from "next/link";
import { PhaseLegend } from "@/components/PhaseRail";
import { REPO_URL } from "@/components/shell/SiteHeader";
import {
  archetypes,
  capabilities,
  components,
  controls,
  incidents,
  activePersonas,
  risks,
  surfaces,
} from "@/lib/data";
import { visibleFrameworks } from "@/lib/frameworks";

export const metadata = {
  title: "AI Security Architecture",
  description:
    "AI security from risk map to reference architecture: the full CoSAI taxonomy, the technology capabilities that implement its controls, and target-state architectures for every class of AI application.",
};

const LADDER = [
  {
    href: "/map",
    label: "Risk map",
    blurb: "Every risk told in three moves across the components it touches.",
    count: `${risks.length} risks · ${risks.length * 3} steps`,
  },
  {
    href: "/risks",
    label: "Taxonomy",
    blurb: "The components, risks, controls and personas behind the picture, with the framework crosswalks.",
    count: `${components.length} components · ${controls.length} controls · ${visibleFrameworks.length} frameworks`,
  },
  {
    href: "/capabilities",
    label: "Capabilities",
    blurb: "The vendor-neutral tooling classes that implement each control, across endpoint, cloud and third-party SaaS.",
    count: `${capabilities.length} capabilities`,
  },
  {
    href: "/reference",
    label: "Architectures",
    blurb: "The target-state drawing for each class of AI application, built to be copied.",
    count: `${archetypes.length} archetypes · ${incidents.length} incidents replayed`,
  },
];

const SECTIONS = [
  {
    href: "/map",
    label: "Risk Map",
    blurb: "Step through every risk and watch it light up the components it touches.",
    count: `${risks.length * 3} steps`,
    accent: "var(--band-app-rail)",
  },
  {
    href: "/components",
    label: "Components",
    blurb: "The building blocks of an AI system, and what each one is exposed to.",
    count: `${components.length} components`,
    accent: "var(--band-model-rail)",
  },
  {
    href: "/risks",
    label: "Risks",
    blurb: "Every risk in full: causes, impact, framework mappings, linked controls.",
    count: `${risks.length} risks`,
    accent: "var(--exposed)",
  },
  {
    href: "/controls",
    label: "Controls",
    blurb: "The countermeasures, what they protect, and who is meant to own them.",
    count: `${controls.length} controls`,
    accent: "var(--mitigated)",
  },
  {
    href: "/capabilities",
    label: "Capabilities",
    blurb: "Which tooling actually delivers each control — on endpoint, cloud, and vendor SaaS.",
    count: `${capabilities.length} capabilities`,
    accent: "var(--introduced)",
  },
  {
    href: "/reference",
    label: "Architectures",
    blurb:
      "Down to the drawing: per application archetype, the trust boundaries and what authenticates every crossing.",
    count: `${archetypes.length} archetypes`,
    accent: "var(--band-model-rail)",
  },
  {
    href: "/personas",
    label: "Personas",
    blurb: "The actors in an AI supply chain, and the risks each one carries.",
    count: `${activePersonas.length} personas`,
    accent: "var(--band-infra-rail)",
  },
  {
    href: "/frameworks",
    label: "Frameworks",
    blurb: "Read the mapping backwards: pick OWASP, ATLAS or NIST and see where it lands.",
    count: `${visibleFrameworks.length} frameworks`,
    accent: "var(--ink-2)",
  },
  {
    href: "/examples",
    label: "Incidents",
    blurb: "Real 2025–26 incidents replayed on the same map, step by step and sourced.",
    count: `${incidents.length} incidents`,
    accent: "var(--band-data-rail)",
  },
];

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
        <a
          href="https://saif.google/secure-ai-framework"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-introduced underline decoration-introduced/30 underline-offset-4 hover:decoration-introduced"
        >
          Google&rsquo;s SAIF Map
        </a>
        , rebuilt on the broader taxonomy that succeeded it — the{" "}
        <a
          href="https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-introduced underline decoration-introduced/30 underline-offset-4 hover:decoration-introduced"
        >
          Coalition for Secure AI Risk Map
        </a>
        . Same walkthrough, more of the modern attack surface: agents, orchestration, tools,
        memory and retrieval.
      </p>
      <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">
        From there the site descends one deliberate rung at a time: the taxonomy
        behind the map — every component, risk, control and persona — then the{" "}
        <Link
          href="/capabilities"
          className="font-medium text-introduced underline decoration-introduced/30 underline-offset-4 hover:decoration-introduced"
        >
          {capabilities.length} technology capabilities
        </Link>{" "}
        that actually implement the controls, and finally{" "}
        <Link
          href="/reference"
          className="font-medium text-introduced underline decoration-introduced/30 underline-offset-4 hover:decoration-introduced"
        >
          {archetypes.length} reference architectures
        </Link>{" "}
        — one target-state drawing per class of AI application, with the capabilities numbered
        onto the diagram and the risks tagged where they surface.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/map"
          className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start the tour
        </Link>
        <Link href="/reference" className="text-[14px] font-semibold text-ink hover:text-introduced hover:underline">
          Browse the architectures →
        </Link>
        <Link href="/capabilities" className="text-[14px] font-semibold text-ink hover:text-introduced hover:underline">
          Map your tooling →
        </Link>
      </div>

      {/* The ladder, drawn: four rungs a reader descends, each a link with what waits on it. */}
      <div className="mt-10 rounded-xl border border-line bg-paper p-6">
        <p className="eyebrow">The ladder</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LADDER.map((rung, i) => (
            <li key={rung.href} className="relative">
              <Link
                href={rung.href}
                className="group flex h-full flex-col rounded-lg border border-line bg-mist/50 p-4 transition-colors hover:border-ink"
              >
                <span className="flex items-center gap-2">
                  <span className="ident flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="display text-[15px] font-semibold text-ink group-hover:text-introduced">
                    {rung.label}
                  </span>
                </span>
                <span className="mt-2 flex-1 text-[13px] leading-snug text-ink-2">{rung.blurb}</span>
                <span className="ident mt-3 text-ink-3">{rung.count}</span>
              </Link>
              {i < LADDER.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-line-strong lg:block"
                >
                  ›
                </span>
              )}
            </li>
          ))}
        </ol>
        <PhaseLegend className="mt-5" />
      </div>

      <h2 className="display mt-16 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">
        Explore
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-line-strong"
            >
              <span
                className="h-[3px] w-8 rounded-full"
                style={{ background: s.accent }}
                aria-hidden
              />
              <span className="display mt-3 text-[17px] font-semibold text-ink transition-colors group-hover:text-introduced">
                {s.label}
              </span>
              <span className="mt-1.5 flex-1 text-[13.5px] leading-snug text-ink-2">
                {s.blurb}
              </span>
              <span className="ident mt-3">{s.count}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="display mt-16 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">
        Where the data comes from
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5">
          <p className="display text-[15px] font-semibold text-ink">CoSAI Risk Map</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
            Every component, risk, control and persona here is CoSAI&rsquo;s, vendored at a
            pinned commit and checked on every build. Google donated SAIF to CoSAI, which
            grew it from 15 risks to {risks.length}.
          </p>
          <a
            href="https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[13.5px] font-semibold text-introduced hover:underline"
          >
            cosai-oasis/secure-ai-tooling ↗
          </a>
        </div>
        <div className="rounded-xl border border-line bg-paper p-5">
          <p className="display text-[15px] font-semibold text-ink">Google SAIF</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
            The layout, the three-phase walkthrough and the component highlights for the 15
            original risks come from the public SAIF Map. CoSAI publishes the prose for those
            phases but not the component lists, so SAIF&rsquo;s own mapping fills the gap.
          </p>
          <a
            href="https://saif.google/secure-ai-framework"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[13.5px] font-semibold text-introduced hover:underline"
          >
            saif.google ↗
          </a>
        </div>
        <div className="rounded-xl border border-line bg-paper p-5 sm:col-span-2">
          <p className="display text-[15px] font-semibold text-ink">
            Authored here <span className="ident ml-1.5 align-middle">two layers</span>
          </p>
          <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">
            The {capabilities.length} capabilities — tooling classes named by at least two
            independent source families and backed by real products, mapped onto CoSAI by
            judgement — and the {archetypes.length} reference architectures across{" "}
            {surfaces.length} surfaces, each block anchored to the CoSAI component it
            instantiates. Both are under review; every entry carries its sources.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/capabilities" className="text-[13.5px] font-semibold text-introduced hover:underline">
              Browse the capability matrix →
            </Link>
            <Link href="/reference" className="text-[13.5px] font-semibold text-introduced hover:underline">
              Browse the architectures →
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 max-w-2xl text-[13px] leading-relaxed text-ink-3">
        The taxonomy is CoSAI&rsquo;s; the composition is SAIF&rsquo;s, because that layout is
        what makes the diagram readable. Everywhere the two disagree, the choice is declared
        and shown on the component it affects.{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-introduced hover:underline"
        >
          Source and full audit on GitHub ↗
        </a>
      </p>
    </div>
  );
}
