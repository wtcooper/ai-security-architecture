/**
 * A daily feed item cut down to what the home page's list shows. The home page builds these from
 * the feed when it is built and hands them to HeadlineList, so the feed itself never reaches a
 * component (see src/lib/feed-server.ts).
 */
import type { FeedItem } from "@/lib/types";

export interface Headline {
  id: string;
  kind: string;
  date: string;
  title: string;
  /** Why it matters, or, for an incident (which has no `why`), the first sentence of what happened. */
  line: string;
  /** Incidents only: the incident pattern it is filed under. */
  category?: string;
}

/** The first sentence, so an incident still gets one line. "gpt-5.4" is not a sentence end. */
const firstSentence = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

export const toHeadline = (f: FeedItem): Headline => ({
  id: f.id,
  kind: f.kind,
  date: f.date,
  title: f.title,
  line: f.why ?? firstSentence(f.summary),
  ...(f.category ? { category: f.category } : {}),
});
