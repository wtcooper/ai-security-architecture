/**
 * The home page's four cards into the main parts of the site, two by two beside the newest
 * items: Patterns, Incidents, Controls and the Daily feed, each with its counts and one line on
 * what it holds, and a rail in its own colour.
 */
import Link from "next/link";

import { ROUTES } from "@/lib/routes";

export interface SiteCounts {
  patterns: number;
  deepDives: number;
  incidentPatterns: number;
  controls: number;
  securityTools: number;
  /** Daily feed items, and those dated in the seven days up to the build day. */
  feed: number;
  thisWeek: number;
}

export function SectionCards({ counts }: { counts: SiteCounts }) {
  const sections = [
    {
      href: ROUTES.patterns,
      title: "Patterns",
      facts: `${counts.patterns} patterns`,
      body: "One drawing per kind of AI tool or application: the controls it needs and the settings of the product you chose.",
      rail: "var(--introduced)",
    },
    {
      href: ROUTES.incidents,
      title: "Incidents",
      facts: `${counts.deepDives} deep dives`,
      body: `How AI systems are being attacked, in ${counts.incidentPatterns} incident patterns, with real incidents walked step by step.`,
      rail: "var(--exposed)",
    },
    {
      href: ROUTES.controls,
      title: "Controls",
      facts: `${counts.controls} controls · ${counts.securityTools} security tools`,
      body: "The catalogue behind the patterns, by NIST CSF category, with the security tools that deliver each control.",
      rail: "var(--chip)",
    },
    {
      href: ROUTES.feed,
      title: "Daily feed",
      facts: `${counts.feed} items · ${counts.thisWeek} this week`,
      body: "The AI security daily: incidents, product updates, security tools, launches and research, newest first.",
      rail: "var(--mitigated)",
    },
  ];
  return (
    <nav aria-label="Parts of the site" className="grid content-start gap-3 sm:grid-cols-2 lg:h-[360px] lg:grid-rows-2 lg:content-stretch lg:self-end">
      {sections.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          data-section={s.href}
          className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-ink-3"
        >
          <span aria-hidden className="h-[3px] w-full" style={{ background: s.rail }} />
          <span className="flex flex-1 flex-col px-4 pb-4 pt-3">
            <span className="eyebrow">{s.facts}</span>
            <span className="display mt-1 text-[18px] font-bold text-ink group-hover:text-introduced">{s.title} →</span>
            <span className="mt-1 text-[13px] leading-snug text-ink-2">{s.body}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
