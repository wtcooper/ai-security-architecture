/**
 * The incident patterns, as the filters and chips that file deep dives and feed items under them
 * read them. The incident patterns (data/incident-patterns/) are the source of truth: their id is
 * the `category` every deep dive and feed item carries, their name the chip's label and their
 * one-liner its hover text. Only the colour is set here, one per incident pattern, so a chip
 * reads the same on every page; a new incident pattern with no colour yet is drawn in grey
 * until it is given one.
 */
import { incidentPatterns } from "./data";

/** Each incident pattern's colour: a saturated dot and rail, and a pale wash behind its card. */
export interface CategoryColour {
  /** The dot on a chip, the rail on a card. */
  rail: string;
  /** A pale wash, for a card's top or a chip that is on. */
  fill: string;
}

export const CATEGORY_COLOURS: Record<string, CategoryColour> = {
  promptInjection: { rail: "#c2456a", fill: "#fbe8ed" },
  supplyChain: { rail: "#a8781f", fill: "#f9f0d8" },
  identity: { rail: "#4a6cd4", fill: "#e8efff" },
  exposed: { rail: "#d4622a", fill: "#fdeadf" },
  exploitedSoftware: { rail: "#0f7c8c", fill: "#dff3f5" },
  aiMadeExposure: { rail: "#8a5cc8", fill: "#f0e9fa" },
  breakout: { rail: "#2f8a5b", fill: "#e4f3ea" },
  aiAttacker: { rail: "#5b6474", fill: "#eceef2" },
};

/** Grey, for an incident pattern not yet given a colour of its own. */
export const NO_COLOUR: CategoryColour = { rail: "#98a2b3", fill: "#f2f4f7" };

export const categoryColour = (id: string): CategoryColour => CATEGORY_COLOURS[id] ?? NO_COLOUR;

/** An incident pattern as a filter or chip shows it. */
export interface IncidentCategoryEntry {
  id: string;
  slug: string;
  label: string;
  blurb: string;
  colour: CategoryColour;
}

/** Every incident pattern, by `order`. */
export const INCIDENT_CATEGORIES: IncidentCategoryEntry[] = incidentPatterns.map((p) => ({
  id: p.id,
  slug: p.slug,
  label: p.name,
  blurb: p.short,
  colour: categoryColour(p.id),
}));

export const categoryById = new Map<string, IncidentCategoryEntry>(INCIDENT_CATEGORIES.map((c) => [c.id, c]));
