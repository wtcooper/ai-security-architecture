/** What the pattern finder searches: everything a reader might type to mean a pattern. */
import { archetypesInOrder, clouds, guidanceByArchetype, toolsForArchetype, vendorById } from "@/lib/data";
import type { Archetype, Paragraph } from "@/lib/types";

const flat = (blocks?: Paragraph[]) => (blocks ?? []).map((b) => (Array.isArray(b) ? b.join(" ") : b)).join(" ");

/** The clouds a pattern can be built on, with the names people use for them. */
const CLOUD_WORDS: Record<string, string> = {
  cloudAws: "aws amazon web services bedrock",
  cloudAzure: "azure microsoft foundry",
  cloudGcp: "gcp google cloud vertex",
};

export const cloudsFor = (archetypeId: string) => clouds.filter((c) => c.implementations.some((i) => i.architecture === archetypeId));

/** What a query is matched against, strongest first: the pattern's name, what it is for, its products, its prose. */
const haystack = new Map(
  archetypesInOrder.map((a): [string, string[]] => {
    const tools = toolsForArchetype(a.id);
    const tiers = [
      [a.title, a.abbrev ?? ""],
      [a.useWhen, ...a.keywords, ...(a.exemplars ?? []).map((e) => e.name)],
      [
        ...tools.flatMap((t) => [t.name, t.family, vendorById.get(t.vendor)?.name ?? t.vendor, ...(t.variants ?? []).map((v) => v.name)]),
        ...cloudsFor(a.id).flatMap((c) => [c.name, c.short, CLOUD_WORDS[c.id] ?? ""]),
      ],
      [flat(a.summary), ...(a.exemplars ?? []).map((e) => e.note)],
    ];
    return [a.id, tiers.map((t) => t.join(" | ").toLowerCase())];
  }),
);

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Whole-word-prefix match, so "rag" finds "RAG" and not "storage". */
const mentions = (text: string, word: string) => new RegExp(`(^|[^a-z0-9])${escape(word)}`).test(text);

/**
 * The patterns a query matches, best first. Every word must appear somewhere; a pattern whose
 * name carries the words outranks one whose products do, which outranks one that only mentions
 * them, and the whole phrase appearing together counts for more than its words apart.
 */
export function findPatterns(query: string): Archetype[] {
  const phrase = query.toLowerCase().trim().replace(/\s+/g, " ");
  const words = phrase.split(" ").filter((w) => /[a-z0-9]/.test(w));
  if (!words.length) return archetypesInOrder;
  const weights = [8, 4, 2, 1];
  const scored = archetypesInOrder.flatMap((a) => {
    const tiers = haystack.get(a.id)!;
    let score = 0;
    for (const w of words) {
      const tier = tiers.findIndex((t) => mentions(t, w));
      if (tier === -1) return [];
      score += weights[tier];
    }
    if (words.length > 1) {
      const tier = tiers.findIndex((t) => mentions(t, phrase));
      if (tier !== -1) score += weights[tier] * words.length;
    }
    return [{ a, score }];
  });
  return scored.sort((x, y) => y.score - x.score).map((s) => s.a);
}

export const modeOf = (archetypeId: string) => guidanceByArchetype.get(archetypeId)?.mode;
