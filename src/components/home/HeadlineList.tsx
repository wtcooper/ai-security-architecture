/**
 * The home page's "Today in AI security": the newest daily feed items in a box of fixed height
 * that scrolls on its own, each row its kind and day, its title and one line on why it matters,
 * opening the item on the feed. A server component: the rows are rendered when the page is built.
 */
import Link from "next/link";

import { CategoryChip, KindTag } from "@/components/incidents/chrome";
import { formatShortDay } from "@/components/incidents/model";
import { feedHref } from "@/lib/routes";
import type { Headline } from "./headlines";

function HeadlineRow({ item }: { item: Headline }) {
  return (
    <li>
      <Link href={feedHref({}, item.id)} className="block px-4 py-3 transition-colors hover:bg-mist" data-headline={item.id}>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <KindTag kind={item.kind} />
          <time dateTime={item.date} className="ident text-ink-3">
            {formatShortDay(item.date)}
          </time>
          {item.category && <CategoryChip category={item.category} />}
        </span>
        <span className="mt-1.5 block text-[14px] font-semibold leading-snug text-ink">{item.title}</span>
        <span className="mt-0.5 text-[12.5px] leading-snug text-ink-2 line-clamp-2 lg:line-clamp-1">{item.line}</span>
      </Link>
    </li>
  );
}

export function HeadlineList({ items, className = "" }: { items: Headline[]; className?: string }) {
  return (
    <ul
      className={`h-[360px] divide-y divide-line overflow-y-auto overscroll-contain rounded-xl border border-line bg-paper ${className}`}
      tabIndex={0}
      aria-label="Newest items in the daily feed"
      data-headlines
    >
      {items.map((f) => (
        <HeadlineRow key={f.id} item={f} />
      ))}
    </ul>
  );
}
