/**
 * Experimental: the derivations the five Tools/org mockups share. Nothing here is authored data;
 * every answer comes from the drawing's pins, the tooling registry and data/org.
 *
 * Two questions per pinned capability:
 *  - WHERE does the reference architecture put it — inside the product (a vendor block, or the
 *    agent application on the device) or on our side (a block in the enterprise cloud band, the
 *    governance plane, or the network crossing out of a managed endpoint)?
 *  - WHO covers it for one product — the product's own setting, our enterprise layer, a
 *    third-party product, or nobody?
 */
import { mitigationById, orgCapabilities, orgStatusFor, orgToolAvailableFor, specializationsOf } from "@/lib/data";
import { capabilitySupportStatus } from "@/lib/org-capabilities";
import type { Archetype, DisplayStatus, Tool, ToolControl, ToolCoverage } from "@/lib/types";

export type Side = "enterprise" | "product";

export interface Site {
  /** A block id or "from->to". */
  at: string;
  title: string;
  side: Side;
  note?: string;
}

const ENTERPRISE_OWNERS = new Set(["cloud", "governance"]);

/**
 * Where the drawing pins one capability, each location sorted onto our side or the product's.
 * The governance call-outs that deliver a capability (identity, secrets, supply chain,
 * observability) count as our side too; the policy call-out does not — it is where policy is
 * written, and the pins say where it is enforced. A governance-category control (a vendor
 * assessment) is a process we run, so all of its sites are ours.
 */
export function sitesFor(arch: Archetype, capId: string): Site[] {
  const blocks = new Map(arch.blocks.map((b) => [b.id, b]));
  const owner = new Map((arch.zones ?? []).map((z) => [z.id, z.owner]));
  const ownerOf = (id: string) => {
    const b = blocks.get(id);
    return b?.kind === "governance" ? "governance" : owner.get(b?.zone ?? "") ?? "cloud";
  };
  const process = mitigationById.get(capId)?.category === "controlsGovernance";
  const pinned = arch.pins.mitigations.filter((p) => p.mitigation === capId);
  const callouts: Site[] = arch.blocks
    .filter((b) => b.kind === "governance" && b.id !== "govPolicy" && b.mitigations?.includes(capId) && !pinned.some((p) => p.at === b.id))
    .map((b) => ({ at: b.id, title: b.title, side: "enterprise", note: b.note }));
  const sites = pinned
    .map((p): Site => {
      if (!p.at.includes("->")) {
        return { at: p.at, title: blocks.get(p.at)?.title ?? p.at, side: ENTERPRISE_OWNERS.has(ownerOf(p.at)) ? "enterprise" : "product", note: p.note };
      }
      const [a, b] = p.at.split("->");
      const [oa, ob] = [ownerOf(a), ownerOf(b)];
      const ours = ENTERPRISE_OWNERS.has(oa) ? a : ENTERPRISE_OWNERS.has(ob) ? b : undefined;
      // Leaving a managed endpoint for the outside crosses our network, so it is ours to enforce.
      const endpointExit = (oa === "endpoint" && ob === "external") || (ob === "endpoint" && oa === "external");
      const title = ours
        ? `${blocks.get(ours)?.title ?? ours}`
        : `${blocks.get(a)?.title ?? a} → ${blocks.get(b)?.title ?? b}`;
      return { at: p.at, title: endpointExit && !ours ? `Network exit · ${title}` : title, side: ours || endpointExit ? "enterprise" : "product", note: p.note };
    });
  return [...sites, ...callouts].map((s) => (process ? { ...s, side: "enterprise" } : s));
}

export type Placement = "enterprise" | "both" | "product";

export const PLACEMENT_META: Record<Placement, { label: string; blurb: string }> = {
  enterprise: { label: "Our enterprise layer", blurb: "The reference puts these on infrastructure we run — once, for every tool of this type." },
  both: { label: "Shared", blurb: "A product setting plus something on our side; each half covers a different part." },
  product: { label: "Inside the product", blurb: "Only the product can enforce these; each tool answers on its own." },
};

