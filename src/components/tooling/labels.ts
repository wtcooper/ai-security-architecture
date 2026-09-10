import type { CapabilityStatus, ToolAdoption, ToolCoverage, ToolSurfaceClass } from "@/lib/types";

/** Display names for the registry's enums, in one place so every view says the same thing. */
export const SURFACE_CLASS_META: Record<ToolSurfaceClass, { label: string; short: string }> = {
  endpointCli: { label: "Terminal CLI", short: "CLI" },
  ideExtension: { label: "IDE extension", short: "IDE" },
  desktopApp: { label: "Desktop app", short: "Desktop" },
  browserExtension: { label: "Browser extension", short: "Browser" },
  cloudAgent: { label: "Cloud-hosted agent", short: "Cloud agent" },
  managedRuntime: { label: "Managed agent runtime / SDK", short: "Runtime" },
  chatIntegration: { label: "Chat & connector integration", short: "Integration" },
  saasChat: { label: "Vendor chat (SaaS)", short: "Chat" },
  officeAddin: { label: "Office add-in", short: "Office" },
  ciIntegration: { label: "CI / code review", short: "CI" },
};

export const SURFACE_CLASS_ORDER = Object.keys(SURFACE_CLASS_META) as ToolSurfaceClass[];

/**
 * How far the vendor goes on a pinned capability, in plain words a reader can act on: can an
 * administrator switch it on in this product, or not. Each carries its own colour; the
 * organisation's status, when shown, rides on top as a pill.
 */
export const COVERAGE_META: Record<
  ToolCoverage,
  { label: string; long: string; glyph: string; blurb: string; bg: string; text: string; border: string; dashed?: boolean }
> = {
  native: {
    label: "Settable",
    long: "Admin-settable",
    glyph: "●",
    blurb: "An administrator can switch this on in the product itself.",
    bg: "var(--mitigated-soft)",
    text: "var(--mitigated)",
    border: "transparent",
  },
  partial: {
    label: "Partly",
    long: "Partly settable",
    glyph: "◐",
    blurb: "Part of it is settable in the product; the rest needs process or another product.",
    bg: "#fdf3e4",
    text: "#b45309",
    border: "transparent",
  },
  external: {
    label: "3rd-party",
    long: "Needs a third-party product",
    glyph: "○",
    blurb: "The product offers nothing itself; a separate product around it provides this.",
    bg: "var(--mist)",
    text: "var(--ink-2)",
    border: "var(--line-strong)",
  },
  none: {
    label: "Not offered",
    long: "Not offered",
    glyph: "—",
    blurb: "The vendor offers nothing for this, and nothing around it fills the gap.",
    bg: "var(--exposed-soft)",
    text: "var(--exposed)",
    border: "transparent",
  },
  unknown: {
    label: "Unverified",
    long: "Unverified",
    glyph: "?",
    blurb: "Could not be confirmed against the vendor's documentation.",
    bg: "var(--paper)",
    text: "var(--ink-3)",
    border: "var(--line-strong)",
    dashed: true,
  },
};
export const COVERAGE_ORDER: ToolCoverage[] = ["native", "partial", "external", "none", "unknown"];

export const ADOPTION_META: Record<ToolAdoption, { label: string; blurb: string }> = {
  approved: { label: "Approved", blurb: "Approved for use in the organisation." },
  pilot: { label: "Pilot", blurb: "In a limited pilot." },
  blocked: { label: "Blocked", blurb: "Not permitted." },
  unassessed: { label: "Unassessed", blurb: "No adoption decision recorded." },
};

/** The posture enum wearing the words leadership asked for on this tab. */
export const ORG_STATUS_LABEL: Record<CapabilityStatus, string> = {
  inPlace: "Enabled",
  partial: "In progress",
  gap: "Gap",
  needsAssessment: "Unassessed",
};
