"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/map", label: "Risk Map" },
  { href: "/components", label: "Components" },
  { href: "/risks", label: "Risks" },
  { href: "/controls", label: "Controls" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/personas", label: "Personas" },
  { href: "/frameworks", label: "Frameworks" },
  { href: "/examples", label: "Examples" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  // Navigating closes the menu. Adjusted during render (the Panel.tsx idiom) so the panel never
  // paints over the page it just moved to.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (open) setOpen(false);
  }

  const current = TABS.find((tab) => pathname.startsWith(tab.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
      <div className="px-5 sm:px-7 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <MapGlyph />
          <span className="display text-[15px] font-bold leading-none">
            AI <span className="font-medium text-ink-2">Risk Map</span>
          </span>
        </Link>

        {/* Wide enough for all eight: every section inline. */}
        <nav aria-label="Sections" className="hidden lg:flex items-end gap-1 h-full -mb-px">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
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

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Narrow: the same four bands the logo uses double as the menu control, and the
              button names the section you are on so the header still answers "where am I". */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="section-menu"
            aria-label={open ? "Close sections menu" : "Open sections menu"}
            className="flex items-center gap-2 rounded-md py-1.5 pl-2 pr-2.5 text-ink-2 transition-colors hover:bg-mist hover:text-ink lg:hidden"
          >
            {open ? <CloseGlyph /> : <BandsGlyph />}
            <span className="text-[13.5px] font-semibold">{current?.label ?? "Menu"}</span>
          </button>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Source on GitHub"
            title="Source on GitHub"
            className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-mist hover:text-ink"
          >
            <GitHubMark />
          </a>
        </div>
      </div>

        {open && (
          <nav
            id="section-menu"
            aria-label="Sections"
            className="absolute inset-x-0 top-14 border-b border-line bg-paper p-2 shadow-lg lg:hidden"
          >
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "block rounded-md px-3 py-2.5 text-[14.5px] transition-colors",
                    active
                      ? "bg-ink text-white font-semibold"
                      : "text-ink-2 hover:bg-mist hover:text-ink font-medium",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Outside the header on purpose: `backdrop-blur` makes it a containing block, so a
          `fixed` child would size against the 56px bar instead of the viewport. */}
      {open && (
        <button
          aria-label="Close sections menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 cursor-default bg-ink/20 lg:hidden"
        />
      )}
    </>
  );
}

export const REPO_URL = "https://github.com/wtcooper/ai-security-framework-viz";

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/** The logo's four bands in one colour: reads as a menu control, still the same shape. */
function BandsGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="1" y="2" width="18" height="2.8" rx="1" />
      <rect x="1" y="6.6" width="18" height="2.8" rx="1" />
      <rect x="1" y="11.2" width="18" height="2.8" rx="1" />
      <rect x="1" y="15.8" width="18" height="2.8" rx="1" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 5 L15 15 M15 5 L5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