export function placementFor(arch: Archetype, capId: string): Placement {
  const sides = new Set(sitesFor(arch, capId).map((s) => s.side));
  return sides.size === 2 ? "both" : sides.has("enterprise") ? "enterprise" : "product";
}

/** Who covers one capability for one product. */
export type Verdict = "product" | "shared" | "partial" | "enterprise" | "thirdParty" | "uncovered" | "unverified" | "na";

export const VERDICT_META: Record<Verdict, { label: string; long: string; color: string; blurb: string }> = {
  product: { label: "Built in", long: "Built into the product", color: "#3d5bd9", blurb: "An admin setting in the product delivers it." },
  shared: { label: "Product + ours", long: "Product setting plus our layer", color: "#0e7490", blurb: "The product covers part; our layer covers the rest." },
  partial: { label: "Partly built in", long: "Partly built into the product", color: "#5b6fd6", blurb: "The product covers part; nothing on our side covers the rest." },
  enterprise: { label: "Our layer", long: "Our enterprise layer covers it", color: "#344054", blurb: "Delivered by infrastructure we run, whatever the product offers." },
  thirdParty: { label: "Needs 3rd-party", long: "Needs a third-party product", color: "#7c3aed", blurb: "The product offers nothing; a product placed around it provides this." },
  uncovered: { label: "Not covered", long: "Nothing covers it", color: "#b42318", blurb: "The product offers nothing and the reference puts nothing on our side." },
  unverified: { label: "Unverified", long: "Vendor support unverified", color: "#7b8798", blurb: "Could not be confirmed against the vendor's documentation." },
  na: { label: "N/A", long: "Not applicable", color: "#98a2b3", blurb: "This product has no surface for this control." },
};

export const VERDICT_ORDER: Verdict[] = ["product", "shared", "partial", "enterprise", "thirdParty", "uncovered", "unverified", "na"];

export function controlOf(tool: Tool, capId: string): ToolControl | undefined {
  return tool.controls.find((c) => c.mitigation === capId);
}

/**
 * Placement decides what an absent product setting means: on a product-only control it is a
 * hole; where our layer has a part, our layer is what covers it.
 */
export function verdictFor(arch: Archetype, tool: Tool, capId: string): Verdict {
  const coverage: ToolCoverage = controlOf(tool, capId)?.coverage ?? "unknown";
  const placement = placementFor(arch, capId);
  if (coverage === "external") return "thirdParty";
  if (placement === "product") {
    return ({ native: "product", partial: "partial", none: "uncovered", notApplicable: "na", unknown: "unverified" } as const)[coverage];
  }
  if (coverage === "native" || coverage === "partial") return "shared";
  if (coverage === "unknown" && placement === "both") return "unverified";
  return "enterprise";
}

/** The product's own configuration page for a control, when the registry names one. */
export const settingUrl = (control?: ToolControl) =>
  control?.steps?.find((s) => s.url)?.url ?? control?.evidence?.[0]?.url;

/** Short names for dense UI; specialisations carry their own `abbrev`. */
const SHORT: Record<string, string> = {
  "D3-APA": "Access policy",
  "D3-MFA": "MFA",
  "D3-CH": "Credential hardening",
  "D3-CTS": "Credential scoping",
  "D3-EI": "Execution isolation",
  "D3-PA": "Process analysis",
  "D3-FA": "File analysis",
  "AML.M0028": "Tool permissions",
  "AML.M0029": "Human approval",
  "AML.M0031": "Memory hardening",
  "AML.M0036": "Resource limits",
  "AML.M0024": "AI telemetry",
};
export const shortName = (capId: string) => SHORT[capId] ?? mitigationById.get(capId)?.abbrev ?? mitigationById.get(capId)?.title ?? capId;
export const fullName = (capId: string) => mitigationById.get(capId)?.title ?? capId;

