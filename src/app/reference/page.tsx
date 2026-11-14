import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/Panel";
import { PhaseLegend } from "@/components/PhaseRail";
import { LegacyRedirect } from "@/components/shell/LegacyRedirect";
import { REPO_URL } from "@/components/shell/SiteHeader";
import { activePersonas, components, controls, mitigations, risks } from "@/lib/data";
import { visibleFrameworks } from "@/lib/frameworks";
import { ROUTES } from "@/lib/routes";

export const metadata = { title: "Reference · AI Security Architecture" };

const specialisations = mitigations.filter((m) => m.parent).length;

const PAGES = [
  {
    href: ROUTES.riskMap,
    label: "Risk map",
    count: `${risks.length} risks × 3 phases`,
    blurb: "Step through every risk and watch it light up where it is introduced, exposed and mitigated across the components of an AI system.",
    when: "To understand how a risk actually plays out.",
  },
  {
    href: ROUTES.risks,
    label: "Risks",
    count: `${risks.length}`,
    blurb: "Every risk by category: causes, impact, who carries it, framework mappings, and the incidents where it happened.",
    when: "To look up a risk code you met on a pattern.",
  },
  {
    href: ROUTES.cosaiControls,
    label: "CoSAI controls",
    count: `${controls.length}`,
    blurb: "The CoSAI control objectives in six groups. Each rolls up the status of the controls in the catalogue that deliver it.",
    when: "To report against the CoSAI Risk Map.",
  },
  {
    href: ROUTES.components,
    label: "Components",
    count: `${components.length}`,
    blurb: "The parts of an AI system as CoSAI names them: what each is, the risks that touch it and what protects it.",
    when: "To see which part of a system a risk or control concerns.",
  },
  {
    href: ROUTES.personas,
    label: "Personas",
    count: `${activePersonas.length}`,
    blurb: "CoSAI's actors, their responsibilities and the risks and controls each carries.",
    when: "To see what a given role is responsible for.",
  },
  {
    href: ROUTES.frameworks,
    label: "Frameworks",
    count: `${visibleFrameworks.length}`,
    blurb: "Crosswalks to NIST CSF, OWASP, MITRE ATLAS, STRIDE, NIST AI RMF, ISO and the EU AI Act: pick an entry and see what maps to it.",
    when: "To answer an audit or compliance question.",
  },
];

const SOURCES = [
  {
    title: "NIST CSF 2.0",
    body: "The categories every control is grouped under, on each pattern and in the control catalogue. Which category a control sits in is this repository's judgement.",
    href: "https://www.nist.gov/cyberframework",
    label: "nist.gov/cyberframework ↗",
  },
  {
    title: "MITRE D3FEND and ATLAS",
    body: `The ${mitigations.length - specialisations} control identifiers and definitions, checksum-pinned. The ${specialisations} specialisations and every pattern are authored here.`,
    href: "https://d3fend.mitre.org/",
    label: "d3fend.mitre.org ↗",
  },
  {
    title: "CoSAI Risk Map",
    body: `Components, risks, CoSAI controls and personas, vendored at a pinned commit. Google donated SAIF to CoSAI, which grew it from 15 risks to ${risks.length}.`,
    href: "https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map",
    label: "cosai-oasis/secure-ai-tooling ↗",
  },
  {
    title: "Google SAIF",
    body: "The three-phase walkthrough and the component highlights for the 15 original risks come from the public SAIF Map.",
    href: "https://saif.google/secure-ai-framework",
    label: "saif.google ↗",
  },
];

/** The reasoning behind the patterns: risks, the CoSAI and SAIF material, and the framework crosswalks. */
export default function ReferencePage() {
  return (
    <>
      {/* Pattern pages used to live at /reference?archetype=…; those links are forwarded. */}
      <Suspense>
        <LegacyRedirect kind="pattern" defaultTab="overview" quiet />
      </Suspense>
      <PageHeader
        eyebrow="Reference"
        title="The reasoning behind the patterns"
        lead="A pattern tells you what to put in place. These pages say why: the risks each control reduces, where they come from, and how the controls map to the frameworks you report against."
      />
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-ink-3">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="display text-[16px] font-semibold text-ink group-hover:text-introduced">{p.label}</span>
                  <span className="ident text-[11px] text-ink-3">{p.count}</span>
                </span>
                <span className="mt-1.5 flex-1 text-[13.5px] leading-snug text-ink-2">{p.blurb}</span>
                <span className="mt-3 text-[12.5px] leading-snug text-ink-3">{p.when}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="display mt-12 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">How risk is described</h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
          Following Google&rsquo;s SAIF, every risk is traced through three phases: where it is introduced, where it is exposed, and
          where it can be mitigated. The risk map walks each one.
        </p>
        <PhaseLegend className="mt-4" />

        <h2 className="display mt-12 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">Where the data comes from</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <div key={s.title} className="rounded-xl border border-line bg-paper p-5">
              <p className="display text-[15px] font-semibold text-ink">{s.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{s.body}</p>
              <a href={s.href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13.5px] font-semibold text-introduced hover:underline">{s.label}</a>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-[13px] leading-relaxed text-ink-3">
          The risk taxonomy is CoSAI&rsquo;s; the composition of the risk map is SAIF&rsquo;s. Where the two disagree, the choice is
          declared on the component it affects.{" "}
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-medium text-introduced hover:underline">Source and full audit on GitHub ↗</a>
        </p>
      </div>
    </>
  );
}
