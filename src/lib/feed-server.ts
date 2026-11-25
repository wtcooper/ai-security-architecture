/**
 * The feed and the security tools, as the build wrote them (src/data/generated/feed.json and
 * security-tools.json). Server side only: import this from a page, layout or route file under
 * src/app/, never from a client component, and hand a component the few items it shows as props.
 * That is what keeps the feed out of the JavaScript every page loads; a test walks the client
 * import graph to hold it there. /feed/ itself is built with its newest days and loads older
 * months from public/data/feed/ in the browser.
 */
import feedJson from "@/data/generated/feed.json";
import securityToolsJson from "@/data/generated/security-tools.json";

import { feedIndexOf } from "./feed";
import type { FeedIndex, FeedItem, SecurityTool } from "./types";

/** Every item, newest first, with its decision and the security tools it announced. */
export const feedItems = feedJson as unknown as FeedItem[];

/** Every security tool, by name. */
export const securityTools = securityToolsJson as unknown as SecurityTool[];

/** The months, the counts the feed's filters start from, and every proposed site update. */
export const feedIndex: FeedIndex = feedIndexOf(feedItems);
