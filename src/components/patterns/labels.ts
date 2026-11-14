/** How the finder and the pattern page name a surface, in the reader's words. */

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
