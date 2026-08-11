"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Risk Map" },
  { href: "/components", label: "Components" },
  { href: "/risks", label: "Risks" },
  { href: "/controls", label: "Controls" },
  { href: "/personas", label: "Personas" },
  { href: "/examples", label: "Examples" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
      <div className="px-5 sm:px-7 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <MapGlyph />
          <span className="display text-[15px] font-bold leading-none">
            CoSAI <span className="font-medium text-ink-2">Risk Map</span>
          </span>
        </Link>

        <nav aria-label="Sections" className="flex items-end gap-1 h-full -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "px-3 py-2 mb-2 text-[13.5px] rounded-md whitespace-nowrap transition-colors",
                  active
                    ? "bg-ink text-white font-semibold"
                    : "text-ink-2 hover:text-ink hover:bg-mist font-medium",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <a
          href="https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map"
          target="_blank"
          rel="noreferrer"
          className="ml-auto hidden md:block ident hover:text-ink-2 transition-colors"
        >
          cosai-oasis/secure-ai-tooling ↗
        </a>
      </div>
    </header>
  );
}

/** Four stacked bands — the map itself, at 20px. */
function MapGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1" y="1.5" width="18" height="3.4" rx="1" fill="var(--band-app-rail)" />
      <rect x="1" y="6.2" width="18" height="3.4" rx="1" fill="var(--band-model-rail)" />
      <rect x="1" y="10.9" width="18" height="3.4" rx="1" fill="var(--band-infra-rail)" />
      <rect x="1" y="15.6" width="18" height="3.4" rx="1" fill="var(--band-data-rail)" />
    </svg>
  );
}
