/**
 * The map's four visual bands, derived from CoSAI's own component classification.
 *
 * CoSAI has three top-level component categories. The original SAIF map showed four stacked
 * bands, which is the layout practitioners read fluently, so Infrastructure is split along
 * its own two subcategories to recover the fourth band:
 *
 *   componentsApplication                              -> application
 *   componentsModel                                    -> model
 *   componentsInfrastructure / componentsModelDeployment -> infrastructure
 *   componentsInfrastructure / componentsData            -> data
 *
 * No component is placed by hand. This function is the single source of truth for band
 * assignment, used by both the diagram and the build-time fidelity check.
 */
export type BandId = "application" | "model" | "infrastructure" | "data";

export function bandFor(category: string, subcategory?: string): BandId {
  if (category === "componentsApplication") return "application";
  if (category === "componentsModel") return "model";
  if (category === "componentsInfrastructure") {
    return subcategory === "componentsData" ? "data" : "infrastructure";
  }
  throw new Error(`unknown component category: ${category}`);
}
