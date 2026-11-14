/** How the finder and the pattern page name a surface and a buy/build mode, in the reader's words. */
import type { GuidanceMode } from "@/lib/types";

/** A surface as the reader's situation, not the catalogue's term. */
export const SURFACE_SITUATION: Record<string, string> = {
  surfaceEndpoint: "Tools on your devices",
  surfaceSaas: "AI services you subscribe to",
  surfaceCloud: "Applications you build",
};

export const SURFACE_BLURB: Record<string, string> = {
  surfaceEndpoint: "AI that runs on a person's own laptop or workstation, with their files, shell and credentials.",
  surfaceSaas: "AI a vendor hosts and operates; you configure the tenant and what it may connect to.",
  surfaceCloud: "AI systems your teams build and run on infrastructure you operate.",
};

/** The order a reader meets the surfaces in: what they are most often asked to enable comes first. */
export const SURFACE_ORDER = ["surfaceEndpoint", "surfaceSaas", "surfaceCloud"];

export const MODE_META: Record<GuidanceMode, { label: string; blurb: string }> = {
  use: { label: "Buy", blurb: "You adopt a product: the work is configuring it and the enterprise controls around it." },
  build: { label: "Build", blurb: "Your teams build it: the pattern is the standard a design is reviewed against." },
  hybrid: { label: "Buy & build", blurb: "Part is a product you configure and part is yours to build or assemble." },
};
