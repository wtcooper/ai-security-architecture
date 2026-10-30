import type { AdoptionStatus, SettingArea, SettingVia, ToolCoverage, ToolSurfaceClass } from "@/lib/types";

/** Display names for the registry's enums, in one place so every view says the same thing. */
export const SURFACE_CLASS_META: Record<ToolSurfaceClass, { label: string; short: string }> = {
  endpointCli: { label: "Terminal CLI", short: "CLI" },
  ideExtension: { label: "IDE extension", short: "IDE" },
  desktopApp: { label: "Desktop app", short: "Desktop" },
  browserExtension: { label: "Browser extension", short: "Browser" },
  cloudAgent: { label: "Cloud-hosted agent", short: "Cloud agent" },
  managedRuntime: { label: "Managed agent runtime", short: "Runtime" },
  chatIntegration: { label: "Chat & connector integration", short: "Integration" },
  saasChat: { label: "Vendor chat (SaaS)", short: "Chat" },
  officeAddin: { label: "Office add-in", short: "Office" },
  ciIntegration: { label: "CI / code review", short: "CI" },
  sdkFramework: { label: "Library / framework", short: "SDK" },
  selfHostedServer: { label: "Self-hosted server", short: "Server" },
  remoteMcpServer: { label: "Remote MCP server", short: "MCP" },
  saasAgentPlatform: { label: "Vendor-hosted agent platform", short: "SaaS agent" },
  agenticBrowser: { label: "Agentic browser", short: "Browser" },
};

export const SURFACE_CLASS_ORDER = Object.keys(SURFACE_CLASS_META) as ToolSurfaceClass[];

/**
 * How far a product covers a capability, in three words a reader can act on. The registry keeps
 * finer grades (a third-party product, nothing offered); on the page both read "Not in tool",
 * because either way a foundation or another product has to cover it. A full, half or empty
 * circle (CoverageMark) carries the meaning, so the words need no colour key.
 */
export type CoverageWord = "builtIn" | "partial" | "notInTool" | "notApplicable" | "unverified";

export const COVERAGE_WORD: Record<CoverageWord, { label: string; blurb: string }> = {
  builtIn: { label: "Built-in", blurb: "An administrator can switch this on in the product itself." },
  partial: { label: "Partial", blurb: "Part of it is settable in the product; the rest needs a foundation, process or another product." },
  notInTool: { label: "Not in tool", blurb: "The product does not provide this; a foundation or another product has to cover it." },
  notApplicable: { label: "N/A", blurb: "The product has no surface for this; the objective belongs to another component or party." },
  unverified: { label: "Unverified", blurb: "Not yet confirmed against the vendor's documentation." },
};

export const coverageWord = (coverage?: ToolCoverage): CoverageWord => {
  switch (coverage) {
    case "native": return "builtIn";
    case "partial": return "partial";
    case "external":
    case "none": return "notInTool";
    case "notApplicable": return "notApplicable";
    default: return "unverified";
  }
};

/** How a setting is applied, as a short tag. */
export const SETTING_VIA_META: Record<SettingVia, { label: string; blurb: string }> = {
  mdm: { label: "MDM", blurb: "Device policy pushed by MDM or Group Policy: a managed file, plist, registry key or browser policy." },
  adminConsole: { label: "Admin console", blurb: "A switch in the vendor's admin console, applied to the whole tenant or a group." },
  configFile: { label: "Config file", blurb: "A settings or configuration file, or an environment variable, read by the product." },
  apiCli: { label: "API / CLI", blurb: "Set through the vendor's admin API, PowerShell or a command-line flag." },
  identityProvider: { label: "IdP", blurb: "Configured in the identity provider: SSO, conditional access, SCIM." },
  cloudPolicy: { label: "Cloud policy", blurb: "A cloud resource setting or policy: IAM, network rules, Azure Policy, an org policy constraint." },
  code: { label: "Your code", blurb: "No setting exists: the organisation builds it into its own application." },
};

/** The admin areas a settings table is grouped by, in the order a console is worked through. */
export const SETTING_AREA_META: Record<SettingArea, string> = {
  identity: "Identity & access",
  data: "Data & retention",
  tools: "Tools & extensions",
  network: "Network",
  audit: "Audit & monitoring",
  sharing: "Sharing & collaboration",
};

/** Whether the organisation has switched a product or a setting on, from data/status.yaml. */
export const ADOPTION_META: Record<AdoptionStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  enabled: { label: "Enabled", bg: "#e8f6ef", border: "#a7dcc4", text: "#06845a", dot: "#10b981" },
  testing: { label: "In testing", bg: "#fef8dc", border: "#ecd58a", text: "#a16207", dot: "#eab308" },
  notEnabled: { label: "Not enabled", bg: "transparent", border: "#d9dee5", text: "#8792a2", dot: "#c3cad4" },
};

export const ADOPTION_HELP =
  "Your organisation records which products and settings it has switched on under products: in data/status.yaml — " +
  "Enabled, In testing or Not enabled. Anything not recorded reads Not enabled.";
