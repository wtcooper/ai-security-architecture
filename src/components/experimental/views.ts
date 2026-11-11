/**
 * Experimental view specs for the simplified drawings. Option A is derived from the
 * architecture's own computed layout (the same geometry as the React Flow canvas, re-skinned);
 * options B and C share one hand-laid nested-boundary layout for the third-party coding agent.
 */
import type { Archetype } from "@/lib/types";
import type { BoundaryTone, CrossingKind, ViewBoundary, ViewBox, ViewLine, ViewSpec } from "./BoxDiagram";

const TONE: Record<string, BoundaryTone> = {
  endpoint: "ours",
  cloud: "ours",
  vendor: "vendor",
  external: "untrusted",
  governance: "control",
};

const TAG: Record<string, string> = {
  user: "people",
  endpoint: "ours",
  cloud: "ours",
  vendor: "vendor-run, under agreement",
  external: "untrusted, no agreement",
  governance: "ours, applies across every boundary",
};

/** Option A: today's geometry, drawn as plain boxes inside labelled boundaries. */
export function specFromLayout(a: Archetype): ViewSpec | null {
  const L = a.layout;
  if (!L) return null;
  const zoneOwner = new Map((a.zones ?? []).map((z) => [z.id, z]));
  const boundaries: ViewBoundary[] = [];
  for (const z of a.zones ?? []) {
    if (z.owner === "user") continue;
    if (z.owner === "governance") {
      if (L.govBand) boundaries.push({ zone: z.id, label: "Control plane", tag: TAG.governance, ...L.govBand, tone: "control" });
      continue;
    }
    const rects = a.blocks.filter((b) => b.zone === z.id && !b.parent).map((b) => L.blocks[b.id]).filter(Boolean);
    if (!rects.length) continue;
    const x = Math.min(...rects.map((r) => r.x)) - 16;
    const right = Math.max(...rects.map((r) => r.x + r.w)) + 16;
    const top = Math.min(L.bandTop, ...rects.map((r) => r.y - 40));
    const bottom = L.bandBottom ?? Math.max(...rects.map((r) => r.y + r.h)) + 20;
    boundaries.push({ zone: z.id, label: z.title ?? z.owner, tag: TAG[z.owner], x, y: top, w: right - x, h: bottom - top, tone: TONE[z.owner] ?? "ours" });
  }
  const parents = new Set(a.blocks.map((b) => b.parent).filter(Boolean));
  const boxes: ViewBox[] = a.blocks.map((b) => {
    const r = L.blocks[b.id];
    const owner = zoneOwner.get(b.zone ?? "")?.owner;
    if (b.kind === "actor") return { id: b.id, x: r.x + r.w / 2 - 70, y: r.y + 4, w: 140, h: 52, tone: "actor", sub: "" };
    return {
      id: b.id,
      ...r,
      tone: parents.has(b.id) ? "container" : owner === "governance" ? "governance" : "plain",
      sub: owner === "governance" ? "" : undefined,
    };
  });
  const lines: ViewLine[] = L.edges.map((e) => {
    const pts = [...e.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
    const edge = a.edges.find((x) => x.from === e.from && x.to === e.to);
    return { key: `${e.from}->${e.to}`, pts, label: edge?.label ? { x: e.midX, y: e.midY - 5 } : undefined };
  });
  return { width: L.width, height: L.height, boundaries, boxes, lines };
}

/**
 * Options B and C: nested trust boundaries for the third-party coding agent. People stand
 * outside every boundary; the developer's machine holds the harness, which holds its tools;
 * our network, the vendor and the internet sit around it, and the control plane runs beneath.
 */
export const CODING_AGENT_NESTED: ViewSpec = {
  width: 1240,
  height: 850,
  boundaries: [
    { zone: "zoneEndpoint", label: "Developer's machine", tag: "managed endpoint · ours", x: 230, y: 100, w: 390, h: 410, tone: "ours" },
    { zone: "zoneCloud", label: "Our network", tag: "enterprise cloud · ours", x: 660, y: 100, w: 370, h: 410, tone: "ours" },
    { zone: "zoneVendor", label: "Vendor", x: 1056, y: 100, w: 170, h: 150, tone: "vendor" },
    { zone: "zoneExternal", label: "Internet", tag: "untrusted · no agreement", x: 230, y: 560, w: 996, h: 120, tone: "untrusted" },
    { zone: "zoneGovernance", label: "Control plane", tag: "ours · applies across every boundary", x: 20, y: 716, w: 1206, h: 116, tone: "control" },
  ],
  boxes: [
    { id: "remoteDevice", x: 20, y: 150, w: 150, h: 60, sub: "phone, web & chat — steering when away", tone: "actor" },
    { id: "developer", x: 20, y: 290, w: 150, h: 60, sub: "present; approves what matters", tone: "actor" },
    { id: "harness", x: 250, y: 140, w: 350, h: 230, sub: "the vendor's app: loop, context, MCP client", tone: "container" },
    { id: "toolPlane", x: 270, y: 194, w: 310, h: 156, sub: "file & edit · shell · local MCP servers · skills · computer use — running as the user, beside their SSH keys, cloud credentials and browser sessions" },
    { id: "memory", x: 250, y: 410, w: 180, h: 70, sub: "memory files, rules, hooks — run on launch" },
    { id: "aiGateway", x: 680, y: 150, w: 160, h: 70, sub: "model proxy · MCP & API gateway · skills catalogue", tone: "control" },
    { id: "hostedTools", x: 860, y: 150, w: 150, h: 70, sub: "remote MCP servers, APIs & connectors" },
    { id: "orgData", x: 860, y: 270, w: 150, h: 70, sub: "systems of record, file storage" },
    { id: "sourceControl", x: 680, y: 420, w: 160, h: 66, sub: "our repos, instruction files, PRs" },
    { id: "registry", x: 860, y: 420, w: 150, h: 66, sub: "approved packages, pinned by digest", tone: "control" },
    { id: "vendorService", x: 1072, y: 140, w: 140, h: 76, sub: "managed settings · audit export · remote sessions" },
    { id: "publicRepos", x: 390, y: 600, w: 136, h: 60, title: "Public repositories", sub: "cloned read-only" },
    { id: "openWeb", x: 540, y: 600, w: 136, h: 60, sub: "search & arbitrary pages" },
    { id: "sources", x: 860, y: 600, w: 150, h: 60, title: "Public packages", sub: "registries & skill hubs" },
    { id: "provider", x: 1072, y: 600, w: 140, h: 60, sub: "inference API" },
    { id: "govIdentity", x: 40, y: 750, w: 220, h: 62, sub: "IdP and device posture", tone: "governance" },
    { id: "govSecrets", x: 276, y: 750, w: 220, h: 62, sub: "vaulted, short-lived grants", tone: "governance" },
    { id: "govPolicy", x: 512, y: 750, w: 220, h: 62, sub: "what may be reached, what may leave", tone: "governance" },
    { id: "govSupplyChain", x: 748, y: 750, w: 220, h: 62, sub: "admitted agents, servers & versions", tone: "governance" },
    { id: "govObservability", x: 984, y: 750, w: 222, h: 62, sub: "session record, vendor export, discovery", tone: "governance" },
  ],
  frames: [{ x: 286, y: 300, w: 278, h: 38, label: "Sandbox", sub: "builds, tests, driven desktops — when on" }],
  lines: [
    { key: "developer->remoteDevice", pts: [[95, 290], [95, 210]], label: { x: 101, y: 254, anchor: "start", text: "away from\nthe machine" } },
    { key: "developer->harness", pts: [[170, 320], [250, 320]], label: { x: 210, y: 312, text: "local session" } },
    { key: "remoteDevice->vendorService", pts: [[60, 150], [60, 50], [1135, 50], [1135, 140]], label: { x: 640, y: 44 } },
    { key: "harness->vendorService", pts: [[520, 140], [520, 78], [1090, 78], [1090, 140]], label: { x: 800, y: 72 } },
    { key: "harness->aiGateway", pts: [[600, 168], [680, 168]], label: { x: 640, y: 150, text: "inference,\nMCP & skills" } },
    { key: "toolPlane->aiGateway", pts: [[580, 240], [720, 240], [720, 220]], label: { x: 640, y: 254, text: "API & MCP calls" } },
    { key: "toolPlane->memory", pts: [[300, 350], [300, 410]], label: { x: 306, y: 384, anchor: "start", text: "read & write" } },
    { key: "toolPlane->registry", pts: [[580, 280], [848, 280], [848, 453], [860, 453]], label: { x: 852, y: 384, anchor: "start" } },
    { key: "toolPlane->sourceControl", pts: [[580, 300], [740, 300], [740, 420]], label: { x: 746, y: 356, anchor: "start", text: "clone, push & PRs\nas the developer" } },
    { key: "toolPlane->publicRepos", pts: [[460, 350], [460, 600]], label: { x: 466, y: 540, anchor: "start", text: "clone public\nrepos" } },
    { key: "toolPlane->openWeb", pts: [[560, 350], [560, 600]], label: { x: 566, y: 540, anchor: "start", text: "web search\n& fetch" } },
    { key: "aiGateway->hostedTools", pts: [[840, 185], [860, 185]], label: { x: 852, y: 238, text: "internal tool calls" } },
    { key: "hostedTools->orgData", pts: [[935, 220], [935, 270]], label: { x: 941, y: 249, anchor: "start", text: "scoped reads" } },
    { key: "aiGateway->provider", pts: [[720, 150], [720, 134], [1044, 134], [1044, 630], [1072, 630]], label: { x: 1038, y: 378, anchor: "end", text: "inference on\nour key" } },
    { key: "vendorService->provider", pts: [[1142, 216], [1142, 600]], label: { x: 1148, y: 420, anchor: "start", text: "inference" } },
    { key: "sources->registry", pts: [[935, 600], [935, 486]], label: { x: 941, y: 540, anchor: "start", text: "mirrored &\nadmitted" } },
  ],
};

/** B's enforcement boundaries, numbered as Agent Baseline numbers its four. */
export const BOUNDARY_BADGES = [
  { n: 1, label: "Sandbox", blurb: "where the agent's code runs" },
  { n: 2, label: "Egress", blurb: "what it can reach" },
  { n: 3, label: "Supply chain", blurb: "what it can install and load" },
  { n: 4, label: "Identity & access", blurb: "who it acts as, and with what" },
];

export const CODING_AGENT_BADGES = [
  { n: 1, x: 286, y: 300 },
  { n: 2, x: 510, y: 510 },
  { n: 3, x: 860, y: 420 },
  { n: 4, x: 680, y: 150 },
  { n: 4, x: 1072, y: 140 },
];

/** C: what each boundary crossing passes through on our side, if anything. */
export const CODING_AGENT_CROSSINGS: Record<string, { kind: CrossingKind; via: string }> = {
  "developer->harness": { kind: "person", via: "The person at the device — device posture and the SSO sign-in" },
  "remoteDevice->vendorService": { kind: "vendor", via: "The vendor's account binding and managed settings; never touches our network" },
  "harness->vendorService": { kind: "vendor", via: "The vendor's SSO tenant and our allowlist entry for it" },
  "harness->aiGateway": { kind: "brokered", via: "AI gateway" },
  "toolPlane->aiGateway": { kind: "brokered", via: "AI gateway — destinations registered, credentials injected" },
  "toolPlane->registry": { kind: "brokered", via: "Private registry — pinned by digest" },
  "toolPlane->sourceControl": { kind: "direct", via: "Nothing between: git on the developer's own credentials; branch protection at the host" },
  "toolPlane->publicRepos": { kind: "direct", via: "Nothing between: the endpoint egress allowlist only" },
  "toolPlane->openWeb": { kind: "direct", via: "Nothing between: the endpoint egress allowlist only" },
  "aiGateway->provider": { kind: "brokered", via: "AI gateway — vaulted key, allowlisted provider" },
  "vendorService->provider": { kind: "vendor", via: "The vendor's own call — assured, not inspected" },
  "sources->registry": { kind: "brokered", via: "Registry admission — scanned and pinned before anything inside can pull it" },
};