/** Seven defence layers a security team already thinks in; the governance band's groups, with policy split. */
export const LAYERS: { id: string; title: string; members: string[] }[] = [
  { id: "identity", title: "Identity & access", members: ["D3-MFA", "D3-APA", "D3-AA", "D3-CR"] },
  { id: "secrets", title: "Secrets & credentials", members: ["D3-CH", "D3-CTS", "AML.M0012"] },
  { id: "network", title: "Network & isolation", members: ["cap-agent-egress-control", "D3-EI", "D3-OTF"] },
  { id: "actions", title: "Agent actions & tools", members: ["AML.M0028", "AML.M0029", "AML.M0036", "AML.M0004", "cap-agent-action-policy-enforcement"] },
  { id: "data", title: "Data & memory", members: ["cap-input-guardrails", "cap-output-guardrails", "cap-sensitive-data-redaction", "cap-data-access-governance", "AML.M0031", "AML.M0005"] },
  { id: "supply", title: "Supply chain & vendors", members: ["cap-ai-vendor-assessment", "cap-agent-tool-registry", "cap-mcp-tool-integrity", "D3-FA", "AML.M0008", "AML.M0013", "AML.M0014", "AML.M0023", "AML.M0025", "D3-SYSVA", "D3-AVE", "cap-staged-rollout-gate", "cap-model-documentation", "cap-ai-threat-modeling"] },
  { id: "monitor", title: "Monitoring & response", members: ["cap-agent-tracing", "cap-agent-kill-switch", "cap-shadow-ai-discovery", "D3-PA", "AML.M0024", "D3-WSAA"] },
];

export function layersFor(arch: Archetype) {
  const placed = new Set<string>();
  const out = LAYERS.map((l) => {
    const caps = arch.mitigations.filter((id) => l.members.includes(id) || l.members.includes(mitigationById.get(id)?.parent ?? ""));
    caps.forEach((c) => placed.add(c));
    return { ...l, caps };
  });
  const rest = arch.mitigations.filter((id) => !placed.has(id));
  if (rest.length) out.push({ id: "other", title: "Other", members: [], caps: rest });
  return out.filter((l) => l.caps.length);
}

// --- Organisation overlay ---------------------------------------------------------------------

/**
 * Our enterprise layer's recorded status for a capability on the drawing's surface: only the
 * enterprise records (data/org/<profile>/capabilities.yaml), no product records mixed in.
 */
export function enterpriseStatus(capId: string, surfaceId: string): { status: DisplayStatus; names: string[]; note?: string } {
  const parent = mitigationById.get(capId)?.parent;
  const ids = new Set([capId, ...specializationsOf(capId).map((s) => s.id)]);
  let recs = orgCapabilities.filter((c) => ids.has(c.capability));
  if (!recs.length && parent) recs = orgCapabilities.filter((c) => c.capability === parent);
  const records = recs.map((c) => c.surfaces[surfaceId]);
  return {
    status: capabilitySupportStatus(records),
    names: [...new Set(recs.map((c) => c.title))],
    note: records.map((r) => r?.note).filter(Boolean).join(" · ") || undefined,
  };
}

/** A product's recorded status on one capability, or null when the organisation does not run it. */
export function toolStatus(tool: Tool, capId: string): { status: DisplayStatus; note?: string } | null {
  if (!orgToolAvailableFor(tool.id)) return null;
  const s = orgStatusFor(tool.id, capId);
  return { status: s.status, note: s.contributions.map((c) => c.record?.note).filter(Boolean).join(" · ") || undefined };
}

/** Saturated chip fills so status reads on the drawing at fit-to-view zoom. */
export const STATUS_FILL: Record<DisplayStatus, { bg: string; border: string; text: string; dashed?: boolean }> = {
  enabled: { bg: "#06845a", border: "#06845a", text: "#ffffff" },
  inProgress: { bg: "#d4a106", border: "#b88a00", text: "#ffffff" },
  gap: { bg: "#d92d20", border: "#d92d20", text: "#ffffff" },
  notAssessed: { bg: "#ffffff", border: "#98a2b3", text: "#667085", dashed: true },
  unmapped: { bg: "#ffffff", border: "#d0d5dd", text: "#98a2b3", dashed: true },
};

export type { DisplayStatus };
