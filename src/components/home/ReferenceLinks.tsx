/** The home page's last row: the Reference overview, then its main pages. */
import Link from "next/link";

import { ROUTES } from "@/lib/routes";

const REFERENCE_PAGES = [
  { href: ROUTES.riskMap, label: "Risk map" },
  { href: ROUTES.risks, label: "Risks" },
  { href: ROUTES.cosaiControls, label: "CoSAI controls" },
  { href: ROUTES.components, label: "Components" },
  { href: ROUTES.frameworks, label: "Frameworks" },
  { href: ROUTES.clouds, label: "Clouds & on-premises" },
];

export function ReferenceLinks() {
  return (
    <nav aria-label="Reference" className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-line pt-4 text-[13px]">
      <Link href={ROUTES.reference} className="display font-semibold text-ink hover:text-introduced">
        Reference →
      </Link>
      {REFERENCE_PAGES.map((r) => (
        <Link key={r.href} href={r.href} className="text-ink-2 hover:text-introduced hover:underline">
          {r.label}
        </Link>
      ))}
    </nav>
  );
}
