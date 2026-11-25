"use client";

import { openSiteSearch } from "@/components/shell/open-search";

/** Looks like a search box and opens the site's own search, the ⌘K palette in the header. */
export function SiteSearchBox({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openSiteSearch}
      data-site-search
      className={`flex w-full items-center gap-3 rounded-lg border border-line-strong bg-paper px-4 py-2.5 text-left text-[14px] text-ink-3 transition-colors hover:border-ink hover:text-ink-2 ${className}`}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden className="shrink-0">
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="min-w-0 flex-1 truncate">Search patterns, products, controls, incidents…</span>
      <kbd className="ident hidden shrink-0 rounded border border-line px-1.5 py-[1px] text-[10.5px] sm:inline">⌘K</kbd>
    </button>
  );
}
