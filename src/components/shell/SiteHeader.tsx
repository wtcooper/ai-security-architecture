"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The nav, grouped so nine sections read as three: everything CoSAI — the walkthrough and
 * the taxonomy behind it — under one Risk Map dropdown, with the two destination sections
 * standing alone. Everything sits right, next to the repository link.
 */
type NavItem =
  | { href: string; label: string }
  | { label: string; children: { href: string; label: string }[] };

const NAV: NavItem[] = [
  {
    label: "Risk Map",
    children: [
      { href: "/map", label: "Risk Map Walkthrough" },
      { href: "/components", label: "Components" },
      { href: "/risks", label: "Risks" },
      { href: "/controls", label: "Controls" },
      { href: "/capabilities", label: "Capabilities" },
      { href: "/personas", label: "Personas" },
      { href: "/frameworks", label: "Frameworks" },
    ],
  },
  { href: "/reference", label: "Reference Architectures" },
  { href: "/examples", label: "Incidents" },
];

/** The flat list, for the small-screen menu. */
const ALL_LINKS = NAV.flatMap((item) => ("children" in item ? item.children : [item]));

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [prevPath, setPrevPath] = useState(pathname);
  const navRef = useRef<HTMLElement>(null);

  // Navigating closes everything. Adjusted during render (the Panel.tsx idiom) so the panel
  // never paints over the page it just moved to.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (open) setOpen(false);
    if (dropdown) setDropdown(null);
  }

  useEffect(() => {
    if (!open && !dropdown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setDropdown(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (dropdown && navRef.current && !navRef.current.contains(e.target as Node)) {
        setDropdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [open, dropdown]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
        <div className="px-5 sm:px-7 h-14 flex items-center gap-3 sm:gap-6">
          {/* Leftmost, like every mobile app's menu button. Only exists below `lg`. */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="section-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-ml-2 flex shrink-0 items-center justify-center rounded-md p-2.5 text-ink-2 transition-colors hover:bg-mist hover:text-ink lg:hidden"
          >
            <HamburgerGlyph open={open} />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <ShieldGlyph />
            <span className="display text-[15px] font-bold leading-none">
              AI Security <span className="font-medium text-ink-2">Architecture</span>
            </span>
          </Link>

          {/* Right-justified, beside the repository link. */}
          <nav
            ref={navRef}
            aria-label="Sections"
            className="ml-auto hidden lg:flex items-center gap-1"
          >
            {NAV.map((item) =>
              "children" in item ? (
                <Dropdown
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  open={dropdown === item.label}
                  onToggle={() =>
                    setDropdown(dropdown === item.label ? null : item.label)
                  }
                />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  className={[
                    "px-3 py-2 text-[13.5px] rounded-md whitespace-nowrap transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-ink text-white font-semibold"
                      : "text-ink-2 hover:text-ink hover:bg-mist font-medium",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Source on GitHub"
            title="Source on GitHub"
            className="shrink-0 rounded-md p-1.5 text-ink-3 transition-colors hover:bg-mist hover:text-ink max-lg:ml-auto"
          >
            <GitHubMark />
          </a>
        </div>

        {open && (
          <nav
            id="section-menu"
            aria-label="Sections"
            className="absolute inset-x-0 top-14 border-b border-line bg-paper p-2 shadow-lg lg:hidden"
          >
            {ALL_LINKS.map((tab) => {
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
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 cursor-default bg-ink/20 lg:hidden"
        />
      )}
    </>
  );
}

function Dropdown({
  item,
  pathname,
  open,
  onToggle,
}: {
  item: { label: string; children: { href: string; label: string }[] };
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const activeChild = item.children.some((c) => pathname.startsWith(c.href));
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          "flex items-center gap-1 px-3 py-2 text-[13.5px] rounded-md whitespace-nowrap transition-colors",
          activeChild
            ? "bg-ink text-white font-semibold"
            : open
              ? "bg-mist text-ink font-medium"
              : "text-ink-2 hover:text-ink hover:bg-mist font-medium",
        ].join(" ")}
      >
        {item.label}
        <svg
          width="9"
          height="9"
          viewBox="0 0 12 12"
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M 2 4 L 6 8 L 10 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 min-w-[11rem] rounded-lg border border-line bg-paper p-1.5 shadow-lg"
        >
          {item.children.map((c) => {
            const active = pathname.startsWith(c.href);
            return (
              <Link
                key={c.href}
                href={c.href}
                role="menuitem"
                aria-current={active ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-[13.5px] transition-colors",
                  active
                    ? "bg-ink text-white font-semibold"
                    : "text-ink-2 hover:bg-mist hover:text-ink font-medium",
                ].join(" ")}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const REPO_URL = "https://github.com/wtcooper/ai-security-architecture";

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/**
 * Three bars that cross into an X. `top`/`opacity` and the transform utilities are all
 * `transition-all`, so swapping classes on click animates instead of snapping.
 */
function HamburgerGlyph({ open }: { open: boolean }) {
  const bar =
    "absolute inset-x-0 h-[2px] rounded-full bg-current transition-all duration-200 ease-in-out";
  return (
    <span className="relative block h-4 w-5" aria-hidden="true">
      <span className={`${bar} ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"}`} />
      <span className={`${bar} top-1/2 -translate-y-1/2 ${open ? "opacity-0" : "opacity-100"}`} />
      <span className={`${bar} ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"}`} />
    </span>
  );
}

/**
 * The site mark: a shield in the app's own "mitigated" green, with a checkmark cut from the
 * fill by the second subpath under `fill-rule: evenodd` — a hole, not a shape drawn on top —
 * so it reads in one flat colour against whatever sits behind it.
 */
function ShieldGlyph() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="var(--mitigated)"
        d="M12 2 4.5 5v6.5c0 5 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.5 7.5-10.5V5L12 2Z
           M8.3 12.35l2.35 2.35 5-5.55.9.8-5.7 6.35-3.25-3.25Z"
      />
    </svg>
  );
}
