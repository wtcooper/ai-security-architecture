import Link from "next/link";
import { PhaseLegend } from "@/components/PhaseRail";
import { REPO_URL } from "@/components/shell/SiteHeader";
import { components, controls, incidents, activePersonas, risks } from "@/lib/data";

export const metadata = {
  title: "AI Risk Map",
  description:
    "An interactive map of AI security risk: where each risk is introduced, exposed and mitigated across the components of an AI system.",
};

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
    href: "/personas",
    label: "Personas",
    blurb: "The actors in an AI supply chain, and the risks each one carries.",
    count: `${activePersonas.length} personas`,
    accent: "var(--band-infra-rail)",
  },
  {
    href: "/examples",
    label: "Examples",
    blurb: "Real 2025–26 incidents replayed on the same map, step by step and sourced.",
    count: `${incidents.length} incidents`,
    accent: "var(--band-data-rail)",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <p className="eyebrow">An interactive map of AI security risk</p>
      <h1 className="display mt-4 max-w-3xl text-[44px] font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[56px]">
        Where AI risk is <span className="text-introduced">introduced</span>,{" "}
        <span className="text-exposed">exposed</span>, and{" "}
        <span className="text-mitigated">mitigated</span>.
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

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/map"
          className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start the tour
        </Link>
        <Link
          href="/examples"
          className="rounded-lg border border-line-strong bg-paper px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-ink"
        >
          See real incidents
        </Link>
      </div>

      <div className="mt-10 rounded-xl border border-line bg-paper p-6">
        <p className="eyebrow">How to read it</p>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">
          Every risk is told in three moves. Pick a risk, then step through the phases — the
          map highlights a different set of components each time, and the mitigated step
          names the controls that break the chain.
        </p>
        <PhaseLegend className="mt-4" />
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
