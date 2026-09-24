"use client";

/** Page chrome shared by every section: the page header. */

export function PageHeader({
  eyebrow,
  title,
  lead,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  /** Sits to the right of the title: a page-level switch. */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-9">
        <p className="eyebrow">{eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h1 className="display text-[34px] font-bold leading-tight text-ink">{title}</h1>
          {aside}
        </div>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{lead}</p>
        {children}
      </div>
    </header>
  );
}
