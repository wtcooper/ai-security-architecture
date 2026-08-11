"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Disclosure row. Reference content stays folded away by default so these pages scan as a
 * list of names, not a wall of prose.
 */
export function Panel({
  id,
  title,
  meta,
  accent = "var(--ink-3)",
  openAll,
  deepLinkId,
  children,
}: {
  id: string;
  title: string;
  meta?: React.ReactNode;
  accent?: string;
  /** Nudge from an "expand all" toggle; changes force the panel open or closed. */
  openAll?: { value: boolean; nonce: number };
  /** When the page's ?id= matches, open and scroll into view on load. */
  deepLinkId?: string | null;
  children: React.ReactNode;
}) {
  const [self, setSelf] = useState(false);
  const [lastNonce, setLastNonce] = useState(openAll?.nonce);
  const ref = useRef<HTMLDivElement>(null);

  // "Expand all" arrives as a value plus a nonce. Adjust during render rather than in an
  // effect, so the panel never paints in the stale state first.
  if (openAll && openAll.nonce !== lastNonce) {
    setLastNonce(openAll.nonce);
    setSelf(openAll.value);
  }

  // A deep-linked panel is open by definition — derived, not stored.
  const linked = deepLinkId === id;
  const open = self || linked;

  useEffect(() => {
    if (linked) ref.current?.scrollIntoView({ block: "center" });
  }, [linked]);

  return (
    <div ref={ref} id={id} className="border-b border-line last:border-b-0 scroll-mt-20">
      <button
        onClick={() => setSelf(!open)}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 py-4 text-left"
      >
        <span
          className="h-6 w-[3px] shrink-0 rounded-full transition-opacity"
          style={{ background: accent, opacity: open ? 1 : 0.35 }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="display block text-[16px] font-semibold text-ink group-hover:text-introduced transition-colors">
            {title}
          </span>
          {meta && <span className="mt-0.5 block text-[13px] text-ink-3">{meta}</span>}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden
          className="shrink-0 text-ink-3 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <path
            d="M4 6.5 L8 10.5 L12 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && <div className="pb-7 pl-7 pr-1">{children}</div>}
    </div>
  );
}

export function ExpandAll({ onToggle }: { onToggle: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => {
        const next = !open;
        setOpen(next);
        onToggle(next);
      }}
      className="text-[13px] font-semibold text-introduced hover:underline"
    >
      {open ? "Collapse all" : "Expand all"}
    </button>
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
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-2 text-[34px] font-bold leading-tight text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{lead}</p>
        {children}
      </div>
    </header>
  );
}
