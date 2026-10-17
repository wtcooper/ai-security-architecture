import type { CoverageWord } from "./labels";

/** A full, half or empty circle for Built-in, Partial and Not in tool; drawn, so it renders the same in every font. */
export function CoverageMark({ word }: { word: CoverageWord }) {
  if (word === "notApplicable") return <span className="inline-block w-[10px]" aria-hidden />;
  if (word === "unverified") return <span className="inline-block w-[10px] text-center text-[10px] font-bold" aria-hidden>?</span>;
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="inline-block shrink-0">
      <circle cx="5" cy="5" r="4.2" fill={word === "builtIn" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" />
      {word === "partial" && <path d="M5 0.8 A4.2 4.2 0 0 1 5 9.2 Z" fill="currentColor" />}
    </svg>
  );
}
