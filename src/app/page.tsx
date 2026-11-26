import Link from "next/link";

import { HeadlineList } from "@/components/home/HeadlineList";
import { toHeadline } from "@/components/home/headlines";
import { ReferenceLinks } from "@/components/home/ReferenceLinks";
import { SectionCards } from "@/components/home/SectionCards";
import { SiteSearchBox } from "@/components/home/SiteSearchBox";
import { archetypes, incidentPatterns, incidents, meta, mitigations } from "@/lib/data";
import { homeHeadlines } from "@/lib/feed";
import { feedItems, securityTools } from "@/lib/feed-server";
import { within } from "@/lib/incident-patterns";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "AI Security Architecture",
  description:
    "Enabling AI securely: a pattern for each kind of AI tool or application with the controls it needs, how AI systems are being attacked, and a daily feed of what changed in AI security.",
};

/**
 * The home page, a briefing: the site search under a one-line headline, then the headline and
 * notable items the daily run filed on its newest day, then the newest by date before them (up to
 * twelve, briefs only to fill) in a short list that
 * scrolls on its own, beside four cards into the main parts of the site, and a row of Reference
 * links. The items are cut down here, when the page is built, so the feed stays out of the
 * JavaScript every page loads. The pattern finder is on /patterns/.
 */
export default function HomePage() {
  const today = meta.generatedAt.slice(0, 10);
  const items = homeHeadlines(feedItems).map(toHeadline);
  const counts = {
    patterns: archetypes.length,
    deepDives: incidents.length,
    incidentPatterns: incidentPatterns.length,
    controls: mitigations.length,
    securityTools: securityTools.length,
    feed: feedItems.length,
    thisWeek: within(feedItems, today, 7).length,
  };

  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto grid w-full max-w-[1500px] gap-x-10 gap-y-4 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end">
          <div>
            <p className="eyebrow">AI Security Architecture</p>
            <h1 className="display mt-2 text-[28px] font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[34px]">Enabling AI securely</h1>
          </div>
          <SiteSearchBox />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] gap-x-8 gap-y-8 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section aria-labelledby="today-title" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="today-title" className="display text-[19px] font-bold text-ink">
              Today in AI security
            </h2>
            <Link href={ROUTES.feed} className="text-[13px] font-semibold text-introduced hover:underline">
              The whole daily feed →
            </Link>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-3">The headline and notable items of the latest daily feed first, then the newest before them.</p>
          <HeadlineList items={items} className="mt-3" />
        </section>

        <SectionCards counts={counts} />
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-8 sm:px-6">
        <ReferenceLinks />
      </div>
    </>
  );
}
