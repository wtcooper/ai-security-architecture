import type { ToolCoverage, ToolSurfaceClass } from "@/lib/types";

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
 * administrator switch it on in this product, or not. The words carry no colour of their own;
 * colour is reserved for the organisation's status, the same tints the Capabilities matrix uses.
 */
export const COVERAGE_META: Record<ToolCoverage, { label: string; long: string; blurb: string; linkable: boolean }> = {
  native: { label: "Settable", long: "Admin-settable", blurb: "An administrator can switch this on in the product itself.", linkable: true },
  partial: { label: "Partly", long: "Partly settable", blurb: "Part of it is settable in the product; the rest needs process or another product.", linkable: true },
  external: { label: "3rd-party", long: "Needs a third-party product", blurb: "The product offers nothing itself; a separate product around it provides this.", linkable: true },
  none: { label: "Not offered", long: "Not offered", blurb: "The vendor offers nothing for this, and nothing around it fills the gap.", linkable: false },
  unknown: { label: "Unverified", long: "Unverified", blurb: "Could not be confirmed against the vendor's documentation.", linkable: true },
};
export const COVERAGE_ORDER: ToolCoverage[] = ["native", "partial", "external", "none", "unknown"];
