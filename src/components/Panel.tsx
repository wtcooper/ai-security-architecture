"use client";

/** Page chrome shared by every section: the ladder and the page header. */
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The site's ladder, drawn on every page header so a reader always knows which rung they are
 * on and what sits below it. Incidents replay on the map and the drawings, so they sit beside
 * the ladder rather than on it.
 */
const LADDER = [
  { label: "Risk map", href: "/map", matches: ["/map"] },
  {
    label: "Taxonomy",
    href: "/risks",
    matches: ["/components", "/risks", "/controls", "/personas", "/frameworks"],
  },
  { label: "Capabilities", href: "/capabilities", matches: ["/capabilities"] },
  { label: "Architectures", href: "/reference", matches: ["/reference"] },
];

export function Ladder({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const onIncidents = pathname.startsWith("/examples");
  return (
    <nav aria-label="Where this page sits" className={`flex flex-wrap items-center gap-1 ${className}`}>
      {LADDER.map((rung, i) => {
        const current = rung.matches.some((m) => pathname.startsWith(m));
        return (
          <span key={rung.label} className="flex items-center gap-1">
            {i > 0 && <span className="text-[10px] text-line-strong" aria-hidden>›</span>}
            <Link
              href={rung.href}
              aria-current={current ? "page" : undefined}
              className={`rounded-full border px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                current
                  ? "border-ink bg-ink text-white"
                  : "border-line text-ink-3 hover:border-line-strong hover:text-ink"
              }`}
            >
              <span className="mr-1 opacity-60">{i + 1}</span>
              {rung.label}
            </Link>
          </span>
        );
      })}
      {onIncidents && (
        <span className="ml-1 rounded-full border border-ink bg-ink px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white">
          Incidents · replayed on 1 and 4
        </span>
      )}
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-9">
        <Ladder className="mb-4" />
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-2 text-[34px] font-bold leading-tight text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{lead}</p>
        {children}
      </div>
    </header>
  );
}
