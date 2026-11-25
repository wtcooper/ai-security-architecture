/**
 * Where the site lives, for the few addresses a Next.js link cannot make: a file the build writes
 * beside the pages, and a whole address for a reader outside the site. Reads no dataset, so the
 * RSS route can use it without loading one.
 */

/**
 * A file the build writes beside the pages (/feed.xml, the feed's months under /data/feed/). A
 * Next.js link adds the GitHub Pages base path by itself; a plain address to a file needs it added.
 */
export const fileHref = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

/** The feed as RSS 2.0, the newest items, for a feed reader. */
export const FEED_XML = "/feed.xml";

/**
 * Where the site is published, for the addresses a page outside it needs whole (a feed reader's
 * links). The deploy can name another; the default is the GitHub Pages site.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wtcooper.github.io/ai-security-architecture").replace(/\/$/, "");
