/**
 * The feed as RSS 2.0 (/feed.xml): the newest items, each linking to its place on /feed/, with its
 * summary, why it matters and its primary source. Pure, so a test can read what the route writes.
 */
import { kindById } from "./feed-vocabulary";
import { RSS_ITEMS } from "./feed";
import type { FeedItem } from "./types";

/** Text safe inside an XML element or attribute. */
export const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** "2026-11-24" -> "Tue, 24 Nov 2026 00:00:00 GMT", the date RSS 2.0 wants (RFC 822). */
export const rfc822 = (day: string) => new Date(`${day}T00:00:00Z`).toUTCString();

/** The description: the summary, why it matters, and the source to read. */
function description(f: FeedItem): string {
  const parts = [`<p>${xmlEscape(f.summary)}</p>`];
  if (f.why) parts.push(`<p><strong>Why it matters:</strong> ${xmlEscape(f.why)}</p>`);
  if (f.update) parts.push(`<p>Site update: ${xmlEscape(f.update.status)}. ${xmlEscape(f.update.note)}</p>`);
  const src = f.sources[0];
  if (src) parts.push(`<p><a href="${xmlEscape(src.url)}">Read more: ${xmlEscape(src.publisher ?? src.title)}</a></p>`);
  return parts.join("");
}

/** The whole document, for the newest `limit` items of a feed already newest first. */
export function feedRss(items: FeedItem[], site: string, limit = RSS_ITEMS): string {
  const feedPage = `${site}/feed/`;
  const newest = items.slice(0, limit);
  const entries = newest.map((f) => {
    const link = `${feedPage}#${f.id}`;
    const kind = kindById.get(f.kind)?.label ?? f.kind;
    const source = f.sources[0];
    return [
      "    <item>",
      `      <title>${xmlEscape(f.title)}</title>`,
      `      <link>${xmlEscape(link)}</link>`,
      `      <guid isPermaLink="false">${xmlEscape(f.id)}</guid>`,
      `      <pubDate>${rfc822(f.date)}</pubDate>`,
      `      <category>${xmlEscape(kind)}</category>`,
      ...(f.vendor ? [`      <category>${xmlEscape(f.vendor)}</category>`] : []),
      `      <description>${xmlEscape(description(f))}</description>`,
      ...(source ? [`      <source url="${xmlEscape(source.url)}">${xmlEscape(source.publisher ?? source.title)}</source>`] : []),
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>Daily feed · AI Security Architecture</title>",
    `    <link>${xmlEscape(feedPage)}</link>`,
    `    <atom:link href="${xmlEscape(`${site}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    "    <description>AI security incidents, product updates, security tools, launches and research, newest first, reviewed daily.</description>",
    "    <language>en</language>",
    ...(newest[0] ? [`    <lastBuildDate>${rfc822(newest[0].date)}</lastBuildDate>`] : []),
    ...entries,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
