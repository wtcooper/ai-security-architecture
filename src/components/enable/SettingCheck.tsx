"use client";

/**
 * A read-only check for one setting: a command to paste that shows the setting's current value,
 * and what a passing result looks like. It reads and changes nothing, it comes from the vendor's
 * command reference, and this project has not run it: the reader runs it in their own account.
 */
import { useState } from "react";

import type { SettingCheck as Check } from "@/lib/types";

export function SettingCheck({ check }: { check: Check }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(check.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // No clipboard access: the command is selectable text.
    }
  };
  return (
    <div className="rounded-lg border border-line bg-paper p-3" data-setting-check>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[12px] font-semibold text-ink">Check it: a command that only reads</span>
        <button type="button" onClick={copy} className="text-[12px] font-semibold text-introduced hover:underline" aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </button>
      </p>
      <pre className="ident mt-1.5 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-mist px-2.5 py-2 text-[11.5px] leading-relaxed text-ink">
        <code>{check.command}</code>
      </pre>
      <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">
        <span className="font-semibold text-ink">A pass looks like: </span>
        {check.expect}
      </p>
      <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
        From the{" "}
        <a href={check.url} target="_blank" rel="noreferrer" className="font-semibold text-introduced hover:underline">
          vendor&rsquo;s command reference ↗
        </a>
        , not run by this project: replace the placeholders and run it in your own account.
      </p>
    </div>
  );
}
