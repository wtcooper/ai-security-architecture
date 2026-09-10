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
 * How far the vendor goes on a pinned capability. Glyphs stay monochrome so the org status
 * tint underneath is the only colour in a compare cell.
 */
export const COVERAGE_META: Record<ToolCoverage, { label: string; glyph: string; blurb: string }> = {
  native: { label: "Native", glyph: "●", blurb: "The vendor ships an admin-settable control for this." },
  partial: { label: "Partial", glyph: "◐", blurb: "Covered in part; the rest needs process or another product." },
  external: { label: "External", glyph: "○", blurb: "Only through a third-party product placed around the tool." },
  none: { label: "None", glyph: "—", blurb: "The vendor offers nothing for this on this surface." },
  unknown: { label: "Unverified", glyph: "?", blurb: "Could not be confirmed against the vendor's documentation." },
};

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
