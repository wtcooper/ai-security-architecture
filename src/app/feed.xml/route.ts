import { feedItems } from "@/lib/feed-server";
import { SITE_URL } from "@/lib/site";
import { feedRss } from "@/lib/rss";

/**
 * /feed.xml: the newest items as RSS 2.0. A GET route handler is rendered once at build time and
 * written to out/feed.xml by the static export; it reads nothing from the request.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(feedRss(feedItems, SITE_URL), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
