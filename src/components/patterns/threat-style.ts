/**
 * How a threat's rating and evidence read on the page. The rating chips carry their own colours,
 * written out rather than drawn from tokens, so the contrast test can check every pair against
 * WCAG AA (4.5:1) for the small text they hold.
 */
import type { ThreatEvidence, ThreatRating } from "@/lib/types";

export const RATING_STYLE: Record<ThreatRating, { label: string; background: string; color: string; border: string }> = {
  critical: { label: "Critical", background: "#b42318", color: "#ffffff", border: "#b42318" },
  high: { label: "High", background: "#fee9e7", color: "#b42318", border: "#f4b4ad" },
  medium: { label: "Medium", background: "#fef0c7", color: "#93370d", border: "#f4d38a" },
  low: { label: "Low", background: "#f2f4f7", color: "#475467", border: "#cfd6e0" },
};

/** The evidence word, and what it means when hovered. */
export const EVIDENCE_WORD: Record<ThreatEvidence, { label: string; help: string }> = {
  observed: { label: "Observed", help: "It has happened: a catalogued incident or a reported attack." },
  disclosed: { label: "Disclosed", help: "A CVE or vendor advisory shows it, with no known exploitation." },
  research: { label: "Research", help: "Demonstrated in published research, not yet seen in a product." },
  theoretical: { label: "Theoretical", help: "Rated on the mechanism alone: no incident, advisory or research shows it yet." },
};

/** "LLM01:2026" -> "LLM01": the short form a tag has room for. */
export const owaspShort = (id: string) => id.replace(/:\d{4}$/, "");

/** WCAG relative luminance of a "#rrggbb" colour. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of two "#rrggbb" colours. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
